"""Scholarship API tests covering student and admin scenarios."""

from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Scholarship, ScholarshipApplication

User = get_user_model()


class ScholarshipEndpointsTests(APITestCase):
	"""Validate scholarship application and review flows."""

	def setUp(self) -> None:
		self.student = User.objects.create_user(
			email="student@example.com",
			password="password123",
			username="student",
			role=User.Roles.STUDENT,
		)
		self.admin = User.objects.create_user(
			email="admin@example.com",
			password="password123",
			username="admin",
			role=User.Roles.ADMIN,
			is_staff=True,
		)
		self.scholarship = Scholarship.objects.create(
			name="Innovation Grant",
			description="Supports innovative student research projects.",
			amount="1500.00",
			provider="University Board",
			eligibility_criteria="Open to all registered students. Provide your proposed lab focus and expected impact.",
			deadline=timezone.localdate() + timedelta(days=14),
			is_active=True,
		)

	def _auth_client(self, email: str, password: str) -> APIClient:
		token_response = self.client.post(reverse("auth-token"), {"email": email, "password": password})
		self.assertEqual(token_response.status_code, status.HTTP_200_OK)
		token = token_response.json()["access"]
		client = APIClient()
		client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
		return client

	def test_student_can_apply_before_deadline(self) -> None:
		student_client = self._auth_client("student@example.com", "password123")
		apply_url = reverse("scholarship-apply", args=[self.scholarship.pk])
		response = student_client.post(
			apply_url,
			{"note": "I will use the funds for lab fees, mentorship, and equipment upgrades within compliance."},
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		payload = response.json()
		self.assertEqual(payload["status"], ScholarshipApplication.Status.PENDING)
		self.assertEqual(ScholarshipApplication.objects.count(), 1)

	def test_student_cannot_apply_after_deadline(self) -> None:
		expired = Scholarship.objects.create(
			name="Archive Scholarship",
			description="Legacy program.",
			amount="500.00",
			provider="Alumni",
			eligibility_criteria="Final year students only. Detail your thesis plans.",
			deadline=timezone.localdate() - timedelta(days=1),
			is_active=True,
		)
		student_client = self._auth_client("student@example.com", "password123")
		apply_url = reverse("scholarship-apply", args=[expired.pk])
		response = student_client.post(
			apply_url,
			{"note": "Hope to still qualify even though my thesis timeline aligns with requirements in detail."},
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("deadline", response.json().get("detail", "").lower())

	def test_duplicate_application_is_prevented(self) -> None:
		student_client = self._auth_client("student@example.com", "password123")
		apply_url = reverse("scholarship-apply", args=[self.scholarship.pk])
		first = student_client.post(
			apply_url,
			{"note": "Great opportunity to expand our lab equipment and collaborate with industry mentors."},
		)
		self.assertEqual(first.status_code, status.HTTP_201_CREATED)
		second = student_client.post(
			apply_url,
			{"note": "Trying again even though I know duplicate submissions should be prevented."},
		)
		self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("already applied", second.json().get("detail", ""))

	def test_admin_cannot_review_before_deadline(self) -> None:
		student_client = self._auth_client("student@example.com", "password123")
		apply_url = reverse("scholarship-apply", args=[self.scholarship.pk])
		student_client.post(
			apply_url,
			{"note": "Looking forward to this support for our capstone initiative and community outreach."},
		)
		application = ScholarshipApplication.objects.get()

		admin_client = self._auth_client("admin@example.com", "password123")
		review_url = reverse("scholarship-review-application", kwargs={"application_id": application.pk})
		response = admin_client.post(review_url, {"action": "approve"})
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("deadline", response.json().get("detail", ""))

	def test_admin_can_review_after_deadline(self) -> None:
		student_client = self._auth_client("student@example.com", "password123")
		apply_url = reverse("scholarship-apply", args=[self.scholarship.pk])
		student_client.post(
			apply_url,
			{"note": "Final submission with detailed eligibility answers covering all rubric items and compliance."},
		)
		application = ScholarshipApplication.objects.get()

		# Simulate the deadline passing
		self.scholarship.deadline = timezone.localdate() - timedelta(days=1)
		self.scholarship.save(update_fields=["deadline"])

		admin_client = self._auth_client("admin@example.com", "password123")
		review_url = reverse("scholarship-review-application", kwargs={"application_id": application.pk})
		response = admin_client.post(
			review_url,
			{"action": "approve", "note": "Approved after committee review with strong research alignment."},
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		application.refresh_from_db()
		self.assertEqual(application.status, ScholarshipApplication.Status.APPROVED)
		self.assertIn("committee review", application.note)
