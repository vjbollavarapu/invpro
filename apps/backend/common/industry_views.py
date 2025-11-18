"""
Industry-Aware API Views
Provides endpoints for managing industry-specific schemas and configurations.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .industry_registry import industry_registry
from .dynamic_schema_loader import dynamic_schema_loader


class IndustrySchemaView(APIView):
    """
    Get industry-specific schema information.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get industry schema",
        description="Returns the complete schema for the tenant's industry including available models, fields, and validations",
        parameters=[
            OpenApiParameter('model', description='Specific model name (optional)', required=False, type=str)
        ]
    )
    def get(self, request):
        """Get schema for tenant's industry"""
        # Get tenant's industry
        tenant = request.user.tenant
        industry = tenant.industry if tenant else 'general'
        
        # Get specific model or all models
        model_name = request.query_params.get('model')
        
        if model_name:
            # Get schema for specific model
            schema = dynamic_schema_loader.get_schema_for_industry(industry, model_name)
            if not schema:
                return Response({
                    'error': f"Model '{model_name}' not found for industry '{industry}'"
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'industry': industry,
                'schema': schema
            })
        else:
            # Get all schemas for industry
            schemas = dynamic_schema_loader.get_all_schemas_for_industry(industry)
            
            return Response({
                'industry': industry,
                'tenant': tenant.name,
                'available_models': list(schemas.keys()),
                'schemas': schemas
            })


class IndustryBusinessRulesView(APIView):
    """
    Get industry-specific business rules.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get industry business rules",
        description="Returns business rules and feature flags for the tenant's industry"
    )
    def get(self, request):
        """Get business rules for tenant's industry"""
        tenant = request.user.tenant
        industry = tenant.industry if tenant else 'general'
        
        business_rules = industry_registry.get_business_rules(industry)
        
        return Response({
            'industry': industry,
            'tenant': tenant.name,
            'business_rules': business_rules
        })


class AvailableIndustriesView(APIView):
    """
    Get list of all supported industries.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get available industries",
        description="Returns list of all supported industries with their configurations"
    )
    def get(self, request):
        """Get all available industries"""
        industries = industry_registry.get_available_industries()
        
        industry_details = []
        for industry in industries:
            models = industry_registry.get_models_for_industry(industry)
            business_rules = industry_registry.get_business_rules(industry)
            
            industry_details.append({
                'code': industry,
                'name': industry.title(),
                'available_models': list(models.keys()),
                'model_count': len(models),
                'business_rules': business_rules
            })
        
        return Response({
            'total_industries': len(industries),
            'industries': industry_details
        })


class IndustryModelDetailsView(APIView):
    """
    Get detailed information about a specific model in the tenant's industry.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get model details",
        description="Returns detailed field information, validations, and relationships for a specific model",
        parameters=[
            OpenApiParameter('model', description='Model name', required=True, type=str)
        ]
    )
    def get(self, request):
        """Get detailed model information"""
        tenant = request.user.tenant
        industry = tenant.industry if tenant else 'general'
        model_name = request.query_params.get('model')
        
        if not model_name:
            return Response({
                'error': 'model parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get model configuration
        config = industry_registry.get_model_config(industry, model_name)
        if not config:
            return Response({
                'error': f"Model '{model_name}' not found for industry '{industry}'"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get validations
        validations = industry_registry.get_validations(industry, model_name)
        
        # Get field information
        required_fields = industry_registry.get_required_fields(industry, model_name)
        optional_fields = industry_registry.get_optional_fields(industry, model_name)
        
        # Build detailed field info
        field_details = {}
        for field in required_fields:
            field_details[field] = {
                'required': True,
                'validations': validations.get(field, {})
            }
        for field in optional_fields:
            field_details[field] = {
                'required': False,
                'validations': validations.get(field, {})
            }
        
        return Response({
            'industry': industry,
            'model_name': model_name,
            'model_class': config.get('model_class'),
            'api_endpoint': config.get('api_endpoint'),
            'serializer': config.get('serializer'),
            'related_models': config.get('related_models', []),
            'field_count': len(field_details),
            'fields': field_details
        })


class TenantIndustryView(APIView):
    """
    Get or update tenant's industry.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Get tenant industry",
        description="Returns the current industry for the authenticated tenant"
    )
    def get(self, request):
        """Get current tenant industry"""
        tenant = request.user.tenant
        
        if not tenant:
            return Response({
                'error': 'No tenant associated with user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'tenant_id': tenant.id,
            'tenant_name': tenant.name,
            'industry': tenant.industry,
            'industry_display': tenant.get_industry_display()
        })
    
    @extend_schema(
        summary="Update tenant industry",
        description="Update the industry for the authenticated tenant",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'industry': {
                        'type': 'string',
                        'enum': ['pharmacy', 'retail', 'logistics', 'manufacturing', 'general']
                    }
                },
                'required': ['industry']
            }
        }
    )
    def patch(self, request):
        """Update tenant industry"""
        tenant = request.user.tenant
        
        if not tenant:
            return Response({
                'error': 'No tenant associated with user'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        new_industry = request.data.get('industry')
        
        if not new_industry:
            return Response({
                'error': 'industry field is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate industry
        if not industry_registry.validate_industry(new_industry):
            available = industry_registry.get_available_industries()
            return Response({
                'error': f"Invalid industry. Available industries: {', '.join(available)}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update tenant industry
        tenant.industry = new_industry
        tenant.save()
        
        return Response({
            'success': True,
            'tenant_id': tenant.id,
            'tenant_name': tenant.name,
            'industry': tenant.industry,
            'industry_display': tenant.get_industry_display(),
            'message': f'Industry updated to {tenant.get_industry_display()}'
        })

