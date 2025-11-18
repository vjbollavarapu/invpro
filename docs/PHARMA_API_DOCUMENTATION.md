# Pharmaceutical Inventory API Documentation

## Overview

The Pharmaceutical Inventory module provides comprehensive drug inventory management with:
- ✅ Complete drug master data (generic, brand, dosage, strength, therapeutic class)
- ✅ Regulatory compliance (MA numbers, GTIN, barcode, NDC)
- ✅ Multi-level packaging hierarchy (tablet→strip→box→carton→pallet)
- ✅ Batch tracking with expiry management
- ✅ FEFO (First-Expiry-First-Out) dispensing logic
- ✅ Partial dispensing at any packaging level
- ✅ Serialization and traceability support
- ✅ Multi-tenant isolation

**Base URL**: `/api/pharma/`

---

## API Endpoints

### 1. Drug Products

#### `GET /api/pharma/products/`
List all pharmaceutical products with filtering and search.

**Query Parameters**:
- `dosage_form`: Filter by dosage form (tablet, capsule, syrup, etc.)
- `therapeutic_class`: Filter by therapeutic class
- `status`: Filter by status (active, discontinued, recalled)
- `requires_prescription`: Boolean filter
- `search`: Search in generic_name, brand_name, barcode, active_ingredients

**Response**:
```json
{
  "count": 100,
  "next": "...",
  "previous": null,
  "results": [
    {
      "id": 1,
      "product_code": "DRG-001",
      "generic_name": "Amoxicillin",
      "brand_name": "Amoxil",
      "dosage_form": "capsule",
      "strength": "500mg",
      "route_of_administration": "oral",
      "therapeutic_class": "Antibiotic",
      "pharmacological_class": "Beta-lactam",
      "marketing_authorization_number": "MA12345",
      "gtin": "12345678901234",
      "barcode": "AMX500C",
      "ndc_code": "12345-678-90",
      "storage_conditions": "room_temp",
      "requires_cold_chain": false,
      "requires_prescription": true,
      "is_controlled_substance": false,
      "manufacturer": "Pharma Corp",
      "active_ingredients": "Amoxicillin Trihydrate",
      "status": "active",
      "packaging_levels": [
        {
          "id": 1,
          "level_name": "Capsule",
          "level_order": 1,
          "base_unit_quantity": "1.000",
          "unit_of_measure": "capsule",
          "can_dispense": true,
          "cost_price": "0.50",
          "selling_price": "1.00"
        },
        {
          "id": 2,
          "level_name": "Strip",
          "level_order": 2,
          "base_unit_quantity": "10.000",
          "unit_of_measure": "strip",
          "can_dispense": true,
          "cost_price": "4.50",
          "selling_price": "9.00"
        }
      ],
      "total_stock_base_units": 5000.0,
      "expiry_alerts": {
        "expired": 0,
        "expiring_30_days": 2,
        "expiring_90_days": 5
      }
    }
  ]
}
```

#### `POST /api/pharma/products/`
Create a new drug product.

**Request Body**:
```json
{
  "generic_name": "Paracetamol",
  "brand_name": "Tylenol",
  "dosage_form": "tablet",
  "strength": "500mg",
  "route_of_administration": "oral",
  "therapeutic_class": "Analgesic",
  "pharmacological_class": "Non-opioid analgesic",
  "marketing_authorization_number": "MA67890",
  "gtin": "98765432109876",
  "barcode": "PAR500T",
  "storage_conditions": "room_temp",
  "requires_prescription": false,
  "manufacturer": "Generic Pharma",
  "active_ingredients": "Paracetamol",
  "status": "active"
}
```

#### `GET /api/pharma/products/{id}/`
Get details of a specific drug product.

#### `PATCH /api/pharma/products/{id}/`
Update drug product information.

#### `DELETE /api/pharma/products/{id}/`
Deactivate a drug product (soft delete).

#### `GET /api/pharma/products/low_stock/`
Get products with low stock across all packaging levels.

