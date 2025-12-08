"""Service for pushing inventory level changes to Shopify."""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from ..models import ShopifyIntegration, ShopifyInventoryLevel
from .shopify_api_client import ShopifyApiClient, ShopifyApiError

logger = logging.getLogger(__name__)


class ShopifyInventoryPushService:
    """Service for pushing inventory level changes to Shopify."""

    def __init__(self, integration: ShopifyIntegration, *, api_client: ShopifyApiClient | None = None) -> None:
        self.integration = integration
        self.client = api_client or ShopifyApiClient(integration)

    def push_inventory_level(self, inventory_level: ShopifyInventoryLevel) -> dict[str, Any]:
        """Push a single inventory level update to Shopify."""
        try:
            logger.info(
                "Updating inventory level: location_id=%s, inventory_item_id=%s, quantity=%d",
                inventory_level.shopify_location_id,
                inventory_level.shopify_inventory_item_id,
                inventory_level.available,
            )

            result = self.client.update_inventory_level(
                location_id=inventory_level.shopify_location_id,
                inventory_item_id=inventory_level.shopify_inventory_item_id,
                quantity=inventory_level.available,
            )

            # Update sync status
            inventory_level.sync_status = "synced"
            inventory_level.last_pushed_at = timezone.now()
            inventory_level.pending_push = False
            inventory_level.last_push_error = ""
            inventory_level.save(update_fields=[
                "sync_status",
                "last_pushed_at",
                "pending_push",
                "last_push_error",
            ])

            logger.info(
                "Successfully pushed inventory level for item %s to Shopify",
                inventory_level.shopify_inventory_item_id,
            )

            return {"success": True, "data": result}

        except ShopifyApiError as e:
            logger.error(
                "Failed to push inventory level for item %s to Shopify: %s",
                inventory_level.shopify_inventory_item_id,
                str(e),
            )
            inventory_level.sync_status = "error"
            inventory_level.last_push_error = str(e)
            inventory_level.save(update_fields=["sync_status", "last_push_error"])
            raise
        except Exception as e:
            logger.exception(
                "Unexpected error pushing inventory level for item %s to Shopify",
                inventory_level.shopify_inventory_item_id,
            )
            inventory_level.sync_status = "error"
            inventory_level.last_push_error = str(e)
            inventory_level.save(update_fields=["sync_status", "last_push_error"])
            raise

    def push_batch(
        self,
        inventory_levels: list[ShopifyInventoryLevel] | None = None,
        updates: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """Push multiple inventory level updates to Shopify."""
        if updates:
            # Push from provided updates list
            results = {"success": 0, "failed": 0, "errors": []}

            for update in updates:
                try:
                    location_id = update.get("location_id")
                    inventory_item_id = update.get("inventory_item_id")
                    quantity = update.get("quantity")

                    if not all([location_id, inventory_item_id, quantity is not None]):
                        results["failed"] += 1
                        results["errors"].append(
                            {
                                "error": "Missing required fields: location_id, inventory_item_id, quantity",
                                "update": update,
                            }
                        )
                        continue

                    self.client.update_inventory_level(
                        location_id=str(location_id),
                        inventory_item_id=str(inventory_item_id),
                        quantity=int(quantity),
                    )
                    results["success"] += 1

                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append(
                        {
                            "error": str(e),
                            "update": update,
                        }
                    )
                    logger.error("Failed to push inventory update: %s", str(e))

            return results

        # Push from inventory level objects
        if inventory_levels is None:
            # Get all inventory levels with pending push
            inventory_levels = list(
                ShopifyInventoryLevel.objects.filter(
                    integration=self.integration,
                    pending_push=True,
                )
            )

        results = {"success": 0, "failed": 0, "errors": []}

        for inventory_level in inventory_levels:
            try:
                self.push_inventory_level(inventory_level)
                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(
                    {
                        "inventory_level_id": inventory_level.id,
                        "inventory_item_id": inventory_level.shopify_inventory_item_id,
                        "location_id": inventory_level.shopify_location_id,
                        "error": str(e),
                    }
                )
                logger.error(
                    "Failed to push inventory level %s: %s",
                    inventory_level.shopify_inventory_item_id,
                    str(e),
                )

        logger.info(
            "Batch inventory push completed: %d succeeded, %d failed",
            results["success"],
            results["failed"],
        )

        return results

