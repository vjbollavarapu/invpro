import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        # Only authenticated users can connect
        if self.user.is_anonymous:
            await self.close()
            return
        
        # Get tenant from user
        self.tenant_id = getattr(self.user, 'tenant_id', None)
        if not self.tenant_id:
            await self.close()
            return
        
        # Join user-specific notification group
        self.notification_group_name = f"notifications_tenant_{self.tenant_id}_user_{self.user.id}"
        
        await self.channel_layer.group_add(
            self.notification_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'notification_group_name'):
            await self.channel_layer.group_discard(
                self.notification_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'mark_read':
                notification_id = data.get('notification_id')
                await self.mark_notification_read(notification_id)
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
        except json.JSONDecodeError:
            pass
    
    async def notification_message(self, event):
        """Handle notification broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))
    
    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark notification as read in database"""
        from notifications.models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user,
                tenant_id=self.tenant_id
            )
            notification.is_read = True
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False


class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if self.user.is_anonymous:
            await self.close()
            return
        
        self.tenant_id = getattr(self.user, 'tenant_id', None)
        if not self.tenant_id:
            await self.close()
            return
        
        # Join tenant-specific dashboard group
        self.dashboard_group_name = f"dashboard_tenant_{self.tenant_id}"
        
        await self.channel_layer.group_add(
            self.dashboard_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'dashboard_group_name'):
            await self.channel_layer.group_discard(
                self.dashboard_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_update':
                # Client requesting immediate update
                dashboard_data = await self.get_dashboard_data()
                await self.send(text_data=json.dumps({
                    'type': 'dashboard_update',
                    'data': dashboard_data
                }))
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
        except json.JSONDecodeError:
            pass
    
    async def dashboard_update(self, event):
        """Handle dashboard update broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data']
        }))
    
    async def stock_alert(self, event):
        """Handle stock alert broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'stock_alert',
            'product': event['product']
        }))
    
    @database_sync_to_async
    def get_dashboard_data(self):
        """Fetch current dashboard data"""
        # This would call your existing dashboard view logic
        from api.views import DashboardViewSet
        # Simplified - in real implementation, properly call the view
        return {
            'metrics': {
                'totalStockValue': 0,
                'activeWarehouses': 0,
                'pendingOrders': 0,
            }
        }


def send_notification_to_user(tenant_id, user_id, notification_data):
    """
    Helper function to send notification via WebSocket
    Call this from your views/signals when creating notifications
    """
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    group_name = f"notifications_tenant_{tenant_id}_user_{user_id}"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'notification_message',
            'notification': notification_data
        }
    )


def broadcast_dashboard_update(tenant_id, data):
    """
    Helper function to broadcast dashboard updates via WebSocket
    Call this when dashboard data changes
    """
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    group_name = f"dashboard_tenant_{tenant_id}"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'dashboard_update',
            'data': data
        }
    )


def broadcast_stock_alert(tenant_id, product_data):
    """
    Helper function to broadcast stock alerts via WebSocket
    """
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    group_name = f"dashboard_tenant_{tenant_id}"
    
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'stock_alert',
            'product': product_data
        }
    )

