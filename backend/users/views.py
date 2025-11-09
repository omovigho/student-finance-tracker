"""Views for user management and authentication."""

from __future__ import annotations

from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsOwnerOrAdmin
from .serializers import (
    ChangePasswordSerializer,
    UserMeSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)

User = get_user_model()


class UserRegistrationView(APIView):
	"""Register a new user."""

	permission_classes = [AllowAny]

	def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
		serializer = UserRegistrationSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		response_serializer = UserMeSerializer(user)
		return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet[User]):
	"""API endpoint that allows users to be viewed or edited."""

	queryset = User.objects.all().order_by("email")
	serializer_class = UserSerializer
	filterset_fields = ("role", "is_active")
	search_fields = ("email", "first_name", "last_name", "student_id")
	ordering_fields = ("email", "date_joined")

	def get_permissions(self):
		if self.action in {"list", "destroy", "create"}:
			permission_classes = [IsAdminUser]
		elif self.action in {"retrieve", "update", "partial_update"}:
			permission_classes = [IsAuthenticated, IsOwnerOrAdmin]
		elif self.action in {"me", "change_password"}:
			permission_classes = [IsAuthenticated]
		else:
			permission_classes = [IsAuthenticated]
		return [permission() for permission in permission_classes]

	def get_queryset(self):
		user = self.request.user
		if user.is_authenticated and (user.is_staff or getattr(user, "role", None) == "admin"):
			return super().get_queryset()
		return User.objects.filter(pk=user.pk)

	def get_serializer_class(self):
		if self.action == "me":
			return UserMeSerializer
		if self.action == "create":
			return UserRegistrationSerializer
		return super().get_serializer_class()

	def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		output_serializer = UserSerializer(user, context=self.get_serializer_context())
		headers = self.get_success_headers(output_serializer.data)
		return Response(output_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

	@action(detail=False, methods=["get", "put", "patch"], url_path="me")
	def me(self, request: Request) -> Response:
		if request.method in {"PUT", "PATCH"}:
			serializer = self.get_serializer(request.user, data=request.data, partial=True)
			serializer.is_valid(raise_exception=True)
			serializer.save()
			return Response(serializer.data)
		serializer = self.get_serializer(request.user)
		return Response(serializer.data)

	@action(detail=False, methods=["post"], url_path="change-password")
	def change_password(self, request: Request) -> Response:
		serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response({"detail": "Password updated successfully."})
