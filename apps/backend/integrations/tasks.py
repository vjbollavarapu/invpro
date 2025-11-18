from celery import shared_task
from django.utils import timezone
from .models import ShopifyIntegration

@shared_task
def sync_shopify_data(tenant_id: int):
    # TODO: implement Shopify fetch & upsert
    integ = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()
    if integ: 
        integ.last_sync = timezone.now()
        integ.status = "CONNECTED"
        integ.save()
