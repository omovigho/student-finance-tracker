"""Loan app models."""

from __future__ import annotations

from decimal import Decimal
from typing import Iterable

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
class LoanScheme(models.Model):
    """Reusable loan templates created by administrators."""

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    lender_name = models.CharField(max_length=255)
    principal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Simple interest rate for the full loan term as a percentage.",
    )
    term_months = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loan_schemes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - human friendly only
        return self.name

    @property
    def max_payback_days(self) -> int:
        """Maximum number of days a student has to repay the loan."""

        return self.term_months * 30


class Loan(models.Model):
    """Represents an individual student's loan application and lifecycle."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        PAID = "paid", "Paid"
        CLOSED = "closed", "Closed"
        DEFAULTED = "defaulted", "Defaulted"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="loans")
    scheme = models.ForeignKey(LoanScheme, on_delete=models.PROTECT, related_name="loans")
    lender_name = models.CharField(max_length=255)
    principal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Simple interest rate applied when the loan matures.",
    )
    interest_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    total_payable = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    term_months = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    notes = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    declined_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["scheme", "status"]),
            models.Index(fields=["start_date"]),
        ]

    def __str__(self) -> str:
        return f"Loan {self.principal} for {self.user}"  # pragma: no cover - human readable only

    @property
    def outstanding_balance(self) -> Decimal:
        """Return outstanding balance based on repayments."""

        total_due = self.repayments.aggregate(total=models.Sum("amount_due"))  # type: ignore[arg-type]
        total_paid = self.repayments.aggregate(total=models.Sum("paid_amount"))  # type: ignore[arg-type]
        due = total_due["total"] or Decimal("0.00")
        paid = total_paid["total"] or Decimal("0.00")
        return (due - paid).quantize(Decimal("0.01"))

    @property
    def next_due(self) -> tuple[Decimal, "Repayment" | None]:
        """Return the next repayment amount and instance."""

        repayment = self.repayments.filter(status=Repayment.Status.PENDING).order_by("due_date").first()
        if not repayment:
            return Decimal("0.00"), None
        today = timezone.now().date()
        amount = repayment.amount_due
        if repayment.due_date and today >= repayment.due_date:
            return amount, repayment
        return amount, repayment

    def clean(self) -> None:
        if self.principal <= 0:
            raise ValidationError("Principal must be greater than zero.")
        if self.term_months <= 0:
            raise ValidationError("Term must be at least one month.")
        if self.total_payable < self.principal:
            raise ValidationError("Total payable cannot be less than the principal amount.")

    def generate_repayment_schedule(self) -> Iterable["Repayment"]:
        """Generate a single repayment covering the full amount due."""

        if not self.start_date:
            raise ValidationError("Loan must have a start date to generate a repayment schedule.")

        maturity_date = self.start_date + relativedelta(months=self.term_months)
        self.due_date = maturity_date
        interest_raw = (self.principal * (self.interest_rate / Decimal("100")))
        self.interest_amount = interest_raw.quantize(Decimal("0.01"))
        total_due = (self.principal + self.interest_amount).quantize(Decimal("0.01"))
        self.total_payable = total_due

        repayment = Repayment(
            loan=self,
            amount_due=total_due,
            due_date=maturity_date,
            status=Repayment.Status.PENDING,
        )
        return [repayment]

    def activate(self) -> None:
        """Transition the loan to active status and create repayment entries."""

        if self.status != self.Status.PENDING:
            raise ValidationError("Only pending loans can be activated.")
        self.start_date = timezone.now().date()
        schedule = list(self.generate_repayment_schedule())
        self.status = self.Status.ACTIVE
        self.approved_at = timezone.now()
        self.save(update_fields=[
            "status",
            "start_date",
            "due_date",
            "interest_amount",
            "total_payable",
            "approved_at",
            "updated_at",
        ])
        # Remove stale repayments before creating the new schedule
        self.repayments.all().delete()
        Repayment.objects.bulk_create(schedule)

    def mark_declined(self, note: str | None = None) -> None:
        """Decline a pending loan application."""

        if self.status != self.Status.PENDING:
            raise ValidationError("Only pending loans can be declined.")
        self.status = self.Status.CLOSED
        self.declined_at = timezone.now()
        if note:
            self.notes = note
        self.save(update_fields=["status", "declined_at", "notes", "updated_at"])

    def mark_paid(self) -> None:
        """Mark the loan as fully repaid."""

        if self.status != self.Status.ACTIVE:
            raise ValidationError("Only active loans can be marked as paid.")
        self.status = self.Status.PAID
        self.paid_at = timezone.now()
        self.save(update_fields=["status", "paid_at", "updated_at"])


class Repayment(models.Model):
    """Represents a scheduled repayment for a loan."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        LATE = "late", "Late"

    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name="repayments")
    amount_due = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    due_date = models.DateField()
    paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    paid_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["due_date"]
        indexes = [
            models.Index(fields=["loan", "due_date"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Repayment {self.amount_due} ({self.due_date})"

    def clean(self) -> None:
        if self.loan.start_date and self.due_date <= self.loan.start_date:
            raise ValidationError("Due date must be after loan start date.")
        if self.paid_amount < 0:
            raise ValidationError("Paid amount cannot be negative.")
        if self.paid_amount > self.amount_due:
            raise ValidationError("Paid amount cannot exceed amount due.")

    def apply_payment(self, amount: Decimal) -> None:
        """Apply a payment to this repayment."""

        if amount <= 0:
            raise ValidationError("Payment amount must be positive.")
        new_total = self.paid_amount + amount
        if new_total > self.amount_due:
            raise ValidationError("Payment exceeds amount due.")
        self.paid_amount = new_total.quantize(Decimal("0.01"))
        if self.paid_amount == self.amount_due:
            self.status = self.Status.PAID
            self.paid_date = timezone.now().date()
        self.save(update_fields=["paid_amount", "status", "paid_date"])
