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
        store_url = serializers.URLField()
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

    def post(self, request, *args, **kwargs):
        serializer = self.InputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        tenant_id = self._resolve_tenant_id(request)
        
        # Create temporary integration for connection testing
        temp_integration = ShopifyIntegration(
            tenant_id=tenant_id,
            store_url=payload['store_url'],
            api_key=payload['api_key'],
            api_secret=payload['api_secret'],
            access_token=payload.get('access_token', ''),
            api_version=payload.get('api_version', '2024-10'),
        )
        
        # Test connection if access token is provided
        if temp_integration.access_token:
            client = ShopifyApiClient(temp_integration)
            test_result = client.test_connection()
            
            if not test_result.get('success'):
                return Response(
                    {
                        'detail': 'Connection test failed',
                        'error': test_result.get('message', 'Unknown error'),
                        'test_result': test_result,
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
            store_url=payload['store_url'],
            defaults=defaults,
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
    def _resolve_tenant_id(request) -> str:
        tenant = getattr(request, 'tenant', None)
        if tenant:
            return str(getattr(tenant, 'id', tenant))
        if hasattr(request.user, 'tenant_id') and request.user.tenant_id:
            return str(request.user.tenant_id)
        raise serializers.ValidationError('Tenant context required for Shopify integration.')
