"""
Shopify synchronization services for products, orders, customers, and inventory.
"""
import logging
from typing import Dict, List, Optional, Any
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache
from datetime import datetime, timedelta
import os

from .shopify_client import ShopifyClient, ShopifyDataTransformer
from .models import ShopifyIntegration
from inventory.models import Product
from sales.models import Order, Customer, OrderItem
from warehouse.models import Warehouse
from tenants.models import Tenant

logger = logging.getLogger(__name__)


class ShopifySyncService:
    """
    Comprehensive Shopify synchronization service.
    """
    
    def __init__(self, tenant_id: int):
        self.tenant_id = tenant_id
        self.tenant = Tenant.objects.get(id=tenant_id)
        self.integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()
        
        if not self.integration:
            raise ValueError(f"No Shopify integration found for tenant {tenant_id}")
        
        self.client = ShopifyClient(
            store_url=self.integration.store_url,
            access_token=self.integration.access_token
        )
    
    def test_connection(self) -> bool:
        """Test Shopify connection"""
        try:
            return self.client.test_connection()
        except Exception as e:
            logger.error(f"Shopify connection test failed for tenant {self.tenant_id}: {e}")
            return False
    
    def sync_products(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Sync products from Shopify to inventory system.
        """
        logger.info(f"Starting product sync for tenant {self.tenant_id}")
        
        try:
            # Test connection first
            if not self.test_connection():
                raise Exception("Shopify connection test failed")
            
            synced_count = 0
            updated_count = 0
            created_count = 0
            errors = []
            
            # Get products from Shopify
            products_generator = self.client.get_all_products()
            
            for i, shopify_product in enumerate(products_generator):
                if limit and i >= limit:
                    break
                    
                try:
                    with transaction.atomic():
                        # Transform product data
                        product_data = ShopifyDataTransformer.transform_product(shopify_product, self.tenant_id)
                        
                        # Check if product already exists (by Shopify ID or SKU)
                        existing_product = Product.objects.filter(
                            tenant_id=self.tenant_id,
                            shopify_id=product_data['shopify_id']
                        ).first()
                        
                        if existing_product:
                            # Update existing product
                            for key, value in product_data.items():
                                if key != 'tenant_id':  # Don't update tenant_id
                                    setattr(existing_product, key, value)
                            existing_product.save()
                            updated_count += 1
                            logger.debug(f"Updated product: {existing_product.name}")
                        else:
                            # Create new product
                            product = Product.objects.create(**product_data)
                            created_count += 1
                            logger.debug(f"Created product: {product.name}")
                        
                        synced_count += 1
                        
                except Exception as e:
                    error_msg = f"Error syncing product {shopify_product.get('title', 'Unknown')}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            # Update integration status
            self.integration.last_sync = timezone.now()
            self.integration.status = "CONNECTED"
            self.integration.save()
            
            result = {
                'success': True,
                'synced_count': synced_count,
                'created_count': created_count,
                'updated_count': updated_count,
                'errors': errors,
                'message': f"Successfully synced {synced_count} products"
            }
            
            logger.info(f"Product sync completed for tenant {self.tenant_id}: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Product sync failed for tenant {self.tenant_id}: {e}")
            self.integration.status = "ERROR"
            self.integration.save()
            
            return {
                'success': False,
                'error': str(e),
                'message': f"Product sync failed: {e}"
            }
    
    def sync_orders(self, limit: Optional[int] = None, days_back: int = 30) -> Dict[str, Any]:
        """
        Sync orders from Shopify to sales system.
        """
        logger.info(f"Starting order sync for tenant {self.tenant_id}")
        
        try:
            # Test connection first
            if not self.test_connection():
                raise Exception("Shopify connection test failed")
            
            synced_count = 0
            updated_count = 0
            created_count = 0
            errors = []
            
            # Calculate date filter
            created_at_min = (timezone.now() - timedelta(days=days_back)).isoformat()
            
            # Get orders from Shopify
            orders_generator = self.client.get_all_orders(created_at_min=created_at_min)
            
            for i, shopify_order in enumerate(orders_generator):
                if limit and i >= limit:
                    break
                    
                try:
                    with transaction.atomic():
                        # Transform order data
                        order_data = ShopifyDataTransformer.transform_order(shopify_order, self.tenant_id)
                        
                        # Check if order already exists
                        existing_order = Order.objects.filter(
                            tenant_id=self.tenant_id,
                            shopify_id=order_data['shopify_id']
                        ).first()
                        
                        if existing_order:
                            # Update existing order
                            for key, value in order_data.items():
                                if key not in ['tenant_id', 'order_number']:  # Don't update these
                                    setattr(existing_order, key, value)
                            existing_order.save()
                            updated_count += 1
                            logger.debug(f"Updated order: {existing_order.order_number}")
                        else:
                            # Create new order
                            order = Order.objects.create(**order_data)
                            
                            # Create order items
                            self._create_order_items(order, shopify_order)
                            
                            created_count += 1
                            logger.debug(f"Created order: {order.order_number}")
                        
                        synced_count += 1
                        
                except Exception as e:
                    error_msg = f"Error syncing order {shopify_order.get('name', 'Unknown')}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            # Update integration status
            self.integration.last_sync = timezone.now()
            self.integration.status = "CONNECTED"
            self.integration.save()
            
            result = {
                'success': True,
                'synced_count': synced_count,
                'created_count': created_count,
                'updated_count': updated_count,
                'errors': errors,
                'message': f"Successfully synced {synced_count} orders"
            }
            
            logger.info(f"Order sync completed for tenant {self.tenant_id}: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Order sync failed for tenant {self.tenant_id}: {e}")
            self.integration.status = "ERROR"
            self.integration.save()
            
            return {
                'success': False,
                'error': str(e),
                'message': f"Order sync failed: {e}"
            }
    
    def sync_customers(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Sync customers from Shopify.
        """
        logger.info(f"Starting customer sync for tenant {self.tenant_id}")
        
        try:
            # Test connection first
            if not self.test_connection():
                raise Exception("Shopify connection test failed")
            
            synced_count = 0
            updated_count = 0
            created_count = 0
            errors = []
            
            # Get customers from Shopify
            customers_generator = self.client.get_all_customers()
            
            for i, shopify_customer in enumerate(customers_generator):
                if limit and i >= limit:
                    break
                    
                try:
                    with transaction.atomic():
                        # Transform customer data
                        customer_data = ShopifyDataTransformer.transform_customer(shopify_customer, self.tenant_id)
                        
                        # Check if customer already exists
                        existing_customer = Customer.objects.filter(
                            tenant_id=self.tenant_id,
                            shopify_id=customer_data['shopify_id']
                        ).first()
                        
                        if existing_customer:
                            # Update existing customer
                            for key, value in customer_data.items():
                                if key not in ['tenant_id', 'customer_code']:  # Don't update these
                                    setattr(existing_customer, key, value)
                            existing_customer.save()
                            updated_count += 1
                            logger.debug(f"Updated customer: {existing_customer.name}")
                        else:
                            # Create new customer
                            customer = Customer.objects.create(**customer_data)
                            created_count += 1
                            logger.debug(f"Created customer: {customer.name}")
                        
                        synced_count += 1
                        
                except Exception as e:
                    error_msg = f"Error syncing customer {shopify_customer.get('email', 'Unknown')}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            # Update integration status
            self.integration.last_sync = timezone.now()
            self.integration.status = "CONNECTED"
            self.integration.save()
            
            result = {
                'success': True,
                'synced_count': synced_count,
                'created_count': created_count,
                'updated_count': updated_count,
                'errors': errors,
                'message': f"Successfully synced {synced_count} customers"
            }
            
            logger.info(f"Customer sync completed for tenant {self.tenant_id}: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Customer sync failed for tenant {self.tenant_id}: {e}")
            self.integration.status = "ERROR"
            self.integration.save()
            
            return {
                'success': False,
                'error': str(e),
                'message': f"Customer sync failed: {e}"
            }
    
    def sync_inventory_levels(self) -> Dict[str, Any]:
        """
        Sync inventory levels from Shopify.
        """
        logger.info(f"Starting inventory sync for tenant {self.tenant_id}")
        
        try:
            # Test connection first
            if not self.test_connection():
                raise Exception("Shopify connection test failed")
            
            # Get all products with Shopify integration
            products = Product.objects.filter(
                tenant_id=self.tenant_id,
                shopify_inventory_item_id__isnull=False
            ).exclude(shopify_inventory_item_id='')
            
            if not products.exists():
                return {
                    'success': True,
                    'message': 'No products with Shopify inventory IDs found',
                    'synced_count': 0
                }
            
            # Get inventory item IDs
            inventory_item_ids = [p.shopify_inventory_item_id for p in products]
            
            # Get inventory levels from Shopify
            inventory_levels = self.client.get_inventory_levels(inventory_item_ids)
            
            synced_count = 0
            errors = []
            
            # Create a mapping of inventory_item_id to quantity
            inventory_map = {level['inventory_item_id']: level['available'] for level in inventory_levels}
            
            # Update product quantities
            for product in products:
                try:
                    if product.shopify_inventory_item_id in inventory_map:
                        new_quantity = inventory_map[product.shopify_inventory_item_id]
                        if product.quantity != new_quantity:
                            product.quantity = new_quantity
                            product.save()
                            synced_count += 1
                            logger.debug(f"Updated inventory for {product.name}: {new_quantity}")
                except Exception as e:
                    error_msg = f"Error updating inventory for {product.name}: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)
            
            result = {
                'success': True,
                'synced_count': synced_count,
                'errors': errors,
                'message': f"Successfully synced inventory for {synced_count} products"
            }
            
            logger.info(f"Inventory sync completed for tenant {self.tenant_id}: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Inventory sync failed for tenant {self.tenant_id}: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': f"Inventory sync failed: {e}"
            }
    
    def _create_order_items(self, order: Order, shopify_order: Dict[str, Any]):
        """Create order items from Shopify order line items"""
        line_items = shopify_order.get('line_items', [])
        
        for item in line_items:
            try:
                # Find product by Shopify variant ID
                product = Product.objects.filter(
                    tenant_id=self.tenant_id,
                    shopify_variant_id=str(item.get('variant_id', ''))
                ).first()
                
                if product:
                    OrderItem.objects.create(
                        tenant_id=self.tenant_id,
                        order=order,
                        product=product,
                        quantity=int(item.get('quantity', 0)),
                        price=float(item.get('price', 0))
                    )
                    logger.debug(f"Created order item: {product.name} x {item.get('quantity', 0)}")
                else:
                    logger.warning(f"Product not found for variant ID: {item.get('variant_id')}")
                    
            except Exception as e:
                logger.error(f"Error creating order item: {e}")
    
    def full_sync(self, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Perform full synchronization of all data.
        """
        logger.info(f"Starting full sync for tenant {self.tenant_id}")
        
        results = {
            'products': self.sync_products(limit),
            'customers': self.sync_customers(limit),
            'orders': self.sync_orders(limit),
            'inventory': self.sync_inventory_levels()
        }
        
        # Calculate overall success
        all_successful = all(result.get('success', False) for result in results.values())
        
        return {
            'success': all_successful,
            'results': results,
            'message': 'Full sync completed' if all_successful else 'Full sync completed with errors'
        }
