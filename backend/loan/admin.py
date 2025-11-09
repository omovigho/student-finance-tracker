"""Admin configuration for loan app."""

from __future__ import annotations

from django.contrib import admin

from .models import Loan, LoanScheme, Repayment


class RepaymentInline(admin.TabularInline):
	model = Repayment
	extra = 0
	readonly_fields = ("amount_due", "due_date", "paid_amount", "status")

@admin.register(LoanScheme)
class LoanSchemeAdmin(admin.ModelAdmin):
	list_display = ("name", "lender_name", "principal", "interest_rate", "term_months", "is_active")
	list_filter = ("is_active", "term_months")
	search_fields = ("name", "lender_name")
	autocomplete_fields = ("created_by",)


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
	list_display = (
		"user",
		"scheme",
		"principal",
		"interest_rate",
		"total_payable",
		"status",
		"start_date",
		"due_date",
	)
	list_filter = ("status", "start_date", "due_date")
	search_fields = ("user__email", "lender_name")
	autocomplete_fields = ("user", "scheme")
	inlines = (RepaymentInline,)


@admin.register(Repayment)
class RepaymentAdmin(admin.ModelAdmin):
	list_display = ("loan", "amount_due", "due_date", "paid_amount", "status")
	list_filter = ("status", "due_date")
	search_fields = ("loan__user__email", "loan__lender_name")
	autocomplete_fields = ("loan",)
