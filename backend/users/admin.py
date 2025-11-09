"""Admin registrations for custom user model."""

from __future__ import annotations

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	"""Customize the admin interface for the user model."""

	model = User
	list_display = (
		"email",
		"first_name",
		"last_name",
		"role",
		"is_active",
		"is_staff",
	)
	list_filter = ("role", "is_active", "is_staff")
	search_fields = ("email", "first_name", "last_name", "student_id")
	ordering = ("email",)
	fieldsets = (
		(None, {"fields": ("email", "password")}),
		(
			"Personal info",
			{
				"fields": (
					"first_name",
					"last_name",
					"student_id",
					"phone_number",
					"department",
					"dob",
					"profile_image",
				)
			},
		),
		(
			"Permissions",
			{
				"fields": (
					"role",
					"is_active",
					"is_staff",
					"is_superuser",
					"groups",
					"user_permissions",
				)
			},
		),
		("Important dates", {"fields": ("last_login", "date_joined")}),
	)
	add_fieldsets = (
		(None, {
			"classes": ("wide",),
			"fields": ("email", "password1", "password2", "role", "is_staff", "is_superuser"),
		}),
	)
	readonly_fields = ("date_joined", "last_login")
