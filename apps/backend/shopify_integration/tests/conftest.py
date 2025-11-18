"""Pytest fixtures for Shopify integration tests."""

import pytest
from shopify_integration.models import ShopifyIntegration


@pytest.fixture
def shopify_integration(tenant1):
    """Create a test Shopify integration."""
    return ShopifyIntegration.objects.create(
        tenant_id=tenant1.id,
        store_url="https://test-store.myshopify.com",
        api_key="test_api_key",
        api_secret="test_api_secret",
        access_token="test_access_token",
        status=ShopifyIntegration.STATUS_CONNECTED,
        auto_sync_enabled=True,
    )
