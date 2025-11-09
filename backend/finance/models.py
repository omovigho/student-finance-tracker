"""Finance app models."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Category(models.Model):
	"""Expense category managed by administrators."""

	name = models.CharField(max_length=120, unique=True)
	created_at = models.DateTimeField(default=timezone.now)
	updated_at = models.DateTimeField(blank=True, null=True)

	class Meta:
		ordering = ["name"]
		verbose_name_plural = "Categories"

	def __str__(self) -> str:
		return self.name


class Income(models.Model):
	"""Income entry recorded by a user."""

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="incomes")
	source = models.CharField(max_length=255)
	amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
	date_received = models.DateField()
	notes = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-date_received", "-created_at"]
		indexes = [models.Index(fields=["user", "date_received"])]

	def __str__(self) -> str:
		return f"Income {self.amount} from {self.source}"


class Expense(models.Model):
	"""Expense entry tracked by a user."""

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expenses")
	merchant = models.CharField(max_length=255)
	amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
	date_spent = models.DateField()
	notes = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	category = models.ForeignKey(
		Category,
		on_delete=models.PROTECT,
		related_name="expenses",
		null=True,
		blank=True,
	)

	class Meta:
		ordering = ["-date_spent", "-created_at"]
		indexes = [models.Index(fields=["user", "date_spent"])]

	def __str__(self) -> str:
		return f"Expense {self.amount} at {self.merchant or 'Unknown merchant'}"


class Budget(models.Model):
	"""Budget for a given period."""

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="budgets")
	period_start = models.DateField()
	period_end = models.DateField()
	allocated_amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])

	class Meta:
		unique_together = ("user", "period_start", "period_end")
		ordering = ["-period_start"]

	def __str__(self) -> str:
		return f"Budget {self.allocated_amount} ({self.period_start} - {self.period_end})"

	def clean(self) -> None:
		if self.period_end <= self.period_start:
			raise ValidationError("Budget end date must be after the start date.")
