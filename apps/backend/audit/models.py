from django.db import models
from common.models import TenantAwareModel

class AuditLog(TenantAwareModel):
    user = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=120)
    module = models.CharField(max_length=120)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
