"""Tests for finance endpoints."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from .models import Category, Expense, Income

User = get_user_model()


class FinanceAPITests(APITestCase):
	"""Validate finance APIs."""

	def setUp(self) -> None:
		self.user = User.objects.create_user(
			email="student@example.com",
			password="password123",
			username="student",
			role=User.Roles.STUDENT,
		)
		token_url = reverse("auth-token")
		response = self.client.post(token_url, {"email": "student@example.com", "password": "password123"})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.access_token = response.json()["access"]
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")

	def test_create_income(self) -> None:
		url = reverse("income-list")
		payload = {
			"source": "Part-time job",
			"amount": "150.00",
			"date_received": date.today().isoformat(),
			"notes": "Evening shift",
		}
		response = self.client.post(url, payload)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(Income.objects.count(), 1)

	def test_create_expense(self) -> None:
		category = Category.objects.create(name="Books")
		url = reverse("expense-list")
		payload = {
			"amount": "75.00",
			"date_spent": date.today().isoformat(),
			"merchant": "Campus Store",
			"notes": "Books",
			"category": category.id,
		}
		response = self.client.post(url, payload)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(Expense.objects.count(), 1)

	def test_finance_summary(self) -> None:
		Income.objects.create(
			user=self.user,
			source="Grant",
			amount=Decimal("200.00"),
			date_received=date.today(),
			notes="Research grant",
		)
		Expense.objects.create(
			user=self.user,
			amount=Decimal("50.00"),
			date_spent=date.today(),
			merchant="Lab Store",
			notes="Supplies",
		)
		url = reverse("finance-summary-list")
		response = self.client.get(url)
		body = response.json()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(body["total_income"], "200.00")
		self.assertEqual(body["total_expense"], "50.00")
		self.assertEqual(body["net_balance"], "150.00")
		self.assertEqual(body["income_this_month"], "200.00")
		self.assertEqual(body["expense_this_month"], "50.00")
		self.assertEqual(body["current_balance"], "150.00")
		self.assertIsNone(body["income_change"])
		self.assertIsNone(body["expense_change"])
		self.assertIsNone(body["balance_change"])
