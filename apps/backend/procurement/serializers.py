from rest_framework import serializers
from .models import Supplier, PurchaseRequest, PurchaseOrder


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model"""
    total_orders = serializers.SerializerMethodField()
    active_orders = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = [
            "id", "supplier_code", "name", "contact_person", "email", "phone",
            "address", "rating", "total_orders", "active_orders",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "supplier_code", "total_orders", "active_orders", "created_at", "updated_at"]
    
    def get_total_orders(self, obj) -> int:
        """Count total purchase orders from this supplier"""
        return obj.purchase_orders.count()
    
    def get_active_orders(self, obj) -> int:
        """Count active (non-delivered) purchase orders"""
        return obj.purchase_orders.exclude(status='delivered').count()


class PurchaseRequestSerializer(serializers.ModelSerializer):
    """Serializer for Purchase Request model"""
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.product_code', read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseRequest
        fields = [
            "id", "request_number", "item", "item_name", "item_code",
            "quantity", "status", "requested_by", "requested_by_name",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "request_number", "requested_by_name", "created_at", "updated_at"]
    
    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return f"{obj.requested_by.first_name} {obj.requested_by.last_name}".strip() or obj.requested_by.username
        return None


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Serializer for Purchase Order model"""
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    supplier_code = serializers.CharField(source='supplier.supplier_code', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            "id", "po_number", "supplier", "supplier_name", "supplier_code",
            "total_amount", "expected_delivery_date", "status",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "po_number", "created_at", "updated_at"]


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating purchase orders"""
    class Meta:
        model = PurchaseOrder
        fields = ["supplier", "total_amount", "expected_delivery_date", "status"]
