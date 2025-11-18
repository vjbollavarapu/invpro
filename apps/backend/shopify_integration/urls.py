"""URL configuration for the Shopify integration app."""

from django.urls import include, path

from .router import router
from .views import (
    ShopifyConnectView,
    ShopifyStatusView,
    ShopifyWebhookView,
    ShopifyOAuthInitiateView,
    ShopifyOAuthCallbackView,
)

app_name = 'shopify_integration'

urlpatterns = [
    path('', include(router.urls)),
    path('connect/', ShopifyConnectView.as_view(), name='connect'),
    path('status/', ShopifyStatusView.as_view(), name='status'),
    path('webhook/', ShopifyWebhookView.as_view(), name='webhook'),
    path('oauth/initiate/', ShopifyOAuthInitiateView.as_view(), name='oauth_initiate'),
    path('oauth/callback/', ShopifyOAuthCallbackView.as_view(), name='oauth_callback'),
]
