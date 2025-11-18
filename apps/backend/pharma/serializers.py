from rest_framework import serializers
from .models import (
    DrugProduct, PackagingLevel, DrugBatch, 
    DrugDispensing, DrugInventory
)
from decimal import Decimal


class PackagingLevelSerializer(serializers.ModelSerializer):
    converted_base_units = serializers.SerializerMethodField()
    cost_per_base_unit = serializers.SerializerMethodField()
    
    class Meta:
        model = PackagingLevel
        fields = [
            'id', 'level_name', 'level_order', 'base_unit_quantity',
            'unit_of_measure', 'packaging_description', 'barcode', 'gtin',
            'cost_price', 'selling_price', 'can_dispense', 'can_purchase',
            'length', 'width', 'height', 'weight',
            'converted_base_units', 'cost_per_base_unit'
        ]
    
    def get_converted_base_units(self, obj) -> float:
        """Example conversion for 1 unit at this level"""
        return float(obj.convert_to_base_units(Decimal('1')))
    
    def get_cost_per_base_unit(self, obj) -> float:
        """Calculate cost per base unit"""
        if obj.base_unit_quantity > 0:
            return float(obj.cost_price / obj.base_unit_quantity)
        return 0.0


class DrugProductSerializer(serializers.ModelSerializer):
    packaging_levels = PackagingLevelSerializer(many=True, read_only=True)
    total_stock_base_units = serializers.SerializerMethodField()
    expiry_alerts = serializers.SerializerMethodField()
    
    class Meta:
        model = DrugProduct
        fields = [
            'id', 'product_code', 'generic_name', 'brand_name',
            'dosage_form', 'strength', 'route_of_administration',
            'therapeutic_class', 'pharmacological_class',
            'marketing_authorization_number', 'gtin', 'barcode', 'ndc_code',
            'storage_conditions', 'storage_instructions',
            'requires_cold_chain', 'requires_prescription',
            'is_controlled_substance', 'controlled_substance_schedule',
            'manufacturer', 'importer', 'active_ingredients',
            'description', 'warnings', 'status',
            'supplier', 'packaging_levels',
            'total_stock_base_units', 'expiry_alerts',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['product_code', 'created_at', 'updated_at']
    
    def get_total_stock_base_units(self, obj) -> float:
        """Get total stock across all batches"""
        total = sum(batch.current_quantity for batch in obj.batches.filter(status='approved'))
        return float(total)
    
    def get_expiry_alerts(self, obj) -> dict:
        """Get count of batches expiring soon"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now().date()
        thirty_days = now + timedelta(days=30)
        ninety_days = now + timedelta(days=90)
        
        batches = obj.batches.filter(status='approved')
        
        return {
            'expired': batches.filter(expiry_date__lt=now).count(),
            'expiring_30_days': batches.filter(expiry_date__gte=now, expiry_date__lte=thirty_days).count(),
            'expiring_90_days': batches.filter(expiry_date__gte=now, expiry_date__lte=ninety_days).count(),
        }


class DrugBatchSerializer(serializers.ModelSerializer):
    drug_product_name = serializers.CharField(source='drug_product.generic_name', read_only=True)
    packaging_level_name = serializers.CharField(source='packaging_level.level_name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)
    quantity_dispensed = serializers.SerializerMethodField()
    
    class Meta:
        model = DrugBatch
        fields = [
            'id', 'drug_product', 'drug_product_name',
            'batch_number', 'lot_number',
            'manufacture_date', 'expiry_date',
            'initial_quantity', 'current_quantity', 'quantity_dispensed',
            'packaging_level', 'packaging_level_name',
            'status', 'certificate_of_analysis', 'qc_notes',
            'warehouse', 'warehouse_name', 'storage_location',
            'serial_numbers', 'supplier', 'purchase_order_number',
            'unit_cost', 'is_expired', 'days_until_expiry',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_expired', 'days_until_expiry']
    
    def get_quantity_dispensed(self, obj) -> float:
        """Calculate total quantity dispensed from this batch"""
        dispensed = obj.initial_quantity - obj.current_quantity
        return float(dispensed)


class DrugDispensingSerializer(serializers.ModelSerializer):
    drug_product_name = serializers.CharField(source='drug_product.generic_name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    packaging_level_name = serializers.CharField(source='packaging_level.level_name', read_only=True)
    dispensed_by_name = serializers.CharField(source='dispensed_by.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = DrugDispensing
        fields = [
            'id', 'drug_product', 'drug_product_name',
            'batch', 'batch_number',
            'packaging_level', 'packaging_level_name',
            'dispensing_number', 'quantity_dispensed', 'quantity_in_base_units',
            'sales_order', 'customer', 'customer_name',
            'patient_name', 'prescription_number',
            'prescriber_name', 'prescriber_license',
            'dispensed_by', 'dispensed_by_name', 'dispensing_date',
            'unit_price', 'total_price', 'dispensing_notes',
            'created_at'
        ]
        read_only_fields = [
            'dispensing_number', 'quantity_in_base_units', 'total_price',
            'dispensing_date', 'created_at'
        ]
    
    def validate(self, data):
        """Validate dispensing quantity against batch availability"""
        batch = data.get('batch')
        packaging_level = data.get('packaging_level')
        quantity_dispensed = data.get('quantity_dispensed')
        
        if batch and packaging_level and quantity_dispensed:
            quantity_in_base_units = packaging_level.convert_to_base_units(quantity_dispensed)
            
            if quantity_in_base_units > batch.current_quantity:
                raise serializers.ValidationError(
                    f"Insufficient stock. Available: {batch.current_quantity} base units, "
                    f"Requested: {quantity_in_base_units} base units"
                )
            
            if batch.status != 'approved':
                raise serializers.ValidationError(
                    f"Batch {batch.batch_number} is not approved for dispensing (Status: {batch.status})"
                )
            
            if batch.is_expired():
                raise serializers.ValidationError(
                    f"Batch {batch.batch_number} has expired on {batch.expiry_date}"
                )
        
        return data
    
    def create(self, validated_data):
        """Create dispensing and update batch quantity"""
        instance = super().create(validated_data)
        
        # Deduct from batch
        batch = instance.batch
        batch.current_quantity -= instance.quantity_in_base_units
        batch.save()
        
        # Update inventory
        self._update_inventory(instance, operation='dispense')
        
        return instance
    
    def _update_inventory(self, dispensing, operation='dispense'):
        """Update inventory status after dispensing"""
        from django.db.models import F
        
        inventory, created = DrugInventory.objects.get_or_create(
            tenant=dispensing.tenant,
            drug_product=dispensing.drug_product,
            warehouse=dispensing.batch.warehouse,
            packaging_level=dispensing.packaging_level
        )
        
        if operation == 'dispense':
            # Convert to packaging level units
            quantity_at_level = dispensing.packaging_level.convert_from_base_units(
                dispensing.quantity_in_base_units
            )
            inventory.quantity_available = F('quantity_available') - quantity_at_level
            inventory.save()


class DrugInventorySerializer(serializers.ModelSerializer):
    drug_product_name = serializers.CharField(source='drug_product.generic_name', read_only=True)
    drug_product_strength = serializers.CharField(source='drug_product.strength', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    packaging_level_name = serializers.CharField(source='packaging_level.level_name', read_only=True)
    total_quantity = serializers.DecimalField(max_digits=12, decimal_places=3, read_only=True)
    is_below_reorder_level = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DrugInventory
        fields = [
            'id', 'drug_product', 'drug_product_name', 'drug_product_strength',
            'warehouse', 'warehouse_name',
            'packaging_level', 'packaging_level_name',
            'quantity_available', 'quantity_reserved', 'quantity_quarantine',
            'total_quantity', 'reorder_level', 'reorder_quantity',
            'is_below_reorder_level', 'last_updated'
        ]


# Bulk Operations Serializers

class PackagingLevelCreateSerializer(serializers.Serializer):
    """Serializer for creating multiple packaging levels at once"""
    packaging_levels = PackagingLevelSerializer(many=True)
    
    def create(self, validated_data):
        drug_product = self.context['drug_product']
        packaging_levels_data = validated_data['packaging_levels']
        
        packaging_levels = []
        for level_data in packaging_levels_data:
            level = PackagingLevel.objects.create(
                drug_product=drug_product,
                tenant=drug_product.tenant,
                **level_data
            )
            packaging_levels.append(level)
        
        return {'packaging_levels': packaging_levels}


class BatchReceiveSerializer(serializers.Serializer):
    """Serializer for receiving bulk inventory (unpacking cartons into units)"""
    drug_product = serializers.PrimaryKeyRelatedField(queryset=DrugProduct.objects.all())
    batch_number = serializers.CharField(max_length=100)
    lot_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    manufacture_date = serializers.DateField()
    expiry_date = serializers.DateField()
    
    # Receiving at specific packaging level (e.g., Cartons)
    packaging_level = serializers.PrimaryKeyRelatedField(queryset=PackagingLevel.objects.all())
    quantity_received = serializers.DecimalField(max_digits=12, decimal_places=3)
    
    warehouse = serializers.IntegerField(required=True)
    storage_location = serializers.CharField(max_length=100, required=False, allow_blank=True)
    
    supplier = serializers.IntegerField(required=False, allow_null=True)
    purchase_order_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    def validate(self, data):
        """Validate batch receive data"""
        if data['expiry_date'] <= data['manufacture_date']:
            raise serializers.ValidationError("Expiry date must be after manufacture date")
        
        # Check packaging level belongs to drug product
        if data['packaging_level'].drug_product != data['drug_product']:
            raise serializers.ValidationError("Packaging level does not belong to the specified drug product")
        
        return data
    
    def create(self, validated_data):
        """Create batch and update inventory"""
        from warehouse.models import Warehouse
        from procurement.models import Supplier
        
        packaging_level = validated_data['packaging_level']
        quantity_received = validated_data['quantity_received']
        
        # Convert to base units
        quantity_in_base_units = packaging_level.convert_to_base_units(quantity_received)
        
        # Get warehouse and supplier instances
        warehouse_id = validated_data['warehouse']
        supplier_id = validated_data.get('supplier')
        
        warehouse = Warehouse.objects.get(id=warehouse_id)
        supplier = Supplier.objects.get(id=supplier_id) if supplier_id else None
        
        # Create batch
        batch = DrugBatch.objects.create(
            tenant=validated_data['drug_product'].tenant,
            drug_product=validated_data['drug_product'],
            batch_number=validated_data['batch_number'],
            lot_number=validated_data.get('lot_number', ''),
            manufacture_date=validated_data['manufacture_date'],
            expiry_date=validated_data['expiry_date'],
            initial_quantity=quantity_in_base_units,
            current_quantity=quantity_in_base_units,
            packaging_level=packaging_level,
            status='quarantine',  # Default to quarantine
            warehouse=warehouse,
            storage_location=validated_data.get('storage_location', ''),
            supplier=supplier,
            purchase_order_number=validated_data.get('purchase_order_number', ''),
            unit_cost=validated_data.get('unit_cost', 0)
        )
        
        return batch

