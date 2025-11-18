from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, OpenApiParameter

from common.mixins import TenantScopedMixin
from .models import (
    DrugProduct, PackagingLevel, DrugBatch,
    DrugDispensing, DrugInventory
)
from .serializers import (
    DrugProductSerializer, PackagingLevelSerializer,
    DrugBatchSerializer, DrugDispensingSerializer,
    DrugInventorySerializer, PackagingLevelCreateSerializer,
    BatchReceiveSerializer
)


class DrugProductViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing pharmaceutical products with complete drug information
    """
    queryset = DrugProduct.objects.all()
    serializer_class = DrugProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'dosage_form', 'route_of_administration', 'therapeutic_class',
        'status', 'requires_prescription', 'is_controlled_substance'
    ]
    search_fields = [
        'generic_name', 'brand_name', 'barcode', 'gtin',
        'active_ingredients', 'therapeutic_class'
    ]
    ordering_fields = ['generic_name', 'brand_name', 'created_at']
    ordering = ['generic_name']
    
    @extend_schema(
        summary="Get drug products with low stock",
        description="Returns all drug products that are below their reorder level"
    )
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock across all packaging levels"""
        low_stock_inventory = DrugInventory.objects.filter(
            tenant=request.user.tenant,
            quantity_available__lte=F('reorder_level')
        ).select_related('drug_product', 'warehouse', 'packaging_level')
        
        # Group by drug product
        products_data = {}
        for inv in low_stock_inventory:
            if inv.drug_product.id not in products_data:
                products_data[inv.drug_product.id] = {
                    'product': DrugProductSerializer(inv.drug_product).data,
                    'low_stock_locations': []
                }
            
            products_data[inv.drug_product.id]['low_stock_locations'].append({
                'warehouse': inv.warehouse.name,
                'packaging_level': inv.packaging_level.level_name,
                'current_stock': float(inv.quantity_available),
                'reorder_level': float(inv.reorder_level)
            })
        
        return Response(list(products_data.values()))
    
    @extend_schema(
        summary="Get expiring batches",
        description="Returns drug products with batches expiring soon",
        parameters=[
            OpenApiParameter('days', description='Number of days to check (default: 90)', required=False, type=int)
        ]
    )
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get products with batches expiring soon"""
        days = int(request.query_params.get('days', 90))
        cutoff_date = timezone.now().date() + timedelta(days=days)
        
        expiring_batches = DrugBatch.objects.filter(
            tenant=request.user.tenant,
            status='approved',
            expiry_date__lte=cutoff_date,
            expiry_date__gte=timezone.now().date()
        ).select_related('drug_product', 'warehouse')
        
        # Group by product
        products_data = {}
        for batch in expiring_batches:
            if batch.drug_product.id not in products_data:
                products_data[batch.drug_product.id] = {
                    'product': DrugProductSerializer(batch.drug_product).data,
                    'expiring_batches': []
                }
            
            products_data[batch.drug_product.id]['expiring_batches'].append({
                'batch_number': batch.batch_number,
                'expiry_date': batch.expiry_date,
                'days_until_expiry': batch.days_until_expiry(),
                'quantity': float(batch.current_quantity),
                'warehouse': batch.warehouse.name
            })
        
        return Response(list(products_data.values()))
    
    @extend_schema(
        summary="Get product inventory across all locations",
        description="Returns detailed inventory status for a specific drug product"
    )
    @action(detail=True, methods=['get'])
    def inventory_status(self, request, pk=None):
        """Get detailed inventory status for a product"""
        product = self.get_object()
        
        # Get all inventory records for this product
        inventory = DrugInventory.objects.filter(
            drug_product=product
        ).select_related('warehouse', 'packaging_level')
        
        # Get all batches
        batches = DrugBatch.objects.filter(
            drug_product=product,
            status='approved'
        ).select_related('warehouse', 'packaging_level')
        
        return Response({
            'product': DrugProductSerializer(product).data,
            'inventory_by_location': DrugInventorySerializer(inventory, many=True).data,
            'batches': DrugBatchSerializer(batches, many=True).data
        })


class PackagingLevelViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing packaging hierarchy (tablet→strip→box→carton→pallet)
    """
    queryset = PackagingLevel.objects.all()
    serializer_class = PackagingLevelSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['drug_product', 'can_dispense', 'can_purchase']
    ordering_fields = ['level_order', 'level_name']
    ordering = ['drug_product', 'level_order']
    
    @extend_schema(
        summary="Create multiple packaging levels",
        description="Create complete packaging hierarchy for a product in one request",
        request=PackagingLevelCreateSerializer
    )
    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        """Create multiple packaging levels at once"""
        drug_product_id = request.data.get('drug_product')
        
        try:
            drug_product = DrugProduct.objects.get(
                id=drug_product_id,
                tenant=request.user.tenant
            )
        except DrugProduct.DoesNotExist:
            return Response(
                {'error': 'Drug product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = PackagingLevelCreateSerializer(
            data=request.data,
            context={'drug_product': drug_product}
        )
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        
        return Response(
            PackagingLevelSerializer(result['packaging_levels'], many=True).data,
            status=status.HTTP_201_CREATED
        )
    
    @extend_schema(
        summary="Convert between packaging levels",
        description="Convert quantity from one packaging level to another",
        parameters=[
            OpenApiParameter('from_level', description='Source packaging level ID', required=True, type=int),
            OpenApiParameter('to_level', description='Target packaging level ID', required=True, type=int),
            OpenApiParameter('quantity', description='Quantity to convert', required=True, type=float)
        ]
    )
    @action(detail=False, methods=['get'])
    def convert(self, request):
        """Convert quantity between packaging levels"""
        from_level_id = request.query_params.get('from_level')
        to_level_id = request.query_params.get('to_level')
        quantity = request.query_params.get('quantity')
        
        if not all([from_level_id, to_level_id, quantity]):
            return Response(
                {'error': 'Missing required parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from_level = PackagingLevel.objects.get(id=from_level_id, tenant=request.user.tenant)
            to_level = PackagingLevel.objects.get(id=to_level_id, tenant=request.user.tenant)
            quantity = float(quantity)
        except (PackagingLevel.DoesNotExist, ValueError):
            return Response(
                {'error': 'Invalid packaging level or quantity'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if from_level.drug_product != to_level.drug_product:
            return Response(
                {'error': 'Packaging levels belong to different products'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Convert to base units, then to target level
        from decimal import Decimal
        base_units = from_level.convert_to_base_units(Decimal(str(quantity)))
        converted_quantity = to_level.convert_from_base_units(base_units)
        
        return Response({
            'from_level': PackagingLevelSerializer(from_level).data,
            'to_level': PackagingLevelSerializer(to_level).data,
            'original_quantity': quantity,
            'converted_quantity': float(converted_quantity),
            'base_units': float(base_units)
        })


class DrugBatchViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing drug batches with expiry and traceability
    """
    queryset = DrugBatch.objects.all()
    serializer_class = DrugBatchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['drug_product', 'status', 'warehouse']
    search_fields = ['batch_number', 'lot_number']
    ordering_fields = ['expiry_date', 'manufacture_date', 'batch_number']
    ordering = ['expiry_date']
    
    @extend_schema(
        summary="Receive bulk inventory",
        description="Receive stock at bulk packaging level (e.g., cartons) and unpack into retail units",
        request=BatchReceiveSerializer
    )
    @action(detail=False, methods=['post'])
    def receive(self, request):
        """Receive new batch inventory"""
        serializer = BatchReceiveSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        batch = serializer.save()
        
        return Response(
            DrugBatchSerializer(batch).data,
            status=status.HTTP_201_CREATED
        )
    
    @extend_schema(
        summary="Approve batch for dispensing",
        description="Change batch status from quarantine to approved"
    )
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve batch after QC"""
        batch = self.get_object()
        
        if batch.status != 'quarantine':
            return Response(
                {'error': f'Batch is not in quarantine (current status: {batch.status})'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        batch.status = 'approved'
        batch.qc_notes = request.data.get('qc_notes', batch.qc_notes)
        batch.save()
        
        # Update inventory
        self._update_inventory_on_approval(batch)
        
        return Response(DrugBatchSerializer(batch).data)
    
    @extend_schema(
        summary="Reject batch",
        description="Reject batch and prevent dispensing"
    )
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject batch"""
        batch = self.get_object()
        
        batch.status = 'rejected'
        batch.qc_notes = request.data.get('qc_notes', batch.qc_notes)
        batch.save()
        
        return Response(DrugBatchSerializer(batch).data)
    
    @extend_schema(
        summary="Get expired batches",
        description="Returns all expired batches"
    )
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """Get all expired batches"""
        expired_batches = self.get_queryset().filter(
            expiry_date__lt=timezone.now().date()
        )
        
        serializer = self.get_serializer(expired_batches, many=True)
        return Response(serializer.data)
    
    def _update_inventory_on_approval(self, batch):
        """Update inventory when batch is approved"""
        inventory, created = DrugInventory.objects.get_or_create(
            tenant=batch.tenant,
            drug_product=batch.drug_product,
            warehouse=batch.warehouse,
            packaging_level=batch.packaging_level,
            defaults={'quantity_available': 0, 'quantity_quarantine': 0}
        )
        
        # Move from quarantine to available
        quantity_at_level = batch.packaging_level.convert_from_base_units(batch.current_quantity)
        inventory.quantity_quarantine = max(0, inventory.quantity_quarantine - quantity_at_level)
        inventory.quantity_available = inventory.quantity_available + quantity_at_level
        inventory.save()


class DrugDispensingViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for dispensing drugs at any packaging level with FEFO logic
    """
    queryset = DrugDispensing.objects.all()
    serializer_class = DrugDispensingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['drug_product', 'batch', 'customer', 'sales_order']
    search_fields = [
        'dispensing_number', 'patient_name', 'prescription_number',
        'prescriber_name'
    ]
    ordering_fields = ['dispensing_date', 'total_price']
    ordering = ['-dispensing_date']
    
    @extend_schema(
        summary="Get available batches for dispensing (FEFO)",
        description="Returns available batches ordered by expiry date (First-Expiry-First-Out)",
        parameters=[
            OpenApiParameter('drug_product', description='Drug product ID', required=True, type=int),
            OpenApiParameter('warehouse', description='Warehouse ID', required=False, type=int)
        ]
    )
    @action(detail=False, methods=['get'])
    def available_batches(self, request):
        """Get available batches for dispensing using FEFO logic"""
        drug_product_id = request.query_params.get('drug_product')
        warehouse_id = request.query_params.get('warehouse')
        
        if not drug_product_id:
            return Response(
                {'error': 'drug_product parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        filters = {
            'tenant': request.user.tenant,
            'drug_product_id': drug_product_id,
            'status': 'approved',
            'current_quantity__gt': 0,
            'expiry_date__gt': timezone.now().date()
        }
        
        if warehouse_id:
            filters['warehouse_id'] = warehouse_id
        
        batches = DrugBatch.objects.filter(**filters).order_by('expiry_date')
        
        return Response(DrugBatchSerializer(batches, many=True).data)
    
    @extend_schema(
        summary="Dispense with partial support",
        description="Dispense drugs at any packaging level with automatic batch deduction"
    )
    def create(self, request, *args, **kwargs):
        """Enhanced create with FEFO logic recommendation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if using FEFO-recommended batch
        batch = serializer.validated_data['batch']
        drug_product = serializer.validated_data['drug_product']
        
        # Get earliest expiring batch
        earliest_batch = DrugBatch.objects.filter(
            tenant=request.user.tenant,
            drug_product=drug_product,
            status='approved',
            current_quantity__gt=0,
            expiry_date__gt=timezone.now().date()
        ).order_by('expiry_date').first()
        
        if earliest_batch and earliest_batch.id != batch.id:
            # Warning: not using FEFO
            response_data = {
                'warning': f'Not using FEFO recommendation. Batch {earliest_batch.batch_number} expires sooner.',
                'recommended_batch': DrugBatchSerializer(earliest_batch).data
            }
        else:
            response_data = {}
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        response_data.update(serializer.data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


class DrugInventoryViewSet(TenantScopedMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing current inventory status (read-only, auto-updated)
    """
    queryset = DrugInventory.objects.all()
    serializer_class = DrugInventorySerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['drug_product', 'warehouse', 'packaging_level']
    ordering_fields = ['quantity_available', 'last_updated']
    ordering = ['drug_product']
    
    @extend_schema(
        summary="Get low stock inventory",
        description="Returns inventory items below reorder level"
    )
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get inventory items below reorder level"""
        low_stock = self.get_queryset().filter(
            quantity_available__lte=F('reorder_level')
        )
        
        serializer = self.get_serializer(low_stock, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Get inventory summary",
        description="Get aggregated inventory statistics"
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get inventory summary statistics"""
        queryset = self.get_queryset()
        
        summary = {
            'total_products': queryset.values('drug_product').distinct().count(),
            'total_warehouses': queryset.values('warehouse').distinct().count(),
            'low_stock_items': queryset.filter(quantity_available__lte=F('reorder_level')).count(),
            'out_of_stock_items': queryset.filter(quantity_available=0).count(),
            'total_value': 0,  # Would need to calculate based on packaging level costs
        }
        
        return Response(summary)

