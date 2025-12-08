"""Service for importing customers from Shopify integration tables to common Customer table."""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from sales.models import Customer
from ..models import ShopifyCustomer, ShopifyIntegration

logger = logging.getLogger(__name__)


class CustomerImportService:
    """Service for importing Shopify customers to the unified Customer table."""

    def __init__(self, integration: ShopifyIntegration) -> None:
        self.integration = integration

    def import_customer(self, shopify_customer: ShopifyCustomer, merge_strategy: str = "last_write_wins") -> tuple[Customer, bool]:
        """
        Import a single Shopify customer to the Customer table.
        
        Args:
            shopify_customer: The ShopifyCustomer to import
            merge_strategy: Strategy for handling conflicts ('last_write_wins', 'skip', 'overwrite')
        
        Returns:
            Tuple of (Customer instance, created boolean)
        """
        # Check if customer already exists by source_id
        existing_customer = Customer.objects.filter(
            tenant_id=self.integration.tenant_id,
            data_source='shopify',
            source_id=str(shopify_customer.id),
        ).first()
        
        # Also check by email or shopify_id if no source match
        if not existing_customer:
            if shopify_customer.email:
                existing_customer = Customer.objects.filter(
                    tenant_id=self.integration.tenant_id,
                    email=shopify_customer.email,
                ).exclude(
                    data_source='shopify',
                    source_id=str(shopify_customer.id),
                ).first()
            
            if not existing_customer and shopify_customer.shopify_customer_id:
                existing_customer = Customer.objects.filter(
                    tenant_id=self.integration.tenant_id,
                    shopify_id=shopify_customer.shopify_customer_id,
                ).exclude(
                    data_source='shopify',
                    source_id=str(shopify_customer.id),
                ).first()
        
        # Transform Shopify customer to Customer format
        customer_data = self._transform_to_customer(shopify_customer)
        
        if existing_customer:
            # Handle existing customer based on merge strategy
            if merge_strategy == "skip":
                logger.info("Skipping customer %s (already exists)", shopify_customer.email or shopify_customer.shopify_customer_id)
                return existing_customer, False
            
            elif merge_strategy == "overwrite":
                # Update all fields
                for key, value in customer_data.items():
                    if key not in ['tenant_id', 'customer_code']:
                        setattr(existing_customer, key, value)
                existing_customer.last_imported_at = timezone.now()
                existing_customer.save()
                logger.info("Overwritten customer %s", shopify_customer.email or shopify_customer.shopify_customer_id)
                return existing_customer, False
            
            else:  # last_write_wins (default)
                # Only update if Shopify customer is newer
                if shopify_customer.synced_at and existing_customer.last_imported_at:
                    if shopify_customer.synced_at <= existing_customer.last_imported_at:
                        logger.info("Skipping customer %s (local version is newer)", shopify_customer.email or shopify_customer.shopify_customer_id)
                        return existing_customer, False
                
                # Update fields that might have changed
                existing_customer.name = customer_data['name']
                existing_customer.email = customer_data['email']
                existing_customer.phone = customer_data['phone']
                existing_customer.address = customer_data['address']
                existing_customer.shopify_id = customer_data['shopify_id']
                existing_customer.last_imported_at = timezone.now()
                existing_customer.save()
                logger.info("Updated customer %s", shopify_customer.email or shopify_customer.shopify_customer_id)
                return existing_customer, False
        
        # Create new customer
        with transaction.atomic():
            customer = Customer.objects.create(**customer_data)
            logger.info("Imported new customer %s", shopify_customer.email or shopify_customer.shopify_customer_id)
            return customer, True

    def import_batch(
        self,
        shopify_customers: list[ShopifyCustomer] | None = None,
        merge_strategy: str = "last_write_wins",
    ) -> dict[str, Any]:
        """
        Import multiple Shopify customers to the Customer table.
        
        Args:
            shopify_customers: List of ShopifyCustomer instances. If None, imports all customers for the integration.
            merge_strategy: Strategy for handling conflicts
        
        Returns:
            Dictionary with import statistics
        """
        if shopify_customers is None:
            shopify_customers = list(
                ShopifyCustomer.objects.filter(integration=self.integration)
            )
        
        results = {
            "total": len(shopify_customers),
            "created": 0,
            "updated": 0,
            "skipped": 0,
            "errors": [],
        }
        
        for shopify_customer in shopify_customers:
            try:
                customer, created = self.import_customer(shopify_customer, merge_strategy)
                if created:
                    results["created"] += 1
                elif merge_strategy == "skip":
                    results["skipped"] += 1
                else:
                    results["updated"] += 1
            except Exception as e:
                logger.exception("Error importing customer %s: %s", shopify_customer.email or shopify_customer.shopify_customer_id, str(e))
                results["errors"].append(
                    {
                        "shopify_customer_id": shopify_customer.id,
                        "email": shopify_customer.email,
                        "error": str(e),
                    }
                )
        
        logger.info(
            "Batch customer import completed: %d total, %d created, %d updated, %d skipped, %d errors",
            results["total"],
            results["created"],
            results["updated"],
            results["skipped"],
            len(results["errors"]),
        )
        
        return results

    def _transform_to_customer(self, shopify_customer: ShopifyCustomer) -> dict[str, Any]:
        """Transform ShopifyCustomer to Customer model format."""
        # Build name from first_name and last_name
        first_name = shopify_customer.first_name or ''
        last_name = shopify_customer.last_name or ''
        name = f"{first_name} {last_name}".strip() or shopify_customer.email or "Unknown Customer"
        
        # Format address from default_address
        address = ''
        default_address = shopify_customer.default_address or {}
        if isinstance(default_address, dict):
            address_parts = [
                default_address.get('address1', ''),
                default_address.get('address2', ''),
                default_address.get('city', ''),
                default_address.get('province', ''),
                default_address.get('zip', ''),
                default_address.get('country', ''),
            ]
            address = ', '.join(filter(None, address_parts))
        
        return {
            'tenant_id': self.integration.tenant_id,
            'name': name,
            'email': shopify_customer.email or '',
            'phone': shopify_customer.phone or '',
            'address': address,
            'data_source': 'shopify',
            'source_id': str(shopify_customer.id),
            'shopify_id': shopify_customer.shopify_customer_id,
            'shopify_created_at': shopify_customer.synced_at,  # Use synced_at as created_at proxy
            'shopify_updated_at': shopify_customer.synced_at,
            'last_imported_at': timezone.now(),
        }

