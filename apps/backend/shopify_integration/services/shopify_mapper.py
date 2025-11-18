"""Utilities for normalising Shopify payloads before persistence."""

from __future__ import annotations

from typing import Any, Dict


class ShopifyMapper:
    """Transforms raw Shopify API payloads into ORM-friendly dictionaries."""

    @staticmethod
    def normalize_product(payload: Dict[str, Any]) -> Dict[str, Any]:
        variants = payload.get('variants') or []
        prices = [ShopifyMapper._safe_decimal(v.get('price')) for v in variants if v.get('price')]
        normalized = {
            'shopify_product_id': str(payload.get('id')),
            'title': payload.get('title', ''),
            'status': payload.get('status', ''),
            'product_type': payload.get('product_type', ''),
            'vendor': payload.get('vendor', ''),
            'tags': payload.get('tags', ''),
            'handle': payload.get('handle', ''),
            'options': payload.get('options') or [],
            'variants': variants,
            'images': payload.get('images') or [],
            'body_html': payload.get('body_html', ''),
            'price_min': min(prices) if prices else None,
            'price_max': max(prices) if prices else None,
            'published_at': payload.get('published_at'),
            'raw_data': payload,
        }
        return normalized

    @staticmethod
    def normalize_order(payload: Dict[str, Any]) -> Dict[str, Any]:
        normalized = {
            'shopify_order_id': str(payload.get('id')),
            'shopify_order_number': str(payload.get('order_number') or ''),
            'name': payload.get('name', ''),
            'email': payload.get('email') or '',
            'financial_status': payload.get('financial_status', ''),
            'fulfillment_status': payload.get('fulfillment_status', ''),
            'currency': payload.get('currency', 'USD'),
            'total_price': ShopifyMapper._safe_decimal(payload.get('total_price', 0)),
            'subtotal_price': ShopifyMapper._safe_decimal(payload.get('subtotal_price', 0)),
            'total_tax': ShopifyMapper._safe_decimal(payload.get('total_tax', 0)),
            'total_discounts': ShopifyMapper._safe_decimal(payload.get('total_discounts', 0)),
            'processed_at': payload.get('processed_at'),
            'closed_at': payload.get('closed_at'),
            'cancelled_at': payload.get('cancelled_at'),
            'shipping_address': payload.get('shipping_address') or {},
            'billing_address': payload.get('billing_address') or {},
            'line_items': payload.get('line_items') or [],
            'customer_data': payload.get('customer') or {},
            'raw_data': payload,
        }
        return normalized

    @staticmethod
    def normalize_customer(payload: Dict[str, Any]) -> Dict[str, Any]:
        normalized = {
            'shopify_customer_id': str(payload.get('id')),
            'email': payload.get('email') or '',
            'first_name': payload.get('first_name') or '',
            'last_name': payload.get('last_name') or '',
            'phone': payload.get('phone') or '',
            'state': payload.get('state') or '',
            'tags': payload.get('tags') or '',
            'addresses': payload.get('addresses') or [],
            'default_address': payload.get('default_address') or {},
            'total_spent': ShopifyMapper._safe_decimal(payload.get('total_spent', 0)),
            'orders_count': int(payload.get('orders_count') or 0),
            'last_order_id': str(payload.get('last_order_id') or ''),
            'last_order_name': payload.get('last_order_name') or '',
            'raw_data': payload,
        }
        return normalized

    @staticmethod
    def normalize_inventory_level(payload: Dict[str, Any]) -> Dict[str, Any]:
        normalized = {
            'shopify_inventory_item_id': str(payload.get('inventory_item_id')),
            'shopify_location_id': str(payload.get('location_id')),
            'sku': payload.get('sku') or '',
            'available': int(payload.get('available') or 0),
            'committed': int(payload.get('committed') or 0),
            'incoming': int(payload.get('incoming') or 0),
            'shopify_updated_at': payload.get('updated_at'),
            'raw_data': payload,
        }
        return normalized

    @staticmethod
    def _safe_decimal(value: Any):
        from decimal import Decimal, InvalidOperation

        try:
            return Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            return None
