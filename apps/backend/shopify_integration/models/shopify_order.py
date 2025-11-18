"""Models representing Shopify orders."""

from django.db import models

from .base import ShopifyBaseModel


class ShopifyOrder(ShopifyBaseModel):
    """Stores order information retrieved from Shopify."""

    integration = models.ForeignKey(
        'shopify_integration.ShopifyIntegration',
        on_delete=models.CASCADE,
        related_name='orders',
    )
    shopify_order_id = models.CharField(max_length=64, db_index=True)
    shopify_order_number = models.CharField(max_length=64, blank=True)
    name = models.CharField(max_length=128, help_text="Human-readable order name")
    email = models.EmailField(blank=True)
    financial_status = models.CharField(max_length=64, blank=True)
    fulfillment_status = models.CharField(max_length=64, blank=True)
    currency = models.CharField(max_length=16, default='USD')
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_discounts = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    processed_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    shipping_address = models.JSONField(default=dict, blank=True)
    billing_address = models.JSONField(default=dict, blank=True)
    line_items = models.JSONField(default=list, blank=True)
    customer_data = models.JSONField(default=dict, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("integration", "shopify_order_id")
        ordering = ['-processed_at', '-created_at']
        indexes = [
            models.Index(fields=["integration", "shopify_order_id"]),
            models.Index(fields=["tenant_id", "processed_at"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - string representation only
        return f"Order {self.name}"
