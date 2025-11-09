"""Admin registrations for scholarship models."""

from __future__ import annotations

from django.contrib import admin

from .models import Scholarship, ScholarshipApplication, ScholarshipDisbursement


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
	list_display = ("name", "provider", "amount", "deadline", "is_active")
	list_filter = ("is_active", "provider")
	search_fields = ("name", "provider")


@admin.register(ScholarshipApplication)
class ScholarshipApplicationAdmin(admin.ModelAdmin):
	list_display = ("scholarship", "applicant", "status", "submitted_at", "reviewed_at")
	list_filter = ("status", "submitted_at")
	search_fields = ("scholarship__name", "applicant__email")
	autocomplete_fields = ("scholarship", "applicant")


@admin.register(ScholarshipDisbursement)
class ScholarshipDisbursementAdmin(admin.ModelAdmin):
	list_display = ("reference", "scholarship", "user", "amount", "status", "disbursement_date")
	list_filter = ("status", "disbursement_date")
	search_fields = ("reference", "user__email", "scholarship__name")
	autocomplete_fields = ("scholarship", "user")
