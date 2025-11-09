"""Scholarship app configuration."""

from django.apps import AppConfig


class ScholarshipConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "scholarship"
    verbose_name = "Scholarships"

    def ready(self) -> None:  # pragma: no cover
        from . import signals  # noqa: F401
