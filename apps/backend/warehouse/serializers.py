from rest_framework import serializers
from .models import Warehouse, Transfer


class WarehouseSerializer(serializers.ModelSerializer):
    """Serializer for Warehouse model"""
    capacity_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Warehouse
        fields = [
            "id", "warehouse_code", "name", "location",
            "max_capacity", "current_utilization", "capacity_percentage",
            "active_clients", "total_skus", "status",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "warehouse_code", "capacity_percentage", "created_at", "updated_at"]
    
    def get_capacity_percentage(self, obj) -> int:
        """Calculate capacity utilization as percentage"""
        if obj.max_capacity == 0:
            return 0
        return int((obj.current_utilization / obj.max_capacity) * 100)


class TransferSerializer(serializers.ModelSerializer):
    """Serializer for Warehouse Transfer model"""
    from_warehouse_name = serializers.CharField(source='from_warehouse.name', read_only=True)
    from_warehouse_code = serializers.CharField(source='from_warehouse.warehouse_code', read_only=True)
    to_warehouse_name = serializers.CharField(source='to_warehouse.name', read_only=True)
    to_warehouse_code = serializers.CharField(source='to_warehouse.warehouse_code', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    
    class Meta:
        model = Transfer
        fields = [
            "id", "transfer_number",
            "from_warehouse", "from_warehouse_name", "from_warehouse_code",
            "to_warehouse", "to_warehouse_name", "to_warehouse_code",
            "product", "product_name", "product_code",
            "quantity", "status", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "transfer_number", "created_at", "updated_at"]


class TransferCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transfers"""
    class Meta:
        model = Transfer
        fields = ["from_warehouse", "to_warehouse", "product", "quantity", "status"]
    
    def validate(self, data):
        if data['from_warehouse'] == data['to_warehouse']:
            raise serializers.ValidationError("Source and destination warehouses must be different")
        return data
