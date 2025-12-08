"""API views to configure Shopify integration credentials."""

from __future__ import annotations

from django.utils import timezone
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration
from ..services import ShopifyApiClient


class ShopifyConnectView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        store_url = serializers.CharField(max_length=255)
        api_key = serializers.CharField(max_length=255)
        api_secret = serializers.CharField(max_length=255)
        access_token = serializers.CharField(max_length=255, allow_blank=True, required=False)
        scopes = serializers.CharField(allow_blank=True, required=False)
        api_version = serializers.CharField(max_length=20, required=False)
        auto_sync_enabled = serializers.BooleanField(required=False)
        sync_products = serializers.BooleanField(required=False)
        sync_orders = serializers.BooleanField(required=False)
        sync_customers = serializers.BooleanField(required=False)
        sync_inventory = serializers.BooleanField(required=False)

        def validate_store_url(self, value):
            """Normalize store URL - accept both full URL and domain only."""
            if not value:
                raise serializers.ValidationError("Store URL is required")
            
            # Remove protocol if present
            value = value.strip().lower()
            if value.startswith(('http://', 'https://')):
                value = value.split('://', 1)[1]
            
            # Remove trailing slash
            value = value.rstrip('/')
            
            # Validate format
            if not value.endswith('.myshopify.com'):
                raise serializers.ValidationError(
                    "Store URL must end with .myshopify.com (e.g., mystore.myshopify.com)"
                )
            
            # Remove any path
            if '/' in value:
                value = value.split('/')[0]
            
            return value

    def post(self, request, *args, **kwargs):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        tenant_id = self._resolve_tenant_id(request)
        
        # Normalize store_url
        store_url = payload['store_url']
        
        # Create temporary integration for connection testing
        access_token = payload.get('access_token', '').strip()
        if not access_token:
            return Response(
                {
                    'detail': 'Access token is required',
                    'error': 'Please provide a valid Shopify access token',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Log credentials (without sensitive parts) for debugging
        import logging
        logger = logging.getLogger(__name__)
        print(f"[SHOPIFY DEBUG] Connection attempt received:")
        print(f"  store_url: '{store_url}'")
        print(f"  access_token (full): '{access_token}'")
        print(f"  token_length: {len(access_token)}")
        print(f"  token_starts_with: {access_token[:10] if len(access_token) > 10 else access_token}")
        print(f"  token_ends_with: {access_token[-10:] if len(access_token) > 10 else access_token}")
        print(f"  api_version: {payload.get('api_version', '2024-10')}")
        
        logger.info(
            "Shopify connection attempt: store_url=%s, token_length=%d, token_preview=%s, token_ends_with=%s, api_version=%s",
            store_url,
            len(access_token),
            access_token[:10] + "..." if len(access_token) > 10 else access_token,
            "..." + access_token[-10:] if len(access_token) > 10 else access_token,
            payload.get('api_version', '2024-10'),
        )
        
        temp_integration = ShopifyIntegration(
            tenant_id=tenant_id,
            store_url=store_url,
            api_key=payload['api_key'],
            api_secret=payload['api_secret'],
            access_token=access_token,
            api_version=payload.get('api_version', '2024-10'),
        )
        
        # Verify access token is set correctly
        if not temp_integration.access_token or temp_integration.access_token != access_token:
            logger.error(
                "Access token mismatch: expected_length=%d, actual_length=%d",
                len(access_token),
                len(temp_integration.access_token) if temp_integration.access_token else 0,
            )
            return Response(
                {
                    'detail': 'Access token validation failed',
                    'error': 'Access token was not set correctly. Please check your input.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Test connection if access token is provided
        if temp_integration.access_token:
            try:
                client = ShopifyApiClient(temp_integration)
                test_result = client.test_connection()
                
                if not test_result.get('success'):
                    error_msg = test_result.get('message', 'Unknown error')
                    # Provide more helpful error messages
                    if '401' in str(error_msg) or 'Unauthorized' in str(error_msg):
                        error_msg = 'Invalid access token. Please check your credentials.'
                    elif '404' in str(error_msg) or 'Not Found' in str(error_msg):
                        error_msg = f'Store not found: {store_url}. Please verify your store URL.'
                    elif '403' in str(error_msg) or 'Forbidden' in str(error_msg):
                        error_msg = 'Access denied. Please check your API permissions and scopes.'
                    
                    return Response(
                        {
                            'detail': 'Connection test failed',
                            'error': error_msg,
                            'test_result': test_result,
                            'hint': 'Please verify: 1) Store URL is correct, 2) Access token is valid, 3) App has required permissions',
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except Exception as e:
                return Response(
                    {
                        'detail': 'Connection test failed',
                        'error': f'Failed to connect to Shopify: {str(e)}',
                        'hint': 'Please check: 1) Store URL format (mystore.myshopify.com), 2) Access token is valid, 3) Network connectivity',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        
        # Connection successful, save integration
        defaults = {
            'tenant_id': tenant_id,
            'api_key': payload['api_key'],
            'api_secret': payload['api_secret'],
            'access_token': payload.get('access_token', ''),
            'scopes': payload.get('scopes', ''),
            'api_version': payload.get('api_version', '2024-10'),
            'auto_sync_enabled': payload.get('auto_sync_enabled', True),
            'sync_products': payload.get('sync_products', True),
            'sync_orders': payload.get('sync_orders', True),
            'sync_customers': payload.get('sync_customers', True),
            'sync_inventory': payload.get('sync_inventory', True),
            'status': ShopifyIntegration.STATUS_CONNECTED,
            'last_successful_sync': timezone.now(),
        }

        integration, created = ShopifyIntegration.objects.update_or_create(
            tenant_id=tenant_id,
            store_url=store_url,
            defaults=defaults,
        )

        # Verify credentials were saved correctly
        integration.refresh_from_db()
        logger.info(
            "Shopify integration %s: api_key_length=%d, api_secret_length=%d, access_token_length=%d",
            "created" if created else "updated",
            len(integration.api_key) if integration.api_key else 0,
            len(integration.api_secret) if integration.api_secret else 0,
            len(integration.access_token) if integration.access_token else 0,
        )

        data = self._serialize_integration(integration)
        if temp_integration.access_token:
            data['connection_test'] = test_result
        return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request, *args, **kwargs):
        tenant_id = self._resolve_tenant_id(request)
        store_url = request.data.get('store_url') or request.query_params.get('store_url')
        if not store_url:
            return Response({'detail': 'store_url is required'}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = ShopifyIntegration.objects.filter(tenant_id=tenant_id, store_url=store_url).delete()
        if not deleted:
            return Response({'detail': 'Integration not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _serialize_integration(self, integration: ShopifyIntegration) -> dict:
        return {
            'id': integration.id,
            'tenant_id': integration.tenant_id,
            'store_url': integration.store_url,
            'status': integration.status,
            'is_connected': integration.is_connected,
            'auto_sync_enabled': integration.auto_sync_enabled,
            'sync_products': integration.sync_products,
            'sync_orders': integration.sync_orders,
            'sync_customers': integration.sync_customers,
            'sync_inventory': integration.sync_inventory,
            'last_sync_at': integration.last_sync_at,
            'last_successful_sync': integration.last_successful_sync,
            'last_error_at': integration.last_error_at,
            'last_error_message': integration.last_error_message,
            'error_count': integration.error_count,
        }

    @staticmethod
    def _resolve_tenant_id(request):
        """Resolve tenant_id from request. Returns UUID string."""
        import uuid
        
        tenant = getattr(request, 'tenant', None)
        if tenant:
            tenant_id = getattr(tenant, 'id', None)
            if tenant_id:
                # Convert integer tenant ID to UUID format
                # Using a deterministic UUID v5 based on tenant ID
                # This ensures the same tenant ID always maps to the same UUID
                namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')  # DNS namespace
                tenant_uuid = uuid.uuid5(namespace, f'tenant_{tenant_id}')
                print(f"[SHOPIFY DEBUG] Resolved tenant_id: tenant.id={tenant_id} -> UUID={tenant_uuid}")
                return str(tenant_uuid)
        
        if hasattr(request.user, 'tenant_id') and request.user.tenant_id:
            # If user has tenant_id attribute, use it directly (assuming it's already UUID)
            return str(request.user.tenant_id)
        
        raise serializers.ValidationError('Tenant context required for Shopify integration.')
