"""Service for orchestrating bidirectional sync operations."""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from ..models import ShopifyIntegration
from ..services.shopify_api_client import ShopifyApiClient
from .conflict_detection_service import ConflictDetectionService
from .customer_import_service import CustomerImportService
from .inventory_push_service import ShopifyInventoryPushService
from .inventory_sync_service import ShopifyInventorySyncService
from .order_import_service import OrderImportService
from .order_sync_service import ShopifyOrderSyncService
from .product_import_service import ProductImportService
from .product_push_service import ShopifyProductPushService
from .product_sync_service import ShopifyProductSyncService

logger = logging.getLogger(__name__)


class BidirectionalSyncService:
    """Orchestrates bidirectional sync: pull → import → push."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration
        self.api_client = ShopifyApiClient(integration)
        self.conflict_detector = ConflictDetectionService(integration)

    def sync_full(
        self,
        entity_types: list[str] | None = None,
        conflict_strategy: str = "last_write_wins",
        auto_resolve: bool = False,
    ) -> dict[str, Any]:
        """
        Perform full bidirectional sync for specified entity types.
        
        Args:
            entity_types: List of entity types to sync ('products', 'orders', 'customers', 'inventory')
            conflict_strategy: Strategy for handling conflicts
            auto_resolve: Whether to automatically resolve conflicts using strategy
        
        Returns:
            Dictionary with sync results
        """
        if entity_types is None:
            entity_types = ['products', 'orders', 'customers', 'inventory']

        results = {
            'pull': {},
            'import': {},
            'push': {},
            'conflicts': [],
            'success': True,
        }

        # Step 1: Pull from Shopify
        pull_results = self._pull_from_shopify(entity_types)
        results['pull'] = pull_results

        # Step 2: Detect conflicts
        conflicts = []
        for entity_type in entity_types:
            if entity_type == 'products':
                entity_conflicts = self.conflict_detector.detect_all_conflicts('products')
                conflicts.extend(entity_conflicts)
        results['conflicts'] = conflicts

        # Step 3: Resolve conflicts if auto_resolve is enabled
        if auto_resolve and conflicts:
            self._auto_resolve_conflicts(conflicts, conflict_strategy)

        # Step 4: Import to common tables
        import_results = self._import_to_common_tables(entity_types, conflict_strategy)
        results['import'] = import_results

        # Step 5: Push local changes to Shopify
        push_results = self._push_to_shopify(entity_types)
        results['push'] = push_results

        # Determine overall success
        results['success'] = (
            pull_results.get('success', False) and
            import_results.get('success', False) and
            push_results.get('success', False) and
            len(conflicts) == 0
        )

        logger.info(
            "Bidirectional sync completed: pull=%s, import=%s, push=%s, conflicts=%d",
            pull_results.get('success', False),
            import_results.get('success', False),
            push_results.get('success', False),
            len(conflicts),
        )

        return results

    def _pull_from_shopify(self, entity_types: list[str]) -> dict[str, Any]:
        """Pull data from Shopify to integration tables."""
        results = {
            'success': True,
            'products': {'fetched': 0, 'errors': []},
            'orders': {'fetched': 0, 'errors': []},
            'customers': {'fetched': 0, 'errors': []},
            'inventory': {'fetched': 0, 'errors': []},
        }

        try:
            if 'products' in entity_types and self.integration.sync_products:
                product_service = ShopifyProductSyncService(self.integration, api_client=self.api_client)
                log = product_service.sync()
                results['products']['fetched'] = log.records_fetched
                if log.status != 'SUCCESS':
                    results['success'] = False
                    results['products']['errors'].append(log.message)

            if 'orders' in entity_types and self.integration.sync_orders:
                order_service = ShopifyOrderSyncService(self.integration, api_client=self.api_client)
                log = order_service.sync()
                results['orders']['fetched'] = log.records_fetched
                if log.status != 'SUCCESS':
                    results['success'] = False
                    results['orders']['errors'].append(log.message)

            if 'customers' in entity_types and self.integration.sync_customers:
                from .customer_sync_service import ShopifyCustomerSyncService
                customer_service = ShopifyCustomerSyncService(self.integration, api_client=self.api_client)
                log = customer_service.sync()
                results['customers']['fetched'] = log.records_fetched
                if log.status != 'SUCCESS':
                    results['success'] = False
                    results['customers']['errors'].append(log.message)

            if 'inventory' in entity_types and self.integration.sync_inventory:
                inventory_service = ShopifyInventorySyncService(self.integration, api_client=self.api_client)
                log = inventory_service.sync()
                results['inventory']['fetched'] = log.records_fetched
                if log.status != 'SUCCESS':
                    results['success'] = False
                    results['inventory']['errors'].append(log.message)

        except Exception as e:
            logger.exception("Error pulling from Shopify")
            results['success'] = False
            results['error'] = str(e)

        return results

    def _import_to_common_tables(
        self,
        entity_types: list[str],
        merge_strategy: str = "last_write_wins",
    ) -> dict[str, Any]:
        """Import data from integration tables to common tables."""
        results = {
            'success': True,
            'products': {'created': 0, 'updated': 0, 'errors': []},
            'orders': {'created': 0, 'updated': 0, 'errors': []},
            'customers': {'created': 0, 'updated': 0, 'errors': []},
        }

        try:
            if 'products' in entity_types:
                import_service = ProductImportService(self.integration)
                import_results = import_service.import_batch(merge_strategy=merge_strategy)
                results['products']['created'] = import_results['created']
                results['products']['updated'] = import_results['updated']
                results['products']['errors'] = import_results['errors']
                if import_results['errors']:
                    results['success'] = False

            if 'orders' in entity_types:
                import_service = OrderImportService(self.integration)
                import_results = import_service.import_batch(merge_strategy=merge_strategy)
                results['orders']['created'] = import_results['created']
                results['orders']['updated'] = import_results['updated']
                results['orders']['errors'] = import_results['errors']
                if import_results['errors']:
                    results['success'] = False

            if 'customers' in entity_types:
                import_service = CustomerImportService(self.integration)
                import_results = import_service.import_batch(merge_strategy=merge_strategy)
                results['customers']['created'] = import_results['created']
                results['customers']['updated'] = import_results['updated']
                results['customers']['errors'] = import_results['errors']
                if import_results['errors']:
                    results['success'] = False

        except Exception as e:
            logger.exception("Error importing to common tables")
            results['success'] = False
            results['error'] = str(e)

        return results

    def _push_to_shopify(self, entity_types: list[str]) -> dict[str, Any]:
        """Push local changes to Shopify."""
        results = {
            'success': True,
            'products': {'pushed': 0, 'failed': 0, 'errors': []},
            'inventory': {'pushed': 0, 'failed': 0, 'errors': []},
        }

        try:
            if 'products' in entity_types:
                push_service = ShopifyProductPushService(self.integration, api_client=self.api_client)
                push_results = push_service.push_batch()
                results['products']['pushed'] = push_results['success']
                results['products']['failed'] = push_results['failed']
                results['products']['errors'] = push_results['errors']
                if push_results['failed'] > 0:
                    results['success'] = False

            if 'inventory' in entity_types:
                push_service = ShopifyInventoryPushService(self.integration, api_client=self.api_client)
                push_results = push_service.push_batch()
                results['inventory']['pushed'] = push_results['success']
                results['inventory']['failed'] = push_results['failed']
                results['inventory']['errors'] = push_results['errors']
                if push_results['failed'] > 0:
                    results['success'] = False

        except Exception as e:
            logger.exception("Error pushing to Shopify")
            results['success'] = False
            results['error'] = str(e)

        return results

    def _auto_resolve_conflicts(self, conflicts: list[dict[str, Any]], strategy: str) -> None:
        """Automatically resolve conflicts using the specified strategy."""
        from ..models import ShopifyProduct

        for conflict in conflicts:
            if conflict['entity'] == 'product':
                shopify_product = ShopifyProduct.objects.filter(
                    id=conflict['shopify_product_id'],
                ).first()

                if not shopify_product:
                    continue

                if strategy == 'last_write_wins':
                    # Use the most recent modification
                    local_modified = conflict.get('local_modified')
                    remote_modified = conflict.get('remote_modified')

                    if local_modified and remote_modified:
                        from django.utils.dateparse import parse_datetime
                        local_dt = parse_datetime(local_modified)
                        remote_dt = parse_datetime(remote_modified)

                        if local_dt > remote_dt:
                            # Local is newer, use local
                            self.conflict_detector.resolve_conflict(shopify_product, 'use_local')
                        else:
                            # Remote is newer, use remote
                            self.conflict_detector.resolve_conflict(shopify_product, 'use_remote')
                elif strategy == 'use_local':
                    self.conflict_detector.resolve_conflict(shopify_product, 'use_local')
                elif strategy == 'use_remote':
                    self.conflict_detector.resolve_conflict(shopify_product, 'use_remote')

                logger.info("Auto-resolved conflict for product %s using strategy %s", shopify_product.title, strategy)

