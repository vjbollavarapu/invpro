"""Stripe integration views."""

from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.utils import timezone
import logging

from .models import StripeIntegration

logger = logging.getLogger(__name__)


class StripeConnectView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Connect to Stripe"""
        try:
            tenant = request.tenant
            payload = request.data
            
            # Validate required fields
            required_fields = ['publishable_key', 'secret_key']
            for field in required_fields:
                if not payload.get(field):
                    return Response(
                        {'error': f'Missing required field: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Test connection (basic validation)
            if not payload.get('secret_key', '').startswith('sk_'):
                return Response(
                    {'error': 'Invalid Stripe secret key format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not payload.get('publishable_key', '').startswith('pk_'):
                return Response(
                    {'error': 'Invalid Stripe publishable key format'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Determine test mode based on key prefix
            test_mode = payload.get('secret_key', '').startswith('sk_test_')
            
            # Create or update integration
            integration, created = StripeIntegration.objects.update_or_create(
                tenant_id=tenant.id,
                defaults={
                    'publishable_key': payload['publishable_key'],
                    'secret_key': payload['secret_key'],
                    'webhook_secret': payload.get('webhook_secret', ''),
                    'test_mode': test_mode,
                    'auto_capture': payload.get('auto_capture', True),
                    'enable_webhooks': payload.get('enable_webhooks', True),
                    'status': 'CONNECTED',
                    'last_test_at': timezone.now(),
                    'error_count': 0,
                    'last_error': ''
                }
            )
            
            return Response({
                'success': True,
                'integration': {
                    'id': integration.id,
                    'status': integration.status,
                    'test_mode': integration.test_mode,
                    'created_at': integration.created_at,
                },
                'message': 'Successfully connected to Stripe'
            })
            
        except Exception as e:
            logger.error(f"Stripe connection error: {e}")
            return Response(
                {'error': f'Connection failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Disconnect from Stripe"""
        try:
            tenant = request.tenant
            integration = StripeIntegration.objects.filter(tenant_id=tenant.id).first()
            
            if not integration:
                return Response(
                    {'error': 'No Stripe integration found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            integration.status = 'DISCONNECTED'
            integration.save()
            
            return Response({
                'success': True,
                'message': 'Successfully disconnected from Stripe'
            })
            
        except Exception as e:
            logger.error(f"Stripe disconnection error: {e}")
            return Response(
                {'error': f'Disconnection failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StripeStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get Stripe integration status"""
        try:
            tenant = request.tenant
            integration = StripeIntegration.objects.filter(tenant_id=tenant.id).first()
            
            if not integration:
                return Response({
                    'connected': False,
                    'message': 'No Stripe integration found'
                })
            
            return Response({
                'connected': integration.is_connected,
                'status': integration.status,
                'test_mode': integration.test_mode,
                'auto_capture': integration.auto_capture,
                'enable_webhooks': integration.enable_webhooks,
                'last_test_at': integration.last_test_at,
                'last_error': integration.last_error,
                'error_count': integration.error_count,
            })
            
        except Exception as e:
            logger.error(f"Stripe status error: {e}")
            return Response(
                {'error': f'Status check failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

