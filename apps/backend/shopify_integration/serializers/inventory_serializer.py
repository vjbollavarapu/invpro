"""Serializers for Shopify inventory levels."""

from rest_framework import serializers

from ..models import ShopifyInventoryLevel


class ShopifyInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopifyInventoryLevel
        fields = [
            'id',
            'tenant_id',
            'integration',
            'shopify_inventory_item_id',
            'shopify_location_id',
            'sku',
            'available',
            'committed',
            'incoming',
            'shopify_updated_at',
            'synced_at',
            'created_at',
            'shopify_updated_at',
        ]
        read_only_fields = (
            'id',
            'tenant_id',
            'created_at',
            'shopify_updated_at',
            'synced_at',
        )
