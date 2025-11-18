"""Serializers for Shopify orders."""

from rest_framework import serializers

from ..models import ShopifyOrder


class ShopifyOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopifyOrder
        fields = [
            'id',
            'tenant_id',
            'integration',
            'shopify_order_id',
            'shopify_order_number',
            'name',
            'email',
            'financial_status',
            'fulfillment_status',
            'currency',
            'total_price',
            'subtotal_price',
            'total_tax',
            'total_discounts',
            'processed_at',
            'closed_at',
            'cancelled_at',
            'shipping_address',
            'billing_address',
            'line_items',
            'customer_data',
            'synced_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = (
            'id',
            'tenant_id',
            'created_at',
            'updated_at',
            'synced_at',
        )
