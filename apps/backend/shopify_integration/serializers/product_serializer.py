"""Serializers for Shopify product resources."""

from rest_framework import serializers

from ..models import ShopifyProduct


class ShopifyProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopifyProduct
        fields = [
            'id',
            'tenant_id',
            'integration',
            'shopify_product_id',
            'title',
            'status',
            'product_type',
            'vendor',
            'tags',
            'handle',
            'options',
            'variants',
            'images',
            'price_min',
            'price_max',
            'synced_at',
            'published_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = (
            'id',
            'tenant_id',
            'created_at',
            'updated_at',
            'synced_at',
            'published_at',
        )
