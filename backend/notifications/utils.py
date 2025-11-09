"""Utility helpers for notifications."""
from __future__ import annotations

from django.core.mail import send_mail

from .models import Notification


def create_notification(
    *,
    user,
    title: str,
    message: str,
    notification_type: str = Notification.Type.GENERAL,
    send_email: bool = False,
) -> Notification:
    """Create an in-app notification and optionally dispatch an email."""

    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notification_type,
        send_email=send_email,
    )

    if send_email and user.email:
        send_mail(
            subject=title,
            message=message,
            from_email=None,
            recipient_list=[user.email],
            fail_silently=True,
        )
    return notification
