"""Notification API tests."""

from __future__ import annotations

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


class NotificationAPITests(APITestCase):
	"""Ensure notifications can be listed and marked as read."""

	def setUp(self) -> None:
		self.user = User.objects.create_user(
			email="notify@example.com",
			password="password123",
			username="notifyuser",
			role=User.Roles.STUDENT,
		)
		Notification.objects.create(user=self.user, title="Test", message="Message", type="general")
		token_url = reverse("auth-token")
		response = self.client.post(token_url, {"email": "notify@example.com", "password": "password123"})
		token = response.json()["access"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

	def test_list_notifications(self) -> None:
		response = self.client.get(reverse("notification-list"))
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.json()), 1)

	def test_mark_notifications_read(self) -> None:
		note = Notification.objects.first()
		response = self.client.post(reverse("notification-mark-read"), {"ids": [note.id]})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		note.refresh_from_db()
		self.assertTrue(note.is_read)
