"""Admin registration for notifications."""

from __future__ import annotations

from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
	list_display = ("user", "title", "type", "is_read", "created_at", "send_email")
	list_filter = ("type", "is_read", "send_email")
	search_fields = ("user__email", "title")
	autocomplete_fields = ("user",)
