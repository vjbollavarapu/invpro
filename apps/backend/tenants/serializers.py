from rest_framework import serializers
from .models import Tenant, Membership
from users.models import User


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model"""
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Tenant
        fields = ["id", "name", "code", "domain", "is_active", "created_at", "updated_at", "member_count"]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    def get_member_count(self, obj):
        return Membership.objects.filter(tenant=obj, is_active=True).count()


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer for Membership model"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = Membership
        fields = ["id", "user", "user_email", "user_name", "tenant", "tenant_name", 
                 "role", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class MembershipCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating membership (inviting user to tenant)"""
    email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Membership
        fields = ["email", "role"]
    
    def validate_email(self, value):
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")
        return value
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        user = User.objects.get(email=email)
        tenant = self.context['tenant']
        
        # Check if membership already exists
        existing = Membership.objects.filter(user=user, tenant=tenant).first()
        if existing:
            existing.role = validated_data['role']
            existing.is_active = True
            existing.save()
            return existing
        
        membership = Membership.objects.create(
            user=user,
            tenant=tenant,
            **validated_data
        )
        return membership

