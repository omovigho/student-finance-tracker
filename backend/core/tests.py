"""Core app tests."""

from __future__ import annotations

from django.test import TestCase


class HealthCheckViewTests(TestCase):
	"""Validate the health check endpoint returns expected payload."""

	def test_health_check_returns_ok(self) -> None:
		response = self.client.get("/api/health/")
		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.json(), {"status": "ok"})
