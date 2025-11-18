from django.db import models
from common.models import TenantAwareModel


class Warehouse(TenantAwareModel):
    # User-facing formatted number (e.g., "WH001")
    warehouse_code = models.CharField(max_length=100, blank=True, db_index=True)
    
    name = models.CharField(max_length=120)
    location = models.CharField(max_length=255, blank=True)
    
    # Capacity tracking
    max_capacity = models.IntegerField(default=1000, help_text="Maximum storage capacity in units")
    current_utilization = models.IntegerField(default=0, help_text="Current space used")
    
    # Metrics
    active_clients = models.IntegerField(default=0)
    total_skus = models.IntegerField(default=0)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "Active"),
            ("inactive", "Inactive"),
            ("maintenance", "Maintenance"),
        ],
        default="active"
    )
    
    class Meta:
        unique_together = ('tenant_id', 'warehouse_code')
        indexes = [
            models.Index(fields=['tenant_id', 'warehouse_code']),
            models.Index(fields=['tenant_id', 'status']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.warehouse_code:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.warehouse_code = get_next_number(tenant, 'warehouse')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.warehouse_code} - {self.name}"
    
    @property
    def capacity_percentage(self):
        """Calculate capacity utilization as percentage"""
        if self.max_capacity == 0:
            return 0
        return int((self.current_utilization / self.max_capacity) * 100)


class Transfer(TenantAwareModel):
    # User-facing formatted number (e.g., "TRF-001")
    transfer_number = models.CharField(max_length=100, blank=True, db_index=True)
    
    from_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="outgoing_transfers"
    )
    to_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name="incoming_transfers"
    )
    product = models.ForeignKey(
        "inventory.Product",
        on_delete=models.CASCADE,
        related_name='transfers'
    )
    quantity = models.IntegerField()
    status = models.CharField(
        max_length=40,
        choices=[
            ("pending", "Pending"),
            ("in-transit", "In Transit"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
        default="pending"
    )
    
    class Meta:
        unique_together = ('tenant_id', 'transfer_number')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant_id', 'transfer_number']),
            models.Index(fields=['tenant_id', 'status']),
            models.Index(fields=['from_warehouse', '-created_at']),
            models.Index(fields=['to_warehouse', '-created_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.transfer_number:
            from common.utils import get_next_number
            from tenants.models import Tenant
            tenant = Tenant.objects.get(id=self.tenant_id)
            self.transfer_number = get_next_number(tenant, 'transfer')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.transfer_number} - {self.from_warehouse.name} → {self.to_warehouse.name}"
