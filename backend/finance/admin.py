"""Finance app admin registrations."""

from __future__ import annotations

from django.contrib import admin

from .models import Budget, Category, Expense, Income


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
	list_display = ("user", "source", "amount", "date_received")
	list_filter = ("date_received",)
	search_fields = ("source", "user__email")
	autocomplete_fields = ("user",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
	list_display = ("user", "merchant", "amount", "date_spent", "category")
	list_filter = ("date_spent", "category")
	search_fields = ("merchant", "user__email")
	autocomplete_fields = ("user", "category")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
	list_display = ("name", "created_at", "updated_at")
	search_fields = ("name",)
	ordering = ("name",)


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
	list_display = ("user", "period_start", "period_end", "allocated_amount")
	list_filter = ("period_start",)
	search_fields = ("user__email",)
	autocomplete_fields = ("user",)
