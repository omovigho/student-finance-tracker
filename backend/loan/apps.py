"""Loan app configuration."""

from django.apps import AppConfig


class LoanConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "loan"
    verbose_name = "Loans"

    def ready(self) -> None:  # pragma: no cover - signal registration only
        from . import signals  # noqa: F401
