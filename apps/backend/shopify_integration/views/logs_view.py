"""API endpoint for retrieving Shopify sync logs."""

from __future__ import annotations

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration, ShopifySyncLog


class ShopifyLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """Get sync logs for the current tenant's Shopify integration."""
        tenant_id = self._resolve_tenant_id(request)
        
        # Get integration
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()
        if not integration:
            return Response(
                {'logs': []},
                status=status.HTTP_200_OK
            )
        
        # Get sync logs for this integration, ordered by most recent first
        logs = ShopifySyncLog.objects.filter(
            integration=integration
        ).order_by('-started_at')[:50]  # Limit to 50 most recent logs
        
        logs_data = []
        for log in logs:
            # Map backend fields to frontend expectations
            status_upper = log.status.upper() if log.status else 'UNKNOWN'
            logs_data.append({
                'id': log.id,
                'sync_type': log.entity.upper() if log.entity else 'UNKNOWN',  # Frontend expects sync_type
                'status': status_upper,  # Frontend expects uppercase
                'started_at': log.started_at.isoformat() if log.started_at else None,
                'completed_at': log.finished_at.isoformat() if log.finished_at else None,  # Frontend expects completed_at
                'duration': log.duration_ms,  # Frontend expects duration (not duration_ms)
                'items_processed': log.records_processed,  # Frontend expects items_processed
                'items_created': log.records_created,  # Frontend expects items_created
                'items_updated': log.records_updated,  # Frontend expects items_updated
                'items_failed': log.records_failed,  # Frontend expects items_failed
                'records_fetched': log.records_fetched,  # Keep for completeness
                'error_message': log.message if log.status == ShopifySyncLog.STATUS_ERROR else None,  # Frontend expects error_message
                'message': log.message,
                'details': log.details,
            })
        
        return Response({'logs': logs_data}, status=status.HTTP_200_OK)
    
    @staticmethod
    def _resolve_tenant_id(request):
        """Resolve tenant_id from request. Returns UUID string."""
        import uuid
        
        tenant = getattr(request, 'tenant', None)
        if tenant:
            tenant_id = getattr(tenant, 'id', None)
            if tenant_id:
                # Convert integer tenant ID to UUID format
                namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')  # DNS namespace
                tenant_uuid = uuid.uuid5(namespace, f'tenant_{tenant_id}')
                return str(tenant_uuid)
        
        if hasattr(request.user, 'tenant_id') and request.user.tenant_id:
            return str(request.user.tenant_id)
        
        raise ValueError('Tenant context required for Shopify logs.')

