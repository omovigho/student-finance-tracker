"""Loan API views."""

from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import QuerySet
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer

from notifications.utils import create_notification

from .models import Loan, LoanScheme, Repayment
from .serializers import LoanCreateSerializer, LoanSchemeSerializer, LoanSerializer, RepaymentSerializer

User = get_user_model()


class LoanSchemeViewSet(viewsets.ModelViewSet[LoanScheme]):
    """Expose loan schemes to administrators and students."""

    serializer_class = LoanSchemeSerializer
    permission_classes = [IsAuthenticated]
    ordering = ("-created_at",)

    def get_queryset(self) -> QuerySet[LoanScheme]:
        queryset = LoanScheme.objects.all()
        user = self.request.user
        if not (user.is_staff or getattr(user, "role", None) == "admin"):
            queryset = queryset.filter(is_active=True)
            restricted_statuses = [
                Loan.Status.PENDING,
                Loan.Status.ACTIVE,
                Loan.Status.PAID,
            ]
            applied_scheme_ids = (
                Loan.objects.filter(user=user, status__in=restricted_statuses)
                .values_list("scheme_id", flat=True)
                .distinct()
            )
            queryset = queryset.exclude(id__in=applied_scheme_ids)
        return queryset

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permission() for permission in self.permission_classes]
        return [IsAuthenticated(), IsAdminUser()]

    def perform_create(self, serializer: LoanSchemeSerializer) -> None:
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer: LoanSchemeSerializer) -> None:
        serializer.save()


