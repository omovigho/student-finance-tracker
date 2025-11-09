"""User app models."""

from __future__ import annotations

from typing import Any

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models


class UserManager(BaseUserManager["User"]):
	"""Custom manager that enforces email-based authentication."""

	use_in_migrations = True

	def _create_user(self, email: str, password: str | None, **extra_fields: Any) -> "User":
		if not email:
			raise ValueError("The Email field must be set")
		email = self.normalize_email(email)
		user = self.model(email=email, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_user(self, email: str, password: str | None = None, **extra_fields: Any) -> "User":
		extra_fields.setdefault("is_staff", False)
		extra_fields.setdefault("is_superuser", False)
		return self._create_user(email, password, **extra_fields)

	def create_superuser(self, email: str, password: str, **extra_fields: Any) -> "User":
		extra_fields.setdefault("is_staff", True)
		extra_fields.setdefault("is_superuser", True)

		if extra_fields.get("is_staff") is not True:
			raise ValueError("Superuser must have is_staff=True.")
		if extra_fields.get("is_superuser") is not True:
			raise ValueError("Superuser must have is_superuser=True.")

		return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
	"""Custom user model that authenticates via email."""

	class Roles(models.TextChoices):
		STUDENT = "student", "Student"
		ADMIN = "admin", "Admin"
		SPONSOR = "sponsor", "Sponsor"

	username = models.CharField(max_length=150, blank=True, null=True)
	email = models.EmailField(unique=True)
	student_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
	phone_number = models.CharField(
		max_length=20,
		validators=[RegexValidator(r"^[+\d][\d -]{7,19}$", "Enter a valid phone number.")],
		blank=True,
	)
	role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.STUDENT)
	profile_image = models.ImageField(upload_to="profiles/", blank=True, null=True)
	department = models.CharField(max_length=100, blank=True)
	dob = models.DateField(null=True, blank=True)

	objects = UserManager()

	EMAIL_FIELD = "email"
	USERNAME_FIELD = "email"
	REQUIRED_FIELDS: list[str] = []

	class Meta:
		verbose_name = "User"
		verbose_name_plural = "Users"
		indexes = [
			models.Index(fields=["email"]),
			models.Index(fields=["role"]),
		]

	def __str__(self) -> str:
		return f"{self.get_full_name() or self.email}"

	@property
	def is_student(self) -> bool:
		return self.role == self.Roles.STUDENT

	@property
	def is_admin(self) -> bool:
		return self.role == self.Roles.ADMIN

	@property
	def is_sponsor(self) -> bool:
		return self.role == self.Roles.SPONSOR

	def get_full_name(self) -> str:
		full_name = super().get_full_name()
		return full_name.strip() or self.email
