"""Models mapping Shopify products to local storage."""

from django.db import models

from .base import ShopifyBaseModel


class ShopifyProduct(ShopifyBaseModel):
    """Stores Shopify product metadata for a tenant's integration."""

    integration = models.ForeignKey(
        'shopify_integration.ShopifyIntegration',
        on_delete=models.CASCADE,
        related_name='products',
    )
    shopify_product_id = models.CharField(max_length=64, help_text="Shopify product ID")
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=32, default='active')
    product_type = models.CharField(max_length=128, blank=True)
    vendor = models.CharField(max_length=128, blank=True)
    tags = models.TextField(blank=True)
    handle = models.SlugField(max_length=255, blank=True)
    body_html = models.TextField(blank=True)
    options = models.JSONField(default=list, blank=True)
    variants = models.JSONField(default=list, blank=True)
    images = models.JSONField(default=list, blank=True)

    price_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    raw_data = models.JSONField(default=dict, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

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
        help_text="Whether this product has pending changes to push to Shopify",
    )
    last_push_error = models.TextField(
        blank=True,
        help_text="Error message from last failed push attempt",
    )
    conflict_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Stores conflict information when sync conflicts are detected",
    )

    class Meta:
        unique_together = ("integration", "shopify_product_id")
        ordering = ["title"]
        indexes = [
            models.Index(fields=["integration", "shopify_product_id"]),
            models.Index(fields=["tenant_id", "title"]),
            models.Index(fields=["sync_status", "pending_push"], name="shopify_prod_sync_idx"),
        ]

    def __str__(self) -> str:  # pragma: no cover - representation only
        return f"{self.title} ({self.shopify_product_id})"
