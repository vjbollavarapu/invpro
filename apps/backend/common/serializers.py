from rest_framework import serializers
from .models import NumberSequence


class NumberSequenceSerializer(serializers.ModelSerializer):
    """Serializer for Number Sequence configuration"""
    
    class Meta:
        model = NumberSequence
        fields = [
            "id", "entity_type", "prefix", "include_year", "include_month",
            "separator", "padding", "current_sequence", "reset_on_year",
            "reset_on_month", "sample_format", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "current_sequence", "sample_format", "created_at", "updated_at"]

