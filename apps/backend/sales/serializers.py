from rest_framework import serializers
from .models import Customer, Order, OrderItem
from inventory.models import Product


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    total_orders = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = [
            "id", "customer_code", "name", "email", "phone", "address",
            "total_orders", "total_revenue", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "customer_code", "created_at", "updated_at"]
    
    def get_total_orders(self, obj):
        return obj.orders.count()
    
    def get_total_revenue(self, obj):
        from django.db.models import Sum
        result = obj.orders.aggregate(total=Sum('total_amount'))
        return result['total'] or 0


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for Order Items"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.product_code', read_only=True)
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "product_code", "quantity", "price", "total"]
        read_only_fields = ["id", "total"]
    
    def get_total(self, obj) -> float:
        """Calculate line item total"""
        return float(obj.quantity * obj.price)


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model"""
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            "id", "order_number", "customer", "customer_name", "customer_email",
            "channel", "total_amount", "status", "fulfilled_at",
            "items", "items_count", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "order_number", "items_count", "created_at", "updated_at"]
    
    def get_items_count(self, obj) -> int:
        """Get count of items in this order"""
        return obj.items.count()


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with items"""
    items = OrderItemSerializer(many=True, write_only=True)
    customer_name = serializers.CharField(write_only=True, required=False)
    customer_email = serializers.EmailField(write_only=True, required=False)
    
    class Meta:
        model = Order
        fields = ["customer", "customer_name", "customer_email", "channel", "items"]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        customer_name = validated_data.pop('customer_name', None)
        customer_email = validated_data.pop('customer_email', None)
        
        # Handle customer creation if needed
        if customer_name and not validated_data.get('customer'):
            tenant = self.context['request'].tenant
            customer = Customer.objects.create(
                tenant=tenant,
                name=customer_name,
                email=customer_email or ''
            )
            validated_data['customer'] = customer
        
        # Calculate total
        total = sum(item['quantity'] * item['price'] for item in items_data)
        validated_data['total_amount'] = total
        
        # Create order
        order = Order.objects.create(**validated_data)
        
        # Create order items
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                tenant=order.tenant,
                **item_data
            )
        
        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating order status"""
    class Meta:
        model = Order
        fields = ["status", "fulfilled_at"]