**Response**:
```json
[
  {
    "product": { /* Product details */ },
    "low_stock_locations": [
      {
        "warehouse": "Main Warehouse",
        "packaging_level": "Strip",
        "current_stock": 50.0,
        "reorder_level": 100.0
      }
    ]
  }
]
```

#### `GET /api/pharma/products/expiring_soon/?days=90`
Get products with batches expiring within specified days.

**Query Parameters**:
- `days`: Number of days (default: 90)

#### `GET /api/pharma/products/{id}/inventory_status/`
Get detailed inventory status for a specific product across all locations and batches.

---

### 2. Packaging Levels

#### `GET /api/pharma/packaging-levels/`
List all packaging levels.

**Query Parameters**:
- `drug_product`: Filter by drug product ID
- `can_dispense`: Filter dispensable levels
- `can_purchase`: Filter purchasable levels

**Response**:
```json
{
  "count": 50,
  "results": [
    {
      "id": 1,
      "drug_product": 1,
      "level_name": "Tablet",
      "level_order": 1,
      "base_unit_quantity": "1.000",
      "unit_of_measure": "tablet",
      "barcode": "TAB-001",
      "gtin": "12345678901234",
      "cost_price": "0.10",
      "selling_price": "0.25",
      "can_dispense": true,
      "can_purchase": false,
      "converted_base_units": 1.0,
      "cost_per_base_unit": 0.10
    },
    {
      "id": 2,
      "level_name": "Strip",
      "level_order": 2,
      "base_unit_quantity": "10.000",
      "unit_of_measure": "strip",
      "can_dispense": true,
      "cost_price": "0.90",
      "selling_price": "2.00",
      "converted_base_units": 10.0,
      "cost_per_base_unit": 0.09
    }
  ]
}
```

#### `POST /api/pharma/packaging-levels/bulk-create/`
Create complete packaging hierarchy in one request.

**Request Body**:
```json
{
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
}
```

#### `GET /api/pharma/packaging-levels/convert/?from_level=2&to_level=1&quantity=5`
Convert quantity between packaging levels.

**Query Parameters**:
- `from_level`: Source packaging level ID
- `to_level`: Target packaging level ID
- `quantity`: Quantity to convert

**Response**:
```json
{
  "from_level": {
    "id": 2,
    "level_name": "Strip",
    "base_unit_quantity": "10.000"
  },
  "to_level": {
    "id": 1,
    "level_name": "Tablet",
    "base_unit_quantity": "1.000"
  },
  "original_quantity": 5,
  "converted_quantity": 50.0,
  "base_units": 50.0
}
```

---

### 3. Drug Batches

#### `GET /api/pharma/batches/`
List all drug batches.

**Query Parameters**:
- `drug_product`: Filter by drug product
- `status`: Filter by status (quarantine, approved, rejected, expired)
- `warehouse`: Filter by warehouse
- `search`: Search batch_number, lot_number

**Response**:
```json
{
  "count": 25,
  "results": [
    {
      "id": 1,
      "drug_product": 1,
      "drug_product_name": "Amoxicillin",
      "batch_number": "BATCH-2024-001",
      "lot_number": "LOT-12345",
      "manufacture_date": "2024-01-15",
      "expiry_date": "2026-01-15",
      "initial_quantity": "10000.000",
      "current_quantity": "8500.000",
      "quantity_dispensed": 1500.0,
      "packaging_level": 3,
      "packaging_level_name": "Box",
      "status": "approved",
      "warehouse": 1,
      "warehouse_name": "Main Warehouse",
      "storage_location": "Shelf A-12",
      "unit_cost": "8.00",
      "is_expired": false,
      "days_until_expiry": 365
    }
  ]
}
```

#### `POST /api/pharma/batches/receive/`
Receive new batch inventory (bulk receiving).

**Request Body**:
```json
{
  "drug_product": 1,
  "batch_number": "BATCH-2024-002",
  "lot_number": "LOT-67890",
  "manufacture_date": "2024-02-01",
  "expiry_date": "2026-02-01",
  "packaging_level": 3,
  "quantity_received": 100,
  "warehouse": 1,
  "storage_location": "Shelf B-05",
  "supplier": 5,
  "purchase_order_number": "PO-2024-050",
  "unit_cost": 8.00
}
```

