"""Service responsible for synchronising Shopify orders."""

from __future__ import annotations

import logging
from typing import Any, Iterable

from ..models import ShopifyIntegration, ShopifyOrder, ShopifySyncLog
from .shopify_api_client import ShopifyApiClient, ShopifyApiError
from .shopify_mapper import ShopifyMapper
from .shopify_upsert import ShopifyUpsert

logger = logging.getLogger(__name__)


class ShopifyOrderSyncService:
    """Synchronise Shopify orders for a tenant."""

    def __init__(self, integration: ShopifyIntegration, *, api_client: ShopifyApiClient | None = None) -> None:
        self.integration = integration
        self.client = api_client or ShopifyApiClient(integration)

    def sync(self, *, updated_after=None, status: str = "any") -> ShopifySyncLog:
        log = ShopifySyncLog.objects.create(
            tenant_id=self.integration.tenant_id,
            integration=self.integration,
            entity=ShopifySyncLog.ENTITY_ORDERS,
            status=ShopifySyncLog.STATUS_STARTED,
        )

        try:
            payloads = list(self._fetch(updated_after=updated_after, status=status))
            log.records_fetched = len(payloads)
            for payload in payloads:
                mapped = ShopifyMapper.normalize_order(payload)
                _, created = ShopifyUpsert.upsert_order(self.integration, mapped)
                log.records_processed += 1
                if created:
                    log.records_created += 1
                else:
                    log.records_updated += 1

            self.integration.mark_success()
            log.mark_complete(status=ShopifySyncLog.STATUS_SUCCESS, message="Order sync complete")
        except ShopifyApiError as exc:
            logger.exception("Shopify order sync failed: %s", exc)
            self.integration.mark_error(str(exc))
            log.records_failed = log.records_fetched - log.records_processed
            log.mark_complete(status=ShopifySyncLog.STATUS_ERROR, message=str(exc))
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Unexpected error during Shopify order sync: %s", exc)
            self.integration.mark_error(str(exc))
            log.records_failed = log.records_fetched - log.records_processed
            log.mark_complete(status=ShopifySyncLog.STATUS_ERROR, message=str(exc))
        finally:
            log.save(update_fields=[
                'records_fetched',
                'records_processed',
                'records_created',
                'records_updated',
                'records_failed',
                'updated_at',
            ])

        return log

    def _fetch(self, *, updated_after=None, status: str = "any") -> Iterable[dict[str, Any]]:
        return self.client.fetch_orders(updated_after=updated_after, status=status)

    def get_queryset(self) -> Iterable[ShopifyOrder]:
        return ShopifyOrder.objects.filter(integration=self.integration)
