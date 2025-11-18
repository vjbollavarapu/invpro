from rest_framework import views, permissions, response, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
import logging

from .models import ShopifyIntegration, ShopifySyncLog
from .shopify_client import ShopifyClient
from .shopify_sync import ShopifySyncService

logger = logging.getLogger(__name__)


class ShopifyConnectView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Connect to Shopify store"""
        try:
            tenant = request.tenant
            payload = request.data
            
            # Validate required fields
            required_fields = ['store_url', 'api_key', 'api_secret', 'access_token']
            for field in required_fields:
                if not payload.get(field):
                    return Response(
                        {'error': f'Missing required field: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Test connection first
            client = ShopifyClient(
                store_url=payload['store_url'],
                access_token=payload['access_token']
            )
            
            if not client.test_connection():
                return Response(
                    {'error': 'Invalid Shopify credentials or store URL'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or update integration
            integration, created = ShopifyIntegration.objects.update_or_create(
                tenant_id=tenant.id,
                store_url=payload['store_url'],
                defaults={
                    'api_key': payload['api_key'],
                    'api_secret': payload['api_secret'],
                    'access_token': payload['access_token'],
                    'status': 'CONNECTED',
                    'last_sync': timezone.now(),
                    'error_count': 0,
                    'last_error': ''
                }
            )
            
            # Get shop info
            shop_info = client.get_shop_info()
            
            return Response({
                'success': True,
                'integration': {
                    'id': integration.id,
                    'store_url': integration.store_url,
                    'status': integration.status,
                    'shop_name': shop_info.get('name', ''),
                    'shop_domain': shop_info.get('domain', ''),
                    'created_at': integration.created_at,
                    'last_sync': integration.last_sync
                },
                'message': 'Successfully connected to Shopify'
            })
            
        except Exception as e:
            logger.error(f"Shopify connection error: {e}")
            return Response(
                {'error': f'Connection failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Disconnect from Shopify store"""
        try:
            tenant = request.tenant
            integration = ShopifyIntegration.objects.filter(tenant_id=tenant.id).first()
            
            if not integration:
                return Response(
                    {'error': 'No Shopify integration found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            integration.status = 'DISCONNECTED'
            integration.save()
            
            return Response({
                'success': True,
                'message': 'Successfully disconnected from Shopify'
            })
            
        except Exception as e:
            logger.error(f"Shopify disconnection error: {e}")
            return Response(
                {'error': f'Disconnection failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShopifyStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get Shopify integration status"""
        try:
            tenant = request.tenant
            integration = ShopifyIntegration.objects.filter(tenant_id=tenant.id).first()
            
            if not integration:
                return Response({
                    'connected': False,
                    'message': 'No Shopify integration found'
                })
            
            # Test connection if status is CONNECTED
            if integration.status == 'CONNECTED':
                try:
                    client = ShopifyClient(
                        store_url=integration.store_url,
                        access_token=integration.access_token
                    )
                    is_connected = client.test_connection()
                    
                    if not is_connected:
                        integration.status = 'ERROR'
                        integration.last_error = 'Connection test failed'
                        integration.error_count += 1
                        integration.save()
                except Exception as e:
                    integration.status = 'ERROR'
                    integration.last_error = str(e)
                    integration.error_count += 1
                    integration.save()
            
            return Response({
                'connected': integration.is_connected,
                'status': integration.status,
                'store_url': integration.store_url,
                'last_sync': integration.last_sync,
                'last_error': integration.last_error,
                'error_count': integration.error_count,
                'auto_sync_enabled': integration.auto_sync_enabled,
                'sync_settings': {
                    'products': integration.sync_products,
                    'orders': integration.sync_orders,
                    'customers': integration.sync_customers,
                    'inventory': integration.sync_inventory
                }
            })
            
        except Exception as e:
            logger.error(f"Shopify status error: {e}")
            return Response(
                {'error': f'Status check failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShopifySyncView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Trigger Shopify synchronization"""
        try:
            tenant = request.tenant
            sync_type = request.data.get('type', 'full')
            limit = request.data.get('limit', None)
            
            # Get integration
            integration = ShopifyIntegration.objects.filter(tenant_id=tenant.id).first()
            if not integration:
                return Response(
                    {'error': 'No Shopify integration found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Create sync log
            sync_log = ShopifySyncLog.objects.create(
                tenant_id=tenant.id,
                integration=integration,
                sync_type=sync_type.upper(),
                status='STARTED'
            )
            
            try:
                # Initialize sync service
                sync_service = ShopifySyncService(tenant.id)
                
                # Perform sync based on type
                if sync_type == 'full':
                    result = sync_service.full_sync(limit)
                elif sync_type == 'products':
                    result = sync_service.sync_products(limit)
                elif sync_type == 'orders':
                    result = sync_service.sync_orders(limit)
                elif sync_type == 'customers':
                    result = sync_service.sync_customers(limit)
                elif sync_type == 'inventory':
                    result = sync_service.sync_inventory_levels()
                else:
                    return Response(
                        {'error': 'Invalid sync type'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Update sync log
                sync_log.status = 'SUCCESS' if result.get('success') else 'ERROR'
                sync_log.completed_at = timezone.now()
                sync_log.items_processed = result.get('synced_count', 0)
                sync_log.items_created = result.get('created_count', 0)
                sync_log.items_updated = result.get('updated_count', 0)
                sync_log.items_failed = result.get('items_failed', 0)
                sync_log.error_message = result.get('error', '')
                sync_log.save()
                
                return Response({
                    'success': result.get('success', False),
                    'message': result.get('message', ''),
                    'data': result,
                    'sync_log_id': sync_log.id
                })
                
            except Exception as e:
                # Update sync log with error
                sync_log.status = 'ERROR'
                sync_log.completed_at = timezone.now()
                sync_log.error_message = str(e)
                sync_log.save()
                
                # Update integration error count
                integration.error_count += 1
                integration.last_error = str(e)
                integration.status = 'ERROR'
                integration.save()
                
                return Response(
                    {'error': f'Sync failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Shopify sync error: {e}")
            return Response(
                {'error': f'Sync request failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ShopifyWebhookView(views.APIView):
    """Handle Shopify webhooks for real-time updates"""
    permission_classes = []  # No authentication for webhooks
    
    def post(self, request):
        """Process incoming Shopify webhook"""
        try:
            # Get webhook topic from headers
            topic = request.headers.get('X-Shopify-Topic', '')
            shop_domain = request.headers.get('X-Shopify-Shop-Domain', '')
            
            logger.info(f"Received Shopify webhook: {topic} from {shop_domain}")
            
            # Find integration by shop domain
            integration = ShopifyIntegration.objects.filter(
                store_url=shop_domain,
                webhooks_enabled=True
            ).first()
            
            if not integration:
                logger.warning(f"No integration found for shop: {shop_domain}")
                return Response({'status': 'ignored'}, status=200)
            
            # Process webhook based on topic
            webhook_data = request.data
            
            if topic == 'products/create':
                self._handle_product_webhook(integration, webhook_data, 'create')
            elif topic == 'products/update':
                self._handle_product_webhook(integration, webhook_data, 'update')
            elif topic == 'orders/create':
                self._handle_order_webhook(integration, webhook_data, 'create')
            elif topic == 'orders/updated':
                self._handle_order_webhook(integration, webhook_data, 'update')
            elif topic == 'customers/create':
                self._handle_customer_webhook(integration, webhook_data, 'create')
            elif topic == 'customers/update':
                self._handle_customer_webhook(integration, webhook_data, 'update')
            elif topic == 'inventory_levels/update':
                self._handle_inventory_webhook(integration, webhook_data)
            
            return Response({'status': 'processed'}, status=200)
            
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            return Response({'error': str(e)}, status=500)
    
    def _handle_product_webhook(self, integration, data, action):
        """Handle product webhook"""
        try:
            sync_service = ShopifySyncService(integration.tenant_id)
            if integration.sync_products:
                sync_service.sync_products(limit=1)  # Sync single product
        except Exception as e:
            logger.error(f"Product webhook error: {e}")
    
    def _handle_order_webhook(self, integration, data, action):
        """Handle order webhook"""
        try:
            sync_service = ShopifySyncService(integration.tenant_id)
            if integration.sync_orders:
                sync_service.sync_orders(limit=1)  # Sync single order
        except Exception as e:
            logger.error(f"Order webhook error: {e}")
    
    def _handle_customer_webhook(self, integration, data, action):
        """Handle customer webhook"""
        try:
            sync_service = ShopifySyncService(integration.tenant_id)
            if integration.sync_customers:
                sync_service.sync_customers(limit=1)  # Sync single customer
        except Exception as e:
            logger.error(f"Customer webhook error: {e}")
    
    def _handle_inventory_webhook(self, integration, data):
        """Handle inventory webhook"""
        try:
            sync_service = ShopifySyncService(integration.tenant_id)
            if integration.sync_inventory:
                sync_service.sync_inventory_levels()
        except Exception as e:
            logger.error(f"Inventory webhook error: {e}")


class ShopifySyncLogView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get sync logs for the tenant"""
        try:
            tenant = request.tenant
            logs = ShopifySyncLog.objects.filter(tenant_id=tenant.id).order_by('-started_at')[:50]
            
            return Response({
                'logs': [
                    {
                        'id': log.id,
                        'sync_type': log.sync_type,
                        'status': log.status,
                        'started_at': log.started_at,
                        'completed_at': log.completed_at,
                        'duration': log.duration.total_seconds() if log.duration else None,
                        'items_processed': log.items_processed,
                        'items_created': log.items_created,
                        'items_updated': log.items_updated,
                        'items_failed': log.items_failed,
                        'error_message': log.error_message
                    }
                    for log in logs
                ]
            })
            
        except Exception as e:
            logger.error(f"Sync logs error: {e}")
            return Response(
                {'error': f'Failed to fetch sync logs: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
