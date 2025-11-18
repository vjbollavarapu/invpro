from django.db import models
from common.models import TenantAwareModel


class Customer(TenantAwareModel):
    # User-facing formatted number (e.g., "CUST-001")
    customer_code = models.CharField(max_length=100, blank=True, db_index=True)
    
    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    
    # Shopify integration fields
    shopify_id = models.CharField(max_length=50, blank=True, help_text="Shopify customer ID")
    shopify_created_at = models.DateTimeField(null=True, blank=True, help_text="Shopify creation date")
    shopify_updated_at = models.DateTimeField(null=True, blank=True, help_text="Shopify last update date")
    
    class Meta:
        unique_together = ('tenant_id', 'customer_code')
        indexes = [
            models.Index(fields=['tenant_id', 'customer_code']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.customer_code:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.customer_code = get_next_number(tenant, 'customer')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.customer_code} - {self.name}"


class Order(TenantAwareModel):
    # User-facing formatted number (e.g., "ORD-2024-001")
    order_number = models.CharField(max_length=100, blank=True, db_index=True)
    
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='orders')
    channel = models.CharField(
        max_length=20,
        choices=[("manual", "Manual"), ("shopify", "Shopify")],
        default="manual"
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(
        max_length=40,
        choices=[
            ("pending", "Pending"),
            ("processing", "Processing"),
            ("shipped", "Shipped"),
            ("delivered", "Delivered"),
            ("cancelled", "Cancelled"),
        ],
        default="pending"
    )
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    
    # Shopify integration fields
    shopify_id = models.CharField(max_length=50, blank=True, help_text="Shopify order ID")
    shopify_order_number = models.CharField(max_length=50, blank=True, help_text="Shopify order number")
    shopify_customer_id = models.CharField(max_length=50, blank=True, help_text="Shopify customer ID")
    shopify_created_at = models.DateTimeField(null=True, blank=True, help_text="Shopify creation date")
    shopify_updated_at = models.DateTimeField(null=True, blank=True, help_text="Shopify last update date")
    shopify_financial_status = models.CharField(max_length=50, blank=True, help_text="Shopify financial status")
    shopify_fulfillment_status = models.CharField(max_length=50, blank=True, help_text="Shopify fulfillment status")
    
    class Meta:
        unique_together = ('tenant_id', 'order_number')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant_id', 'order_number']),
            models.Index(fields=['tenant_id', 'status']),
            models.Index(fields=['tenant_id', '-created_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.order_number = get_next_number(tenant, 'order')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.order_number} - {self.customer.name}"
    
    @property
    def items_count(self):
        """Get count of items in this order"""
        return self.items.count()


class OrderItem(TenantAwareModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("inventory.Product", on_delete=models.CASCADE)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    
    class Meta:
        indexes = [
            models.Index(fields=['order', 'product']),
        ]
    
    @property
    def total(self):
        """Calculate line item total"""
        return self.quantity * self.price
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product.name} x {self.quantity}"
