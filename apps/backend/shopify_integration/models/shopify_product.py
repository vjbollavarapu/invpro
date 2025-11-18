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

    class Meta:
        unique_together = ("integration", "shopify_product_id")
        ordering = ["title"]
        indexes = [
            models.Index(fields=["integration", "shopify_product_id"]),
            models.Index(fields=["tenant_id", "title"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - representation only
        return f"{self.title} ({self.shopify_product_id})"
