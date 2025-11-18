"""REST framework router for Shopify integration."""

from rest_framework.routers import DefaultRouter

from .views import (
    ShopifyProductViewSet,
    ShopifyOrderViewSet,
    ShopifyCustomerViewSet,
    ShopifyInventoryViewSet,
)

router = DefaultRouter()
router.register(r'products', ShopifyProductViewSet, basename='shopify-product')
router.register(r'orders', ShopifyOrderViewSet, basename='shopify-order')
router.register(r'customers', ShopifyCustomerViewSet, basename='shopify-customer')
router.register(r'inventory', ShopifyInventoryViewSet, basename='shopify-inventory')
