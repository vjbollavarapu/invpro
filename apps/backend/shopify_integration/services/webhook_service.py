"""Process incoming Shopify webhook payloads."""

from __future__ import annotations

import logging
from typing import Any, Callable

from django.utils import timezone

from ..models import (
    ShopifyIntegration,
    ShopifyInventoryLevel,
    ShopifyProduct,
    ShopifySyncLog,
)
from ..utils.hmac_validator import validate_shopify_hmac
from .shopify_mapper import ShopifyMapper
from .shopify_upsert import ShopifyUpsert

logger = logging.getLogger(__name__)


class ShopifyWebhookService:
    """Handles verification and dispatch of Shopify webhook events."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration
        self._handlers: dict[str, Callable[[dict[str, Any]], None]] = {
            'products/create': self._handle_product,
            'products/update': self._handle_product,
            'orders/create': self._handle_order,
            'orders/updated': self._handle_order,
            'customers/create': self._handle_customer,
            'customers/update': self._handle_customer,
            'inventory_levels/update': self._handle_inventory,
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def verify(self, *, signature: str, body: bytes) -> bool:
        if not self.integration.webhook_secret:
            logger.warning("Webhook secret missing for %s", self.integration)
            return False
        return validate_shopify_hmac(signature, body, self.integration.webhook_secret)

    def dispatch(self, *, topic: str, payload: dict[str, Any]) -> None:
        handler = self._handlers.get(topic)
        if not handler:
            logger.info("Unhandled Shopify webhook topic %s", topic)
            return
        handler(payload)

    # ------------------------------------------------------------------
    # Event handlers
    # ------------------------------------------------------------------
    def _handle_product(self, payload: dict[str, Any]) -> None:
        mapped = ShopifyMapper.normalize_product(payload)
        product, created = ShopifyUpsert.upsert_product(self.integration, mapped)
        
        # Update sync status - webhook confirms Shopify has the latest data
        # This means our push was successful (if we had pending push)
        product.sync_status = 'synced'
        product.last_pulled_at = timezone.now()
        if product.pending_push:
            # Webhook confirms our push was received
            product.last_pushed_at = timezone.now()
            product.pending_push = False
        product.save(update_fields=['sync_status', 'last_pulled_at', 'last_pushed_at', 'pending_push'])
        
        logger.info(
            "Product webhook processed: %s (shopify_id: %s)",
            product.title,
            product.shopify_product_id,
        )
        self._record_webhook(ShopifySyncLog.ENTITY_PRODUCTS, payload)

    def _handle_order(self, payload: dict[str, Any]) -> None:
        mapped = ShopifyMapper.normalize_order(payload)
        ShopifyUpsert.upsert_order(self.integration, mapped)
        self._record_webhook(ShopifySyncLog.ENTITY_ORDERS, payload)

    def _handle_customer(self, payload: dict[str, Any]) -> None:
        mapped = ShopifyMapper.normalize_customer(payload)
        ShopifyUpsert.upsert_customer(self.integration, mapped)
        self._record_webhook(ShopifySyncLog.ENTITY_CUSTOMERS, payload)

    def _handle_inventory(self, payload: dict[str, Any]) -> None:
        mapped = ShopifyMapper.normalize_inventory_level(payload)
        inventory, created = ShopifyUpsert.upsert_inventory(self.integration, mapped)
        
        # Update sync status - webhook confirms Shopify has the latest data
        # This means our push was successful (if we had pending push)
        inventory.sync_status = 'synced'
        inventory.last_pulled_at = timezone.now()
        if inventory.pending_push:
            # Webhook confirms our push was received
            inventory.last_pushed_at = timezone.now()
            inventory.pending_push = False
        inventory.save(update_fields=['sync_status', 'last_pulled_at', 'last_pushed_at', 'pending_push'])
        
        logger.info(
            "Inventory webhook processed: item_id=%s, location_id=%s",
            inventory.shopify_inventory_item_id,
            inventory.shopify_location_id,
        )
        self._record_webhook(ShopifySyncLog.ENTITY_INVENTORY, payload)

    def _record_webhook(self, entity: str, payload: dict[str, Any]) -> None:
        log = ShopifySyncLog.objects.create(
            tenant_id=self.integration.tenant_id,
            integration=self.integration,
            entity=entity,
            status=ShopifySyncLog.STATUS_SUCCESS,
            records_fetched=1,
            records_processed=1,
            records_created=0,
            records_updated=1,
            records_failed=0,
            message='Webhook processed',
            details={'event': entity, 'timestamp': timezone.now().isoformat()},
        )
        logger.debug("Recorded webhook log %s", log.id)
