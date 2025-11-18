"""Persistence helpers for Shopify synchronisation."""

from __future__ import annotations

from typing import Any, Dict, Tuple

from django.utils import timezone

from ..models import (
    ShopifyCustomer,
    ShopifyInventoryLevel,
    ShopifyOrder,
    ShopifyProduct,
)


class ShopifyUpsert:
    """Centralised helpers to create or update Shopify entities."""

    @staticmethod
    def upsert_product(integration, data: Dict[str, Any]) -> Tuple[ShopifyProduct, bool]:
        defaults = data.copy()
        defaults['tenant_id'] = integration.tenant_id
        defaults.setdefault('synced_at', timezone.now())
        product, created = ShopifyProduct.objects.update_or_create(
            integration=integration,
            shopify_product_id=data['shopify_product_id'],
            defaults=defaults,
        )
        return product, created

    @staticmethod
    def upsert_order(integration, data: Dict[str, Any]) -> Tuple[ShopifyOrder, bool]:
        defaults = data.copy()
        defaults['tenant_id'] = integration.tenant_id
        defaults.setdefault('synced_at', timezone.now())
        order, created = ShopifyOrder.objects.update_or_create(
            integration=integration,
            shopify_order_id=data['shopify_order_id'],
            defaults=defaults,
        )
        return order, created

    @staticmethod
    def upsert_customer(integration, data: Dict[str, Any]) -> Tuple[ShopifyCustomer, bool]:
        defaults = data.copy()
        defaults['tenant_id'] = integration.tenant_id
        defaults.setdefault('synced_at', timezone.now())
        customer, created = ShopifyCustomer.objects.update_or_create(
            integration=integration,
            shopify_customer_id=data['shopify_customer_id'],
            defaults=defaults,
        )
        return customer, created

    @staticmethod
    def upsert_inventory(integration, data: Dict[str, Any]) -> Tuple[ShopifyInventoryLevel, bool]:
        defaults = data.copy()
        defaults['tenant_id'] = integration.tenant_id
        defaults.setdefault('synced_at', timezone.now())
        inventory, created = ShopifyInventoryLevel.objects.update_or_create(
            integration=integration,
            shopify_inventory_item_id=data['shopify_inventory_item_id'],
            shopify_location_id=data['shopify_location_id'],
            defaults=defaults,
        )
        return inventory, created
