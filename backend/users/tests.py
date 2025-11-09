"""Tests for the users app."""

from __future__ import annotations

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model


User = get_user_model()


class UserModelTests(APITestCase):
	"""Validate custom user model behaviour."""

	def test_create_user_with_email(self) -> None:
		user = User.objects.create_user(email="student@example.com", password="testpass123", username="student")
		self.assertEqual(user.email, "student@example.com")
		self.assertTrue(user.check_password("testpass123"))


class UserRegistrationAPITests(APITestCase):
	"""Ensure registration and authentication endpoints behave correctly."""

	def test_user_can_register_and_login(self) -> None:
		register_url = reverse("auth-register")
		payload = {
			"email": "newuser@example.com",
			"password": "StrongPass123",
			"first_name": "New",
			"last_name": "User",
		}
		response = self.client.post(register_url, payload)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		token_url = reverse("auth-token")
		token_response = self.client.post(token_url, {"email": payload["email"], "password": payload["password"]})
		self.assertEqual(token_response.status_code, status.HTTP_200_OK)
		self.assertIn("access", token_response.json())
