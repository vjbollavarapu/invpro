"""Models for tracking Shopify inventory levels."""

from django.db import models

from .base import ShopifyBaseModel


class ShopifyInventoryLevel(ShopifyBaseModel):
    """Represents inventory quantities for Shopify locations."""

    integration = models.ForeignKey(
        'shopify_integration.ShopifyIntegration',
        on_delete=models.CASCADE,
        related_name='inventory_levels',
    )
    shopify_inventory_item_id = models.CharField(max_length=64)
    shopify_location_id = models.CharField(max_length=64)
    sku = models.CharField(max_length=128, blank=True)
    available = models.IntegerField(default=0)
    committed = models.IntegerField(default=0)
    incoming = models.IntegerField(default=0)
    shopify_updated_at = models.DateTimeField(null=True, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    # Sync status tracking for bidirectional sync
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('synced', 'Synced'),
            ('conflict', 'Conflict'),
            ('error', 'Error'),
        ],
        default='pending',
        help_text="Sync status for bidirectional synchronization",
    )
    last_pulled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of last successful pull from Shopify",
    )
    last_pushed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of last successful push to Shopify",
    )
    pending_push = models.BooleanField(
        default=False,
        help_text="Whether this inventory level has pending changes to push to Shopify",
    )
    last_push_error = models.TextField(
        blank=True,
        help_text="Error message from last failed push attempt",
    )

    class Meta:
        unique_together = (
            "integration",
            "shopify_inventory_item_id",
            "shopify_location_id",
        )
        indexes = [
            models.Index(fields=["integration", "shopify_inventory_item_id"]),
            models.Index(fields=["tenant_id", "sku"]),
            models.Index(fields=["sync_status", "pending_push"], name="shopify_inv_sync_idx"),
        ]
        verbose_name = "Shopify Inventory Level"
        verbose_name_plural = "Shopify Inventory Levels"

    def __str__(self) -> str:  # pragma: no cover - representation only
        return f"Inventory {self.shopify_inventory_item_id} @ {self.shopify_location_id}"
