from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Customer, Order, OrderItem
from .serializers import (
    CustomerSerializer, OrderSerializer,
    OrderCreateSerializer, OrderUpdateSerializer
)
from inventory.views import TenantScopedMixin
from tenants.permissions import TenantPermissionMixin


class CustomerViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Customer management.
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['name']
    search_fields = ['name', 'email', 'customer_code']
    ordering = ['-created_at']


class OrderViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Order management.
    """
    queryset = Order.objects.select_related('customer').prefetch_related('items__product').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'channel', 'customer']
    search_fields = ['order_number', 'customer__name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrderUpdateSerializer
        return OrderSerializer
    
    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        """Mark order as fulfilled"""
        order = self.get_object()
        from django.utils import timezone
        order.status = 'delivered'
        order.fulfilled_at = timezone.now()
        order.save()
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        if order.status in ['delivered', 'shipped']:
            return Response(
                {"error": "Cannot cancel delivered or shipped orders"},
                status=status.HTTP_400_BAD_REQUEST
            )
        order.status = 'cancelled'
        order.save()
        return Response(OrderSerializer(order).data)
