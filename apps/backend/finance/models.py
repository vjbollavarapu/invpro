from django.db import models
from common.models import TenantAwareModel

class CostCenter(TenantAwareModel):
    name = models.CharField(max_length=120)
    budget = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)

class Expense(TenantAwareModel):
    date = models.DateField()
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=120)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    linked_order = models.ForeignKey("sales.Order", on_delete=models.SET_NULL, null=True, blank=True)
    linked_po = models.ForeignKey("procurement.PurchaseOrder", on_delete=models.SET_NULL, null=True, blank=True)
