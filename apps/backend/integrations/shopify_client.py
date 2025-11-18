"""
Shopify API Client for comprehensive data synchronization.
Handles authentication, rate limiting, and data transformation.
"""
import requests
import time
import logging
from typing import Dict, List, Optional, Any, Generator
from datetime import datetime, timezone
from django.conf import settings
from django.utils import timezone as django_timezone
from django.core.cache import cache
import json
import os

logger = logging.getLogger(__name__)


class ShopifyRateLimitError(Exception):
    """Raised when Shopify rate limit is exceeded"""
    pass


class ShopifyAPIError(Exception):
    """Raised when Shopify API returns an error"""
    pass


class ShopifyClient:
    """
    Comprehensive Shopify API client with rate limiting and error handling.
    """
    
    def __init__(self, store_url: str, access_token: str, api_version: str = None):
        self.store_url = store_url.rstrip('/')
        self.access_token = access_token
        self.api_version = api_version or os.getenv('SHOPIFY_API_VERSION', '2024-01')
        self.base_url = f"https://{self.store_url}/admin/api/{self.api_version}"
        self.session = requests.Session()
        self.session.headers.update({
            'X-Shopify-Access-Token': self.access_token,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Rate limiting configuration
        self.max_requests_per_second = int(os.getenv('SHOPIFY_MAX_REQUESTS_PER_SECOND', '40'))
        self.rate_limit_remaining = self.max_requests_per_second
        self.rate_limit_reset = None
        self.last_request_time = 0
        
        # Retry configuration
        self.max_retry_attempts = int(os.getenv('SHOPIFY_MAX_RETRY_ATTEMPTS', '3'))
        self.retry_delay = int(os.getenv('SHOPIFY_RETRY_DELAY', '5'))
        
        # Debug logging
        self.debug_logging = os.getenv('SHOPIFY_DEBUG_LOGGING', 'False').lower() == 'true'
        
    def _handle_rate_limiting(self):
        """Handle Shopify rate limiting based on configuration"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        # Calculate minimum time between requests
        min_interval = 1.0 / self.max_requests_per_second
        
        # Ensure minimum interval between requests
        if time_since_last < min_interval:
            time.sleep(min_interval - time_since_last)
            
        self.last_request_time = time.time()
        
        # Check if we're approaching rate limit
        if self.rate_limit_remaining < 5:
            logger.warning(f"Shopify rate limit low: {self.rate_limit_remaining} requests remaining")
            
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make authenticated request to Shopify API with error handling"""
        self._handle_rate_limiting()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(method, url, **kwargs)
            
            # Update rate limit info from headers
            self.rate_limit_remaining = int(response.headers.get('X-Shopify-Shop-Api-Call-Limit', '0/40').split('/')[0])
            
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 1))
                logger.warning(f"Rate limited. Waiting {retry_after} seconds...")
                time.sleep(retry_after)
                return self._make_request(method, endpoint, **kwargs)
                
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Shopify API request failed: {e}")
            raise ShopifyAPIError(f"Shopify API request failed: {e}")
    
    def test_connection(self) -> bool:
        """Test Shopify connection and credentials"""
        try:
            response = self._make_request('GET', 'shop.json')
            return 'shop' in response
        except Exception as e:
            logger.error(f"Shopify connection test failed: {e}")
            return False
    
    def get_shop_info(self) -> Dict[str, Any]:
        """Get shop information"""
        response = self._make_request('GET', 'shop.json')
        return response['shop']
    
    # PRODUCTS
    def get_products(self, limit: int = 250, page_info: str = None) -> Dict[str, Any]:
        """Get products with pagination support"""
        params = {'limit': limit}
        if page_info:
            params['page_info'] = page_info
            
        return self._make_request('GET', 'products.json', params=params)
    
    def get_product(self, product_id: str) -> Dict[str, Any]:
        """Get single product by ID"""
        response = self._make_request('GET', f'products/{product_id}.json')
        return response['product']
    
    def get_product_variants(self, product_id: str) -> List[Dict[str, Any]]:
        """Get all variants for a product"""
        response = self._make_request('GET', f'products/{product_id}/variants.json')
        return response['variants']
    
    def get_inventory_levels(self, inventory_item_ids: List[str]) -> List[Dict[str, Any]]:
        """Get inventory levels for specific inventory item IDs"""
        params = {'inventory_item_ids': ','.join(inventory_item_ids)}
        response = self._make_request('GET', 'inventory_levels.json', params=params)
        return response['inventory_levels']
    
    def update_inventory_level(self, inventory_item_id: str, location_id: str, available: int) -> Dict[str, Any]:
        """Update inventory level for a specific item and location"""
        data = {
            'location_id': location_id,
            'inventory_item_id': inventory_item_id,
            'available': available
        }
        response = self._make_request('POST', 'inventory_levels/set.json', json=data)
        return response['inventory_level']
    
    # ORDERS
    def get_orders(self, limit: int = 250, page_info: str = None, 
                   status: str = None, created_at_min: str = None) -> Dict[str, Any]:
        """Get orders with pagination and filtering"""
        params = {'limit': limit}
        if page_info:
            params['page_info'] = page_info
        if status:
            params['status'] = status
        if created_at_min:
            params['created_at_min'] = created_at_min
            
        return self._make_request('GET', 'orders.json', params=params)
    
    def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get single order by ID"""
        response = self._make_request('GET', f'orders/{order_id}.json')
        return response['order']
    
    def update_order_fulfillment(self, order_id: str, fulfillment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update order fulfillment status"""
        response = self._make_request('POST', f'orders/{order_id}/fulfillments.json', json=fulfillment_data)
        return response['fulfillment']
    
    # CUSTOMERS
    def get_customers(self, limit: int = 250, page_info: str = None) -> Dict[str, Any]:
        """Get customers with pagination support"""
        params = {'limit': limit}
        if page_info:
            params['page_info'] = page_info
            
        return self._make_request('GET', 'customers.json', params=params)
    
    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """Get single customer by ID"""
        response = self._make_request('GET', f'customers/{customer_id}.json')
        return response['customer']
    
    # LOCATIONS
    def get_locations(self) -> List[Dict[str, Any]]:
        """Get all locations"""
        response = self._make_request('GET', 'locations.json')
        return response['locations']
    
    # WEBHOOKS
    def create_webhook(self, topic: str, address: str) -> Dict[str, Any]:
        """Create webhook subscription"""
        data = {
            'webhook': {
                'topic': topic,
                'address': address,
                'format': 'json'
            }
        }
        response = self._make_request('POST', 'webhooks.json', json=data)
        return response['webhook']
    
    def get_webhooks(self) -> List[Dict[str, Any]]:
        """Get all webhook subscriptions"""
        response = self._make_request('GET', 'webhooks.json')
        return response['webhooks']
    
    def delete_webhook(self, webhook_id: str) -> bool:
        """Delete webhook subscription"""
        try:
            self._make_request('DELETE', f'webhooks/{webhook_id}.json')
            return True
        except Exception as e:
            logger.error(f"Failed to delete webhook {webhook_id}: {e}")
            return False
    
    # UTILITY METHODS
    def get_all_products(self) -> Generator[Dict[str, Any], None, None]:
        """Generator to get all products with automatic pagination"""
        page_info = None
        while True:
            response = self.get_products(page_info=page_info)
            products = response.get('products', [])
            
            for product in products:
                yield product
                
            # Check for next page
            link_header = response.get('link', '')
            if 'rel="next"' not in link_header:
                break
                
            # Extract page_info from link header
            next_link = [link for link in link_header.split(',') if 'rel="next"' in link]
            if next_link:
                page_info = next_link[0].split('page_info=')[1].split('>')[0]
            else:
                break
    
    def get_all_orders(self, status: str = None, created_at_min: str = None) -> Generator[Dict[str, Any], None, None]:
        """Generator to get all orders with automatic pagination"""
        page_info = None
        while True:
            response = self.get_orders(page_info=page_info, status=status, created_at_min=created_at_min)
            orders = response.get('orders', [])
            
            for order in orders:
                yield order
                
            # Check for next page
            link_header = response.get('link', '')
            if 'rel="next"' not in link_header:
                break
                
            # Extract page_info from link header
            next_link = [link for link in link_header.split(',') if 'rel="next"' in link]
            if next_link:
                page_info = next_link[0].split('page_info=')[1].split('>')[0]
            else:
                break
    
    def get_all_customers(self) -> Generator[Dict[str, Any], None, None]:
        """Generator to get all customers with automatic pagination"""
        page_info = None
        while True:
            response = self.get_customers(page_info=page_info)
            customers = response.get('customers', [])
            
            for customer in customers:
                yield customer
                
            # Check for next page
            link_header = response.get('link', '')
            if 'rel="next"' not in link_header:
                break
                
            # Extract page_info from link header
            next_link = [link for link in link_header.split(',') if 'rel="next"' in link]
            if next_link:
                page_info = next_link[0].split('page_info=')[1].split('>')[0]
            else:
                break


