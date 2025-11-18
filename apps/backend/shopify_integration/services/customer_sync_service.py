"""Service responsible for synchronising Shopify customers."""

from __future__ import annotations

import logging
from typing import Any, Iterable

from ..models import ShopifyCustomer, ShopifyIntegration, ShopifySyncLog
from .shopify_api_client import ShopifyApiClient, ShopifyApiError
from .shopify_mapper import ShopifyMapper
from .shopify_upsert import ShopifyUpsert

logger = logging.getLogger(__name__)


class ShopifyCustomerSyncService:
    """Synchronise customers from Shopify."""

    def __init__(self, integration: ShopifyIntegration, *, api_client: ShopifyApiClient | None = None) -> None:
        self.integration = integration
        self.client = api_client or ShopifyApiClient(integration)

    def sync(self, *, updated_after=None) -> ShopifySyncLog:
        log = ShopifySyncLog.objects.create(
            tenant_id=self.integration.tenant_id,
            integration=self.integration,
            entity=ShopifySyncLog.ENTITY_CUSTOMERS,
            status=ShopifySyncLog.STATUS_STARTED,
        )

        try:
            payloads = list(self._fetch(updated_after=updated_after))
            log.records_fetched = len(payloads)
            for payload in payloads:
                mapped = ShopifyMapper.normalize_customer(payload)
                _, created = ShopifyUpsert.upsert_customer(self.integration, mapped)
                log.records_processed += 1
                if created:
                    log.records_created += 1
                else:
                    log.records_updated += 1

            self.integration.mark_success()
            log.mark_complete(status=ShopifySyncLog.STATUS_SUCCESS, message="Customer sync complete")
        except ShopifyApiError as exc:
            logger.exception("Shopify customer sync failed: %s", exc)
            self.integration.mark_error(str(exc))
            log.records_failed = log.records_fetched - log.records_processed
            log.mark_complete(status=ShopifySyncLog.STATUS_ERROR, message=str(exc))
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Unexpected error during Shopify customer sync: %s", exc)
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

    def _fetch(self, *, updated_after=None) -> Iterable[dict[str, Any]]:
        return self.client.fetch_customers(updated_after=updated_after)

    def get_queryset(self) -> Iterable[ShopifyCustomer]:
        return ShopifyCustomer.objects.filter(integration=self.integration)
