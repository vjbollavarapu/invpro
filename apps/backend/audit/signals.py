from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from audit.models import AuditLog
from inventory.models import Product

def _log(instance, action):
    tenant_id = getattr(instance, "tenant_id", None)
    AuditLog.objects.create(
        tenant_id=tenant_id, user=None, action=action, module=instance.__class__.__name__,
        details={"id": getattr(instance,"id", None)}
    )

@receiver(post_save, sender=Product)
def product_saved(sender, instance, created, **kwargs):
    _log(instance, "CREATE" if created else "UPDATE")

@receiver(post_delete, sender=Product)
def product_deleted(sender, instance, **kwargs):
    _log(instance, "DELETE")
