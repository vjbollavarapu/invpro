"""Celery task for processing sync queue items."""

from __future__ import annotations

import logging

from celery import shared_task

from ..models import ShopifyIntegration
from ..services import SyncQueueService

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={'max_retries': 3})
def process_sync_queue(self, integration_id: int, limit: int = 10) -> str:
    """
    Process pending items in the sync queue for an integration.
    
    Args:
        integration_id: ID of the ShopifyIntegration
        limit: Maximum number of items to process
    
    Returns:
        Summary string of processed items
    """
    try:
        integration = ShopifyIntegration.objects.get(id=integration_id)
    except ShopifyIntegration.DoesNotExist:
        logger.warning("Shopify integration %s no longer exists", integration_id)
        return "missing"

    queue_service = SyncQueueService(integration)
    
    processed = 0
    succeeded = 0
    failed = 0
    
    for _ in range(limit):
        item = queue_service.process_next()
        if not item:
            break
        
        processed += 1
        if item.status == 'completed':
            succeeded += 1
        elif item.status == 'failed':
            failed += 1
    
    result = f"Processed {processed} items: {succeeded} succeeded, {failed} failed"
    logger.info("Queue processing completed for %s: %s", integration.store_url, result)
    
    return result


@shared_task
def process_all_sync_queues(limit_per_integration: int = 10) -> str:
    """
    Process sync queues for all active integrations.
    
    Args:
        limit_per_integration: Maximum items to process per integration
    
    Returns:
        Summary string
    """
    active_integrations = ShopifyIntegration.objects.filter(
        status=ShopifyIntegration.STATUS_CONNECTED,
        auto_sync_enabled=True,
    )
    
    results = []
    for integration in active_integrations:
        try:
            result = process_sync_queue(integration.id, limit=limit_per_integration)
            results.append(f"{integration.store_url}: {result}")
        except Exception as exc:
            logger.error("Queue processing failed for %s: %s", integration.store_url, exc)
            results.append(f"{integration.store_url}: error")
    
    return f"Processed queues for {len(results)} integrations: {', '.join(results)}"


@shared_task
def retry_failed_operations_periodic() -> str:
    """Periodic task to retry failed push operations for all active integrations."""
    from ..services import RetryService
    
    active_integrations = ShopifyIntegration.objects.filter(
        status=ShopifyIntegration.STATUS_CONNECTED,
        auto_sync_enabled=True,
    )
    
    results = []
    for integration in active_integrations:
        try:
            retry_service = RetryService(integration)
            result = retry_service.retry_all_failed(max_retries=3)
            
            total_succeeded = result.get('total_succeeded', 0)
            total_failed = result.get('total_failed', 0)
            
            if total_succeeded > 0 or total_failed > 0:
                results.append(
                    f"{integration.store_url}: {total_succeeded} succeeded, {total_failed} failed"
                )
        except Exception as exc:
            logger.error("Retry failed for %s: %s", integration.store_url, exc)
            results.append(f"{integration.store_url}: error")
    
    if not results:
        return "No failed operations to retry"
    
    return f"Retried operations for {len(results)} integrations: {', '.join(results)}"

