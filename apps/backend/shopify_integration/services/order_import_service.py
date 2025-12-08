"""Service for importing orders from Shopify integration tables to common Order table."""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from inventory.models import Product
from sales.models import Customer, Order, OrderItem
from ..models import ShopifyIntegration, ShopifyOrder

logger = logging.getLogger(__name__)


class OrderImportService:
    """Service for importing Shopify orders to the unified Order table."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration

    def import_order(self, shopify_order: ShopifyOrder, merge_strategy: str = "last_write_wins") -> tuple[Order, bool]:
        """
        Import a single Shopify order to the Order table.
        
        Args:
            shopify_order: The ShopifyOrder to import
            merge_strategy: Strategy for handling conflicts ('last_write_wins', 'skip', 'overwrite')
        
        Returns:
            Tuple of (Order instance, created boolean)
        """
        # Get or create customer
        customer = self._get_or_create_customer(shopify_order)
        
        # Check if order already exists by source_id
        existing_order = Order.objects.filter(
            tenant_id=self.integration.tenant_id,
            data_source='shopify',
            source_id=str(shopify_order.id),
        ).first()
        
        # Also check by shopify_id if no source match
        if not existing_order and shopify_order.shopify_order_id:
            existing_order = Order.objects.filter(
                tenant_id=self.integration.tenant_id,
                shopify_id=shopify_order.shopify_order_id,
            ).exclude(
                data_source='shopify',
                source_id=str(shopify_order.id),
            ).first()
        
        # Transform Shopify order to Order format
        order_data = self._transform_to_order(shopify_order, customer)
        
        if existing_order:
            # Handle existing order based on merge strategy
            if merge_strategy == "skip":
                logger.info("Skipping order %s (already exists)", shopify_order.name)
                return existing_order, False
            
            elif merge_strategy == "overwrite":
                # Update all fields
                for key, value in order_data.items():
                    if key not in ['tenant_id', 'order_number', 'customer']:
                        setattr(existing_order, key, value)
                existing_order.last_imported_at = timezone.now()
                existing_order.save()
                # Update order items
                self._update_order_items(existing_order, shopify_order)
                logger.info("Overwritten order %s", shopify_order.name)
                return existing_order, False
            
            else:  # last_write_wins (default)
                # Only update if Shopify order is newer
                if shopify_order.synced_at and existing_order.last_imported_at:
                    if shopify_order.synced_at <= existing_order.last_imported_at:
                        logger.info("Skipping order %s (local version is newer)", shopify_order.name)
                        return existing_order, False
                
                # Update fields that might have changed
                existing_order.total_amount = order_data['total_amount']
                existing_order.status = order_data['status']
                existing_order.fulfilled_at = order_data.get('fulfilled_at')
                existing_order.shopify_financial_status = order_data.get('shopify_financial_status', '')
                existing_order.shopify_fulfillment_status = order_data.get('shopify_fulfillment_status', '')
                existing_order.last_imported_at = timezone.now()
                existing_order.save()
                # Update order items
                self._update_order_items(existing_order, shopify_order)
                logger.info("Updated order %s", shopify_order.name)
                return existing_order, False
        
        # Create new order
        with transaction.atomic():
            order = Order.objects.create(**order_data)
            # Create order items
            self._create_order_items(order, shopify_order)
            logger.info("Imported new order %s", shopify_order.name)
            return order, True

    def import_batch(
        self,
        shopify_orders: list[ShopifyOrder] | None = None,
        merge_strategy: str = "last_write_wins",
    ) -> dict[str, Any]:
        """
        Import multiple Shopify orders to the Order table.
        
        Args:
            shopify_orders: List of ShopifyOrder instances. If None, imports all orders for the integration.
            merge_strategy: Strategy for handling conflicts
        
        Returns:
            Dictionary with import statistics
        """
        if shopify_orders is None:
            shopify_orders = list(
                ShopifyOrder.objects.filter(integration=self.integration)
            )
        
        results = {
            "total": len(shopify_orders),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [],
        }
        
        for shopify_order in shopify_orders:
            try:
                order, created = self.import_order(shopify_order, merge_strategy)
                if created:
                    results["created"] += 1
                elif merge_strategy == "skip":
                    results["skipped"] += 1
                else:
                    results["updated"] += 1
            except Exception as e:
                logger.exception("Error importing order %s: %s", shopify_order.name, str(e))
                results["errors"].append(
                    {
                        "shopify_order_id": shopify_order.id,
                        "name": shopify_order.name,
                        "error": str(e),
                    }
                )
        
        logger.info(
            "Batch order import completed: %d total, %d created, %d updated, %d skipped, %d errors",
            results["total"],
            results["created"],
            results["updated"],
            results["skipped"],
            len(results["errors"]),
        )
        
        return results

    def _get_or_create_customer(self, shopify_order: ShopifyOrder) -> Customer:
        """Get or create customer from Shopify order data."""
        customer_data = shopify_order.customer_data or {}
        shopify_customer_id = str(customer_data.get('id', ''))
        email = shopify_order.email or customer_data.get('email', '')
        
        # Try to find existing customer by shopify_id or email
        customer = None
        if shopify_customer_id:
            customer = Customer.objects.filter(
                tenant_id=self.integration.tenant_id,
                shopify_id=shopify_customer_id,
            ).first()
        
        if not customer and email:
            customer = Customer.objects.filter(
                tenant_id=self.integration.tenant_id,
                email=email,
            ).first()
        
        if customer:
            return customer
        
        # Create new customer
        first_name = customer_data.get('first_name', '')
        last_name = customer_data.get('last_name', '')
        name = f"{first_name} {last_name}".strip() or email or "Unknown Customer"
        
        # Format address from shipping address
        shipping_address = shopify_order.shipping_address or {}
        address_parts = [
            shipping_address.get('address1', ''),
            shipping_address.get('address2', ''),
            shipping_address.get('city', ''),
            shipping_address.get('province', ''),
            shipping_address.get('zip', ''),
            shipping_address.get('country', ''),
        ]
        address = ', '.join(filter(None, address_parts))
        
        customer = Customer.objects.create(
            tenant_id=self.integration.tenant_id,
            name=name,
            email=email,
            phone=customer_data.get('phone', '') or shipping_address.get('phone', ''),
            address=address,
            shopify_id=shopify_customer_id,
            data_source='shopify',
            source_id='',  # Will be set when customer is imported separately
        )
        
        logger.info("Created customer %s for order %s", name, shopify_order.name)
        return customer

    def _transform_to_order(self, shopify_order: ShopifyOrder, customer: Customer) -> dict[str, Any]:
        """Transform ShopifyOrder to Order model format."""
        # Map fulfillment status to order status
        fulfillment_status = shopify_order.fulfillment_status or ''
        status = 'pending'
        if fulfillment_status == 'fulfilled':
            status = 'delivered'
        elif fulfillment_status == 'partial':
            status = 'processing'
        elif fulfillment_status == 'restocked':
            status = 'cancelled'
        
        # Set fulfilled_at if order is fulfilled
        fulfilled_at = None
        if fulfillment_status == 'fulfilled' and shopify_order.processed_at:
            fulfilled_at = shopify_order.processed_at
        
        return {
            'tenant_id': self.integration.tenant_id,
            'customer': customer,
            'channel': 'shopify',
            'total_amount': float(shopify_order.total_price or 0),
            'status': status,
            'fulfilled_at': fulfilled_at,
            'data_source': 'shopify',
            'source_id': str(shopify_order.id),
            'shopify_id': shopify_order.shopify_order_id,
            'shopify_order_number': shopify_order.shopify_order_number or shopify_order.name,
            'shopify_customer_id': str((shopify_order.customer_data or {}).get('id', '')),
            'shopify_created_at': shopify_order.processed_at,
            'shopify_updated_at': shopify_order.synced_at,
            'shopify_financial_status': shopify_order.financial_status or '',
            'shopify_fulfillment_status': fulfillment_status,
            'last_imported_at': timezone.now(),
        }

    def _create_order_items(self, order: Order, shopify_order: ShopifyOrder) -> None:
        """Create order items from Shopify order line items."""
        line_items = shopify_order.line_items or []
        
        for line_item in line_items:
            if not isinstance(line_item, dict):
                continue
            
            # Try to find product by SKU or shopify variant ID
            product = None
            variant_id = str(line_item.get('variant_id', ''))
            sku = line_item.get('sku', '')
            
            if variant_id:
                product = Product.objects.filter(
                    tenant_id=self.integration.tenant_id,
                    shopify_variant_id=variant_id,
                ).first()
            
            if not product and sku:
                product = Product.objects.filter(
                    tenant_id=self.integration.tenant_id,
                    sku=sku,
                ).first()
            
            # Skip if product not found (can be created later or handled differently)
            if not product:
                logger.warning(
                    "Product not found for line item %s in order %s",
                    line_item.get('title', 'Unknown'),
                    shopify_order.name,
                )
                continue
            
            quantity = int(line_item.get('quantity', 0))
            price = float(line_item.get('price', 0))
            
            OrderItem.objects.create(
                tenant_id=self.integration.tenant_id,
                order=order,
                product=product,
                quantity=quantity,
                price=price,
            )

    def _update_order_items(self, order: Order, shopify_order: ShopifyOrder) -> None:
        """Update order items from Shopify order line items."""
        # Delete existing items and recreate (simple approach)
        order.items.all().delete()
        self._create_order_items(order, shopify_order)

