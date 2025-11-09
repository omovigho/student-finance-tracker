"""Loan app routing."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LoanSchemeViewSet, LoanViewSet

router = DefaultRouter()
router.register(r"schemes", LoanSchemeViewSet, basename="loan-schemes")
router.register(r"loans", LoanViewSet, basename="loan")

urlpatterns = [
    path("", include(router.urls)),
]