**Response**: Created batch (initially in quarantine status)

#### `POST /api/pharma/batches/{id}/approve/`
Approve batch after QC (moves from quarantine to approved).

**Request Body** (optional):
```json
{
  "qc_notes": "QC passed. Certificate of Analysis attached."
}
```

#### `POST /api/pharma/batches/{id}/reject/`
Reject batch.

#### `GET /api/pharma/batches/expired/`
Get all expired batches.

---

### 4. Drug Dispensing

#### `GET /api/pharma/dispensing/`
List all dispensing records.

**Query Parameters**:
- `drug_product`: Filter by drug product
- `batch`: Filter by batch
- `customer`: Filter by customer
- `search`: Search dispensing_number, patient_name, prescription_number

**Response**:
```json
{
  "count": 150,
  "results": [
    {
      "id": 1,
      "dispensing_number": "DISP-2024-001",
      "drug_product": 1,
      "drug_product_name": "Amoxicillin",
      "batch": 1,
      "batch_number": "BATCH-2024-001",
      "packaging_level": 2,
      "packaging_level_name": "Strip",
      "quantity_dispensed": "5.000",
      "quantity_in_base_units": "50.000",
      "customer": 10,
      "customer_name": "ABC Pharmacy",
      "patient_name": "John Doe",
      "prescription_number": "RX-12345",
      "prescriber_name": "Dr. Smith",
      "prescriber_license": "MD-67890",
      "dispensed_by": 2,
      "dispensed_by_name": "Jane Pharmacist",
      "dispensing_date": "2024-10-13T14:30:00Z",
      "unit_price": "9.00",
      "total_price": "45.00",
      "dispensing_notes": "Take with food"
    }
  ]
}
```

#### `GET /api/pharma/dispensing/available_batches/?drug_product=1&warehouse=1`
Get available batches for dispensing using FEFO (First-Expiry-First-Out) logic.

**Response**: List of batches ordered by expiry date

#### `POST /api/pharma/dispensing/`
Dispense drugs at any packaging level.

**Request Body**:
```json
{
  "drug_product": 1,
  "batch": 1,
  "packaging_level": 2,
  "quantity_dispensed": 5,
  "customer": 10,
  "patient_name": "John Doe",
  "prescription_number": "RX-12345",
  "prescriber_name": "Dr. Smith",
  "prescriber_license": "MD-67890",
  "dispensed_by": 2,
  "unit_price": 9.00,
  "dispensing_notes": "Take with food"
}
```

**Response**:
```json
{
  "id": 1,
  "dispensing_number": "DISP-2024-001",
  /* ... full dispensing record ... */
  "warning": "Not using FEFO recommendation. Batch BATCH-2024-002 expires sooner.",
  "recommended_batch": {
    /* details of FEFO-recommended batch */
  }
}
```

**Note**: System automatically:
- Calculates `quantity_in_base_units`
- Calculates `total_price`
- Deducts from batch quantity
- Updates inventory
- Generates dispensing number
- Validates against batch availability and expiry

---

### 5. Drug Inventory

#### `GET /api/pharma/inventory/`
View current inventory status (read-only, auto-updated).

**Query Parameters**:
- `drug_product`: Filter by drug product
- `warehouse`: Filter by warehouse
- `packaging_level`: Filter by packaging level

**Response**:
```json
{
  "count": 75,
  "results": [
    {
      "id": 1,
      "drug_product": 1,
      "drug_product_name": "Amoxicillin",
      "drug_product_strength": "500mg",
      "warehouse": 1,
      "warehouse_name": "Main Warehouse",
      "packaging_level": 2,
      "packaging_level_name": "Strip",
      "quantity_available": "850.000",
      "quantity_reserved": "50.000",
      "quantity_quarantine": "100.000",
      "total_quantity": "1000.000",
      "reorder_level": "100.000",
      "reorder_quantity": "500.000",
      "is_below_reorder_level": false,
      "last_updated": "2024-10-13T14:30:00Z"
    }
  ]
}
```

