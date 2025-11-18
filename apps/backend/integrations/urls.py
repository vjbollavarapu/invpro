from django.urls import path
from .views import (
    ShopifyConnectView, 
    ShopifyStatusView, 
    ShopifySyncView,
    ShopifyWebhookView,
    ShopifySyncLogView
)
from .stripe_views import StripeConnectView, StripeStatusView
from .email_views import EmailServiceConnectView, EmailServiceStatusView

urlpatterns = [
    # Shopify
    path("shopify/connect/", ShopifyConnectView.as_view()),
    path("shopify/status/", ShopifyStatusView.as_view()),
    path("shopify/sync/", ShopifySyncView.as_view()),
    path("shopify/webhook/", ShopifyWebhookView.as_view()),
    path("shopify/logs/", ShopifySyncLogView.as_view()),
    # Stripe
    path("stripe/connect/", StripeConnectView.as_view()),
    path("stripe/status/", StripeStatusView.as_view()),
    # Email Service
    path("email/connect/", EmailServiceConnectView.as_view()),
    path("email/status/", EmailServiceStatusView.as_view()),
]
