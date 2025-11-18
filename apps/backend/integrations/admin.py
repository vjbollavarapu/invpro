from django.contrib import admin
from .models import ShopifyIntegration, ShopifySyncLog, StripeIntegration, EmailServiceIntegration


@admin.register(ShopifyIntegration)
class ShopifyIntegrationAdmin(admin.ModelAdmin):
    list_display = ('store_url', 'tenant_id', 'status', 'last_sync')
    list_filter = ('status',)
    search_fields = ('store_url', 'tenant_id')


@admin.register(StripeIntegration)
class StripeIntegrationAdmin(admin.ModelAdmin):
    list_display = ('tenant_id', 'status', 'test_mode', 'last_test_at')
    list_filter = ('status', 'test_mode')
    search_fields = ('tenant_id',)


@admin.register(EmailServiceIntegration)
class EmailServiceIntegrationAdmin(admin.ModelAdmin):
    list_display = ('tenant_id', 'service_provider', 'status', 'from_email', 'enable_sending')
    list_filter = ('status', 'service_provider', 'enable_sending')
    search_fields = ('tenant_id', 'from_email', 'smtp_host')
