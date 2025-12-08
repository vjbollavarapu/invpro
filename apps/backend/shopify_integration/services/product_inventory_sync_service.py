"""Service for syncing inventory updates from Product to Shopify."""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from inventory.models import Product
from ..models import ShopifyIntegration, ShopifyInventoryLevel
from .shopify_api_client import ShopifyApiClient, ShopifyApiError
from .inventory_push_service import ShopifyInventoryPushService

logger = logging.getLogger(__name__)


class ProductInventorySyncService:
    """Service for syncing inventory updates from Product to Shopify."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration
        self.api_client = ShopifyApiClient(integration)
        self.push_service = ShopifyInventoryPushService(integration, api_client=self.api_client)

    def sync_product_inventory_to_shopify(self, product: Product) -> dict[str, Any]:
        """
        Sync inventory from Product to Shopify.
        
        Args:
            product: Product instance with updated inventory
            
        Returns:
            Dictionary with sync results
        """
        if not product.shopify_inventory_item_id or not product.shopify_location_id:
            logger.warning(
                "Product %s (ID: %s) missing Shopify inventory identifiers. "
                "shopify_inventory_item_id=%s, shopify_location_id=%s",
                product.name,
                product.id,
                product.shopify_inventory_item_id,
                product.shopify_location_id,
            )
            return {
                "success": False,
                "error": "Product missing Shopify inventory identifiers",
            }
        
        if product.data_source != 'shopify':
            logger.warning(
                "Product %s (ID: %s) is not from Shopify (data_source=%s). Skipping sync.",
                product.name,
                product.id,
                product.data_source,
            )
            return {
                "success": False,
                "error": "Product is not from Shopify",
            }
        
        try:
            # Find or create ShopifyInventoryLevel
            inventory_level, created = ShopifyInventoryLevel.objects.get_or_create(
                integration=self.integration,
                shopify_inventory_item_id=product.shopify_inventory_item_id,
                shopify_location_id=product.shopify_location_id,
                defaults={
                    'tenant_id': self.integration.tenant_id,
                    'sku': product.sku,
                    'available': product.quantity,
                    'committed': product.committed,
                    'incoming': product.incoming,
                }
            )
            
            # Update inventory level with product values
            inventory_level.available = product.quantity
            inventory_level.committed = product.committed
            inventory_level.incoming = product.incoming
            inventory_level.sku = product.sku
            inventory_level.pending_push = True
            inventory_level.save(update_fields=[
                'available',
                'committed',
                'incoming',
                'sku',
                'pending_push',
            ])
            
            # Push to Shopify
            result = self.push_service.push_inventory_level(inventory_level)
            
            logger.info(
                "Successfully synced inventory for product %s to Shopify: available=%d",
                product.name,
                product.quantity,
            )
            
            return {
                "success": True,
                "inventory_level_id": inventory_level.id,
                "available": product.quantity,
                "committed": product.committed,
                "incoming": product.incoming,
            }
            
        except ShopifyApiError as e:
            logger.error(
                "Failed to sync inventory for product %s to Shopify: %s",
                product.name,
                str(e),
            )
            return {
                "success": False,
                "error": str(e),
            }
        except Exception as e:
            logger.exception(
                "Unexpected error syncing inventory for product %s to Shopify: %s",
                product.name,
                str(e),
            )
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
            }

    def sync_batch_inventory_to_shopify(
        self,
        products: list[Product] | None = None,
        filter_shopify_only: bool = True,
    ) -> dict[str, Any]:
        """
        Sync inventory for multiple products to Shopify.
        
        Args:
            products: List of Product instances. If None, syncs all Shopify products.
            filter_shopify_only: If True, only sync products with data_source='shopify'
            
        Returns:
            Dictionary with batch sync results
        """
        if products is None:
            # Get all Shopify products for this tenant
            actual_tenant_id = self._resolve_tenant_id()
            products = Product.objects.filter(
                tenant_id=actual_tenant_id,
                data_source='shopify',
                shopify_inventory_item_id__isnull=False,
                shopify_location_id__isnull=False,
            )
        elif filter_shopify_only:
            products = [p for p in products if p.data_source == 'shopify']
        
        results = {
            "total": len(products),
            "success": 0,
            "failed": 0,
            "errors": [],
        }
        
        for product in products:
            result = self.sync_product_inventory_to_shopify(product)
            if result.get("success"):
                results["success"] += 1
            else:
                results["failed"] += 1
                results["errors"].append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "error": result.get("error", "Unknown error"),
                })
        
        logger.info(
            "Batch inventory sync completed: %d total, %d success, %d failed",
            results["total"],
            results["success"],
            results["failed"],
        )
        
        return results
    
    def _resolve_tenant_id(self) -> int:
        """Resolve the actual integer tenant ID from UUID tenant_id."""
        import uuid
        from tenants.models import Tenant
        
        # If tenant_id is already an integer, return it
        if isinstance(self.integration.tenant_id, int):
            return self.integration.tenant_id
        
        # If it's a UUID string, convert it back to integer tenant ID
        try:
            tenant_uuid = uuid.UUID(str(self.integration.tenant_id))
            namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')  # DNS namespace
            
            # Try to find tenant by checking all tenants
            for tenant in Tenant.objects.all():
                test_uuid = uuid.uuid5(namespace, f'tenant_{tenant.id}')
                if test_uuid == tenant_uuid:
                    return tenant.id
            
            # If not found, try to get first tenant as fallback
            logger.warning("Could not resolve tenant ID from UUID: %s", self.integration.tenant_id)
            tenant = Tenant.objects.first()
            if tenant:
                return tenant.id
            raise ValueError("No tenant found")
        except (ValueError, TypeError) as e:
            logger.error("Error resolving tenant ID: %s", e)
            raise ValueError(f"Invalid tenant_id format: {self.integration.tenant_id}")

