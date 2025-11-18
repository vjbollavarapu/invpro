# Pharmaceutical Inventory Module

## Quick Start

### 1. Run Migrations
```bash
cd apps/backend
python manage.py makemigrations pharma
python manage.py migrate
```

### 2. Test API
```bash
python manage.py runserver
```

**API Base URL**: `http://localhost:8000/api/pharma/`  
**API Documentation**: `http://localhost:8000/api/docs/`

### 3. Create Your First Drug Product

**Request**:
```bash
curl -X POST http://localhost:8000/api/pharma/products/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "generic_name": "Paracetamol",
    "brand_name": "Tylenol",
    "dosage_form": "tablet",
    "strength": "500mg",
    "route_of_administration": "oral",
    "therapeutic_class": "Analgesic",
    "storage_conditions": "room_temp",
    "requires_prescription": false,
    "manufacturer": "Generic Pharma",
    "active_ingredients": "Paracetamol",
    "status": "active"
  }'
```

### 4. Create Packaging Hierarchy

**Request**:
```bash
curl -X POST http://localhost:8000/api/pharma/packaging-levels/bulk-create/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "drug_product": 1,
    "packaging_levels": [
      {
        "level_name": "Tablet",
        "level_order": 1,
        "base_unit_quantity": 1,
        "unit_of_measure": "tablet",
        "can_dispense": true,
        "cost_price": 0.10,
        "selling_price": 0.25
      },
      {
        "level_name": "Strip",
        "level_order": 2,
        "base_unit_quantity": 10,
        "unit_of_measure": "strip",
        "can_dispense": true,
        "cost_price": 0.90,
        "selling_price": 2.00
      },
      {
        "level_name": "Box",
        "level_order": 3,
        "base_unit_quantity": 100,
        "unit_of_measure": "box",
        "can_dispense": false,
        "can_purchase": true,
        "cost_price": 8.00,
        "selling_price": 18.00
      }
    ]
  }'
```

### 5. Receive Inventory

**Request**:
```bash
curl -X POST http://localhost:8000/api/pharma/batches/receive/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "drug_product": 1,
    "batch_number": "BATCH-2024-001",
    "manufacture_date": "2024-01-01",
    "expiry_date": "2026-01-01",
    "packaging_level": 3,
    "quantity_received": 50,
    "warehouse": 1,
    "unit_cost": 8.00
  }'
```

### 6. Approve Batch

**Request**:
```bash
curl -X POST http://localhost:8000/api/pharma/batches/1/approve/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Dispense Drugs

**Request**:
```bash
curl -X POST http://localhost:8000/api/pharma/dispensing/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "drug_product": 1,
    "batch": 1,
    "packaging_level": 2,
    "quantity_dispensed": 5,
    "patient_name": "John Doe",
    "prescription_number": "RX-12345",
    "prescriber_name": "Dr. Smith",
    "dispensed_by": 1,
    "unit_price": 2.00
  }'
```

## Features

✅ **Complete Drug Master Data**  
- Generic & brand names  
- Dosage forms & strengths  
- Therapeutic classification  
- Regulatory identifiers  

✅ **Multi-Level Packaging**  
- Tablet → Strip → Box → Carton  
- Automatic conversions  
- Dispense at any level  

✅ **Batch Tracking**  
- Expiry management  
- FEFO logic  
- QC workflow  
- Traceability  

✅ **Flexible Dispensing**  
- Partial dispensing  
- Automatic inventory updates  
- Prescription tracking  

✅ **25+ API Endpoints**  
- RESTful design  
- Comprehensive documentation  

## Documentation

See `/docs/PHARMA_API_DOCUMENTATION.md` for complete API reference.

## Status

✅ **Production-Ready**


