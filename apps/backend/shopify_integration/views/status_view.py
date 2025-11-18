"""API endpoint exposing Shopify integration status."""

from __future__ import annotations

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration


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
            'auto_sync_enabled': integration.auto_sync_enabled,
            'last_sync_at': integration.last_sync_at,
            'last_successful_sync': integration.last_successful_sync,
            'last_error_at': integration.last_error_at,
            'last_error_message': integration.last_error_message,
            'error_count': integration.error_count,
        }
        return Response(data, status=status.HTTP_200_OK)

    @staticmethod
    def _resolve_tenant_id(request) -> str:
        tenant = getattr(request, 'tenant', None)
        if tenant:
            return str(getattr(tenant, 'id', tenant))
        if hasattr(request.user, 'tenant_id') and request.user.tenant_id:
            return str(request.user.tenant_id)
        raise PermissionError('Tenant context required for Shopify status.')