class ShopifyDataTransformer:
    """
    Transform Shopify data to match our internal models.
    """
    
    @staticmethod
    def transform_product(shopify_product: Dict[str, Any], tenant_id: int) -> Dict[str, Any]:
        """Transform Shopify product to our Product model format"""
        # Get the first variant for basic product info
        variant = shopify_product.get('variants', [{}])[0]
        
        return {
            'tenant_id': tenant_id,
            'name': shopify_product.get('title', ''),
            'description': shopify_product.get('body_html', '').replace('<p>', '').replace('</p>', ''),
            'sku': variant.get('sku', ''),
            'product_code': f"SHOP-{shopify_product.get('id', '')}",
            'category': shopify_product.get('product_type', 'General'),
            'quantity': int(variant.get('inventory_quantity', 0)),
            'unit_cost': float(variant.get('cost_price', 0)) if variant.get('cost_price') else 0.0,
            'selling_price': float(variant.get('price', 0)),
            'reorder_level': 10,  # Default reorder level
            'status': 'active' if shopify_product.get('status') == 'active' else 'inactive',
            'shopify_id': str(shopify_product.get('id', '')),
            'shopify_variant_id': str(variant.get('id', '')),
            'shopify_inventory_item_id': str(variant.get('inventory_item_id', '')),
            'shopify_handle': shopify_product.get('handle', ''),
            'shopify_tags': ','.join(shopify_product.get('tags', [])),
            'shopify_created_at': shopify_product.get('created_at', ''),
            'shopify_updated_at': shopify_product.get('updated_at', ''),
        }
    
    @staticmethod
    def transform_order(shopify_order: Dict[str, Any], tenant_id: int) -> Dict[str, Any]:
        """Transform Shopify order to our Order model format"""
        customer = shopify_order.get('customer', {})
        
        return {
            'tenant_id': tenant_id,
            'order_number': f"SHOP-{shopify_order.get('name', '')}",
            'customer_name': customer.get('first_name', '') + ' ' + customer.get('last_name', ''),
            'customer_email': customer.get('email', ''),
            'channel': 'shopify',
            'total_amount': float(shopify_order.get('total_price', 0)),
            'status': ShopifyDataTransformer._map_order_status(shopify_order.get('fulfillment_status')),
            'fulfilled_at': shopify_order.get('fulfilled_at'),
            'shopify_id': str(shopify_order.get('id', '')),
            'shopify_order_number': shopify_order.get('name', ''),
            'shopify_customer_id': str(customer.get('id', '')),
            'shopify_created_at': shopify_order.get('created_at', ''),
            'shopify_updated_at': shopify_order.get('updated_at', ''),
            'shopify_financial_status': shopify_order.get('financial_status', ''),
            'shopify_fulfillment_status': shopify_order.get('fulfillment_status', ''),
        }
    
    @staticmethod
    def transform_customer(shopify_customer: Dict[str, Any], tenant_id: int) -> Dict[str, Any]:
        """Transform Shopify customer to our Customer model format"""
        return {
            'tenant_id': tenant_id,
            'customer_code': f"SHOP-CUST-{shopify_customer.get('id', '')}",
            'name': f"{shopify_customer.get('first_name', '')} {shopify_customer.get('last_name', '')}".strip(),
            'email': shopify_customer.get('email', ''),
            'phone': shopify_customer.get('phone', ''),
            'address': ShopifyDataTransformer._format_address(shopify_customer.get('default_address', {})),
            'shopify_id': str(shopify_customer.get('id', '')),
            'shopify_created_at': shopify_customer.get('created_at', ''),
            'shopify_updated_at': shopify_customer.get('updated_at', ''),
        }
    
    @staticmethod
    def _map_order_status(fulfillment_status: str) -> str:
        """Map Shopify fulfillment status to our order status"""
        status_mapping = {
            'fulfilled': 'delivered',
            'partial': 'processing',
            'restocked': 'cancelled',
            None: 'pending'
        }
        return status_mapping.get(fulfillment_status, 'pending')
    
    @staticmethod
    def _format_address(address: Dict[str, Any]) -> str:
        """Format Shopify address to string"""
        if not address:
            return ''
        
        parts = [
            address.get('address1', ''),
            address.get('address2', ''),
            address.get('city', ''),
            address.get('province', ''),
            address.get('zip', ''),
            address.get('country', '')
        ]
        return ', '.join(filter(None, parts))
