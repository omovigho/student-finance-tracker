"""Serializers for finance models."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Budget, Category, Expense, Income

User = get_user_model()


class IncomeSerializer(serializers.ModelSerializer[Income]):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Income
        fields = (
            "id",
            "user",
            "source",
            "amount",
            "date_received",
            "notes",
            "created_at",
        )
        read_only_fields = ("id", "user", "created_at")

    def validate_amount(self, value: Decimal) -> Decimal:
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value


class CategorySerializer(serializers.ModelSerializer[Category]):
    class Meta:
        model = Category
        fields = ("id", "name", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ExpenseSerializer(serializers.ModelSerializer[Expense]):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "user",
            "merchant",
            "amount",
            "date_spent",
            "notes",
            "created_at",
            "category",
            "category_name",
        )
        read_only_fields = ("id", "user", "created_at", "category_name")

    def validate_amount(self, value: Decimal) -> Decimal:
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        category = attrs.get("category")
        if self.instance is None and category is None:
            raise serializers.ValidationError({"category": "Select a category for this expense."})
        if self.instance is not None and "category" in attrs and category is None:
            raise serializers.ValidationError({"category": "Select a category for this expense."})
        return super().validate(attrs)


class BudgetSerializer(serializers.ModelSerializer[Budget]):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Budget
        fields = ("id", "user", "period_start", "period_end", "allocated_amount")
        read_only_fields = ("id", "user")

    def validate(self, attrs: dict[str, date | Decimal]) -> dict[str, date | Decimal]:
        start: date = attrs.get("period_start") or getattr(self.instance, "period_start", None)
        end: date = attrs.get("period_end") or getattr(self.instance, "period_end", None)
        if start and end and end <= start:
            raise serializers.ValidationError({"period_end": "End date must be after start date."})
        amount: Decimal | None = attrs.get("allocated_amount")
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"allocated_amount": "Allocated amount must be positive."})
        return attrs


class FinanceSummarySerializer(serializers.Serializer):
    total_income = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_expense = serializers.DecimalField(max_digits=14, decimal_places=2)
    net_balance = serializers.DecimalField(max_digits=14, decimal_places=2)


class FinanceDashboardSummarySerializer(FinanceSummarySerializer):
    income_this_month = serializers.DecimalField(max_digits=14, decimal_places=2)
    expense_this_month = serializers.DecimalField(max_digits=14, decimal_places=2)
    current_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    income_change = serializers.DecimalField(max_digits=7, decimal_places=2, allow_null=True)
    expense_change = serializers.DecimalField(max_digits=7, decimal_places=2, allow_null=True)
    balance_change = serializers.DecimalField(max_digits=7, decimal_places=2, allow_null=True)
