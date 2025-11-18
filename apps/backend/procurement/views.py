from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Supplier, PurchaseRequest, PurchaseOrder
from .serializers import (
    SupplierSerializer, PurchaseRequestSerializer,
    PurchaseOrderSerializer, PurchaseOrderCreateSerializer
)
from inventory.views import TenantScopedMixin
from tenants.permissions import TenantPermissionMixin


class SupplierViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Supplier management.
    """
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'supplier_code', 'contact_person', 'email']
    ordering = ['name']


class PurchaseRequestViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Purchase Request management.
    """
    queryset = PurchaseRequest.objects.select_related('item', 'requested_by').all()
    serializer_class = PurchaseRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'item']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        tenant = getattr(self.request, "tenant", None)
        serializer.save(tenant=tenant, requested_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a purchase request"""
        pr = self.get_object()
        pr.status = 'approved'
        pr.save()
        return Response(PurchaseRequestSerializer(pr).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a purchase request"""
        pr = self.get_object()
        pr.status = 'rejected'
        pr.save()
        return Response(PurchaseRequestSerializer(pr).data)


class PurchaseOrderViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Purchase Order management.
    """
    queryset = PurchaseOrder.objects.select_related('supplier').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'supplier']
    search_fields = ['po_number', 'supplier__name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer
