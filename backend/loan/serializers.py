"""Serializers for loan application."""
from __future__ import annotations

from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from users.serializers import UserMeSerializer

from .models import Loan, LoanScheme, Repayment


class LoanSchemeSerializer(serializers.ModelSerializer[LoanScheme]):
    """Serialize loan schemes for both admins and students."""

    max_payback_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = LoanScheme
        fields = (
            "id",
            "name",
            "description",
            "lender_name",
            "principal",
            "interest_rate",
            "term_months",
            "max_payback_days",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "max_payback_days")


class RepaymentSerializer(serializers.ModelSerializer[Repayment]):
    """Serialize repayment entries."""

    class Meta:
        model = Repayment
        fields = (
            "id",
            "amount_due",
            "due_date",
            "paid_amount",
            "paid_date",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "status", "created_at")


class LoanSerializer(serializers.ModelSerializer[Loan]):
    """Serialize loans with nested repayments."""

    user = UserMeSerializer(read_only=True)
    scheme = LoanSchemeSerializer(read_only=True)
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    next_due_date = serializers.SerializerMethodField()
    next_due_amount = serializers.SerializerMethodField()
    max_payback_days = serializers.SerializerMethodField()
    current_amount_due = serializers.SerializerMethodField()
    repayments = RepaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Loan
        fields = (
            "id",
            "user",
            "scheme",
            "lender_name",
            "principal",
            "interest_rate",
            "interest_amount",
            "total_payable",
            "start_date",
            "due_date",
            "term_months",
            "status",
            "created_at",
            "updated_at",
            "outstanding_balance",
            "next_due_date",
            "next_due_amount",
            "current_amount_due",
            "max_payback_days",
            "repayments",
            "notes",
            "applied_at",
            "approved_at",
            "declined_at",
            "paid_at",
        )
        read_only_fields = (
            "id",
            "status",
            "created_at",
            "updated_at",
            "outstanding_balance",
            "next_due_date",
            "next_due_amount",
            "current_amount_due",
            "max_payback_days",
            "repayments",
            "user",
            "scheme",
            "interest_amount",
            "total_payable",
            "applied_at",
            "approved_at",
            "declined_at",
            "paid_at",
        )

    def validate_interest_rate(self, value: Decimal) -> Decimal:
        if value < 0:
            raise serializers.ValidationError("Interest rate cannot be negative.")
        return value

    def validate_term_months(self, value: int) -> int:
        if value <= 0:
            raise serializers.ValidationError("Term months must be greater than zero.")
        return value

    def get_next_due_date(self, obj: Loan):
        pending = obj.repayments.filter(status=Repayment.Status.PENDING, due_date__gte=timezone.now().date()).first()
        return pending.due_date if pending else None

    def get_next_due_amount(self, obj: Loan):
        pending = obj.repayments.filter(status=Repayment.Status.PENDING).first()
        return pending.amount_due if pending else None

    def get_current_amount_due(self, obj: Loan):
        amount, _ = obj.next_due
        return amount

    def get_max_payback_days(self, obj: Loan) -> int:
        scheme = obj.scheme
        if scheme:
            return scheme.max_payback_days
        return obj.term_months * 30


class LoanCreateSerializer(serializers.ModelSerializer[Loan]):
    """Serializer used for creating loans."""

    scheme_id = serializers.PrimaryKeyRelatedField(
        queryset=LoanScheme.objects.filter(is_active=True),
        source="scheme",
        write_only=True,
    )

    class Meta:
        model = Loan
        fields = (
            "id",
            "scheme_id",
            "notes",
        )
        read_only_fields = ("id",)

    def create(self, validated_data: dict) -> Loan:
        scheme: LoanScheme = validated_data.pop("scheme")
        user = self.context["request"].user
        loan = Loan.objects.create(
            user=user,
            scheme=scheme,
            lender_name=scheme.lender_name,
            principal=scheme.principal,
            interest_rate=scheme.interest_rate,
            interest_amount=Decimal("0.00"),
            total_payable=scheme.principal,
            term_months=scheme.term_months,
            notes=validated_data.get("notes", ""),
        )
        return loan


class RepaymentActionSerializer(serializers.Serializer):
    """Serializer used for repayment actions."""

    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_amount(self, value: Decimal) -> Decimal:
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value
