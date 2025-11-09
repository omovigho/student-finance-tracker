"""URL configuration for the core project."""
from __future__ import annotations

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/health/", include("core.urls")),
    path("api/auth/", include("users.auth_urls")),
    path("api/users/", include("users.urls")),
    path("api/finance/", include("finance.urls")),
    path("api/loan/", include("loan.urls")),
    path("api/scholarships/", include("scholarship.urls")),
    path("api/notifications/", include("notifications.urls")),
]
