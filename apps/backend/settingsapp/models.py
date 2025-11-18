from django.db import models
from common.models import TenantAwareModel

class SystemSetting(TenantAwareModel):
    key = models.CharField(max_length=120, unique=False)
    value = models.JSONField(default=dict)

class IntegrationSetting(TenantAwareModel):
    name = models.CharField(max_length=120)
    is_enabled = models.BooleanField(default=False)
    config = models.JSONField(default=dict)
