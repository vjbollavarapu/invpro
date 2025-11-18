"""Models representing Shopify customers."""

from django.db import models

from .base import ShopifyBaseModel


class ShopifyCustomer(ShopifyBaseModel):
    """Stores Shopify customer information synced for a tenant."""

    integration = models.ForeignKey(
        'shopify_integration.ShopifyIntegration',
        on_delete=models.CASCADE,
        related_name='customers',
    )
    shopify_customer_id = models.CharField(max_length=64, db_index=True)
    email = models.EmailField(blank=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    state = models.CharField(max_length=64, blank=True)
    tags = models.TextField(blank=True)
    addresses = models.JSONField(default=list, blank=True)
    default_address = models.JSONField(default=dict, blank=True)
    total_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    orders_count = models.IntegerField(default=0)
    last_order_id = models.CharField(max_length=64, blank=True)
    last_order_name = models.CharField(max_length=128, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("integration", "shopify_customer_id")
        ordering = ["-synced_at", "email"]
        indexes = [
            models.Index(fields=["integration", "shopify_customer_id"]),
            models.Index(fields=["tenant_id", "email"]),
        ]

    def __str__(self) -> str:  # pragma: no cover - representation only
        identifier = self.email or self.shopify_customer_id
        return f"Customer {identifier}"
