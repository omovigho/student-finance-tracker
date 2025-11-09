"""Celery tasks for notifications."""
from __future__ import annotations

from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from loan.models import Repayment

from .utils import create_notification


@shared_task
def send_repayment_reminders() -> int:
    """Send reminders for repayments due within the next 48 hours."""

    window_start = timezone.now().date()
    window_end = window_start + timedelta(days=2)
    repayments = (
        Repayment.objects.select_related("loan", "loan__user")
        .filter(status=Repayment.Status.PENDING, due_date__range=(window_start, window_end))
        .order_by("due_date")
    )
    count = 0
    for repayment in repayments:
        loan = repayment.loan
        create_notification(
            user=loan.user,
            title="Upcoming Loan Repayment",
            message=(
                "Your repayment of {amount} to {lender} is due on {due_date}."
            ).format(
                amount=repayment.amount_due,
                lender=loan.lender_name,
                due_date=repayment.due_date,
            ),
            notification_type="loan",
            send_email=True,
        )
        count += 1
    return count
