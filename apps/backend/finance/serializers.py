from rest_framework import serializers
from .models import CostCenter, Expense


class CostCenterSerializer(serializers.ModelSerializer):
    """Serializer for Cost Center model"""
    variance = serializers.SerializerMethodField()
    variance_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = CostCenter
        fields = [
            "id", "name", "budget", "actual_cost", "variance", "variance_percentage",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "variance", "variance_percentage", "created_at", "updated_at"]
    
    def get_variance(self, obj) -> float:
        """Calculate budget variance (positive = over budget, negative = under budget)"""
        return float(obj.actual_cost - obj.budget)
    
    def get_variance_percentage(self, obj) -> float:
        """Calculate variance as percentage"""
        if obj.budget == 0:
            return 0.0
        return float(((obj.actual_cost - obj.budget) / obj.budget) * 100)


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model"""
    linked_to = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = [
            "id", "date", "description", "category", "amount",
            "linked_order", "linked_po", "linked_to",
            "created_at", "updated_at"
        ]
        read_only_fields = ["id", "linked_to", "created_at", "updated_at"]
    
    def get_linked_to(self, obj) -> str:
        """Return order or PO number for display"""
        if obj.linked_order:
            return obj.linked_order.order_number
        elif obj.linked_po:
            return obj.linked_po.po_number
        return ""


class ExpenseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating expenses"""
    class Meta:
        model = Expense
        fields = ["date", "description", "category", "amount", "linked_order", "linked_po"]
