"""Signals for loan app."""
from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.utils import create_notification

from .models import Loan


@receiver(post_save, sender=Loan)
def handle_loan_created(sender, instance: Loan, created: bool, **_: object) -> None:
    """Send a notification when a loan application is recorded."""

    if not created:
        return

    create_notification(
        user=instance.user,
        title="Loan Application Submitted",
        message=f"Your application for {instance.lender_name} is pending review.",
        notification_type="loan",
    )
