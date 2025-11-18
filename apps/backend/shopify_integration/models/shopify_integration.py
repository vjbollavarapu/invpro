"""Models related to Shopify integration configuration."""

from django.core.validators import URLValidator
from django.db import models

from .base import ShopifyBaseModel


def _get_default_api_version():
    """Get default API version from environment or use default."""
    import os
    return os.getenv("SHOPIFY_API_VERSION", "2024-10")


class ShopifyIntegration(ShopifyBaseModel):
    """Stores configuration and runtime metadata for a Shopify connection."""

    STATUS_DISCONNECTED = "DISCONNECTED"
    STATUS_CONNECTED = "CONNECTED"
    STATUS_SYNCING = "SYNCING"
    STATUS_ERROR = "ERROR"
    STATUS_PAUSED = "PAUSED"

    STATUS_CHOICES = [
        (STATUS_DISCONNECTED, "Disconnected"),
        (STATUS_CONNECTED, "Connected"),
        (STATUS_SYNCING, "Syncing"),
        (STATUS_ERROR, "Error"),
        (STATUS_PAUSED, "Paused"),
    ]

    store_url = models.CharField(
        max_length=255,
        validators=[URLValidator()],
        help_text="Primary Shopify store URL (e.g. https://mystore.myshopify.com)",
    )
    api_key = models.CharField(max_length=255, help_text="Private app API key")
    api_secret = models.CharField(max_length=255, help_text="Private app API secret")
    access_token = models.CharField(
        max_length=255,
        blank=True,
        help_text="Generated access token after OAuth flow",
    )
    scopes = models.TextField(
        blank=True,
        help_text="Granted API scopes, comma separated",
    )
    api_version = models.CharField(
        max_length=20,
        default=_get_default_api_version,
        help_text="Shopify API version used for requests",
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_DISCONNECTED,
        db_index=True,
    )
    webhook_secret = models.CharField(
        max_length=255,
        blank=True,
        help_text="Secret used to verify webhook signatures",
    )
    auto_sync_enabled = models.BooleanField(
        default=True,
        help_text="Automatically run background synchronization tasks",
    )
    sync_products = models.BooleanField(default=True)
    sync_orders = models.BooleanField(default=True)
    sync_customers = models.BooleanField(default=True)
    sync_inventory = models.BooleanField(default=True)

    last_sync_at = models.DateTimeField(null=True, blank=True)
    last_successful_sync = models.DateTimeField(null=True, blank=True)
    last_error_at = models.DateTimeField(null=True, blank=True)
    last_error_message = models.TextField(blank=True)
    error_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of consecutive errors",
    )

    sync_frequency_minutes = models.PositiveIntegerField(
        default=15,
        help_text="Desired background sync frequency",
    )

    class Meta:
        unique_together = ("tenant_id", "store_url")
        indexes = [
            models.Index(fields=["tenant_id", "status"]),
        ]
        verbose_name = "Shopify Integration"
        verbose_name_plural = "Shopify Integrations"

    def __str__(self) -> str:  # pragma: no cover - human readable representation
        return f"{self.store_url} ({self.status})"

    @property
    def is_active(self) -> bool:
        """Return True when the integration is connected and syncing is enabled."""

        return self.status == self.STATUS_CONNECTED and self.auto_sync_enabled

    @property
    def is_connected(self) -> bool:
        """Return True when the integration is connected."""
        return self.status == self.STATUS_CONNECTED

    def mark_error(self, message: str) -> None:
        """Persist an error message and update last error timestamp."""

        from django.utils import timezone

        self.last_error_at = timezone.now()
        self.last_error_message = message
        self.status = self.STATUS_ERROR
        self.error_count += 1
        self.save(update_fields=["last_error_at", "last_error_message", "status", "error_count", "updated_at"])

    def mark_success(self) -> None:
        """Record a successful sync run."""

        from django.utils import timezone

        now = timezone.now()
        self.last_sync_at = now
        self.last_successful_sync = now
        if self.status != self.STATUS_CONNECTED:
            self.status = self.STATUS_CONNECTED
        # Reset error count on success
        if self.error_count > 0:
            self.error_count = 0
        self.save(update_fields=["last_sync_at", "last_successful_sync", "status", "error_count", "updated_at"])
