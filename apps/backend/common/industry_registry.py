"""
Industry-Aware Model Registry
Maps each industry to its relevant models, fields, and validation rules.
"""

from typing import Dict, List, Any, Optional
from django.core.exceptions import ValidationError


class IndustryRegistry:
    """
    Central registry for industry-specific model configurations.
    Enables dynamic schema loading based on tenant industry.
    """
    
    # Industry-specific model configurations
    INDUSTRY_MODELS = {
        'pharmacy': {
            'DrugProduct': {
                'model_class': 'pharma.models.DrugProduct',
                'required_fields': [
                    'generic_name', 'dosage_form', 'strength',
                    'route_of_administration', 'therapeutic_class'
                ],
                'optional_fields': [
                    'brand_name', 'pharmacological_class',
                    'marketing_authorization_number', 'gtin', 'barcode',
                    'ndc_code', 'storage_conditions', 'requires_prescription',
                    'is_controlled_substance', 'manufacturer', 'active_ingredients'
                ],
                'related_models': ['PackagingLevel', 'DrugBatch', 'DrugDispensing'],
                'api_endpoint': '/api/pharma/products/',
                'serializer': 'pharma.serializers.DrugProductSerializer',
            },
            'PackagingLevel': {
                'model_class': 'pharma.models.PackagingLevel',
                'required_fields': [
                    'level_name', 'level_order', 'base_unit_quantity', 'unit_of_measure'
                ],
                'optional_fields': [
                    'barcode', 'gtin', 'cost_price', 'selling_price',
                    'can_dispense', 'can_purchase'
                ],
                'api_endpoint': '/api/pharma/packaging-levels/',
                'serializer': 'pharma.serializers.PackagingLevelSerializer',
            },
            'DrugBatch': {
                'model_class': 'pharma.models.DrugBatch',
                'required_fields': [
                    'batch_number', 'manufacture_date', 'expiry_date',
                    'initial_quantity', 'packaging_level', 'warehouse'
                ],
                'optional_fields': [
                    'lot_number', 'serial_numbers', 'status',
                    'certificate_of_analysis', 'qc_notes', 'supplier'
                ],
                'api_endpoint': '/api/pharma/batches/',
                'serializer': 'pharma.serializers.DrugBatchSerializer',
            },
            'DrugDispensing': {
                'model_class': 'pharma.models.DrugDispensing',
                'required_fields': [
                    'drug_product', 'batch', 'packaging_level',
                    'quantity_dispensed', 'unit_price'
                ],
                'optional_fields': [
                    'patient_name', 'prescription_number',
                    'prescriber_name', 'prescriber_license', 'customer'
                ],
                'api_endpoint': '/api/pharma/dispensing/',
                'serializer': 'pharma.serializers.DrugDispensingSerializer',
            },
        },
        
        'retail': {
            'Product': {
                'model_class': 'inventory.models.Product',
                'required_fields': ['sku', 'name', 'category', 'unit_cost', 'selling_price'],
                'optional_fields': [
                    'description', 'unit', 'quantity', 'reorder_level',
                    'supplier', 'status'
                ],
                'related_models': ['StockMovement'],
                'api_endpoint': '/api/inventory/products/',
                'serializer': 'inventory.serializers.ProductSerializer',
            },
            'Customer': {
                'model_class': 'sales.models.Customer',
                'required_fields': ['name'],
                'optional_fields': [
                    'email', 'phone', 'address', 'city', 'state', 'zipCode'
                ],
                'api_endpoint': '/api/sales/customers/',
                'serializer': 'sales.serializers.CustomerSerializer',
            },
            'Order': {
                'model_class': 'sales.models.Order',
                'required_fields': ['customer', 'order_date', 'items'],
                'optional_fields': [
                    'delivery_date', 'status', 'notes'
                ],
                'api_endpoint': '/api/sales/orders/',
                'serializer': 'sales.serializers.OrderSerializer',
            },
        },
        
        'logistics': {
            'Warehouse': {
                'model_class': 'warehouse.models.Warehouse',
                'required_fields': ['name', 'code'],
                'optional_fields': [
                    'location', 'address', 'city', 'state',
                    'capacity', 'is_active'
                ],
                'api_endpoint': '/api/warehouse/warehouses/',
                'serializer': 'warehouse.serializers.WarehouseSerializer',
            },
            'Transfer': {
                'model_class': 'warehouse.models.Transfer',
                'required_fields': [
                    'product', 'from_warehouse', 'to_warehouse',
                    'quantity', 'transfer_date'
                ],
                'optional_fields': ['status', 'notes', 'completed_date'],
                'api_endpoint': '/api/warehouse/transfers/',
                'serializer': 'warehouse.serializers.TransferSerializer',
            },
            'Product': {
                'model_class': 'inventory.models.Product',
                'required_fields': ['sku', 'name', 'quantity'],
                'optional_fields': [
                    'category', 'unit', 'warehouse', 'reorder_level'
                ],
                'api_endpoint': '/api/inventory/products/',
                'serializer': 'inventory.serializers.ProductSerializer',
            },
        },
        
        'manufacturing': {
            'Product': {
                'model_class': 'inventory.models.Product',
                'required_fields': ['sku', 'name', 'category', 'unit_cost'],
                'optional_fields': [
                    'description', 'quantity', 'unit', 'supplier',
                    'reorder_level', 'status'
                ],
                'api_endpoint': '/api/inventory/products/',
                'serializer': 'inventory.serializers.ProductSerializer',
            },
            'PurchaseOrder': {
                'model_class': 'procurement.models.PurchaseOrder',
                'required_fields': [
                    'supplier', 'order_date', 'items', 'total_amount'
                ],
                'optional_fields': [
                    'expected_delivery', 'status', 'notes'
                ],
                'api_endpoint': '/api/procurement/purchase_orders/',
                'serializer': 'procurement.serializers.PurchaseOrderSerializer',
            },
            'Supplier': {
                'model_class': 'procurement.models.Supplier',
                'required_fields': ['name'],
                'optional_fields': [
                    'email', 'phone', 'address', 'city', 'country'
                ],
                'api_endpoint': '/api/procurement/suppliers/',
                'serializer': 'procurement.serializers.SupplierSerializer',
            },
        },
        
        'general': {
            'Product': {
                'model_class': 'inventory.models.Product',
                'required_fields': ['name', 'sku'],
                'optional_fields': [
                    'description', 'category', 'unit', 'unit_cost',
                    'selling_price', 'quantity', 'reorder_level', 'supplier'
                ],
                'api_endpoint': '/api/inventory/products/',
                'serializer': 'inventory.serializers.ProductSerializer',
            },
            'Warehouse': {
                'model_class': 'warehouse.models.Warehouse',
                'required_fields': ['name'],
                'optional_fields': [
                    'code', 'location', 'capacity', 'is_active'
                ],
                'api_endpoint': '/api/warehouse/warehouses/',
                'serializer': 'warehouse.serializers.WarehouseSerializer',
            },
            'Customer': {
                'model_class': 'sales.models.Customer',
                'required_fields': ['name'],
                'optional_fields': ['email', 'phone', 'address'],
                'api_endpoint': '/api/sales/customers/',
                'serializer': 'sales.serializers.CustomerSerializer',
            },
        },
    }
    
    # Industry-specific validation rules
    INDUSTRY_VALIDATIONS = {
        'pharmacy': {
            'DrugProduct': {
                'generic_name': {
                    'min_length': 2,
                    'max_length': 200,
                    'pattern': r'^[A-Za-z\s\-]+$',
                    'error_message': 'Generic name must contain only letters, spaces, and hyphens'
                },
                'strength': {
                    'pattern': r'^\d+(\.\d+)?\s*(mg|g|ml|mcg|%|IU)$',
                    'error_message': 'Strength must include numeric value and valid unit (mg, g, ml, mcg, %, IU)'
                },
                'expiry_date': {
                    'future_only': True,
                    'error_message': 'Expiry date must be in the future'
                },
            },
        },
        'retail': {
            'Product': {
                'sku': {
                    'unique': True,
                    'pattern': r'^[A-Z0-9\-]+$',
                    'error_message': 'SKU must be uppercase alphanumeric with hyphens'
                },
                'selling_price': {
                    'greater_than': 'unit_cost',
                    'error_message': 'Selling price must be greater than unit cost'
                },
            },
        },
        'logistics': {
            'Transfer': {
                'quantity': {
                    'min_value': 1,
                    'check_availability': True,
                    'error_message': 'Quantity must be positive and available in source warehouse'
                },
            },
        },
        'manufacturing': {
            'PurchaseOrder': {
                'expected_delivery': {
                    'future_only': True,
                    'min_days_from_now': 1,
                    'error_message': 'Expected delivery must be at least 1 day in the future'
                },
            },
        },
    }
    
    # Industry-specific business logic
    INDUSTRY_BUSINESS_RULES = {
        'pharmacy': {
            'enable_batch_tracking': True,
            'enable_expiry_management': True,
            'enable_prescription_tracking': True,
            'enable_fefo': True,  # First-Expiry-First-Out
            'enable_cold_chain_monitoring': True,
            'enable_serialization': True,
        },
        'retail': {
            'enable_batch_tracking': False,
            'enable_loyalty_programs': True,
            'enable_promotions': True,
            'enable_pos_integration': True,
        },
        'logistics': {
            'enable_route_optimization': True,
            'enable_tracking': True,
            'enable_multi_warehouse': True,
            'enable_cross_docking': True,
        },
        'manufacturing': {
            'enable_bom': True,  # Bill of Materials
            'enable_production_planning': True,
            'enable_quality_control': True,
            'enable_work_orders': True,
        },
    }
    
    @classmethod
    def get_models_for_industry(cls, industry: str) -> Dict[str, Any]:
        """Get all models configured for a specific industry"""
        return cls.INDUSTRY_MODELS.get(industry, cls.INDUSTRY_MODELS['general'])
    
    @classmethod
    def get_model_config(cls, industry: str, model_name: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific model in an industry"""
        industry_models = cls.get_models_for_industry(industry)
        return industry_models.get(model_name)
    
    @classmethod
    def get_required_fields(cls, industry: str, model_name: str) -> List[str]:
        """Get required fields for a model in an industry"""
        config = cls.get_model_config(industry, model_name)
        return config.get('required_fields', []) if config else []
    
    @classmethod
    def get_optional_fields(cls, industry: str, model_name: str) -> List[str]:
        """Get optional fields for a model in an industry"""
        config = cls.get_model_config(industry, model_name)
        return config.get('optional_fields', []) if config else []
    
    @classmethod
    def get_all_fields(cls, industry: str, model_name: str) -> List[str]:
        """Get all available fields for a model in an industry"""
        return cls.get_required_fields(industry, model_name) + cls.get_optional_fields(industry, model_name)
    
    @classmethod
    def get_validations(cls, industry: str, model_name: str) -> Dict[str, Any]:
        """Get validation rules for a model in an industry"""
        industry_validations = cls.INDUSTRY_VALIDATIONS.get(industry, {})
        return industry_validations.get(model_name, {})
    
    @classmethod
    def get_business_rules(cls, industry: str) -> Dict[str, bool]:
        """Get business rules for an industry"""
        return cls.INDUSTRY_BUSINESS_RULES.get(industry, {})
    
    @classmethod
    def is_field_required(cls, industry: str, model_name: str, field_name: str) -> bool:
        """Check if a field is required for a model in an industry"""
        return field_name in cls.get_required_fields(industry, model_name)
    
    @classmethod
    def is_field_allowed(cls, industry: str, model_name: str, field_name: str) -> bool:
        """Check if a field is allowed for a model in an industry"""
        return field_name in cls.get_all_fields(industry, model_name)
    
    @classmethod
    def get_api_endpoint(cls, industry: str, model_name: str) -> Optional[str]:
        """Get API endpoint for a model in an industry"""
        config = cls.get_model_config(industry, model_name)
        return config.get('api_endpoint') if config else None
    
    @classmethod
    def get_serializer_class(cls, industry: str, model_name: str) -> Optional[str]:
        """Get serializer class path for a model in an industry"""
        config = cls.get_model_config(industry, model_name)
        return config.get('serializer') if config else None
    
    @classmethod
    def get_available_industries(cls) -> List[str]:
        """Get list of all available industries"""
        return list(cls.INDUSTRY_MODELS.keys())
    
    @classmethod
    def validate_industry(cls, industry: str) -> bool:
        """Validate if an industry is supported"""
        return industry in cls.INDUSTRY_MODELS


# Singleton instance
industry_registry = IndustryRegistry()

