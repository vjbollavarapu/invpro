from django.db import models
from django.conf import settings
from datetime import datetime


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_created')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='%(class)s_updated')
    
    class Meta: 
        abstract = True


class TenantAwareManager(models.Manager):
    """Manager that provides automatic tenant filtering"""
    
    def get_queryset(self):
        """Return base queryset (filtering happens at view level)"""
        return super().get_queryset()
    
    def for_tenant(self, tenant):
        """Explicitly filter by tenant object"""
        return self.filter(tenant_id=tenant.id)
    
    def for_tenant_id(self, tenant_id):
        """Filter by tenant ID"""
        return self.filter(tenant_id=tenant_id)
    
    def for_current_tenant(self, request):
        """Filter by current tenant from request context"""
        if hasattr(request, 'tenant') and request.tenant:
            return self.filter(tenant_id=request.tenant.id)
        return self.none()


class TenantAwareModel(BaseModel):
    tenant_id = models.UUIDField(db_index=True, help_text="Tenant ID for multi-tenant isolation")
    objects = TenantAwareManager()
    
    class Meta: 
        abstract = True


class NumberSequence(TenantAwareModel):
    """
    Manages auto-number generation with custom formats per tenant.
    Allows users to configure number formats like PRD-001, PO-2024-001, etc.
    """
    
    ENTITY_CHOICES = [
        ('product', 'Product'),
        ('order', 'Sales Order'),
        ('purchase_order', 'Purchase Order'),
        ('purchase_request', 'Purchase Request'),
        ('warehouse', 'Warehouse'),
        ('transfer', 'Transfer'),
        ('supplier', 'Supplier'),
        ('customer', 'Customer'),
    ]
    
    # tenant field is inherited from TenantAwareModel as tenant_id
    entity_type = models.CharField(max_length=50, choices=ENTITY_CHOICES)
    
    # Format configuration
    prefix = models.CharField(max_length=20, default='DOC')
    include_year = models.BooleanField(default=False)
    include_month = models.BooleanField(default=False)
    separator = models.CharField(max_length=5, default='-')
    padding = models.IntegerField(default=3)  # Number of digits (001, 0001, etc.)
    
    # Sequence tracking
    current_sequence = models.IntegerField(default=0)
    reset_on_year = models.BooleanField(default=False)
    reset_on_month = models.BooleanField(default=False)
    
    # Tracking last reset to determine when to reset
    last_reset_year = models.IntegerField(null=True, blank=True)
    last_reset_month = models.IntegerField(null=True, blank=True)
    
    # Example format result for preview
    sample_format = models.CharField(max_length=100, blank=True)
    
    class Meta:
        unique_together = ('tenant_id', 'entity_type')
        verbose_name = 'Number Sequence'
        verbose_name_plural = 'Number Sequences'
    
    def __str__(self):
        from tenants.models import Tenant
        try:
            tenant = Tenant.objects.get(id=self.tenant_id)
            return f"{tenant.name} - {self.entity_type}: {self.sample_format}"
        except Tenant.DoesNotExist:
            return f"Tenant {self.tenant_id} - {self.entity_type}: {self.sample_format}"
    
    def save(self, *args, **kwargs):
        # Auto-generate sample format on save
        self.sample_format = self.generate_sample()
        super().save(*args, **kwargs)
    
    def generate_sample(self):
        """Generate sample format string for preview"""
        parts = [self.prefix]
        
        if self.include_year:
            parts.append('YYYY')
        if self.include_month:
            parts.append('MM')
        
        parts.append('0' * self.padding)
        return self.separator.join(parts)
    
    def get_next_number(self):
        """
        Generate next number in sequence.
        Handles year/month resets automatically.
        Thread-safe with select_for_update.
        """
        now = datetime.now()
        
        # Check if we need to reset based on year
        if self.reset_on_year:
            if self.last_reset_year is None or self.last_reset_year != now.year:
                self.current_sequence = 0
                self.last_reset_year = now.year
        
        # Check if we need to reset based on month
        if self.reset_on_month:
            if self.last_reset_month is None or self.last_reset_month != now.month:
                self.current_sequence = 0
                self.last_reset_month = now.month
        
        # Increment sequence
        self.current_sequence += 1
        
        # Build the formatted number
        parts = [self.prefix]
        
        if self.include_year:
            parts.append(str(now.year))
        if self.include_month:
            parts.append(str(now.month).zfill(2))
        
        # Add padded sequence number
        parts.append(str(self.current_sequence).zfill(self.padding))
        
        # Save the updated sequence
        self.save()
        
        return self.separator.join(parts)
