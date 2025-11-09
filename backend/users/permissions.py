"""Custom permissions shared across apps."""
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOrAdmin(BasePermission):
    """Allow access to object owners or admins."""

    def has_object_permission(self, request, view, obj) -> bool:  # type: ignore[override]
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "role", None) == "admin" or user.is_staff:
            return True
        if getattr(obj, "user", None) == user or getattr(obj, "applicant", None) == user:
            return True
        UserModel = get_user_model()
        if isinstance(obj, UserModel):
            return obj == user
        return False


class IsStudent(BasePermission):
    """Allow only student users."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "role", None) == "student")


class IsAdminOrReadOnly(BasePermission):
    """Allow edits for admins but grant read-only access to others."""

    def has_permission(self, request, view) -> bool:  # type: ignore[override]
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "role", None) == "admin"
        )
