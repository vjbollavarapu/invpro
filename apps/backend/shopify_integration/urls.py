"""URL configuration for the Shopify integration app."""

from django.urls import include, path

from .router import router
from .views import (
    ShopifyConnectView,
    ShopifyStatusView,
    ShopifySyncView,
    ShopifyLogsView,
    ShopifyPushView,
    ShopifyImportView,
    BidirectionalSyncView,
    ConflictResolutionView,
    CredentialsView,
    MonitoringView,
    RetryView,
    QueueView,
    ShopifyWebhookView,
    ShopifyOAuthInitiateView,
    ShopifyOAuthCallbackView,
)

app_name = 'shopify_integration'

urlpatterns = [
    path('', include(router.urls)),
    path('connect/', ShopifyConnectView.as_view(), name='connect'),
    path('status/', ShopifyStatusView.as_view(), name='status'),
    path('sync/', ShopifySyncView.as_view(), name='sync'),
    path('sync/bidirectional/', BidirectionalSyncView.as_view(), name='bidirectional_sync'),
    path('logs/', ShopifyLogsView.as_view(), name='logs'),
    path('push/<str:entity_type>/', ShopifyPushView.as_view(), name='push'),
    path('import/<str:entity_type>/', ShopifyImportView.as_view(), name='import'),
    path('conflicts/<str:entity_type>/', ConflictResolutionView.as_view(), name='conflicts'),
    path('conflicts/<str:entity_type>/<int:entity_id>/resolve/', ConflictResolutionView.as_view(), name='resolve_conflict'),
    path('credentials/', CredentialsView.as_view(), name='credentials'),
    path('monitoring/', MonitoringView.as_view(), name='monitoring'),
    path('retry/', RetryView.as_view(), name='retry'),
    path('queue/', QueueView.as_view(), name='queue'),
    path('webhook/', ShopifyWebhookView.as_view(), name='webhook'),
    path('oauth/initiate/', ShopifyOAuthInitiateView.as_view(), name='oauth_initiate'),
    path('oauth/callback/', ShopifyOAuthCallbackView.as_view(), name='oauth_callback'),
]
