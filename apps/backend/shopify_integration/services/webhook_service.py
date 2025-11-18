"""Process incoming Shopify webhook payloads."""

from __future__ import annotations

import logging
from typing import Any, Callable

from django.utils import timezone

from ..models import ShopifyIntegration, ShopifySyncLog
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
        ShopifyUpsert.upsert_product(self.integration, mapped)
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
        ShopifyUpsert.upsert_inventory(self.integration, mapped)
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
