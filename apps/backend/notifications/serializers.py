from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    class Meta:
        model = Notification
        fields = ["id", "title", "message", "is_read", "timestamp"]
        read_only_fields = ["id", "timestamp"]

