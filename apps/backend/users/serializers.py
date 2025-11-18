from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User
from tenants.models import Membership, Tenant


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    tenants = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "tenants"]
        read_only_fields = ["id"]
    
    def get_tenants(self, obj):
        """Get list of tenants user belongs to"""
        memberships = Membership.objects.filter(user=obj, is_active=True).select_related('tenant')
        return [{
            'tenant_id': m.tenant.id,
            'tenant_name': m.tenant.name,
            'tenant_code': m.tenant.code,
            'role': m.role,
        } for m in memberships]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm Password")
    
    class Meta:
        model = User
        fields = ["username", "email", "password", "password2", "first_name", "last_name"]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user info"""
    class Meta:
        model = User
        fields = ["email", "first_name", "last_name"]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True, label="Confirm New Password")
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs
