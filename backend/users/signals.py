"""User app signals."""
from __future__ import annotations

from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import User


@receiver(pre_save, sender=User)
def ensure_username(sender, instance: User, **_: object) -> None:
    """Generate a fallback username when omitted."""

    if not instance.username:
        instance.username = instance.email.split("@")[0]
