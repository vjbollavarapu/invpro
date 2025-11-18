from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import Product, StockMovement
from .serializers import (
    ProductSerializer, ProductCreateUpdateSerializer,
    StockMovementSerializer, StockAdjustmentSerializer
)
from tenants.permissions import TenantPermissionMixin


class TenantScopedMixin:
    """
    Mixin to automatically filter querysets by tenant and set tenant on create.
    All ViewSets should inherit from this.
    """
    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return qs.none()  # Return empty queryset if no tenant
        return qs.filter(tenant_id=tenant.id)
    
    def perform_create(self, serializer):
        tenant = getattr(self.request, "tenant", None)
        if not tenant:
            return Response(
                {"error": "No tenant specified"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save(tenant_id=tenant.id)


class ProductViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Product management.
    
    list: Get all products
    retrieve: Get single product
    create: Create new product
    update: Update product
    partial_update: Partially update product
    destroy: Delete product
    adjust_stock: Custom action to adjust stock levels
    """
    queryset = Product.objects.select_related('supplier').all()
    permission_classes = [permissions.IsAuthenticated]  # Simple authentication requirement
    filterset_fields = ['category', 'status', 'supplier']
    search_fields = ['name', 'sku', 'product_code', 'description']
    ordering_fields = ['name', 'quantity', 'unit_cost', 'created_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer
    
    def get_queryset(self):
        """
        Override to add custom stock status filtering
        """
        queryset = super().get_queryset()
        stock_status = self.request.query_params.get('stock_status')
        
        if stock_status == 'low':
            # Products with quantity > 0 and quantity <= reorder_level
            queryset = queryset.filter(quantity__gt=0, quantity__lte=models.F('reorder_level'))
        elif stock_status == 'out':
            # Products with quantity = 0
            queryset = queryset.filter(quantity=0)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """
        Adjust stock level for a product.
        
        Body:
        {
            "adjustment_type": "add|remove|set",
            "quantity": 100,
            "warehouse_id": 1,  # optional
            "reason": "Received shipment"
        }
        """
        product = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            data = serializer.validated_data
            adjustment_type = data['adjustment_type']
            quantity_change = data['quantity']
            
            # Adjust quantity based on type
            if adjustment_type == 'add':
                product.quantity += quantity_change
                movement_type = 'in'
            elif adjustment_type == 'remove':
                product.quantity -= quantity_change
                if product.quantity < 0:
                    return Response(
                        {"error": "Insufficient stock"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                movement_type = 'out'
            else:  # set
                product.quantity = quantity_change
                movement_type = 'in' if quantity_change > product.quantity else 'out'
            
            product.save()
            
            # Create stock movement record
            StockMovement.objects.create(
                tenant_id=request.tenant.id,
                product=product,
                quantity=quantity_change,
                movement_type=movement_type,
                reason=data.get('reason', ''),
                performed_by=request.user,
                destination_warehouse_id=data.get('warehouse_id')
            )
            
            return Response(ProductSerializer(product).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockMovementViewSet(TenantScopedMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Stock Movement history (read-only).
    
    list: Get all stock movements
    retrieve: Get single stock movement
    """
    queryset = StockMovement.objects.select_related(
        'product', 'source_warehouse', 'destination_warehouse', 'performed_by'
    ).all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['product', 'movement_type', 'source_warehouse', 'destination_warehouse']
    ordering = ['-timestamp']
