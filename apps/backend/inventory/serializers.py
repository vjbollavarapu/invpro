from rest_framework import serializers
from .models import Product, StockMovement


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    total_value = serializers.SerializerMethodField()
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, allow_null=True)
    supplier_code = serializers.CharField(source='supplier.supplier_code', read_only=True, allow_null=True)
    
    class Meta:
        model = Product
        fields = [
            "id", "product_code", "sku", "name", "description", "category", "unit",
            "unit_cost", "selling_price", "quantity", "reorder_level", "status",
            "supplier", "supplier_name", "supplier_code",
            "total_value", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "product_code", "total_value", "created_at", "updated_at"]
    
    def get_total_value(self, obj) -> float:
        """Calculate total value of current stock"""
        return float(obj.quantity * obj.unit_cost)
    
    def to_representation(self, instance):
        """Customize output to match frontend expectations"""
        data = super().to_representation(instance)
        
        # Calculate stock status
        if instance.quantity == 0:
            data['stock_status'] = 'out-of-stock'
        elif instance.quantity <= instance.reorder_level:
            data['stock_status'] = 'low-stock'
        else:
            data['stock_status'] = 'in-stock'
        
        return data


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating products"""
    class Meta:
        model = Product
        fields = [
            "sku", "name", "description", "category", "unit",
            "unit_cost", "selling_price", "quantity", "reorder_level",
            "status", "supplier"
        ]
    
    def validate(self, data):
        # Ensure tenant cannot be modified
        if self.instance and hasattr(self.instance, 'tenant'):
            if 'tenant' in data:
                raise serializers.ValidationError("Cannot change tenant")
        return data


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for Stock Movement tracking"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    source_warehouse_name = serializers.CharField(source='source_warehouse.name', read_only=True, allow_null=True)
    destination_warehouse_name = serializers.CharField(source='destination_warehouse.name', read_only=True, allow_null=True)
    performed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = StockMovement
        fields = [
            "id", "product", "product_name", "product_code",
            "source_warehouse", "source_warehouse_name",
            "destination_warehouse", "destination_warehouse_name",
            "quantity", "movement_type", "reason",
            "performed_by", "performed_by_name", "timestamp"
        ]
        read_only_fields = ["id", "timestamp"]
    
    def get_performed_by_name(self, obj):
        if obj.performed_by:
            return f"{obj.performed_by.first_name} {obj.performed_by.last_name}".strip() or obj.performed_by.username
        return None


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustments from frontend"""
    product_id = serializers.IntegerField(required=True)
    adjustment_type = serializers.ChoiceField(choices=['add', 'remove', 'set'], required=True)
    quantity = serializers.IntegerField(required=True, min_value=0)
    warehouse_id = serializers.IntegerField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        if data['adjustment_type'] in ['add', 'remove'] and data['quantity'] == 0:
            raise serializers.ValidationError("Quantity must be greater than 0 for add/remove operations")
        return data
