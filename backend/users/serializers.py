"""Serializers for the users app."""
from __future__ import annotations

from typing import Any

from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer[User]):
    """Serializer used for user self-registration."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "student_id",
            "phone_number",
            "department",
            "dob",
        )
        read_only_fields = ("id",)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def create(self, validated_data: dict[str, Any]) -> User:
        validated_data.setdefault("role", "student")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer[User]):
    """Serializer used by administrators to inspect users."""

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "student_id",
            "phone_number",
            "role",
            "profile_image",
            "department",
            "dob",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined")


class UserMeSerializer(serializers.ModelSerializer[User]):
    """Serializer for authenticated users to manage their profile."""

    current_balance = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "student_id",
            "phone_number",
            "role",
            "profile_image",
            "department",
            "dob",
            "current_balance",
        )
        read_only_fields = ("id", "email", "role")

    def get_current_balance(self, obj: User) -> Decimal:
        today = timezone.now().date()
        current_month_start = today.replace(day=1)
        next_month_start = _shift_month(current_month_start, 1)

        income_total = (
            obj.incomes.filter(date_received__gte=current_month_start, date_received__lt=next_month_start)
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0.00")
        )
        expense_total = (
            obj.expenses.filter(date_spent__gte=current_month_start, date_spent__lt=next_month_start)
            .aggregate(total=Sum("amount"))
            .get("total")
            or Decimal("0.00")
        )
        balance = Decimal(income_total) - Decimal(expense_total)
        return balance.quantize(Decimal("0.01"))


def _shift_month(reference: date, offset: int) -> date:
    month = reference.month - 1 + offset
    year = reference.year + month // 12
    month = month % 12 + 1
    return date(year, month, 1)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer to validate password change requests."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": _("Old password is incorrect.")})
        return attrs

    def save(self, **kwargs: Any) -> None:
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
