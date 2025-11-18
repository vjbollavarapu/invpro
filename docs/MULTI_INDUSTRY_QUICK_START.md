# Multi-Industry System - Quick Start Guide

## What is it?

The Multi-Industry System allows each tenant to operate under different business models (pharmacy, retail, logistics, manufacturing) with **industry-specific data schemas and validation rules**.

---

## Quick Setup

### 1. Run Migration
```bash
cd apps/backend
python manage.py makemigrations tenants
python manage.py migrate
```

### 2. Update Tenant Industry
```bash
# Via API
PATCH /api/tenant/industry/
{
  "industry": "pharmacy"  # or retail, logistics, manufacturing, general
}

# Or via Django shell
python manage.py shell
>>> from tenants.models import Tenant
>>> tenant = Tenant.objects.get(code='your-tenant-code')
>>> tenant.industry = 'pharmacy'
>>> tenant.save()
```

---

## API Endpoints

### Get Industry Schema
```bash
GET /api/industry/schema/
GET /api/industry/schema/?model=DrugProduct
```

### Get Business Rules
```bash
GET /api/industry/business-rules/
```

### Get Available Industries
```bash
GET /api/industry/available/
```

### Get Model Details
```bash
GET /api/industry/model-details/?model=DrugProduct
```

### Get/Update Tenant Industry
```bash
GET /api/tenant/industry/
PATCH /api/tenant/industry/
```

---

## Supported Industries

| Industry | Available Models | Key Features |
|----------|------------------|--------------|
| **Pharmacy** | DrugProduct, PackagingLevel, DrugBatch, DrugDispensing | Batch tracking, FEFO, prescription tracking |
| **Retail** | Product, Customer, Order | SKU management, pricing validation |
| **Logistics** | Warehouse, Transfer, Product | Multi-warehouse, route optimization |
| **Manufacturing** | Product, PurchaseOrder, Supplier | BOM support, production planning |
| **General** | Product, Warehouse, Customer | Basic inventory management |

---

## Example: Pharmacy Tenant

### 1. Set Industry
```bash
PATCH /api/tenant/industry/
{
  "industry": "pharmacy"
}
```

### 2. Create Drug Product
```bash
POST /api/pharma/products/
{
  "generic_name": "Paracetamol",
  "brand_name": "Tylenol",
  "dosage_form": "tablet",
  "strength": "500mg",
  "route_of_administration": "oral",
  "therapeutic_class": "Analgesic",
  "requires_prescription": false
}
```

### 3. Get Schema
```bash
GET /api/industry/schema/?model=DrugProduct

# Response shows:
# - Required fields: generic_name, dosage_form, strength, route_of_administration, therapeutic_class
# - Optional fields: brand_name, barcode, gtin, etc.
# - Validations: strength pattern, etc.
```

---

## Example: Retail Tenant

### 1. Set Industry
```bash
PATCH /api/tenant/industry/
{
  "industry": "retail"
}
```

### 2. Create Product
```bash
POST /api/inventory/products/
{
  "sku": "PROD-001",
  "name": "T-Shirt",
  "category": "Clothing",
  "unit_cost": 10.00,
  "selling_price": 25.00
}
```

✅ **Different schema**: No generic_name, dosage_form, etc.  
✅ **Different validation**: selling_price > unit_cost  

---

## How It Works

1. **Tenant has industry field**: `tenant.industry = 'pharmacy'`
2. **Registry maps industries to models**: Each industry has specific models and fields
3. **Middleware validates requests**: Checks required fields, validates formats
4. **Middleware filters responses**: Returns only industry-appropriate fields
5. **Dynamic at runtime**: No code changes needed per tenant

---

## Features

✅ **5 Industries Supported**: pharmacy, retail, logistics, manufacturing, general  
✅ **Dynamic Schemas**: Loaded at runtime based on tenant  
✅ **Validation Rules**: Industry-specific field validation  
✅ **Business Rules**: Feature flags per industry  
✅ **Clean API**: Same endpoints, different behaviors  
✅ **Extensible**: Easy to add new industries  

---

## Configuration

### Enable Middleware (Optional)

In `settings.py`:
```python
MIDDLEWARE = [
    ...
    'common.industry_middleware.IndustryAwareMiddleware',  # Request validation
    # 'common.industry_middleware.IndustryResponseFilterMiddleware',  # Response filtering (optional)
]
```

---

## Status

✅ **COMPLETE & READY**: All features implemented  
📚 **DOCUMENTED**: See `MULTI_INDUSTRY_SYSTEM.md` for details  
🚀 **PRODUCTION-READY**: Deploy immediately  

---

**Need Help?** See full documentation: `docs/MULTI_INDUSTRY_SYSTEM.md`


