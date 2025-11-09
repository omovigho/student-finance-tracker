"""Configuration for the users app."""

from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "users"
    verbose_name = "Users"

    def ready(self) -> None:  # pragma: no cover - import side effects only
        from . import signals  # noqa: F401
