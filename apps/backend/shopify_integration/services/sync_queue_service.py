"""Service for managing sync queue operations."""

from __future__ import annotations

import logging
from typing import Any

from django.db.models import Q
from django.utils import timezone

from ..models import ShopifyIntegration, SyncQueueItem

logger = logging.getLogger(__name__)


class SyncQueueService:
    """Service for managing sync queue operations."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration

    def enqueue(
        self,
        operation: str,
        entity_type: str | None = None,
        entity_id: int | None = None,
        priority: int = SyncQueueItem.PRIORITY_NORMAL,
        scheduled_at: timezone.datetime | None = None,
        operation_data: dict[str, Any] | None = None,
    ) -> SyncQueueItem:
        """
        Add an operation to the sync queue.
        
        Args:
            operation: Type of operation (from SyncQueueItem.OPERATION_*)
            entity_type: Type of entity (products, orders, etc.)
            entity_id: ID of specific entity
            priority: Priority level (1-4)
            scheduled_at: When to process (None = immediate)
            operation_data: Additional data for the operation
        
        Returns:
            Created SyncQueueItem
        """
        queue_item = SyncQueueItem.objects.create(
            tenant_id=self.integration.tenant_id,
            integration=self.integration,
            operation=operation,
            entity_type=entity_type or '',
            entity_id=entity_id,
            priority=priority,
            scheduled_at=scheduled_at,
            operation_data=operation_data or {},
        )
        
        logger.info(
            "Enqueued operation: %s (priority: %d, scheduled_at: %s)",
            operation,
            priority,
            scheduled_at,
        )
        
        return queue_item

    def get_pending_items(
        self,
        limit: int | None = None,
        priority: int | None = None,
    ) -> list[SyncQueueItem]:
        """
        Get pending queue items ready to process.
        
        Args:
            limit: Maximum number of items to return
            priority: Filter by priority level
        
        Returns:
            List of SyncQueueItem instances
        """
        queryset = SyncQueueItem.objects.filter(
            integration=self.integration,
            status=SyncQueueItem.STATUS_PENDING,
        )
        
        # Filter by scheduled time (only items scheduled for now or earlier)
        now = timezone.now()
        queryset = queryset.filter(
            Q(scheduled_at__isnull=True) | Q(scheduled_at__lte=now)
        )
        
        if priority:
            queryset = queryset.filter(priority=priority)
        
        queryset = queryset.order_by('-priority', 'scheduled_at', 'created_at')
        
        if limit:
            queryset = queryset[:limit]
        
        return list(queryset)

    def process_next(self) -> SyncQueueItem | None:
        """
        Process the next pending item in the queue.
        
        Returns:
            Processed SyncQueueItem or None if no items
        """
        items = self.get_pending_items(limit=1)
        
        if not items:
            return None
        
        item = items[0]
        item.mark_processing()
        
        try:
            # Dispatch to appropriate handler
            if item.operation == SyncQueueItem.OPERATION_PUSH_PRODUCT:
                self._process_push_product(item)
            elif item.operation == SyncQueueItem.OPERATION_PUSH_INVENTORY:
                self._process_push_inventory(item)
            elif item.operation == SyncQueueItem.OPERATION_BIDIRECTIONAL_SYNC:
                self._process_bidirectional_sync(item)
            else:
                logger.warning("Unhandled operation type: %s", item.operation)
                item.mark_failed("Unhandled operation type")
            
            return item
            
        except Exception as e:
            logger.exception("Error processing queue item %s", item.id)
            item.mark_failed(str(e))
            return item

    def _process_push_product(self, item: SyncQueueItem) -> None:
        """Process a push product operation."""
        from .product_push_service import ShopifyProductPushService
        from .shopify_api_client import ShopifyApiClient
        from ..models import ShopifyProduct
        
        if not item.entity_id:
            item.mark_failed("Entity ID is required for push product operation")
            return
        
        product = ShopifyProduct.objects.filter(id=item.entity_id).first()
        if not product:
            item.mark_failed(f"Product {item.entity_id} not found")
            return
        
        api_client = ShopifyApiClient(self.integration)
        push_service = ShopifyProductPushService(self.integration, api_client=api_client)
        push_service.push_product(product)
        item.mark_completed()

    def _process_push_inventory(self, item: SyncQueueItem) -> None:
        """Process a push inventory operation."""
        from .inventory_push_service import ShopifyInventoryPushService
        from .shopify_api_client import ShopifyApiClient
        from ..models import ShopifyInventoryLevel
        
        if not item.entity_id:
            item.mark_failed("Entity ID is required for push inventory operation")
            return
        
        inventory = ShopifyInventoryLevel.objects.filter(id=item.entity_id).first()
        if not inventory:
            item.mark_failed(f"Inventory level {item.entity_id} not found")
            return
        
        api_client = ShopifyApiClient(self.integration)
        push_service = ShopifyInventoryPushService(self.integration, api_client=api_client)
        push_service.push_inventory_level(inventory)
        item.mark_completed()

    def _process_bidirectional_sync(self, item: SyncQueueItem) -> None:
        """Process a bidirectional sync operation."""
        from .bidirectional_sync_service import BidirectionalSyncService
        
        entity_types = item.operation_data.get('entity_types')
        conflict_strategy = item.operation_data.get('conflict_strategy', 'last_write_wins')
        auto_resolve = item.operation_data.get('auto_resolve', False)
        
        sync_service = BidirectionalSyncService(self.integration)
        sync_service.sync_full(
            entity_types=entity_types,
            conflict_strategy=conflict_strategy,
            auto_resolve=auto_resolve,
        )
        item.mark_completed()

    def get_queue_stats(self) -> dict[str, Any]:
        """Get statistics about the sync queue."""
        all_items = SyncQueueItem.objects.filter(integration=self.integration)
        
        return {
            "total": all_items.count(),
            "pending": all_items.filter(status=SyncQueueItem.STATUS_PENDING).count(),
            "processing": all_items.filter(status=SyncQueueItem.STATUS_PROCESSING).count(),
            "completed": all_items.filter(status=SyncQueueItem.STATUS_COMPLETED).count(),
            "failed": all_items.filter(status=SyncQueueItem.STATUS_FAILED).count(),
            "cancelled": all_items.filter(status=SyncQueueItem.STATUS_CANCELLED).count(),
            "by_priority": {
                "urgent": all_items.filter(priority=SyncQueueItem.PRIORITY_URGENT).count(),
                "high": all_items.filter(priority=SyncQueueItem.PRIORITY_HIGH).count(),
                "normal": all_items.filter(priority=SyncQueueItem.PRIORITY_NORMAL).count(),
                "low": all_items.filter(priority=SyncQueueItem.PRIORITY_LOW).count(),
            },
        }

