"""Notification API views."""

from __future__ import annotations

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationMarkSerializer, NotificationSerializer


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet[Notification]):
	"""List and update notifications for the current user."""

	serializer_class = NotificationSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return Notification.objects.filter(user=self.request.user)

	@action(detail=False, methods=["post"], url_path="mark-read")
	def mark_read(self, request: Request) -> Response:
		serializer = NotificationMarkSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		data = serializer.validated_data
		queryset = self.get_queryset()
		if data.get("mark_all"):
			updated = queryset.update(is_read=True)
		else:
			ids = data.get("ids", [])
			updated = queryset.filter(id__in=ids).update(is_read=True)
		return Response({"updated": updated}, status=status.HTTP_200_OK)

	@action(detail=True, methods=["post"], url_path="mark-read")
	def mark_single_read(self, request: Request, pk: str | None = None) -> Response:
		notification = self.get_object()
		if not notification.is_read:
			notification.is_read = True
			notification.save(update_fields=["is_read"])
		return Response({"updated": 1}, status=status.HTTP_200_OK)
