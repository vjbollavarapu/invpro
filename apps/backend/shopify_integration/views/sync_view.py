"""API endpoint for triggering Shopify synchronization."""

from __future__ import annotations

import logging
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ShopifyIntegration
from ..services import (
    ShopifyProductSyncService,
    ShopifyOrderSyncService,
    ShopifyCustomerSyncService,
    ShopifyInventorySyncService,
    ProductImportService,
    OrderImportService,
    CustomerImportService,
)
from ..services.shopify_api_client import ShopifyApiClient

logger = logging.getLogger(__name__)


class SyncRequestSerializer(serializers.Serializer):
    """Serializer for sync request."""
    type = serializers.ChoiceField(
        choices=['full', 'products', 'orders', 'customers', 'inventory'],
        default='full'
    )
    limit = serializers.IntegerField(required=False, min_value=1)


class ShopifySyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        """Trigger a Shopify synchronization."""
        serializer = SyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        sync_type = serializer.validated_data['type']
        tenant_id = self._resolve_tenant_id(request)
        
        # Get integration
        integration = ShopifyIntegration.objects.filter(tenant_id=tenant_id).first()
        if not integration:
            return Response(
                {'error': 'Shopify integration not found. Please connect to Shopify first.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not integration.is_connected:
            return Response(
                {'error': 'Shopify integration is not connected.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize API client
        client = ShopifyApiClient(integration)
        
        try:
            logs = []
            
            if sync_type == 'full':
                # Sync all enabled types
                if integration.sync_products:
                    product_service = ShopifyProductSyncService(integration, api_client=client)
                    log = product_service.sync()
                    # Automatically import products after syncing
                    import_service = ProductImportService(integration)
                    import_results = import_service.import_batch(merge_strategy='last_write_wins')
                    logs.append({
                        'type': 'products',
                        'log_id': log.id,
                        'status': log.status,
                        'records_fetched': log.records_fetched,
                        'records_processed': log.records_processed,
                        'records_created': log.records_created,
                        'records_updated': log.records_updated,
                        'records_failed': log.records_failed,
                        'imported': import_results.get('created', 0),
                        'import_updated': import_results.get('updated', 0),
                    })
                
                if integration.sync_orders:
                    order_service = ShopifyOrderSyncService(integration, api_client=client)
                    log = order_service.sync()
                    # Automatically import orders after syncing
                    import_service = OrderImportService(integration)
                    import_results = import_service.import_batch(merge_strategy='last_write_wins')
                    logs.append({
                        'type': 'orders',
                        'log_id': log.id,
                        'status': log.status,
                        'records_fetched': log.records_fetched,
                        'records_processed': log.records_processed,
                        'records_created': log.records_created,
                        'records_updated': log.records_updated,
                        'records_failed': log.records_failed,
                        'imported': import_results.get('created', 0),
                        'import_updated': import_results.get('updated', 0),
                    })
                
                if integration.sync_customers:
                    customer_service = ShopifyCustomerSyncService(integration, api_client=client)
                    log = customer_service.sync()
                    # Automatically import customers after syncing
                    import_service = CustomerImportService(integration)
                    import_results = import_service.import_batch(merge_strategy='last_write_wins')
                    logs.append({
                        'type': 'customers',
                        'log_id': log.id,
                        'status': log.status,
                        'records_fetched': log.records_fetched,
                        'records_processed': log.records_processed,
                        'records_created': log.records_created,
                        'records_updated': log.records_updated,
                        'records_failed': log.records_failed,
                        'imported': import_results.get('created', 0),
                        'import_updated': import_results.get('updated', 0),
                    })
                
                if integration.sync_inventory:
                    inventory_service = ShopifyInventorySyncService(integration, api_client=client)
                    log = inventory_service.sync()
                    logs.append({
                        'type': 'inventory',
                        'log_id': log.id,
                        'status': log.status,
                        'records_fetched': log.records_fetched,
                        'records_processed': log.records_processed,
                        'records_created': log.records_created,
                        'records_updated': log.records_updated,
                        'records_failed': log.records_failed,
                    })
                
                total_processed = sum(log['records_processed'] for log in logs)
                total_created = sum(log['records_created'] for log in logs)
                total_updated = sum(log['records_updated'] for log in logs)
                total_failed = sum(log['records_failed'] for log in logs)
                
                return Response({
                    'success': True,
                    'message': f'Full sync completed. Processed {total_processed} records.',
                    'sync_type': 'full',
                    'logs': logs,
                    'summary': {
                        'total_processed': total_processed,
                        'total_created': total_created,
                        'total_updated': total_updated,
                        'total_failed': total_failed,
                    }
                }, status=status.HTTP_200_OK)
            
            elif sync_type == 'products':
                if not integration.sync_products:
                    return Response(
                        {'error': 'Product syncing is disabled for this integration.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                service = ShopifyProductSyncService(integration, api_client=client)
                log = service.sync()
                # Automatically import products after syncing
                import_service = ProductImportService(integration)
                import_results = import_service.import_batch(merge_strategy='last_write_wins')
                return Response({
                    'success': True,
                    'message': f'Product sync and import completed. Synced {log.records_processed} products, imported {import_results.get("created", 0)} to inventory.',
                    'sync_type': 'products',
                    'log_id': log.id,
                    'records_fetched': log.records_fetched,
                    'records_processed': log.records_processed,
                    'records_created': log.records_created,
                    'records_updated': log.records_updated,
                    'records_failed': log.records_failed,
                    'imported': import_results.get('created', 0),
                    'import_updated': import_results.get('updated', 0),
                }, status=status.HTTP_200_OK)
            
            elif sync_type == 'orders':
                if not integration.sync_orders:
                    return Response(
                        {'error': 'Order syncing is disabled for this integration.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                service = ShopifyOrderSyncService(integration, api_client=client)
                log = service.sync()
                # Automatically import orders after syncing
                import_service = OrderImportService(integration)
                import_results = import_service.import_batch(merge_strategy='last_write_wins')
                return Response({
                    'success': True,
                    'message': f'Order sync and import completed. Synced {log.records_processed} orders, imported {import_results.get("created", 0)} to inventory.',
                    'sync_type': 'orders',
                    'log_id': log.id,
                    'records_fetched': log.records_fetched,
                    'records_processed': log.records_processed,
                    'records_created': log.records_created,
                    'records_updated': log.records_updated,
                    'records_failed': log.records_failed,
                    'imported': import_results.get('created', 0),
                    'import_updated': import_results.get('updated', 0),
                }, status=status.HTTP_200_OK)
            
            elif sync_type == 'customers':
                if not integration.sync_customers:
                    return Response(
                        {'error': 'Customer syncing is disabled for this integration.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                service = ShopifyCustomerSyncService(integration, api_client=client)
                log = service.sync()
                # Automatically import customers after syncing
                import_service = CustomerImportService(integration)
                import_results = import_service.import_batch(merge_strategy='last_write_wins')
                return Response({
                    'success': True,
                    'message': f'Customer sync and import completed. Synced {log.records_processed} customers, imported {import_results.get("created", 0)} to inventory.',
                    'sync_type': 'customers',
                    'log_id': log.id,
                    'records_fetched': log.records_fetched,
                    'records_processed': log.records_processed,
                    'records_created': log.records_created,
                    'records_updated': log.records_updated,
                    'records_failed': log.records_failed,
                    'imported': import_results.get('created', 0),
                    'import_updated': import_results.get('updated', 0),
                }, status=status.HTTP_200_OK)
            
            elif sync_type == 'inventory':
                if not integration.sync_inventory:
                    return Response(
                        {'error': 'Inventory syncing is disabled for this integration.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                service = ShopifyInventorySyncService(integration, api_client=client)
                log = service.sync()
                return Response({
                    'success': True,
                    'message': f'Inventory sync completed. Processed {log.records_processed} inventory levels.',
                    'sync_type': 'inventory',
                    'log_id': log.id,
                    'records_fetched': log.records_fetched,
                    'records_processed': log.records_processed,
                    'records_created': log.records_created,
                    'records_updated': log.records_updated,
                    'records_failed': log.records_failed,
                }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.exception("Shopify sync failed: %s", e)
            return Response(
                {
                    'success': False,
                    'error': f'Sync failed: {str(e)}',
                    'message': 'An error occurred during synchronization. Please check the logs for details.',
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
        
        raise ValueError('Tenant context required for Shopify sync.')

