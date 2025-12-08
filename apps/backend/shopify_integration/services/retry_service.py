"""Service for retrying failed push operations with exponential backoff."""

from __future__ import annotations

import logging
import time
from typing import Any

from django.utils import timezone

from ..models import ShopifyIntegration, ShopifyInventoryLevel, ShopifyProduct
from .inventory_push_service import ShopifyInventoryPushService
from .product_push_service import ShopifyProductPushService
from .shopify_api_client import ShopifyApiClient

logger = logging.getLogger(__name__)


class RetryService:
    """Service for retrying failed push operations."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration
        self.api_client = ShopifyApiClient(integration)
        self.max_retries = 3
        self.base_delay = 5  # seconds

    def retry_failed_products(self, max_retries: int | None = None) -> dict[str, Any]:
        """
        Retry pushing products that failed previously.
        
        Args:
            max_retries: Maximum number of retry attempts (default: 3)
        
        Returns:
            Dictionary with retry results
        """
        max_retries = max_retries or self.max_retries
        
        # Get products with error status
        failed_products = ShopifyProduct.objects.filter(
            integration=self.integration,
            sync_status='error',
        )
        
        results = {
            "total": failed_products.count(),
            "retried": 0,
            "succeeded": 0,
            "failed": 0,
            "errors": [],
        }
        
        push_service = ShopifyProductPushService(self.integration, api_client=self.api_client)
        
        for product in failed_products:
            retry_count = 0
            success = False
            
            while retry_count < max_retries and not success:
                try:
                    # Exponential backoff
                    if retry_count > 0:
                        delay = self.base_delay * (2 ** (retry_count - 1))
                        logger.info(
                            "Retrying product %s (attempt %d/%d) after %d seconds",
                            product.title,
                            retry_count + 1,
                            max_retries,
                            delay,
                        )
                        time.sleep(delay)
                    
                    push_service.push_product(product)
                    success = True
                    results["succeeded"] += 1
                    logger.info("Successfully retried product %s", product.title)
                    
                except Exception as e:
                    retry_count += 1
                    logger.warning(
                        "Retry attempt %d/%d failed for product %s: %s",
                        retry_count,
                        max_retries,
                        product.title,
                        str(e),
                    )
                    
                    if retry_count >= max_retries:
                        results["failed"] += 1
                        results["errors"].append(
                            {
                                "product_id": product.id,
                                "title": product.title,
                                "error": str(e),
                                "retry_count": retry_count,
                            }
                        )
            
            results["retried"] += 1
        
        logger.info(
            "Retry completed: %d total, %d succeeded, %d failed",
            results["total"],
            results["succeeded"],
            results["failed"],
        )
        
        return results

    def retry_failed_inventory(self, max_retries: int | None = None) -> dict[str, Any]:
        """
        Retry pushing inventory levels that failed previously.
        
        Args:
            max_retries: Maximum number of retry attempts (default: 3)
        
        Returns:
            Dictionary with retry results
        """
        max_retries = max_retries or self.max_retries
        
        # Get inventory levels with error status
        failed_inventory = ShopifyInventoryLevel.objects.filter(
            integration=self.integration,
            sync_status='error',
        )
        
        results = {
            "total": failed_inventory.count(),
            "retried": 0,
            "succeeded": 0,
            "failed": 0,
            "errors": [],
        }
        
        push_service = ShopifyInventoryPushService(self.integration, api_client=self.api_client)
        
        for inventory in failed_inventory:
            retry_count = 0
            success = False
            
            while retry_count < max_retries and not success:
                try:
                    # Exponential backoff
                    if retry_count > 0:
                        delay = self.base_delay * (2 ** (retry_count - 1))
                        logger.info(
                            "Retrying inventory item %s (attempt %d/%d) after %d seconds",
                            inventory.shopify_inventory_item_id,
                            retry_count + 1,
                            max_retries,
                            delay,
                        )
                        time.sleep(delay)
                    
                    push_service.push_inventory_level(inventory)
                    success = True
                    results["succeeded"] += 1
                    logger.info(
                        "Successfully retried inventory item %s",
                        inventory.shopify_inventory_item_id,
                    )
                    
                except Exception as e:
                    retry_count += 1
                    logger.warning(
                        "Retry attempt %d/%d failed for inventory item %s: %s",
                        retry_count,
                        max_retries,
                        inventory.shopify_inventory_item_id,
                        str(e),
                    )
                    
                    if retry_count >= max_retries:
                        results["failed"] += 1
                        results["errors"].append(
                            {
                                "inventory_id": inventory.id,
                                "inventory_item_id": inventory.shopify_inventory_item_id,
                                "error": str(e),
                                "retry_count": retry_count,
                            }
                        )
            
            results["retried"] += 1
        
        logger.info(
            "Inventory retry completed: %d total, %d succeeded, %d failed",
            results["total"],
            results["succeeded"],
            results["failed"],
        )
        
        return results

    def retry_all_failed(self, max_retries: int | None = None) -> dict[str, Any]:
        """
        Retry all failed push operations (products and inventory).
        
        Args:
            max_retries: Maximum number of retry attempts (default: 3)
        
        Returns:
            Dictionary with combined retry results
        """
        product_results = self.retry_failed_products(max_retries)
        inventory_results = self.retry_failed_inventory(max_retries)
        
        return {
            "products": product_results,
            "inventory": inventory_results,
            "total_retried": product_results["retried"] + inventory_results["retried"],
            "total_succeeded": product_results["succeeded"] + inventory_results["succeeded"],
            "total_failed": product_results["failed"] + inventory_results["failed"],
        }

