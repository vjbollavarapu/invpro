"""Service for importing products from Shopify integration tables to common Product table."""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from inventory.models import Product
from ..models import ShopifyIntegration, ShopifyProduct, ShopifyInventoryLevel

logger = logging.getLogger(__name__)


class ProductImportService:
    """Service for importing Shopify products to the unified Product table."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration

    def import_product(self, shopify_product: ShopifyProduct, merge_strategy: str = "last_write_wins") -> tuple[Product, bool]:
        """
        Import a single Shopify product to the Product table.
        
        Args:
            shopify_product: The ShopifyProduct to import
            merge_strategy: Strategy for handling conflicts ('last_write_wins', 'skip', 'overwrite')
        
        Returns:
            Tuple of (Product instance, created boolean)
        """
        # Extract SKU from variants
        sku = self._extract_sku(shopify_product)
        
        # Resolve actual integer tenant ID
        actual_tenant_id = self._resolve_tenant_id()
        
        # Check if product already exists by source_id
        existing_product = Product.objects.filter(
            tenant_id=actual_tenant_id,
            data_source='shopify',
            source_id=str(shopify_product.id),
        ).first()
        
        # Also check by SKU if no source match (for products imported before source tracking)
        if not existing_product and sku:
            existing_product = Product.objects.filter(
                tenant_id=actual_tenant_id,
                sku=sku,
            ).exclude(
                data_source='shopify',
                source_id=str(shopify_product.id),
            ).first()
        
        # Transform Shopify product to Product format
        product_data = self._transform_to_product(shopify_product, sku)
        
        if existing_product:
            # Handle existing product based on merge strategy
            if merge_strategy == "skip":
                logger.info("Skipping product %s (already exists)", shopify_product.title)
                return existing_product, False
            
            elif merge_strategy == "overwrite":
                # Update all fields
                for key, value in product_data.items():
                    if key not in ['tenant_id', 'product_code']:  # Don't overwrite these
                        setattr(existing_product, key, value)
                existing_product.last_imported_at = timezone.now()
                existing_product.save()
                logger.info("Overwritten product %s", shopify_product.title)
                return existing_product, False
            
            else:  # last_write_wins (default)
                # Only update if Shopify product is newer
                if shopify_product.synced_at and existing_product.last_imported_at:
                    if shopify_product.synced_at <= existing_product.last_imported_at:
                        logger.info("Skipping product %s (local version is newer)", shopify_product.title)
                        return existing_product, False
                
                # Update fields that might have changed
                existing_product.name = product_data['name']
                existing_product.description = product_data['description']
                existing_product.category = product_data['category']
                existing_product.selling_price = product_data['selling_price']
                existing_product.status = product_data['status']
                existing_product.shopify_id = product_data['shopify_id']
                existing_product.shopify_variant_id = product_data.get('shopify_variant_id', '')
                existing_product.shopify_inventory_item_id = product_data.get('shopify_inventory_item_id', '')
                existing_product.shopify_handle = product_data.get('shopify_handle', '')
                existing_product.shopify_tags = product_data.get('shopify_tags', '')
                existing_product.last_imported_at = timezone.now()
                existing_product.save()
                # Sync inventory from ShopifyInventoryLevel if available
                self._sync_inventory_from_shopify(existing_product, shopify_product)
                logger.info("Updated product %s", shopify_product.title)
                return existing_product, False
        
        # Create new product
        with transaction.atomic():
            product = Product.objects.create(**product_data)
            # Sync inventory from ShopifyInventoryLevel if available
            self._sync_inventory_from_shopify(product, shopify_product)
            logger.info("Imported new product %s (SKU: %s)", shopify_product.title, sku)
            return product, True

    def import_batch(
        self,
        shopify_products: list[ShopifyProduct] | None = None,
        merge_strategy: str = "last_write_wins",
    ) -> dict[str, Any]:
        """
        Import multiple Shopify products to the Product table.
        
        Args:
            shopify_products: List of ShopifyProduct instances. If None, imports all products for the integration.
            merge_strategy: Strategy for handling conflicts
        
        Returns:
            Dictionary with import statistics
        """
        if shopify_products is None:
            shopify_products = list(
                ShopifyProduct.objects.filter(integration=self.integration)
            )
        
        results = {
            "total": len(shopify_products),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [],
        }
        
        for shopify_product in shopify_products:
            try:
                product, created = self.import_product(shopify_product, merge_strategy)
                if created:
                    results["created"] += 1
                elif merge_strategy == "skip":
                    results["skipped"] += 1
                else:
                    results["updated"] += 1
            except Exception as e:
                logger.exception("Error importing product %s: %s", shopify_product.title, str(e))
                results["errors"].append(
                    {
                        "shopify_product_id": shopify_product.id,
                        "title": shopify_product.title,
                        "error": str(e),
                    }
                )
        
        logger.info(
            "Batch import completed: %d total, %d created, %d updated, %d skipped, %d errors",
            results["total"],
            results["created"],
            results["updated"],
            results["skipped"],
            len(results["errors"]),
        )
        
        return results

    def _extract_sku(self, shopify_product: ShopifyProduct) -> str:
        """Extract SKU from Shopify product variants."""
        if shopify_product.variants:
            # Get SKU from first variant
            first_variant = shopify_product.variants[0] if isinstance(shopify_product.variants, list) else {}
            sku = first_variant.get('sku', '') if isinstance(first_variant, dict) else ''
            if sku:
                return sku
        
        # Fallback: use shopify_product_id as SKU
        return f"SHOP-{shopify_product.shopify_product_id}"

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
            
            # If not found, try to parse from UUID (this shouldn't happen, but fallback)
            logger.warning("Could not resolve tenant ID from UUID: %s", self.integration.tenant_id)
            # Try to get first tenant as fallback (not ideal, but better than failing)
            tenant = Tenant.objects.first()
            if tenant:
                return tenant.id
            raise ValueError("No tenant found")
        except (ValueError, TypeError) as e:
            logger.error("Error resolving tenant ID: %s", e)
            raise ValueError(f"Invalid tenant_id format: {self.integration.tenant_id}")

    def _transform_to_product(self, shopify_product: ShopifyProduct, sku: str) -> dict[str, Any]:
        """Transform ShopifyProduct to Product model format."""
        # Extract variant information
        variant = None
        if shopify_product.variants:
            variant = shopify_product.variants[0] if isinstance(shopify_product.variants, list) else {}
            if not isinstance(variant, dict):
                variant = {}
        
        # Extract price from variant or use min price
        selling_price = 0.0
        if variant and variant.get('price'):
            try:
                selling_price = float(variant.get('price', 0))
            except (ValueError, TypeError):
                pass
        elif shopify_product.price_min:
            selling_price = float(shopify_product.price_min)
        
        # Extract inventory item ID from variant
        inventory_item_id = ''
        if variant and variant.get('inventory_item_id'):
            inventory_item_id = str(variant.get('inventory_item_id'))
        
        # Extract variant ID
        variant_id = ''
        if variant and variant.get('id'):
            variant_id = str(variant.get('id'))
        
        # Clean HTML from description
        description = shopify_product.body_html or ''
        if description:
            # Simple HTML tag removal (can be enhanced with BeautifulSoup if needed)
            import re
            description = re.sub(r'<[^>]+>', '', description)
            description = description.strip()
        
        # Resolve actual integer tenant ID
        actual_tenant_id = self._resolve_tenant_id()
        
        return {
            'tenant_id': actual_tenant_id,
            'sku': sku,
            'name': shopify_product.title,
            'description': description,
            'category': shopify_product.product_type or 'General',
            'selling_price': selling_price,
            'status': 'active' if shopify_product.status == 'active' else 'inactive',
            'data_source': 'shopify',
            'source_id': str(shopify_product.id),
            'shopify_id': shopify_product.shopify_product_id,
            'shopify_variant_id': variant_id,
            'shopify_inventory_item_id': inventory_item_id,
            'shopify_handle': shopify_product.handle or '',
            'shopify_tags': shopify_product.tags or '',
            'shopify_created_at': shopify_product.published_at,
            'shopify_updated_at': shopify_product.synced_at,
            'last_imported_at': timezone.now(),
        }
    
    def _sync_inventory_from_shopify(self, product: Product, shopify_product: ShopifyProduct) -> None:
        """Sync inventory data from ShopifyInventoryLevel to Product."""
        if not product.shopify_inventory_item_id:
            return
        
        # Find inventory levels for this inventory item
        inventory_levels = ShopifyInventoryLevel.objects.filter(
            integration=self.integration,
            shopify_inventory_item_id=product.shopify_inventory_item_id
        )
        
        # Aggregate inventory across all locations (or use primary location)
        total_available = 0
        total_committed = 0
        total_incoming = 0
        primary_location_id = None
        
        for inv_level in inventory_levels:
            total_available += inv_level.available
            total_committed += inv_level.committed
            total_incoming += inv_level.incoming
            # Use the first location as primary (or you can add logic to determine primary)
            if not primary_location_id:
                primary_location_id = inv_level.shopify_location_id
        
        # Update product inventory
        product.quantity = total_available
        product.committed = total_committed
        product.incoming = total_incoming
        if primary_location_id:
            product.shopify_location_id = primary_location_id
        product.save(update_fields=['quantity', 'committed', 'incoming', 'shopify_location_id'])
        
        logger.info(
            "Synced inventory for product %s: available=%d, committed=%d, incoming=%d",
            product.name,
            total_available,
            total_committed,
            total_incoming
        )

