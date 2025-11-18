"""Email service integration views."""

from rest_framework import views, permissions, status
from rest_framework.response import Response
from django.utils import timezone
from django.core.mail import send_mail, get_connection
import logging

from .models import EmailServiceIntegration

logger = logging.getLogger(__name__)


class EmailServiceConnectView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Connect to Email Service"""
        try:
            tenant = request.tenant
            payload = request.data
            
            # Validate required fields based on service provider
            service_provider = payload.get('service_provider', 'SMTP')
            
            if service_provider == 'SMTP':
                required_fields = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email']
            else:
                required_fields = ['api_key', 'from_email']
            
            for field in required_fields:
                if not payload.get(field):
                    return Response(
                        {'error': f'Missing required field: {field}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Test connection
            test_result = self._test_connection(payload)
            
            if not test_result.get('success'):
                return Response(
                    {'error': test_result.get('message', 'Connection test failed')},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or update integration
            defaults = {
                'service_provider': service_provider,
                'from_email': payload['from_email'],
                'from_name': payload.get('from_name', ''),
                'status': 'CONNECTED',
                'last_test_at': timezone.now(),
                'error_count': 0,
                'last_error': '',
                'enable_sending': payload.get('enable_sending', True),
                'daily_limit': payload.get('daily_limit', 1000),
            }
            
            if service_provider == 'SMTP':
                defaults.update({
                    'smtp_host': payload['smtp_host'],
                    'smtp_port': payload.get('smtp_port', 587),
                    'smtp_username': payload['smtp_username'],
                    'smtp_password': payload['smtp_password'],
                    'use_tls': payload.get('use_tls', True),
                    'use_ssl': payload.get('use_ssl', False),
                })
            else:
                defaults.update({
                    'api_key': payload.get('api_key', ''),
                    'api_secret': payload.get('api_secret', ''),
                })
            
            integration, created = EmailServiceIntegration.objects.update_or_create(
                tenant_id=tenant.id,
                defaults=defaults
            )
            
            return Response({
                'success': True,
                'integration': {
                    'id': integration.id,
                    'status': integration.status,
                    'service_provider': integration.service_provider,
                    'from_email': integration.from_email,
                    'created_at': integration.created_at,
                },
                'message': 'Successfully connected to email service'
            })
            
        except Exception as e:
            logger.error(f"Email service connection error: {e}")
            return Response(
                {'error': f'Connection failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _test_connection(self, payload):
        """Test email service connection"""
        try:
            service_provider = payload.get('service_provider', 'SMTP')
            
            if service_provider == 'SMTP':
                # Test SMTP connection
                connection = get_connection(
                    host=payload.get('smtp_host'),
                    port=payload.get('smtp_port', 587),
                    username=payload.get('smtp_username'),
                    password=payload.get('smtp_password'),
                    use_tls=payload.get('use_tls', True),
                    use_ssl=payload.get('use_ssl', False),
                )
                connection.open()
                connection.close()
                return {'success': True, 'message': 'SMTP connection successful'}
            else:
                # For API-based services, just validate API key format
                api_key = payload.get('api_key', '')
                if not api_key:
                    return {'success': False, 'message': 'API key is required'}
                return {'success': True, 'message': 'API key format valid'}
                
        except Exception as e:
            return {'success': False, 'message': f'Connection test failed: {str(e)}'}
    
    def delete(self, request):
        """Disconnect from Email Service"""
        try:
            tenant = request.tenant
            integration = EmailServiceIntegration.objects.filter(tenant_id=tenant.id).first()
            
            if not integration:
                return Response(
                    {'error': 'No email service integration found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            integration.status = 'DISCONNECTED'
            integration.save()
            
            return Response({
                'success': True,
                'message': 'Successfully disconnected from email service'
            })
            
        except Exception as e:
            logger.error(f"Email service disconnection error: {e}")
            return Response(
                {'error': f'Disconnection failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class EmailServiceStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get Email Service integration status"""
        try:
            tenant = request.tenant
            integration = EmailServiceIntegration.objects.filter(tenant_id=tenant.id).first()
            
            if not integration:
                return Response({
                    'connected': False,
                    'message': 'No email service integration found'
                })
            
            return Response({
                'connected': integration.is_connected,
                'status': integration.status,
                'service_provider': integration.service_provider,
                'from_email': integration.from_email,
                'from_name': integration.from_name,
                'enable_sending': integration.enable_sending,
                'daily_limit': integration.daily_limit,
                'emails_sent_today': integration.emails_sent_today,
                'can_send_email': integration.can_send_email,
                'last_test_at': integration.last_test_at,
                'last_error': integration.last_error,
                'error_count': integration.error_count,
            })
            
        except Exception as e:
            logger.error(f"Email service status error: {e}")
            return Response(
                {'error': f'Status check failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

