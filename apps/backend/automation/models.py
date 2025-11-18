from django.db import models
from common.models import TenantAwareModel

class AutomationRule(TenantAwareModel):
    condition = models.CharField(max_length=200)   # e.g., stock < reorder_level
    operator = models.CharField(max_length=10, default="LT")
    value = models.CharField(max_length=120, default="0")
    action = models.CharField(max_length=200)      # e.g., create_purchase_request
    status = models.CharField(max_length=20, default="ACTIVE")
