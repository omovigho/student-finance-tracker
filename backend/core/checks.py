"""Django system checks for core app."""
from __future__ import annotations

from django.core.checks import register
from django.core.checks.messages import CheckMessage


@register()
def core_placeholder_check(**kwargs: object) -> list[CheckMessage]:
    """Return an empty list of system checks.

    This placeholder keeps the application ready for future health checks
    without enforcing additional runtime constraints.
    """

    return []
