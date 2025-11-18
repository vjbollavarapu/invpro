"""Periodic sync tasks that run for all active integrations."""

from __future__ import annotations

import logging

from celery import shared_task

from ..models import ShopifyIntegration

logger = logging.getLogger(__name__)


@shared_task
def sync_shopify_products_periodic() -> str:
    """Periodic task to sync products for all active integrations."""
    from .sync_products import sync_shopify_products
    
    active_integrations = ShopifyIntegration.objects.filter(
        status=ShopifyIntegration.STATUS_CONNECTED,
        auto_sync_enabled=True,
        sync_products=True,
    )
    
    results = []
    for integration in active_integrations:
        try:
            result = sync_shopify_products(integration.id)
            results.append(f"{integration.store_url}: {result}")
        except Exception as exc:
            logger.error("Periodic product sync failed for %s: %s", integration.store_url, exc)
            results.append(f"{integration.store_url}: error")
    
    return f"Synced {len(results)} integrations: {', '.join(results)}"


@shared_task
def sync_shopify_orders_periodic() -> str:
    """Periodic task to sync orders for all active integrations."""
    from .sync_orders import sync_shopify_orders
    
    active_integrations = ShopifyIntegration.objects.filter(
        status=ShopifyIntegration.STATUS_CONNECTED,
        auto_sync_enabled=True,
        sync_orders=True,
    )
    
    results = []
    for integration in active_integrations:
        try:
            result = sync_shopify_orders(integration.id)
            results.append(f"{integration.store_url}: {result}")
        except Exception as exc:
            logger.error("Periodic order sync failed for %s: %s", integration.store_url, exc)
            results.append(f"{integration.store_url}: error")
    
    return f"Synced {len(results)} integrations: {', '.join(results)}"


@shared_task
def sync_shopify_customers_periodic() -> str:
    """Periodic task to sync customers for all active integrations."""
    from .sync_customers import sync_shopify_customers
    
    active_integrations = ShopifyIntegration.objects.filter(
        status=ShopifyIntegration.STATUS_CONNECTED,
        auto_sync_enabled=True,
        sync_customers=True,
    )
    
    results = []
    for integration in active_integrations:
        try:
            result = sync_shopify_customers(integration.id)
            results.append(f"{integration.store_url}: {result}")
        except Exception as exc:
            logger.error("Periodic customer sync failed for %s: %s", integration.store_url, exc)
            results.append(f"{integration.store_url}: error")
    
    return f"Synced {len(results)} integrations: {', '.join(results)}"


@shared_task
def sync_shopify_inventory_periodic() -> str:
    """Periodic task to sync inventory for all active integrations."""
    from .sync_inventory import sync_shopify_inventory
    
    active_integrations = ShopifyIntegration.objects.filter(
        status=ShopifyIntegration.STATUS_CONNECTED,
        auto_sync_enabled=True,
        sync_inventory=True,
    )
    
    results = []
    for integration in active_integrations:
        try:
            result = sync_shopify_inventory(integration.id)
            results.append(f"{integration.store_url}: {result}")
        except Exception as exc:
            logger.error("Periodic inventory sync failed for %s: %s", integration.store_url, exc)
            results.append(f"{integration.store_url}: error")
    
    return f"Synced {len(results)} integrations: {', '.join(results)}"

