from django.db import models
from common.models import BaseModel

class Tenant(BaseModel):
    # Industry Support
    INDUSTRY_CHOICES = [
        ('pharmacy', 'Pharmacy'),
        ('retail', 'Retail'),
        ('logistics', 'Logistics'),
        ('manufacturing', 'Manufacturing'),
        ('general', 'General Inventory'),
    ]
    
    name = models.CharField(max_length=150)
    code = models.SlugField(unique=True)
    domain = models.CharField(max_length=255, blank=True)
    industry = models.CharField(
        max_length=50,
        choices=INDUSTRY_CHOICES,
        default='general',
        db_index=True,
        help_text='Industry type determines available features and data models'
    )
    is_active = models.BooleanField(default=True)
    
    def __str__(self): return f"{self.name} ({self.get_industry_display()})"

class Membership(BaseModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
    role = models.CharField(max_length=80, default="staff")
    is_active = models.BooleanField(default=True)
    class Meta: unique_together = ("user","tenant")
