"""Admin registrations for Shopify integration models."""

from django.contrib import admin

from .models import (
    ShopifyIntegration,
    ShopifyProduct,
    ShopifyOrder,
    ShopifyCustomer,
    ShopifyInventoryLevel,
    ShopifySyncLog,
)


@admin.register(ShopifyIntegration)
class ShopifyIntegrationAdmin(admin.ModelAdmin):
    list_display = (
        'store_url',
        'tenant_id',
        'status',
        'auto_sync_enabled',
        'last_successful_sync',
        'last_error_at',
    )
    list_filter = ('status', 'auto_sync_enabled', 'sync_products', 'sync_orders')
    search_fields = ('store_url', 'tenant_id')
    readonly_fields = ('last_sync_at', 'last_successful_sync', 'last_error_at')
    ordering = ('store_url',)


@admin.register(ShopifyProduct)
class ShopifyProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'shopify_product_id', 'tenant_id', 'status', 'synced_at')
    list_filter = ('status',)
    search_fields = ('title', 'shopify_product_id', 'handle')
    readonly_fields = ('raw_data',)


@admin.register(ShopifyOrder)
class ShopifyOrderAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'shopify_order_id',
        'tenant_id',
        'financial_status',
        'fulfillment_status',
        'total_price',
        'processed_at',
    )
    list_filter = ('financial_status', 'fulfillment_status')
    search_fields = ('name', 'shopify_order_id', 'email')
    readonly_fields = ('raw_data',)


@admin.register(ShopifyCustomer)
class ShopifyCustomerAdmin(admin.ModelAdmin):
    list_display = ('email', 'shopify_customer_id', 'tenant_id', 'orders_count', 'total_spent')
    search_fields = ('email', 'shopify_customer_id', 'first_name', 'last_name')
    readonly_fields = ('raw_data',)


@admin.register(ShopifyInventoryLevel)
class ShopifyInventoryLevelAdmin(admin.ModelAdmin):
    list_display = (
        'sku',
        'shopify_inventory_item_id',
        'shopify_location_id',
        'tenant_id',
        'available',
        'incoming',
        'updated_at',
    )
    search_fields = ('sku', 'shopify_inventory_item_id', 'shopify_location_id')
    readonly_fields = ('raw_data',)


@admin.register(ShopifySyncLog)
class ShopifySyncLogAdmin(admin.ModelAdmin):
    list_display = (
        'integration',
        'entity',
        'status',
        'records_processed',
        'records_failed',
        'started_at',
        'finished_at',
    )
    list_filter = ('entity', 'status')
    search_fields = ('integration__store_url', 'message')
    readonly_fields = ('details',)
    ordering = ('-started_at',)
