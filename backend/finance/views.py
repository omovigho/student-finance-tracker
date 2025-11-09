"""Finance viewsets and endpoints."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import cast

from django.db.models import Q, QuerySet, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Budget, Category, Expense, Income
from .serializers import (
	BudgetSerializer,
	CategorySerializer,
	ExpenseSerializer,
	FinanceDashboardSummarySerializer,
	FinanceSummarySerializer,
	IncomeSerializer,
)


class IncomeViewSet(viewsets.ModelViewSet[Income]):
	"""Manage income records for authenticated users."""

	serializer_class = IncomeSerializer
	permission_classes = [IsAuthenticated]

	def _is_admin(self) -> bool:
		user = self.request.user
		return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser or getattr(user, "role", "") == "admin"))

	def get_queryset(self) -> QuerySet[Income]:
		request = cast(Request, self.request)
		queryset: QuerySet[Income] = Income.objects.all()
		if not self._is_admin():
			queryset = queryset.filter(user=request.user)
		start_date = request.query_params.get("start_date")
		end_date = request.query_params.get("end_date")
		search_term = request.query_params.get("search")
		if start_date:
			queryset = queryset.filter(date_received__gte=start_date)
		if end_date:
			queryset = queryset.filter(date_received__lte=end_date)
		if search_term:
			queryset = queryset.filter(Q(source__icontains=search_term) | Q(notes__icontains=search_term))
		return queryset.order_by("-date_received", "-created_at")

	def perform_create(self, serializer: IncomeSerializer) -> None:
		serializer.save(user=self.request.user)


class ExpenseViewSet(viewsets.ModelViewSet[Expense]):
	"""Manage expense records for authenticated users."""

	serializer_class = ExpenseSerializer
	permission_classes = [IsAuthenticated]

	def _is_admin(self) -> bool:
		user = self.request.user
		return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser or getattr(user, "role", "") == "admin"))

	def get_queryset(self) -> QuerySet[Expense]:
		request = cast(Request, self.request)
		queryset: QuerySet[Expense] = Expense.objects.all()
		if not self._is_admin():
			queryset = queryset.filter(user=request.user)
		start_date = request.query_params.get("start_date")
		end_date = request.query_params.get("end_date")
		search_term = request.query_params.get("search")
		if start_date:
			queryset = queryset.filter(date_spent__gte=start_date)
		if end_date:
			queryset = queryset.filter(date_spent__lte=end_date)
		if search_term:
			queryset = queryset.filter(Q(merchant__icontains=search_term) | Q(notes__icontains=search_term))
		return queryset.order_by("-date_spent", "-created_at")

	def perform_create(self, serializer: ExpenseSerializer) -> None:
		serializer.save(user=self.request.user)


class BudgetViewSet(viewsets.ModelViewSet[Budget]):
	"""Manage budgets for authenticated students."""

	serializer_class = BudgetSerializer
	permission_classes = [IsAuthenticated]

	def _is_admin(self) -> bool:
		user = self.request.user
		return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser or getattr(user, "role", "") == "admin"))

	def get_queryset(self) -> QuerySet[Budget]:
		if self._is_admin():
			return Budget.objects.all()
		return Budget.objects.filter(user=self.request.user)

	def perform_create(self, serializer: BudgetSerializer) -> None:
		serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet[Category]):
	"""Manage expense categories."""

	serializer_class = CategorySerializer
	permission_classes = [IsAuthenticated]

	def get_permissions(self):
		if self.action in {"create", "update", "partial_update", "destroy"}:
			return [IsAdminUser()]
		return super().get_permissions()

	def get_queryset(self) -> QuerySet[Category]:
		return Category.objects.all()


class FinanceSummaryViewSet(viewsets.ViewSet):
	"""Provides a summary endpoint for incomes and expenses."""

	permission_classes = [IsAuthenticated]

	def list(self, request: Request) -> Response:
		today = timezone.now().date()
		current_month_start = today.replace(day=1)
		previous_month_start = _shift_month(current_month_start, -1)
		next_month_start = _shift_month(current_month_start, 1)

		start_param = request.query_params.get("start")
		end_param = request.query_params.get("end")
		try:
			start_date = date.fromisoformat(start_param) if start_param else None
			end_date = date.fromisoformat(end_param) if end_param else None
		except ValueError:
			return Response({"detail": "Invalid date format."}, status=status.HTTP_400_BAD_REQUEST)

		if start_date and end_date and end_date < start_date:
			return Response(
				{"detail": "End date must be greater than or equal to start date."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		income_qs = Income.objects.filter(user=request.user)
		expense_qs = Expense.objects.filter(user=request.user)
		if start_date:
			income_qs = income_qs.filter(date_received__gte=start_date)
			expense_qs = expense_qs.filter(date_spent__gte=start_date)
		if end_date:
			income_qs = income_qs.filter(date_received__lte=end_date)
			expense_qs = expense_qs.filter(date_spent__lte=end_date)

		income_total_raw = income_qs.aggregate(total=Sum("amount"))
		expense_total_raw = expense_qs.aggregate(total=Sum("amount"))
		total_income = income_total_raw["total"] or Decimal("0.00")
		total_expense = expense_total_raw["total"] or Decimal("0.00")
		net_balance = total_income - total_expense

		income_current_month = Income.objects.filter(
			user=request.user,
			date_received__gte=current_month_start,
			date_received__lt=next_month_start,
		).aggregate(total=Sum("amount"))
		expense_current_month = Expense.objects.filter(
			user=request.user,
			date_spent__gte=current_month_start,
			date_spent__lt=next_month_start,
		).aggregate(total=Sum("amount"))
		current_income = income_current_month["total"] or Decimal("0.00")
		current_expense = expense_current_month["total"] or Decimal("0.00")
		current_balance = current_income - current_expense

		income_previous_month = Income.objects.filter(
			user=request.user,
			date_received__gte=previous_month_start,
			date_received__lt=current_month_start,
		).aggregate(total=Sum("amount"))
		expense_previous_month = Expense.objects.filter(
			user=request.user,
			date_spent__gte=previous_month_start,
			date_spent__lt=current_month_start,
		).aggregate(total=Sum("amount"))
		previous_income = income_previous_month["total"] or Decimal("0.00")
		previous_expense = expense_previous_month["total"] or Decimal("0.00")
		previous_balance = previous_income - previous_expense

		income_change = _percent_change(current_income, previous_income)
		expense_change = _percent_change(current_expense, previous_expense)
		balance_change = _percent_change(current_balance, previous_balance)

		serializer = FinanceDashboardSummarySerializer(
			{
				"total_income": total_income,
				"total_expense": total_expense,
				"net_balance": net_balance,
				"income_this_month": current_income,
				"expense_this_month": current_expense,
				"current_balance": current_balance,
				"income_change": income_change,
				"expense_change": expense_change,
				"balance_change": balance_change,
			}
		)
		return Response(serializer.data)

	@action(detail=False, methods=["get"], url_path="trends")
	def trends(self, request: Request) -> Response:
		"""Return income vs expense trend for previous months."""

		today = timezone.now().date()
		current_month_start = today.replace(day=1)
		window_param = request.query_params.get("window", "6m")
		window_months = _parse_window(window_param)
		include_current = request.query_params.get("include_current", "true").lower() != "false"
		results: list[dict[str, object]] = []

		start_offset = -(window_months - 1) if include_current and window_months > 0 else -window_months
		end_offset = 1 if include_current else 0

		for offset in range(start_offset, end_offset):
			month_start = _shift_month(current_month_start, offset)
			next_month = _shift_month(month_start, 1)
			month_income = Income.objects.filter(
				user=request.user,
				date_received__gte=month_start,
				date_received__lt=next_month,
			).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
			month_expense = Expense.objects.filter(
				user=request.user,
				date_spent__gte=month_start,
				date_spent__lt=next_month,
			).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
			results.append(
				{
					"month": month_start.strftime("%b %Y"),
					"income": month_income,
					"expense": month_expense,
				}
			)

		return Response({"results": results})

	@action(detail=False, methods=["get"], url_path="expenses/by-category")
	def expenses_by_category(self, request: Request) -> Response:
		"""Summarise expenses by category."""

		period = request.query_params.get("period", "current_month")
		today = timezone.now().date()
		current_month_start = today.replace(day=1)
		queryset = Expense.objects.filter(user=request.user)

		if period == "current_month":
			next_month_start = _shift_month(current_month_start, 1)
			queryset = queryset.filter(date_spent__gte=current_month_start, date_spent__lt=next_month_start)
		elif period == "last_6_months":
			six_months_ago = _shift_month(current_month_start, -6)
			queryset = queryset.filter(date_spent__gte=six_months_ago, date_spent__lt=current_month_start)
		elif period == "previous_month":
			previous_month_start = _shift_month(current_month_start, -1)
			queryset = queryset.filter(date_spent__gte=previous_month_start, date_spent__lt=current_month_start)

		category_totals = (
			queryset
			.values("category", "category__name")
			.annotate(total=Sum("amount"))
			.order_by("category__name")
		)

		results = [
			{
				"category_id": entry["category"],
				"category": entry["category__name"] or "Uncategorised",
				"amount": entry["total"] or Decimal("0.00"),
			}
			for entry in category_totals
		]
		return Response({"results": results})

	@action(detail=False, methods=["get"], url_path="expenses/category-breakdown")
	def expenses_category_breakdown(self, request: Request) -> Response:
		"""Return monthly expense breakdown per category for visual summaries."""

		mode = request.query_params.get("mode", "month")
		month_param = request.query_params.get("month")
		today = timezone.now().date()
		current_month_start = today.replace(day=1)
		if mode in {"last_3_months", "last_6_months"}:
			window = 3 if mode == "last_3_months" else 6
			month_starts = [
				_shift_month(current_month_start, offset)
				for offset in range(-(window - 1), 1)
			]
		elif mode == "month":
			if not month_param:
				return Response({"detail": "month parameter is required for mode=month."}, status=status.HTTP_400_BAD_REQUEST)
			try:
				year, month = map(int, month_param.split("-"))
				month_starts = [date(year, month, 1)]
			except ValueError:
				return Response({"detail": "Invalid month format. Use YYYY-MM."}, status=status.HTTP_400_BAD_REQUEST)
		else:
			return Response({"detail": "Unsupported mode."}, status=status.HTTP_400_BAD_REQUEST)

		series: list[dict[str, object]] = []
		for month_start in month_starts:
			next_month = _shift_month(month_start, 1)
			monthly_queryset = (
				Expense.objects.filter(
					user=request.user,
					date_spent__gte=month_start,
					date_spent__lt=next_month,
				)
				.values("category", "category__name")
				.annotate(total=Sum("amount"))
				.order_by("category__name")
			)
			categories = [
				{
					"category_id": entry["category"],
					"category": entry["category__name"] or "Uncategorised",
					"amount": entry["total"] or Decimal("0.00"),
				}
				for entry in monthly_queryset
			]
			total = sum(item["amount"] for item in categories) if categories else Decimal("0.00")
			series.append(
				{
					"month": month_start.strftime("%b %Y"),
					"month_key": month_start.strftime("%Y-%m"),
					"categories": categories,
					"total": total,
				}
			)

		return Response({"mode": mode, "series": series})

	@action(detail=False, methods=["get"], url_path="incomes/by-category")
	def incomes_by_category(self, request: Request) -> Response:
		"""Summarise incomes by source (category equivalent)."""

		period = request.query_params.get("period", "all")
		today = timezone.now().date()
		current_month_start = today.replace(day=1)
		queryset = Income.objects.filter(user=request.user)

		if period == "current_month":
			next_month_start = _shift_month(current_month_start, 1)
			queryset = queryset.filter(date_received__gte=current_month_start, date_received__lt=next_month_start)
		elif period == "last_6_months":
			six_months_ago = _shift_month(current_month_start, -6)
			queryset = queryset.filter(date_received__gte=six_months_ago, date_received__lt=current_month_start)
		elif period == "previous_month":
			previous_month_start = _shift_month(current_month_start, -1)
			queryset = queryset.filter(date_received__gte=previous_month_start, date_received__lt=current_month_start)

		results = (
			queryset
			.values("source")
			.annotate(total=Sum("amount"))
			.order_by("source")
		)

		payload = [
			{
				"category": entry["source"] or "Uncategorised",
				"amount": entry["total"] or Decimal("0.00"),
			}
			for entry in results
		]
		return Response({"results": payload})


def _shift_month(reference: date, offset: int) -> date:
	"""Return the first day of the month offset from reference."""

	month = reference.month - 1 + offset
	year = reference.year + month // 12
	month = month % 12 + 1
	return date(year, month, 1)


def _percent_change(current: Decimal, previous: Decimal) -> Decimal | None:
	"""Calculate percentage change handling division by zero."""

	if previous == 0:
		return None
	change = ((current - previous) / previous) * Decimal("100")
	return change.quantize(Decimal("0.01"))


def _parse_window(raw: str) -> int:
	"""Parse window parameter like '6m' to integer months."""

	try:
		if raw.endswith("m"):
			value = int(raw[:-1])
		else:
			value = int(raw)
	except (TypeError, ValueError):
		value = 6
	return max(1, min(value, 24))