class LoanViewSet(viewsets.ModelViewSet[Loan]):
    """Manage loan applications and lifecycle."""

    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    ordering = ("-created_at",)

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        loan = serializer.instance
        output = LoanSerializer(loan, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        scheme_name = loan.scheme.name if loan.scheme else loan.lender_name
        create_notification(
            user=request.user,
            title="Loan Application Submitted",
            message=f"Your application for {scheme_name} has been received and is pending review.",
            notification_type="loan",
        )
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self) -> QuerySet[Loan]:
        user = self.request.user
        queryset = Loan.objects.select_related("user", "scheme").prefetch_related("repayments")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if user.is_staff or getattr(user, "role", None) == "admin":
            user_id = self.request.query_params.get("user_id")
            if user_id:
                queryset = queryset.filter(user_id=user_id)
            return queryset
        return queryset.filter(user=user)

    def get_serializer_class(self) -> type[BaseSerializer]:
        if self.action == "create":
            return LoanCreateSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer: LoanCreateSerializer) -> None:
        user = self.request.user
        if getattr(user, "role", None) != "student":
            raise PermissionDenied("Only students can apply for loans.")
        serializer.save()

    def create(self, request: Request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        loan = serializer.instance
        output = LoanSerializer(loan, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        scheme_name = loan.scheme.name if loan.scheme else loan.lender_name
        create_notification(
            user=request.user,
            title="Loan Application Submitted",
            message=f"Your application for {scheme_name} has been received and is pending review.",
            notification_type="loan",
        )
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request: Request) -> Response:
        """Provide active loan insights for dashboard widgets."""

        user = request.user
        student_id = request.query_params.get("student_id") or request.query_params.get("user_id")

        if student_id:
            if not (user.is_staff or getattr(user, "role", None) == "admin"):
                raise PermissionDenied("You do not have permission to view other students' loan summaries.")
            try:
                target_user = get_object_or_404(User, pk=int(student_id))
            except (TypeError, ValueError):
                return Response({"detail": "Invalid student id."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_user = user

        loans = (
            Loan.objects.select_related("scheme")
            .prefetch_related("repayments")
            .filter(user=target_user, status=Loan.Status.ACTIVE)
            .order_by("due_date", "created_at")
        )

        today = timezone.now().date()
        payload = []
        for loan in loans:
            amount_due, next_repayment = loan.next_due
            due_date = next_repayment.due_date if next_repayment else loan.due_date
            payload.append(
                {
                    "id": loan.id,
                    "loan_id": loan.id,
                    "loan_name": loan.scheme.name if loan.scheme else loan.lender_name,
                    "status": loan.status,
                    "due_date": due_date,
                    "amount_due": amount_due or loan.total_payable,
                    "outstanding_balance": loan.outstanding_balance,
                    "days_until_due": (due_date - today).days if due_date else None,
                }
            )

        return Response({"active_loans": payload, "upcoming": payload})

    @action(detail=False, methods=["get"], url_path="history")
    def history(self, request: Request) -> Response:
        """Return loan grouped history for the authenticated student."""

        loans = self.get_queryset()
        serializer = LoanSerializer(loans, many=True, context=self.get_serializer_context())
        grouped: dict[str, list[dict]] = {
            Loan.Status.PENDING: [],
            Loan.Status.ACTIVE: [],
            Loan.Status.PAID: [],
            Loan.Status.CLOSED: [],
            Loan.Status.DEFAULTED: [],
        }
        for entry in serializer.data:
            grouped.setdefault(entry["status"], []).append(entry)
        return Response(grouped)

    @action(
        detail=False,
        methods=["get"],
        url_path="admin/history",
        permission_classes=[IsAuthenticated, IsAdminUser],
    )
    def admin_history(self, request: Request) -> Response:
        """Provide administrators with full loan history overview."""

        queryset = Loan.objects.select_related("user", "scheme").prefetch_related("repayments")
        serializer = LoanSerializer(queryset, many=True, context=self.get_serializer_context())
        totals = {
            "pending": queryset.filter(status=Loan.Status.PENDING).count(),
            "active": queryset.filter(status=Loan.Status.ACTIVE).count(),
            "paid": queryset.filter(status=Loan.Status.PAID).count(),
            "closed": queryset.filter(status=Loan.Status.CLOSED).count(),
            "defaulted": queryset.filter(status=Loan.Status.DEFAULTED).count(),
        }
        return Response({"results": serializer.data, "totals": totals})

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
        permission_classes=[IsAuthenticated, IsAdminUser],
    )
    def approve(self, request: Request, pk: str | None = None) -> Response:
        """Approve a pending loan application."""

        loan = self.get_object()
        if loan.status != Loan.Status.PENDING:
            raise ValidationError({"detail": "Only pending loans can be approved."})
        with transaction.atomic():
            loan.activate()
        scheme_name = loan.scheme.name if loan.scheme else loan.lender_name
        create_notification(
            user=loan.user,
            title="Loan Approved",
            message=f"Your loan for {scheme_name} has been approved. Repayment is due on {loan.due_date}.",
            notification_type="loan",
        )
        return Response(LoanSerializer(loan, context=self.get_serializer_context()).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="decline",
        permission_classes=[IsAuthenticated, IsAdminUser],
    )
    def decline(self, request: Request, pk: str | None = None) -> Response:
        """Decline a pending loan application."""

        loan = self.get_object()
        if loan.status != Loan.Status.PENDING:
            raise ValidationError({"detail": "Only pending loans can be declined."})
        note = request.data.get("note")
        with transaction.atomic():
            loan.mark_declined(note)
        scheme_name = loan.scheme.name if loan.scheme else loan.lender_name
        create_notification(
            user=loan.user,
            title="Loan Application Update",
            message=f"Your loan application for {scheme_name} was declined.",
            notification_type="loan",
        )
        return Response(LoanSerializer(loan, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"], url_path="payoff")
    def payoff(self, request: Request, pk: str | None = None) -> Response:
        """Allow a student to settle an active loan in full."""

        loan = self.get_object()
        if loan.user != request.user:
            raise PermissionDenied("You cannot pay off a loan that is not yours.")
        if loan.status != Loan.Status.ACTIVE:
            return Response({"detail": "Only active loans can be paid off."}, status=status.HTTP_400_BAD_REQUEST)

        repayment = loan.repayments.filter(status=Repayment.Status.PENDING).order_by("due_date").first()
        if not repayment:
            return Response({"detail": "No pending repayments found."}, status=status.HTTP_400_BAD_REQUEST)

        outstanding = (repayment.amount_due - repayment.paid_amount).quantize(Decimal("0.01"))
        if outstanding <= Decimal("0.00"):
            return Response({"detail": "This loan is already settled."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            repayment.apply_payment(outstanding)
            loan.mark_paid()

        lender_name = loan.scheme.lender_name if loan.scheme else loan.lender_name
        create_notification(
            user=loan.user,
            title="Loan Settled",
            message=f"You have successfully repaid your loan from {lender_name}.",
            notification_type="loan",
        )
        return Response(LoanSerializer(loan, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["get"], url_path="repayments")
    def list_repayments(self, request: Request, pk: str | None = None) -> Response:
        loan = self.get_object()
        serializer = RepaymentSerializer(loan.repayments.all(), many=True)
        return Response(serializer.data)
