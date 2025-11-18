"""
Industry-Aware Middleware
Adapts API behavior based on tenant's industry at runtime.
"""

from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework.exceptions import ValidationError as DRFValidationError
from .industry_registry import industry_registry
from .dynamic_schema_loader import dynamic_schema_loader
import json


class IndustryAwareMiddleware:
    """
    Middleware that validates requests and filters responses based on tenant's industry.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add industry context to request
        if hasattr(request, 'user') and hasattr(request.user, 'tenant'):
            tenant = request.user.tenant
            request.industry = tenant.industry if tenant else 'general'
        else:
            request.industry = 'general'
        
        # Process request
        response = self.get_response(request)
        
        return response
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Process view before it's executed.
        Validate incoming data against industry schema.
        """
        # Skip for non-API requests
        if not request.path.startswith('/api/'):
            return None
        
        # Skip for GET, DELETE requests (no body validation needed)
        if request.method in ['GET', 'DELETE', 'HEAD', 'OPTIONS']:
            return None
        
        # Skip if user not authenticated
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Get tenant industry
        industry = getattr(request, 'industry', 'general')
        
        # Try to determine model name from URL
        model_name = self._extract_model_name_from_url(request.path)
        if not model_name:
            return None
        
        # Validate request data against industry schema
        try:
            if request.content_type == 'application/json' and request.body:
                data = json.loads(request.body)
                self._validate_request_data(industry, model_name, data)
        except (json.JSONDecodeError, ValidationError, DRFValidationError) as e:
            return JsonResponse({
                'error': 'Validation failed',
                'details': str(e),
                'industry': industry,
                'model': model_name
            }, status=400)
        
        return None
    
    def _extract_model_name_from_url(self, path: str) -> str:
        """
        Extract model name from URL path.
        Maps URL segments to model names.
        """
        # Map URL patterns to model names
        url_model_map = {
            '/api/pharma/products/': 'DrugProduct',
            '/api/pharma/packaging-levels/': 'PackagingLevel',
            '/api/pharma/batches/': 'DrugBatch',
            '/api/pharma/dispensing/': 'DrugDispensing',
            '/api/inventory/products/': 'Product',
            '/api/sales/customers/': 'Customer',
            '/api/sales/orders/': 'Order',
            '/api/warehouse/warehouses/': 'Warehouse',
            '/api/warehouse/transfers/': 'Transfer',
            '/api/procurement/suppliers/': 'Supplier',
            '/api/procurement/purchase_orders/': 'PurchaseOrder',
        }
        
        # Find matching pattern
        for url_pattern, model_name in url_model_map.items():
            if url_pattern in path:
                return model_name
        
        return None
    
    def _validate_request_data(self, industry: str, model_name: str, data: dict) -> None:
        """
        Validate request data against industry-specific schema.
        """
        # Check if model is allowed for this industry
        config = industry_registry.get_model_config(industry, model_name)
        if not config:
            raise ValidationError(f"Model '{model_name}' is not available for industry '{industry}'")
        
        # Validate required fields
        dynamic_schema_loader.validate_required_fields(industry, model_name, data)
        
        # Validate field values
        dynamic_schema_loader.apply_industry_validations(industry, model_name, data)
        
        # Check for disallowed fields
        allowed_fields = industry_registry.get_all_fields(industry, model_name)
        if allowed_fields:
            disallowed_fields = [
                field for field in data.keys()
                if field not in allowed_fields and field not in ['id', 'tenant', 'created_at', 'updated_at']
            ]
            
            if disallowed_fields:
                raise ValidationError({
                    'disallowed_fields': f"Fields not allowed for {industry} industry: {', '.join(disallowed_fields)}"
                })


class IndustryResponseFilterMiddleware:
    """
    Middleware that filters API responses based on tenant's industry.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Only process JSON API responses
        if not request.path.startswith('/api/'):
            return response
        
        if response.get('Content-Type', '').startswith('application/json'):
            # Get tenant industry
            industry = getattr(request, 'industry', 'general')
            
            # Extract model name from URL
            model_name = self._extract_model_name_from_url(request.path)
            
            if model_name:
                # Filter response data
                try:
                    response_data = json.loads(response.content)
                    filtered_data = self._filter_response(industry, model_name, response_data)
                    response.content = json.dumps(filtered_data)
                    response['Content-Length'] = len(response.content)
                except (json.JSONDecodeError, Exception) as e:
                    # If filtering fails, return original response
                    pass
        
        return response
    
    def _extract_model_name_from_url(self, path: str) -> str:
        """Extract model name from URL (same as in IndustryAwareMiddleware)"""
        url_model_map = {
            '/api/pharma/products/': 'DrugProduct',
            '/api/pharma/packaging-levels/': 'PackagingLevel',
            '/api/pharma/batches/': 'DrugBatch',
            '/api/pharma/dispensing/': 'DrugDispensing',
            '/api/inventory/products/': 'Product',
            '/api/sales/customers/': 'Customer',
            '/api/sales/orders/': 'Order',
            '/api/warehouse/warehouses/': 'Warehouse',
            '/api/warehouse/transfers/': 'Transfer',
            '/api/procurement/suppliers/': 'Supplier',
            '/api/procurement/purchase_orders/': 'PurchaseOrder',
        }
        
        for url_pattern, model_name in url_model_map.items():
            if url_pattern in path:
                return model_name
        
        return None
    
    def _filter_response(self, industry: str, model_name: str, data: any) -> any:
        """
        Filter response data to only include industry-appropriate fields.
        """
        if isinstance(data, dict):
            # Handle single object
            if 'results' in data:
                # Paginated response
                data['results'] = [
                    dynamic_schema_loader.filter_response_fields(industry, model_name, item)
                    for item in data['results']
                ]
            else:
                # Single object response
                data = dynamic_schema_loader.filter_response_fields(industry, model_name, data)
        elif isinstance(data, list):
            # Handle list of objects
            data = [
                dynamic_schema_loader.filter_response_fields(industry, model_name, item)
                for item in data
            ]
        
        return data

