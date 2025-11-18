"""
Dynamic Schema Loader
Loads model structure at runtime based on tenant's industry.
"""

from typing import Dict, Any, Optional, Type
from django.apps import apps
from django.core.exceptions import ValidationError
from rest_framework import serializers
from .industry_registry import industry_registry
import importlib
import re


class DynamicSchemaLoader:
    """
    Loads and manages industry-specific schemas dynamically.
    """
    
    _model_cache: Dict[str, Type] = {}
    _serializer_cache: Dict[str, Type] = {}
    
    @classmethod
    def get_model_class(cls, industry: str, model_name: str) -> Optional[Type]:
        """
        Dynamically load model class for an industry.
        """
        cache_key = f"{industry}:{model_name}"
        
        if cache_key in cls._model_cache:
            return cls._model_cache[cache_key]
        
        config = industry_registry.get_model_config(industry, model_name)
        if not config:
            return None
        
        model_path = config.get('model_class')
        if not model_path:
            return None
        
        try:
            # Parse model path: 'app.models.ModelName'
            parts = model_path.rsplit('.', 1)
            if len(parts) != 2:
                return None
            
            module_path, class_name = parts
            
            # Import module and get model class
            module = importlib.import_module(module_path)
            model_class = getattr(module, class_name)
            
            cls._model_cache[cache_key] = model_class
            return model_class
            
        except (ImportError, AttributeError) as e:
            print(f"Error loading model {model_path}: {e}")
            return None
    
    @classmethod
    def get_serializer_class(cls, industry: str, model_name: str) -> Optional[Type]:
        """
        Dynamically load serializer class for an industry.
        """
        cache_key = f"{industry}:{model_name}"
        
        if cache_key in cls._serializer_cache:
            return cls._serializer_cache[cache_key]
        
        serializer_path = industry_registry.get_serializer_class(industry, model_name)
        if not serializer_path:
            return None
        
        try:
            # Parse serializer path: 'app.serializers.SerializerName'
            parts = serializer_path.rsplit('.', 1)
            if len(parts) != 2:
                return None
            
            module_path, class_name = parts
            
            # Import module and get serializer class
            module = importlib.import_module(module_path)
            serializer_class = getattr(module, class_name)
            
            cls._serializer_cache[cache_key] = serializer_class
            return serializer_class
            
        except (ImportError, AttributeError) as e:
            print(f"Error loading serializer {serializer_path}: {e}")
            return None
    
    @classmethod
    def create_dynamic_serializer(cls, industry: str, model_name: str) -> Type[serializers.Serializer]:
        """
        Create a dynamic serializer that only includes industry-specific fields.
        """
        # Get base serializer
        base_serializer = cls.get_serializer_class(industry, model_name)
        if not base_serializer:
            return None
        
        # Get allowed fields for this industry
        allowed_fields = industry_registry.get_all_fields(industry, model_name)
        required_fields = industry_registry.get_required_fields(industry, model_name)
        
        # Create dynamic serializer class
        class DynamicSerializer(base_serializer):
            class Meta(base_serializer.Meta if hasattr(base_serializer, 'Meta') else object):
                model = base_serializer.Meta.model if hasattr(base_serializer, 'Meta') else None
                fields = allowed_fields if allowed_fields else '__all__'
                
            def validate(self, data):
                # Run base validation
                data = super().validate(data)
                
                # Apply industry-specific validation
                cls.apply_industry_validations(industry, model_name, data)
                
                return data
        
        return DynamicSerializer
    
    @classmethod
    def apply_industry_validations(cls, industry: str, model_name: str, data: Dict[str, Any]) -> None:
        """
        Apply industry-specific validation rules to data.
        """
        validations = industry_registry.get_validations(industry, model_name)
        
        for field_name, rules in validations.items():
            if field_name not in data:
                continue
            
            value = data[field_name]
            
            # Pattern validation
            if 'pattern' in rules and value:
                pattern = rules['pattern']
                if not re.match(pattern, str(value)):
                    raise ValidationError({
                        field_name: rules.get('error_message', f'Invalid format for {field_name}')
                    })
            
            # Min length validation
            if 'min_length' in rules and value:
                if len(str(value)) < rules['min_length']:
                    raise ValidationError({
                        field_name: f"{field_name} must be at least {rules['min_length']} characters"
                    })
            
            # Max length validation
            if 'max_length' in rules and value:
                if len(str(value)) > rules['max_length']:
                    raise ValidationError({
                        field_name: f"{field_name} must be at most {rules['max_length']} characters"
                    })
            
            # Min value validation
            if 'min_value' in rules and value is not None:
                if float(value) < rules['min_value']:
                    raise ValidationError({
                        field_name: f"{field_name} must be at least {rules['min_value']}"
                    })
            
            # Greater than validation
            if 'greater_than' in rules:
                compare_field = rules['greater_than']
                if compare_field in data and value is not None and data[compare_field] is not None:
                    if float(value) <= float(data[compare_field]):
                        raise ValidationError({
                            field_name: rules.get('error_message', f"{field_name} must be greater than {compare_field}")
                        })
    
    @classmethod
    def filter_response_fields(cls, industry: str, model_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Filter response data to only include industry-specific fields.
        """
        allowed_fields = industry_registry.get_all_fields(industry, model_name)
        
        if not allowed_fields:
            return data
        
        # Filter data to only include allowed fields
        filtered_data = {
            key: value for key, value in data.items()
            if key in allowed_fields or key in ['id', 'created_at', 'updated_at', 'tenant']
        }
        
        return filtered_data
    
    @classmethod
    def validate_required_fields(cls, industry: str, model_name: str, data: Dict[str, Any]) -> None:
        """
        Validate that all required fields are present.
        """
        required_fields = industry_registry.get_required_fields(industry, model_name)
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        
        if missing_fields:
            raise ValidationError({
                'required_fields': f"Missing required fields: {', '.join(missing_fields)}"
            })
    
    @classmethod
    def get_schema_for_industry(cls, industry: str, model_name: str) -> Dict[str, Any]:
        """
        Get complete schema definition for a model in an industry.
        """
        config = industry_registry.get_model_config(industry, model_name)
        if not config:
            return {}
        
        validations = industry_registry.get_validations(industry, model_name)
        
        schema = {
            'model_name': model_name,
            'industry': industry,
            'required_fields': config.get('required_fields', []),
            'optional_fields': config.get('optional_fields', []),
            'validations': validations,
            'api_endpoint': config.get('api_endpoint'),
            'related_models': config.get('related_models', []),
        }
        
        return schema
    
    @classmethod
    def get_all_schemas_for_industry(cls, industry: str) -> Dict[str, Any]:
        """
        Get all model schemas for an industry.
        """
        models = industry_registry.get_models_for_industry(industry)
        
        schemas = {}
        for model_name in models.keys():
            schemas[model_name] = cls.get_schema_for_industry(industry, model_name)
        
        return schemas


# Singleton instance
dynamic_schema_loader = DynamicSchemaLoader()

