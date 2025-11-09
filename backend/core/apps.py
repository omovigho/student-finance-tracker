"""Core app configuration."""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Application configuration for shared logic."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
    verbose_name = "Core"

    def ready(self) -> None:  # pragma: no cover - import side effects only
        from . import checks  # noqa: F401  (registers system checks)

