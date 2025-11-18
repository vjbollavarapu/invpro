"""Synchronization logging models for Shopify integration."""

from django.db import models

from .base import ShopifyBaseModel


class ShopifySyncLog(ShopifyBaseModel):
    """Records synchronization attempts for diagnostic purposes."""

    ENTITY_PRODUCTS = "products"
    ENTITY_ORDERS = "orders"
    ENTITY_CUSTOMERS = "customers"
    ENTITY_INVENTORY = "inventory"
    ENTITY_FULL = "full"

    ENTITY_CHOICES = [
        (ENTITY_PRODUCTS, "Products"),
        (ENTITY_ORDERS, "Orders"),
        (ENTITY_CUSTOMERS, "Customers"),
        (ENTITY_INVENTORY, "Inventory"),
        (ENTITY_FULL, "Full Sync"),
    ]

    STATUS_STARTED = "started"
    STATUS_SUCCESS = "success"
    STATUS_ERROR = "error"
    STATUS_PARTIAL = "partial"

    STATUS_CHOICES = [
        (STATUS_STARTED, "Started"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_ERROR, "Error"),
        (STATUS_PARTIAL, "Partial Success"),
    ]

    integration = models.ForeignKey(
        'shopify_integration.ShopifyIntegration',
        on_delete=models.CASCADE,
        related_name='sync_logs',
    )
    entity = models.CharField(max_length=32, choices=ENTITY_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_STARTED)
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.PositiveIntegerField(default=0)

    records_fetched = models.PositiveIntegerField(default=0)
    records_processed = models.PositiveIntegerField(default=0)
    records_created = models.PositiveIntegerField(default=0)
    records_updated = models.PositiveIntegerField(default=0)
    records_failed = models.PositiveIntegerField(default=0)

    message = models.TextField(blank=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=["integration", "entity", "status"]),
            models.Index(fields=["tenant_id", "started_at"]),
        ]
        verbose_name = "Shopify Sync Log"
        verbose_name_plural = "Shopify Sync Logs"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.integration.store_url} {self.entity} {self.status}"

    def mark_complete(
        self,
        *,
        status: str,
        message: str | None = None,
        details: dict | None = None,
    ) -> None:
        """Mark the log entry as complete and update metadata."""

        from django.utils import timezone

        self.status = status
        self.finished_at = timezone.now()
        if self.finished_at and self.started_at:
            delta = self.finished_at - self.started_at
            self.duration_ms = int(delta.total_seconds() * 1000)
        if message:
            self.message = message
        if details:
            self.details = details
        self.save()
