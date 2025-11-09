"""Scholarship API views."""

from __future__ import annotations

from typing import Any

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from users.permissions import IsStudent

from .models import Scholarship, ScholarshipApplication
from .serializers import (
	ScholarshipApplicationReviewSerializer,
	ScholarshipApplicationSerializer,
	ScholarshipListSerializer,
	ScholarshipSerializer,
)


def _is_admin_user(user: Any) -> bool:
	return bool(
		user
		and getattr(user, "is_authenticated", False)
		and (getattr(user, "role", "") == "admin" or getattr(user, "is_staff", False) or getattr(user, "is_superuser", False))
	)


class ScholarshipViewSet(viewsets.ModelViewSet[Scholarship]):
	"""Expose scholarships to users and allow applications."""

	queryset = Scholarship.objects.all()
	permission_classes = [IsAuthenticated]

	def _ensure_admin(self, request: Request) -> None:
		if not _is_admin_user(request.user):
			raise PermissionDenied("Only administrators can perform this action.")

	def get_queryset(self):
		queryset = Scholarship.objects.all().order_by("deadline", "name")
		if self.action == "list" and not _is_admin_user(self.request.user):
			return queryset.filter(is_active=True, deadline__gte=timezone.localdate())
		return queryset

	def get_serializer_class(self):
		if self.action == "list" and not _is_admin_user(self.request.user):
			return ScholarshipListSerializer
		return ScholarshipSerializer

	def perform_create(self, serializer: ScholarshipSerializer) -> None:
		self._ensure_admin(self.request)
		serializer.save()

	def create(self, request: Request, *args, **kwargs) -> Response:
		self._ensure_admin(request)
		return super().create(request, *args, **kwargs)

	def update(self, request: Request, *args, **kwargs) -> Response:
		self._ensure_admin(request)
		return super().update(request, *args, **kwargs)

	def partial_update(self, request: Request, *args, **kwargs) -> Response:
		self._ensure_admin(request)
		return super().partial_update(request, *args, **kwargs)

	def destroy(self, request: Request, *args, **kwargs) -> Response:
		self._ensure_admin(request)
		return super().destroy(request, *args, **kwargs)

	def retrieve(self, request: Request, *args, **kwargs) -> Response:
		instance = self.get_object()
		if not _is_admin_user(request.user):
			if instance.deadline < timezone.localdate() and not instance.applications.filter(applicant=request.user).exists():
				raise PermissionDenied("This scholarship is no longer available.")
		serializer = self.get_serializer(instance)
		return Response(serializer.data)

	@action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsStudent])
	def apply(self, request: Request, pk: str | None = None) -> Response:
		scholarship = self.get_object()
		serializer = ScholarshipApplicationSerializer(
			data=request.data,
			context={"request": request, "scholarship": scholarship},
		)
		serializer.is_valid(raise_exception=True)
		application = serializer.save()
		return Response(
			ScholarshipApplicationSerializer(application, context={"request": request}).data,
			status=status.HTTP_201_CREATED,
		)

	@action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="disbursements")
	def disbursements(self, request: Request) -> Response:
		self._ensure_admin(request)
		queryset = Scholarship.objects.all().order_by("deadline", "name")
		serializer = ScholarshipSerializer(queryset, many=True, context={"request": request})
		return Response(serializer.data)

	@action(detail=True, methods=["get"], permission_classes=[IsAuthenticated], url_path="applications")
	def list_applications(self, request: Request, pk: str | None = None) -> Response:
		self._ensure_admin(request)
		scholarship = self.get_object()
		applications = scholarship.applications.select_related("applicant").order_by("-submitted_at")
		serializer = ScholarshipApplicationSerializer(applications, many=True, context={"request": request})
		return Response(serializer.data)

	@action(
		detail=False,
		methods=["get"],
		permission_classes=[IsAuthenticated],
		url_path="my-applications",
	)
	def my_applications(self, request: Request) -> Response:
		user = request.user
		status_filter = request.query_params.get("status")
		queryset = ScholarshipApplication.objects.select_related("scholarship", "applicant")

		if _is_admin_user(user):
			applicant_id = request.query_params.get("applicant")
			if applicant_id:
				queryset = queryset.filter(applicant_id=applicant_id)
		else:
			if not IsStudent().has_permission(request, self):
				raise PermissionDenied("Only students or administrators can view their scholarship applications.")
			queryset = queryset.filter(applicant=user)

		if status_filter in ScholarshipApplication.Status.values:
			queryset = queryset.filter(status=status_filter)

		applications = queryset.order_by("-submitted_at")
		serializer = ScholarshipApplicationSerializer(applications, many=True, context={"request": request})
		return Response(serializer.data)

	@action(
		detail=False,
		methods=["post"],
		permission_classes=[IsAuthenticated],
		url_path="applications/(?P<application_id>[^/.]+)/review",
	)
	def review_application(self, request: Request, application_id: str) -> Response:
		self._ensure_admin(request)
		try:
			application = ScholarshipApplication.objects.select_related("scholarship").get(pk=application_id)
		except ScholarshipApplication.DoesNotExist:
			return Response({"detail": "Application not found."}, status=status.HTTP_404_NOT_FOUND)

		scholarship = application.scholarship

		serializer = ScholarshipApplicationReviewSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		action_value = serializer.validated_data["action"]
		if application.status != ScholarshipApplication.Status.PENDING:
			return Response({"detail": "Application has already been reviewed."}, status=status.HTTP_400_BAD_REQUEST)

		application.status = (
			ScholarshipApplication.Status.APPROVED if action_value == "approve" else ScholarshipApplication.Status.REJECTED
		)
		if serializer.validated_data.get("note"):
			application.note = serializer.validated_data["note"]
		application.reviewed_at = timezone.now()
		application.save(update_fields=["status", "note", "reviewed_at"])

		return Response(ScholarshipApplicationSerializer(application, context={"request": request}).data)
