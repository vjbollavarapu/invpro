from django.db import models
from common.models import TenantAwareModel


class Supplier(TenantAwareModel):
    # User-facing formatted number (e.g., "SUP-001")
    supplier_code = models.CharField(max_length=100, blank=True, db_index=True)
    
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=150, blank=True, help_text="Primary contact person name")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0, help_text="Supplier rating out of 5.0")
    
    class Meta:
        unique_together = ('tenant_id', 'supplier_code')
        indexes = [
            models.Index(fields=['tenant_id', 'supplier_code']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.supplier_code:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.supplier_code = get_next_number(tenant, 'supplier')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.supplier_code} - {self.name}"
    
    @property
    def total_orders(self):
        """Count total purchase orders from this supplier"""
        return self.purchase_orders.count()
    
    @property
    def active_orders(self):
        """Count active (non-delivered) purchase orders"""
        return self.purchase_orders.exclude(status='delivered').count()


class PurchaseRequest(TenantAwareModel):
    # User-facing formatted number (e.g., "PR-001")
    request_number = models.CharField(max_length=100, blank=True, db_index=True)
    
    requested_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name='purchase_requests'
    )
    item = models.ForeignKey(
        "inventory.Product",
        on_delete=models.CASCADE,
        related_name='purchase_requests'
    )
    quantity = models.IntegerField()
    status = models.CharField(
        max_length=40,
        choices=[
            ("pending", "Pending"),
            ("approved", "Approved"),
            ("rejected", "Rejected"),
        ],
        default="pending"
    )
    
    class Meta:
        unique_together = ('tenant_id', 'request_number')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant_id', 'request_number']),
            models.Index(fields=['tenant_id', 'status']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.request_number:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.request_number = get_next_number(tenant, 'purchase_request')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.request_number} - {self.item.name} ({self.quantity})"


class PurchaseOrder(TenantAwareModel):
    # User-facing formatted number (e.g., "PO-2024-001")
    po_number = models.CharField(max_length=100, blank=True, db_index=True)
    
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expected_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=40,
        choices=[
            ("draft", "Draft"),
            ("pending", "Pending"),
            ("processing", "Processing"),
            ("in-transit", "In Transit"),
            ("delivered", "Delivered"),
            ("cancelled", "Cancelled"),
        ],
        default="draft"
    )
    
    class Meta:
        unique_together = ('tenant_id', 'po_number')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant_id', 'po_number']),
            models.Index(fields=['tenant_id', 'status']),
            models.Index(fields=['supplier', '-created_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.po_number:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.po_number = get_next_number(tenant, 'purchase_order')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.po_number} - {self.supplier.name}"
