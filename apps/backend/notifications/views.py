from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer
from inventory.views import TenantScopedMixin


class NotificationViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Notification management.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """Return only notifications for the current user and tenant"""
        qs = super().get_queryset()
        return qs.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set tenant and user on create"""
        tenant = getattr(self.request, "tenant", None)
        serializer.save(tenant=tenant, user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"message": f"{updated} notifications marked as read"})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark single notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)
