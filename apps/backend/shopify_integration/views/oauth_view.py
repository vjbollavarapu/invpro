"""OAuth flow views for Shopify integration."""

from __future__ import annotations

import hashlib
import secrets
from urllib.parse import urlencode

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponseRedirect
from django.urls import reverse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..config import SHOPIFY_WEBHOOK_BASE_URL
from ..models import ShopifyIntegration


class ShopifyOAuthInitiateView(APIView):
    """Initiate OAuth flow with Shopify."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Start OAuth flow by redirecting to Shopify."""
        store_url = request.data.get('store_url')
        if not store_url:
            return Response({'detail': 'store_url is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Clean store URL
        if store_url.startswith('http'):
            store_url = store_url.replace('https://', '').replace('http://', '')
        store_url = store_url.strip('/')

        tenant_id = self._resolve_tenant_id(request)
        
        # Get or create integration to store API credentials
        integration, _ = ShopifyIntegration.objects.get_or_create(
            tenant_id=tenant_id,
            store_url=f"https://{store_url}",
            defaults={
                'api_key': request.data.get('api_key', ''),
                'api_secret': request.data.get('api_secret', ''),
            },
        )

        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)
        cache_key = f"shopify_oauth_state_{state}"
        cache.set(cache_key, {
            'tenant_id': str(tenant_id),
            'integration_id': integration.id,
        }, timeout=600)  # 10 minutes

        # Required scopes
        scopes = request.data.get('scopes', 'read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory')
        
        # Build OAuth URL
        redirect_uri = f"{SHOPIFY_WEBHOOK_BASE_URL}{reverse('shopify_integration:oauth_callback')}"
        oauth_url = (
            f"https://{store_url}/admin/oauth/authorize?"
            f"client_id={integration.api_key}&"
            f"scope={scopes}&"
            f"redirect_uri={redirect_uri}&"
            f"state={state}"
        )

        return Response({
            'oauth_url': oauth_url,
            'state': state,
            'redirect_uri': redirect_uri,
        }, status=status.HTTP_200_OK)

    @staticmethod
    def _resolve_tenant_id(request) -> str:
        tenant = getattr(request, 'tenant', None)
        if tenant:
            return str(getattr(tenant, 'id', tenant))
        if hasattr(request.user, 'tenant_id') and request.user.tenant_id:
            return str(request.user.tenant_id)
        raise ValueError('Tenant context required for Shopify OAuth.')


class ShopifyOAuthCallbackView(APIView):
    """Handle OAuth callback from Shopify."""

    permission_classes = [permissions.AllowAny]
    authentication_classes: list = []

    def get(self, request, *args, **kwargs):
        """Process OAuth callback and exchange code for access token."""
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        shop = request.query_params.get('shop')

        if not code or not state or not shop:
            return Response(
                {'detail': 'Missing required parameters: code, state, or shop'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify state
        cache_key = f"shopify_oauth_state_{state}"
        state_data = cache.get(cache_key)
        if not state_data:
            return Response(
                {'detail': 'Invalid or expired state parameter'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cache.delete(cache_key)  # One-time use

        try:
            integration = ShopifyIntegration.objects.get(id=state_data['integration_id'])
        except ShopifyIntegration.DoesNotExist:
            return Response(
                {'detail': 'Integration not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Exchange code for access token
        token_result = self._exchange_code_for_token(integration, code, shop)
        
        if not token_result.get('success'):
            return Response(
                {'detail': 'Failed to exchange code for token', 'error': token_result.get('error')},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update integration with access token
        integration.access_token = token_result['access_token']
        integration.scopes = token_result.get('scope', '')
        integration.status = ShopifyIntegration.STATUS_CONNECTED
        integration.save()

        # Redirect to success page (frontend should handle this)
        return HttpResponseRedirect(f"{SHOPIFY_WEBHOOK_BASE_URL}/shopify/oauth/success?integration_id={integration.id}")

    def _exchange_code_for_token(self, integration, code: str, shop: str) -> dict:
        """Exchange authorization code for access token."""
        import requests

        url = f"https://{shop}/admin/oauth/access_token"
        data = {
            'client_id': integration.api_key,
            'client_secret': integration.api_secret,
            'code': code,
        }

        try:
            response = requests.post(url, json=data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'access_token': result.get('access_token'),
                    'scope': result.get('scope', ''),
                }
            return {
                'success': False,
                'error': f"HTTP {response.status_code}: {response.text}",
            }
        except Exception as exc:
            return {
                'success': False,
                'error': str(exc),
            }

