"""Serializers for notifications."""
from __future__ import annotations

from typing import Iterable

from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer[Notification]):
    """Serialize notification objects."""

    class Meta:
        model = Notification
        fields = ("id", "title", "message", "type", "is_read", "created_at", "send_email")
        read_only_fields = fields


class NotificationMarkSerializer(serializers.Serializer):
    """Validate payload for mark-read endpoint."""

    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        help_text="List of notification IDs to mark as read.",
    )
    mark_all = serializers.BooleanField(default=False)

    def validate(self, attrs):
        ids: Iterable[int] | None = attrs.get("ids")
        mark_all: bool = attrs.get("mark_all", False)
        if not mark_all and not ids:
            raise serializers.ValidationError("Provide notification IDs or set mark_all to true.")
        return attrs
