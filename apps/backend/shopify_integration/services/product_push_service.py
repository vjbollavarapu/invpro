"""Service for pushing product changes to Shopify."""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from ..models import ShopifyIntegration, ShopifyProduct
from .shopify_api_client import ShopifyApiClient, ShopifyApiError

logger = logging.getLogger(__name__)


class ShopifyProductPushService:
    """Service for pushing product changes to Shopify."""

    def __init__(self, integration: ShopifyIntegration, *, api_client: ShopifyApiClient | None = None) -> None:
        self.integration = integration
        self.client = api_client or ShopifyApiClient(integration)

    def push_product(self, shopify_product: ShopifyProduct) -> dict[str, Any]:
        """Push a single product to Shopify."""
        try:
            # Transform to Shopify format
            product_data = self._transform_for_shopify(shopify_product)

            if shopify_product.shopify_product_id:
                # Update existing product
                logger.info(
                    "Updating product %s (%s) in Shopify",
                    shopify_product.title,
                    shopify_product.shopify_product_id,
                )
                result = self.client.update_product(shopify_product.shopify_product_id, product_data)
            else:
                # Create new product
                logger.info("Creating new product %s in Shopify", shopify_product.title)
                result = self.client.create_product(product_data)
                # Update local record with Shopify ID
                shopify_product.shopify_product_id = str(result.get("id", ""))
                if not shopify_product.shopify_product_id:
                    raise ValueError("Shopify API did not return product ID")

            # Update sync status
            shopify_product.sync_status = "synced"
            shopify_product.last_pushed_at = timezone.now()
            shopify_product.pending_push = False
            shopify_product.last_push_error = ""
            shopify_product.save(update_fields=[
                "shopify_product_id",
                "sync_status",
                "last_pushed_at",
                "pending_push",
                "last_push_error",
            ])

            logger.info(
                "Successfully pushed product %s to Shopify",
                shopify_product.title,
            )

            return {"success": True, "data": result, "product_id": shopify_product.shopify_product_id}

        except ShopifyApiError as e:
            logger.error(
                "Failed to push product %s to Shopify: %s",
                shopify_product.title,
                str(e),
            )
            shopify_product.sync_status = "error"
            shopify_product.last_push_error = str(e)
            shopify_product.save(update_fields=["sync_status", "last_push_error"])
            raise
        except Exception as e:
            logger.exception("Unexpected error pushing product %s to Shopify", shopify_product.title)
            shopify_product.sync_status = "error"
            shopify_product.last_push_error = str(e)
            shopify_product.save(update_fields=["sync_status", "last_push_error"])
            raise

    def push_batch(self, products: list[ShopifyProduct] | None = None) -> dict[str, Any]:
        """Push multiple products to Shopify."""
        if products is None:
            # Get all products with pending push
            products = list(
                ShopifyProduct.objects.filter(
                    integration=self.integration,
                    pending_push=True,
                )
            )

        results = {"success": 0, "failed": 0, "errors": []}

        for product in products:
            try:
                self.push_product(product)
                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(
                    {
                        "product_id": product.id,
                        "shopify_product_id": product.shopify_product_id,
                        "title": product.title,
                        "error": str(e),
                    }
                )
                logger.error("Failed to push product %s: %s", product.title, str(e))

        logger.info(
            "Batch push completed: %d succeeded, %d failed",
            results["success"],
            results["failed"],
        )

        return results

    def _transform_for_shopify(self, shopify_product: ShopifyProduct) -> dict[str, Any]:
        """Transform local ShopifyProduct to Shopify API format."""
        product_data: dict[str, Any] = {
            "title": shopify_product.title,
            "status": shopify_product.status,
        }

        # Add optional fields if they exist
        if shopify_product.body_html:
            product_data["body_html"] = shopify_product.body_html
        if shopify_product.product_type:
            product_data["product_type"] = shopify_product.product_type
        if shopify_product.vendor:
            product_data["vendor"] = shopify_product.vendor
        if shopify_product.tags:
            product_data["tags"] = shopify_product.tags
        if shopify_product.handle:
            product_data["handle"] = shopify_product.handle

        # Include variants if available
        if shopify_product.variants:
            product_data["variants"] = shopify_product.variants
        else:
            # Create a default variant if none exist
            product_data["variants"] = [
                {
                    "price": str(shopify_product.price_min or "0.00"),
                    "inventory_management": "shopify",
                }
            ]

        # Include options if available
        if shopify_product.options:
            product_data["options"] = shopify_product.options

        # Include images if available
        if shopify_product.images:
            product_data["images"] = shopify_product.images

        return product_data

