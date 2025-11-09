"""Signals driving scholarship workflows."""
from __future__ import annotations

import uuid

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from notifications.utils import create_notification

from .models import ScholarshipApplication, ScholarshipDisbursement


@receiver(post_save, sender=ScholarshipApplication)
def handle_application_change(sender, instance: ScholarshipApplication, created: bool, **_: object) -> None:
    """React to scholarship application lifecycle events."""

    if created:
        create_notification(
            user=instance.applicant,
            title="Scholarship Application Received",
            message=f"We received your application for {instance.scholarship.name}.",
            notification_type="scholarship",
        )
        return

    if instance.status != ScholarshipApplication.Status.PENDING:
        ScholarshipApplication.objects.filter(pk=instance.pk, reviewed_at__isnull=True).update(
            reviewed_at=timezone.now()
        )

    if instance.status == ScholarshipApplication.Status.APPROVED:
        disbursement, created_disbursement = ScholarshipDisbursement.objects.get_or_create(
            scholarship=instance.scholarship,
            user=instance.applicant,
            defaults={
                "amount": instance.scholarship.amount,
                "disbursement_date": timezone.now().date(),
                "reference": uuid.uuid4().hex[:12].upper(),
                "status": ScholarshipDisbursement.Status.PENDING,
            },
        )
        if created_disbursement:
            create_notification(
                user=instance.applicant,
                title="Scholarship Approved",
                message=(
                    f"Congratulations! Your application for {instance.scholarship.name} has been approved. "
                    f"Disbursement reference: {disbursement.reference}."
                ),
                notification_type="scholarship",
                send_email=True,
            )
    elif instance.status == ScholarshipApplication.Status.REJECTED:
        create_notification(
            user=instance.applicant,
            title="Scholarship Update",
            message=f"Your application for {instance.scholarship.name} was not successful this time.",
            notification_type="scholarship",
        )
