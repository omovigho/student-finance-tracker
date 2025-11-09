"""Notification models."""

from __future__ import annotations

from django.conf import settings
from django.db import models


class Notification(models.Model):
	"""Stores in-app notifications for users."""

	class Type(models.TextChoices):
		LOAN = "loan", "Loan"
		SCHOLARSHIP = "scholarship", "Scholarship"
		FINANCE = "finance", "Finance"
		GENERAL = "general", "General"

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
	title = models.CharField(max_length=255)
	message = models.TextField()
	type = models.CharField(max_length=20, choices=Type.choices, default=Type.GENERAL)
	is_read = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	send_email = models.BooleanField(default=False)

	class Meta:
		ordering = ["-created_at"]
		indexes = [
			models.Index(fields=["user", "is_read"]),
			models.Index(fields=["type"]),
		]

	def __str__(self) -> str:  # pragma: no cover - presentation only
		return f"Notification for {self.user}: {self.title}"

	def mark_read(self) -> None:
		"""Mark the notification as read."""

		if not self.is_read:
			self.is_read = True
			self.save(update_fields=["is_read"])
