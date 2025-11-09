"""Serializers for scholarship workflows."""

from __future__ import annotations

from django.utils import timezone
from rest_framework import serializers

from users.serializers import UserMeSerializer

from .models import Scholarship, ScholarshipApplication


class ScholarshipSerializer(serializers.ModelSerializer[Scholarship]):
	is_open = serializers.SerializerMethodField()
	has_applied = serializers.SerializerMethodField()

	class Meta:
		model = Scholarship
		fields = (
			"id",
			"name",
			"description",
			"amount",
			"provider",
			"eligibility_criteria",
			"deadline",
			"is_active",
			"created_at",
			"updated_at",
			"is_open",
			"has_applied",
		)
		read_only_fields = ("id", "created_at", "updated_at", "is_open", "has_applied")

	def validate_deadline(self, value):
		if value < timezone.localdate():
			raise serializers.ValidationError("Deadline must be today or in the future.")
		return value

	def get_is_open(self, obj: Scholarship) -> bool:
		return bool(obj.is_active and obj.deadline >= timezone.localdate())

	def get_has_applied(self, obj: Scholarship) -> bool:
		request = self.context.get("request")
		if not request or not request.user.is_authenticated:
			return False
		return obj.applications.filter(applicant=request.user).exists()


class ScholarshipListSerializer(serializers.ModelSerializer[Scholarship]):
	is_open = serializers.SerializerMethodField()
	has_applied = serializers.SerializerMethodField()

	class Meta:
		model = Scholarship
		fields = (
			"id",
			"name",
			"provider",
			"amount",
			"deadline",
			"is_open",
			"has_applied",
		)

	def get_is_open(self, obj: Scholarship) -> bool:
		return bool(obj.is_active and obj.deadline >= timezone.localdate())

	def get_has_applied(self, obj: Scholarship) -> bool:
		request = self.context.get("request")
		if not request or not request.user.is_authenticated:
			return False
		return obj.applications.filter(applicant=request.user).exists()


class ScholarshipApplicationSerializer(serializers.ModelSerializer[ScholarshipApplication]):
	scholarship = serializers.PrimaryKeyRelatedField(read_only=True)
	scholarship_name = serializers.CharField(source="scholarship.name", read_only=True)
	applicant = UserMeSerializer(read_only=True)
	note = serializers.CharField(allow_blank=False, trim_whitespace=True)

	class Meta:
		model = ScholarshipApplication
		fields = (
			"id",
			"scholarship",
			"scholarship_name",
			"applicant",
			"note",
			"status",
			"submitted_at",
			"reviewed_at",
		)
		read_only_fields = (
			"id",
			"scholarship",
			"scholarship_name",
			"applicant",
			"status",
			"submitted_at",
			"reviewed_at",
		)

	def validate_note(self, value: str) -> str:
		trimmed = value.strip()
		if len(trimmed) < 30:
			raise serializers.ValidationError("Respond to the eligibility criteria using at least 30 characters.")
		return trimmed

	def validate(self, attrs: dict[str, str]) -> dict[str, str]:
		scholarship: Scholarship = self.context["scholarship"]
		request = self.context["request"]
		user = request.user
		if scholarship.deadline < timezone.localdate():
			raise serializers.ValidationError({"detail": "You cannot apply after the scholarship deadline."})
		if scholarship.applications.filter(applicant=user).exists():
			raise serializers.ValidationError({"detail": "You have already applied for this scholarship."})
		return attrs

	def create(self, validated_data: dict[str, str]) -> ScholarshipApplication:
		scholarship: Scholarship = self.context["scholarship"]
		user = self.context["request"].user
		return ScholarshipApplication.objects.create(
			scholarship=scholarship,
			applicant=user,
			**validated_data,
		)


class ScholarshipApplicationReviewSerializer(serializers.Serializer):
	action = serializers.ChoiceField(choices=("approve", "reject"))
	note = serializers.CharField(allow_blank=True, required=False)
