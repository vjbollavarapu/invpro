"""Serializers for Shopify customers."""

from rest_framework import serializers

from ..models import ShopifyCustomer


class ShopifyCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopifyCustomer
        fields = [
            'id',
            'tenant_id',
            'integration',
            'shopify_customer_id',
            'email',
            'first_name',
            'last_name',
            'phone',
            'state',
            'tags',
            'addresses',
            'default_address',
            'total_spent',
            'orders_count',
            'last_order_id',
            'last_order_name',
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
