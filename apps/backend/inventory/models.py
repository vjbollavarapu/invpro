from django.db import models
from common.models import TenantAwareModel


class Product(TenantAwareModel):
    # User-facing formatted number (e.g., "PRD-001")
    product_code = models.CharField(max_length=100, blank=True, db_index=True)
    
    # Basic product information
    sku = models.CharField(max_length=64, unique=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=120, blank=True)
    unit = models.CharField(max_length=20, default='pcs', help_text="Unit of measurement: pcs, kg, liters, etc.")
    
    # Pricing
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Stock management
    quantity = models.IntegerField(default=0, help_text="Current stock quantity (available)")
    committed = models.IntegerField(default=0, help_text="Quantity committed/reserved (e.g., in orders)")
    incoming = models.IntegerField(default=0, help_text="Quantity incoming (e.g., in transit)")
    reorder_level = models.IntegerField(default=0)
    status = models.CharField(max_length=40, default="active")
    
    # Relationships
    supplier = models.ForeignKey(
        'procurement.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    
    # Shopify integration fields
    shopify_id = models.CharField(max_length=50, blank=True, help_text="Shopify product ID")
    shopify_variant_id = models.CharField(max_length=50, blank=True, help_text="Shopify variant ID")
    shopify_inventory_item_id = models.CharField(max_length=50, blank=True, help_text="Shopify inventory item ID")
    shopify_location_id = models.CharField(max_length=50, blank=True, help_text="Shopify location ID where inventory is stored")
    shopify_handle = models.CharField(max_length=255, blank=True, help_text="Shopify product handle")
    shopify_tags = models.TextField(blank=True, help_text="Shopify product tags (comma-separated)")
    shopify_created_at = models.DateTimeField(null=True, blank=True, help_text="Shopify creation date")
    shopify_updated_at = models.DateTimeField(null=True, blank=True, help_text="Shopify last update date")
    
    # Source tracking for multi-integration support
    data_source = models.CharField(
        max_length=50,
        choices=[
            ('shopify', 'Shopify'),
            ('xero', 'Xero'),
            ('manual', 'Manual'),
        ],
        default='manual',
        help_text="Source of this product data",
    )
    source_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="ID of the source record in the integration table (e.g., ShopifyProduct.id)",
    )
    last_imported_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp of last import from integration source",
    )
    
    class Meta:
        unique_together = ('tenant_id', 'product_code')
        indexes = [
            models.Index(fields=['tenant_id', 'product_code']),
            models.Index(fields=['tenant_id', 'status']),
            models.Index(fields=['data_source', 'source_id'], name='product_source_idx'),
        ]
    
    def save(self, *args, **kwargs):
        # Auto-generate product_code if not set
        if not self.product_code:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.product_code = get_next_number(tenant, 'product')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.product_code} - {self.name}"
    
    @property
    def total_value(self):
        """Calculate total value of current stock"""
        return self.quantity * self.unit_cost
    
    @property
    def total_quantity(self):
        """Calculate total quantity (available + committed + incoming)"""
        return self.quantity + self.committed + self.incoming

class StockMovement(TenantAwareModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    source_warehouse = models.ForeignKey(
        "warehouse.Warehouse",
        on_delete=models.SET_NULL,
        null=True,
        related_name="outgoing_movements",
        blank=True
    )
    destination_warehouse = models.ForeignKey(
        "warehouse.Warehouse",
        on_delete=models.SET_NULL,
        null=True,
        related_name="incoming_movements",
        blank=True
    )
    quantity = models.IntegerField()
    movement_type = models.CharField(
        max_length=10,
        choices=[("in", "In"), ("out", "Out"), ("transfer", "Transfer")]
    )
    
    # Additional tracking fields
    reason = models.TextField(blank=True, help_text="Reason for stock adjustment")
    performed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_movements'
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['tenant_id', '-timestamp']),
            models.Index(fields=['product', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.movement_type} - {self.product.name} ({self.quantity})"
