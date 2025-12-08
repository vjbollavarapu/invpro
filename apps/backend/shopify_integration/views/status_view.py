"""API endpoint exposing Shopify integration status."""

from __future__ import annotations

from rest_framework import permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration


class SyncSettingsSerializer(serializers.Serializer):
    """Serializer for updating sync settings."""
    sync_products = serializers.BooleanField(required=False)
    sync_orders = serializers.BooleanField(required=False)
    sync_customers = serializers.BooleanField(required=False)
    sync_inventory = serializers.BooleanField(required=False)
    auto_sync_enabled = serializers.BooleanField(required=False)


class ShopifyStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()
        if not integration:
            return Response({'connected': False}, status=status.HTTP_200_OK)

        data = {
            'connected': integration.is_connected,
            'status': integration.status,
            'store_url': integration.store_url,
            'auto_sync_enabled': integration.auto_sync_enabled,
            'sync_settings': {
                'products': integration.sync_products,
                'orders': integration.sync_orders,
                'customers': integration.sync_customers,
                'inventory': integration.sync_inventory,
            },
            'last_sync_at': integration.last_sync_at,
            'last_successful_sync': integration.last_successful_sync,
            'last_error_at': integration.last_error_at,
            'last_error_message': integration.last_error_message,
            'error_count': integration.error_count,
        }
        return Response(data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        """Update sync settings for the Shopify integration."""
        tenant_id = self._resolve_tenant_id(request)
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()
        
        if not integration:
            return Response(
                {'error': 'Shopify integration not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SyncSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update sync settings
        if 'sync_products' in serializer.validated_data:
            integration.sync_products = serializer.validated_data['sync_products']
        if 'sync_orders' in serializer.validated_data:
            integration.sync_orders = serializer.validated_data['sync_orders']
        if 'sync_customers' in serializer.validated_data:
            integration.sync_customers = serializer.validated_data['sync_customers']
        if 'sync_inventory' in serializer.validated_data:
            integration.sync_inventory = serializer.validated_data['sync_inventory']
        if 'auto_sync_enabled' in serializer.validated_data:
            integration.auto_sync_enabled = serializer.validated_data['auto_sync_enabled']

        integration.save()

        # Return updated status
        data = {
            'connected': integration.is_connected,
            'status': integration.status,
            'store_url': integration.store_url,
            'auto_sync_enabled': integration.auto_sync_enabled,
            'sync_settings': {
                'products': integration.sync_products,
                'orders': integration.sync_orders,
                'customers': integration.sync_customers,
                'inventory': integration.sync_inventory,
            },
            'last_sync_at': integration.last_sync_at,
            'last_successful_sync': integration.last_successful_sync,
            'last_error_at': integration.last_error_at,
            'last_error_message': integration.last_error_message,
            'error_count': integration.error_count,
        }
        return Response(data, status=status.HTTP_200_OK)

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
                namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')  # DNS namespace
                tenant_uuid = uuid.uuid5(namespace, f'tenant_{tenant_id}')
                return str(tenant_uuid)
        
        if hasattr(request.user, 'tenant_id') and request.user.tenant_id:
            return str(request.user.tenant_id)
        
        raise PermissionError('Tenant context required for Shopify status.')
