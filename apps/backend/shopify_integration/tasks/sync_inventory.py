"""Celery task for syncing Shopify inventory levels."""

from __future__ import annotations

import logging

from celery import shared_task
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from ..models import ShopifyIntegration
from ..services import ShopifyInventorySyncService

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={'max_retries': 3})
def sync_shopify_inventory(self, integration_id: int, *, updated_after: str | None = None) -> str:
    try:
        integration = ShopifyIntegration.objects.get(id=integration_id)
    except ShopifyIntegration.DoesNotExist:
        logger.warning("Shopify integration %s no longer exists", integration_id)
        return "missing"

    timestamp = _parse_timestamp(updated_after)
    service = ShopifyInventorySyncService(integration)
    log = service.sync(updated_after=timestamp)
    return f"inventory:{log.id}"


def _parse_timestamp(value: str | None):
    if not value:
        return None
    parsed = parse_datetime(value)
    if parsed is None:
        return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed)
    return parsed
