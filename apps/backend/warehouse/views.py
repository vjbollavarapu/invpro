from rest_framework import viewsets, permissions
from .models import Warehouse, Transfer
from .serializers import WarehouseSerializer, TransferSerializer, TransferCreateSerializer
from inventory.views import TenantScopedMixin


class WarehouseViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Warehouse management.
    """
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status']
    search_fields = ['name', 'warehouse_code', 'location']
    ordering = ['name']


class TransferViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Warehouse Transfer management.
    """
    queryset = Transfer.objects.select_related(
        'from_warehouse', 'to_warehouse', 'product'
    ).all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'from_warehouse', 'to_warehouse']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TransferCreateSerializer
        return TransferSerializer
