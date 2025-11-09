"""Shared abstract models used across the project."""

from __future__ import annotations

import uuid
from django.db import models


class TimeStampedModel(models.Model):
	"""Abstract base model providing created/updated timestamps."""

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		abstract = True


class UUIDModel(models.Model):
	"""Abstract base model with a UUID primary key."""

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

	class Meta:
		abstract = True
