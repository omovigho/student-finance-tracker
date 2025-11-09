"""Scholarship app models."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Scholarship(models.Model):
	"""Scholarship opportunities."""

	name = models.CharField(max_length=255, unique=True)
	description = models.TextField()
	amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
	provider = models.CharField(max_length=255)
	eligibility_criteria = models.TextField()
	deadline = models.DateField(default=None)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		ordering = ("deadline", "name")
		indexes = [
			models.Index(fields=["deadline"]),
			models.Index(fields=["is_active"]),
		]

	def __str__(self) -> str:
		return f"{self.name} (deadline: {self.deadline})"

	def clean(self) -> None:
		if self.deadline and self.deadline < timezone.localdate():
			raise ValidationError({"deadline": "Deadline must be today or in the future."})


class ScholarshipApplication(models.Model):
	"""Tracks student applications for scholarships."""

	class Status(models.TextChoices):
		PENDING = "pending", "Pending"
		APPROVED = "approved", "Approved"
		REJECTED = "rejected", "Rejected"

	scholarship = models.ForeignKey(Scholarship, on_delete=models.CASCADE, related_name="applications")
	applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scholarship_applications")
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
	submitted_at = models.DateTimeField(default=timezone.now)
	reviewed_at = models.DateTimeField(blank=True, null=True)
	note = models.TextField()

	class Meta:
		unique_together = ("scholarship", "applicant")
		ordering = ("-submitted_at",)
		indexes = [models.Index(fields=["status"])]

	def __str__(self) -> str:
		return f"{self.applicant} -> {self.scholarship} ({self.status})"


class ScholarshipDisbursement(models.Model):
	"""Records scholarship fund disbursements."""

	class Status(models.TextChoices):
		PENDING = "pending", "Pending"
		COMPLETED = "completed", "Completed"
		FAILED = "failed", "Failed"

	scholarship = models.ForeignKey(Scholarship, on_delete=models.CASCADE, related_name="disbursements")
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="scholarship_disbursements")
	amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
	disbursement_date = models.DateField()
	reference = models.CharField(max_length=50, unique=True)
	status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
	created_at = models.DateTimeField(default=timezone.now)

	class Meta:
		ordering = ("-disbursement_date",)
		indexes = [
			models.Index(fields=["user", "disbursement_date"]),
			models.Index(fields=["status"]),
		]

	def __str__(self) -> str:
		return f"Disbursement {self.reference} - {self.amount}"

	def clean(self) -> None:
		if self.amount <= 0:
			raise ValidationError("Disbursement amount must be greater than zero.")
