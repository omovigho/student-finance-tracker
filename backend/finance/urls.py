"""Finance app routing."""
from __future__ import annotations

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BudgetViewSet, CategoryViewSet, ExpenseViewSet, FinanceSummaryViewSet, IncomeViewSet

router = DefaultRouter()
router.register(r"incomes", IncomeViewSet, basename="income")
router.register(r"expenses", ExpenseViewSet, basename="expense")
router.register(r"budgets", BudgetViewSet, basename="budget")
router.register(r"summary", FinanceSummaryViewSet, basename="finance-summary")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
]