#### `GET /api/pharma/inventory/low_stock/`
Get inventory items below reorder level.

#### `GET /api/pharma/inventory/summary/`
Get aggregated inventory statistics.

**Response**:
```json
{
  "total_products": 50,
  "total_warehouses": 3,
  "low_stock_items": 5,
  "out_of_stock_items": 2,
  "total_value": 0
}
```

---

## Data Models

### DrugProduct
- Complete pharmaceutical product master
- Regulatory identifiers
- Storage requirements
- Classification

### PackagingLevel
- Multi-level hierarchy
- Conversion logic
- Dispensing & purchase configuration

### DrugBatch
- Batch/lot tracking
- Expiry management
- Serialization support
- Quality control workflow

### DrugDispensing
- FEFO logic
- Partial dispensing
- Prescription tracking
- Automatic inventory updates

### DrugInventory
- Real-time status
- Multi-location tracking
- Reorder management

---

## Key Features

### 1. Packaging Hierarchy
Support for any number of packaging levels:
```
Tablet (1) → Strip (10) → Box (100) → Carton (1000) → Pallet (10000)
```

### 2. Flexible Dispensing
- Dispense at ANY packaging level
- Automatic unit conversion
- Partial dispensing supported

### 3. FEFO (First-Expiry-First-Out)
- Automatic batch selection by expiry date
- Warning if not using FEFO
- Prevents expired stock dispensing

### 4. Batch Tracking
- Complete traceability
- Serial number support
- QC workflow (quarantine → approved/rejected)

### 5. Multi-Tenant
- Complete data isolation
- Tenant-specific inventory

---

## Example Workflows

### Workflow 1: Receive Bulk Inventory
```bash
# 1. Create drug product
POST /api/pharma/products/
{
  "generic_name": "Aspirin",
  "dosage_form": "tablet",
  "strength": "100mg",
  ...
}

# 2. Create packaging hierarchy
POST /api/pharma/packaging-levels/bulk-create/
{
  "drug_product": 1,
  "packaging_levels": [
    {"level_name": "Tablet", "level_order": 1, "base_unit_quantity": 1, ...},
    {"level_name": "Strip", "level_order": 2, "base_unit_quantity": 10, ...},
    {"level_name": "Box", "level_order": 3, "base_unit_quantity": 100, ...}
  ]
}

# 3. Receive inventory (at Box level)
POST /api/pharma/batches/receive/
{
  "drug_product": 1,
  "batch_number": "BATCH-001",
  "packaging_level": 3,  # Box
  "quantity_received": 50,  # 50 boxes = 5000 tablets
  ...
}

# 4. Approve batch
POST /api/pharma/batches/1/approve/

# 5. Check inventory
GET /api/pharma/inventory/?drug_product=1
# Shows: 50 boxes (5000 tablets) available
```

### Workflow 2: Dispense at Different Levels
```bash
# Dispense 5 strips (50 tablets)
POST /api/pharma/dispensing/
{
  "drug_product": 1,
  "batch": 1,
  "packaging_level": 2,  # Strip
  "quantity_dispensed": 5,
  ...
}

# Dispense 20 individual tablets
POST /api/pharma/dispensing/
{
  "drug_product": 1,
  "batch": 1,
  "packaging_level": 1,  # Tablet
  "quantity_dispensed": 20,
  ...
}

# Check remaining stock
GET /api/pharma/inventory/?drug_product=1
# Automatically updated in all packaging levels
```

---

## Implementation Status

✅ **COMPLETE**: All features implemented and ready for production use!

**Technology Stack**:
- Django 5.1.1
- Django REST Framework 3.15.2
- PostgreSQL
- Multi-tenant architecture
- RESTful API design

---

**Generated**: October 13, 2025  
**Module**: Pharmaceutical Inventory  
**Status**: Production-Ready ✅


