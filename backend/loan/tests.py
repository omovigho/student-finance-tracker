"""Tests for loan functionality."""

from __future__ import annotations

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from .models import Loan, LoanScheme

User = get_user_model()


class LoanWorkflowTests(APITestCase):
	"""Ensure loan lifecycle follows admin approval and student repayment."""

	def setUp(self) -> None:
		self.student = User.objects.create_user(
			email="loanstudent@example.com",
			password="password123",
			username="loanstudent",
			role="student",
		)
		self.admin = User.objects.create_user(
			email="loanadmin@example.com",
			password="password123",
			username="loanadmin",
			role="admin",
			is_staff=True,
		)
		self.scheme = LoanScheme.objects.create(
			name="Campus Credit Union",
			description="Short-term relief loan",
			lender_name="Campus Credit Union",
			principal="600.00",
			interest_rate="5.00",
			term_months=6,
			created_by=self.admin,
		)

	def authenticate(self, email: str, password: str) -> None:
		token_url = reverse("auth-token")
		response = self.client.post(token_url, {"email": email, "password": password})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		token = response.json()["access"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")  # type: ignore[attr-defined]

	def test_loan_application_approval_and_payoff(self) -> None:
		self.authenticate("loanstudent@example.com", "password123")
		create_url = reverse("loan-list")
		payload = {"scheme_id": self.scheme.id}
		create_response = self.client.post(create_url, payload)
		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		loan_id = create_response.json()["id"]
		loan = Loan.objects.get(pk=loan_id)
		self.assertEqual(loan.status, Loan.Status.PENDING)
		self.client.credentials()

		self.authenticate("loanadmin@example.com", "password123")
		approve_url = reverse("loan-approve", args=[loan_id])
		approve_response = self.client.post(approve_url)
		self.assertEqual(approve_response.status_code, status.HTTP_200_OK)
		loan.refresh_from_db()
		self.assertEqual(loan.status, Loan.Status.ACTIVE)
		self.assertIsNotNone(loan.due_date)
		self.client.credentials()

		self.authenticate("loanstudent@example.com", "password123")
		payoff_url = reverse("loan-payoff", args=[loan_id])
		payoff_response = self.client.post(payoff_url)
		self.assertEqual(payoff_response.status_code, status.HTTP_200_OK)
		loan.refresh_from_db()
		self.assertEqual(loan.status, Loan.Status.PAID)
		repayment = loan.repayments.first()
		self.assertIsNotNone(repayment)
		self.assertEqual(repayment.status, repayment.Status.PAID)
