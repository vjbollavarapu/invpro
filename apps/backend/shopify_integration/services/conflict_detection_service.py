"""Service for detecting conflicts between local and remote data."""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from inventory.models import Product
from ..models import ShopifyProduct

logger = logging.getLogger(__name__)


class ConflictDetectionService:
    """Service for detecting sync conflicts between local and remote data."""

    def __init__(self, integration) -> None:
        self.integration = integration

    def detect_product_conflicts(self, shopify_product: ShopifyProduct) -> dict[str, Any] | None:
        """
        Detect conflicts between ShopifyProduct and corresponding Product.
        
        Returns:
            Conflict dictionary if conflict detected, None otherwise
        """
        # Find corresponding Product by source_id
        product = Product.objects.filter(
            tenant_id=self.integration.tenant_id,
            data_source='shopify',
            source_id=str(shopify_product.id),
        ).first()

        if not product:
            # No local product, no conflict
            return None

        # Check if both have been modified
        shopify_modified = shopify_product.synced_at or shopify_product.updated_at
        local_modified = product.last_imported_at or product.updated_at

        if not shopify_modified or not local_modified:
            # Can't determine modification times, assume no conflict
            return None

        # Check if local was modified after last import
        local_changed_after_import = (
            product.updated_at and
            product.last_imported_at and
            product.updated_at > product.last_imported_at
        )

        # Check if Shopify was modified after last push
        shopify_changed_after_push = (
            shopify_product.synced_at and
            shopify_product.last_pushed_at and
            shopify_product.synced_at > shopify_product.last_pushed_at
        )

        # Conflict exists if both have been modified independently
        if local_changed_after_import and shopify_changed_after_push:
            conflict = {
                'type': 'concurrent_modification',
                'entity': 'product',
                'entity_id': product.id,
                'shopify_product_id': shopify_product.id,
                'local_modified': product.updated_at.isoformat() if product.updated_at else None,
                'remote_modified': shopify_product.synced_at.isoformat() if shopify_product.synced_at else None,
                'last_imported': product.last_imported_at.isoformat() if product.last_imported_at else None,
                'last_pushed': shopify_product.last_pushed_at.isoformat() if shopify_product.last_pushed_at else None,
                'local_data': {
                    'name': product.name,
                    'selling_price': str(product.selling_price),
                    'status': product.status,
                },
                'remote_data': {
                    'title': shopify_product.title,
                    'price_min': str(shopify_product.price_min) if shopify_product.price_min else None,
                    'status': shopify_product.status,
                },
            }
            logger.warning(
                "Conflict detected for product %s (local: %s, remote: %s)",
                product.name,
                product.updated_at,
                shopify_product.synced_at,
            )
            return conflict

        return None

    def detect_all_conflicts(self, entity_type: str = "products") -> list[dict[str, Any]]:
        """
        Detect all conflicts for a given entity type.
        
        Args:
            entity_type: Type of entity to check ('products', 'orders', 'inventory')
        
        Returns:
            List of conflict dictionaries
        """
        conflicts = []

        if entity_type == "products":
            shopify_products = ShopifyProduct.objects.filter(
                integration=self.integration,
            )
            for shopify_product in shopify_products:
                conflict = self.detect_product_conflicts(shopify_product)
                if conflict:
                    conflicts.append(conflict)

        # TODO: Add conflict detection for orders and inventory

        logger.info("Detected %d conflicts for %s", len(conflicts), entity_type)
        return conflicts

    def mark_conflict(self, shopify_product: ShopifyProduct, conflict_data: dict[str, Any]) -> None:
        """Mark a product as having a conflict."""
        shopify_product.sync_status = 'conflict'
        shopify_product.conflict_data = conflict_data
        shopify_product.save(update_fields=['sync_status', 'conflict_data'])

    def resolve_conflict(
        self,
        shopify_product: ShopifyProduct,
        resolution: str,
        resolution_data: dict[str, Any] | None = None,
    ) -> None:
        """
        Resolve a conflict by applying the chosen resolution.
        
        Args:
            shopify_product: The ShopifyProduct with conflict
            resolution: Resolution strategy ('use_local', 'use_remote', 'merge')
            resolution_data: Additional data for merge resolution
        """
        product = Product.objects.filter(
            tenant_id=self.integration.tenant_id,
            data_source='shopify',
            source_id=str(shopify_product.id),
        ).first()

        if not product:
            logger.warning("Product not found for conflict resolution")
            return

        if resolution == 'use_local':
            # Push local changes to Shopify
            shopify_product.sync_status = 'pending'
            shopify_product.pending_push = True
            shopify_product.conflict_data = {}
            shopify_product.save(update_fields=['sync_status', 'pending_push', 'conflict_data'])
            logger.info("Resolved conflict by using local version for product %s", product.name)

        elif resolution == 'use_remote':
            # Import remote changes to local
            from .product_import_service import ProductImportService
            import_service = ProductImportService(self.integration)
            import_service.import_product(shopify_product, merge_strategy='overwrite')
            shopify_product.sync_status = 'synced'
            shopify_product.conflict_data = {}
            shopify_product.save(update_fields=['sync_status', 'conflict_data'])
            logger.info("Resolved conflict by using remote version for product %s", product.name)

        elif resolution == 'merge':
            # Merge fields based on resolution_data
            if resolution_data:
                # Update local product with merged data
                for field, value in resolution_data.items():
                    if hasattr(product, field):
                        setattr(product, field, value)
                product.save()
                # Mark for push
                shopify_product.sync_status = 'pending'
                shopify_product.pending_push = True
                shopify_product.conflict_data = {}
                shopify_product.save(update_fields=['sync_status', 'pending_push', 'conflict_data'])
                logger.info("Resolved conflict by merging for product %s", product.name)

