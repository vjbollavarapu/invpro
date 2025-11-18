# Pharmacy Frontend UI - Implementation Status

## Current Status

**Frontend Status**: ❌ **DOES NOT EXIST**

The frontend currently has NO pharmacy-specific UI components. The existing dashboard includes:
- ✅ Inventory (generic products)
- ✅ Sales
- ✅ Procurement
- ✅ Warehouses
- ✅ Finance
- ❌ **Pharmacy** (NOT IMPLEMENTED)

---

## What Needs to Be Implemented

### 1. Admin Panel ❌
**Required Components**:
- `DrugProductDialog` - Create/edit drug products with full pharmaceutical attributes
- `PackagingLevelsDialog` - Define packaging hierarchy (tablet→strip→box→carton)
- `BarcodeAssignmentForm` - Assign barcodes to packaging levels
- `BatchManagementDialog` - Create batches with batch numbers and expiry dates

**Features Needed**:
- Full drug product form (generic name, brand, dosage, strength, route, therapeutic class)
- Regulatory fields (MA number, GTIN, barcode, NDC)
- Storage conditions selection
- Prescription/controlled substance flags
- Multi-level packaging hierarchy builder
- Unit conversion calculator

### 2. Inventory Dashboard ❌
**Required Components**:
- `BatchInventoryTab` - Display stock levels at each packaging level
- `StockLevelCards` - Show available, reserved, quarantine quantities
- `LowStockAlerts` - Alert cards for items below reorder level
- `ExpiryAlertsTab` - Show expiring batches with countdown
- `SerializationTracker` - Track serial numbers

**Features Needed**:
- Real-time stock levels per packaging level
- Color-coded alerts (red for critical, orange for warning)
- Batch expiry timeline visualization
- FEFO (First-Expiry-First-Out) recommendations
- Serial number tracking status

### 3. Dispensing Interface ❌
**Required Components**:
- `DispensingTab` - Main dispensing interface
- `DispensingDialog` - Dispensing form with batch selection
- `PackagingLevelSelector` - Select dispensing level (tablet/strip/box)
- `BatchSelector` - Select batch with FEFO recommendation
- `UnitConverter` - Show automatic unit conversions
- `PrescriptionForm` - Capture prescription details

**Features Needed**:
- Sell at any packaging level
- Automatic unit conversion display
- Batch selection with expiry warning
- FEFO batch recommendations
- Prescription number capture
- Prescriber information
- Real-time inventory updates

### 4. Purchase Interface ❌
**Required Components**:
- `PurchaseOrdersTab` - List and manage purchase orders
- `CreatePurchaseOrderDialog` - Create bulk orders
- `ReceiveBatchDialog` - Receive inventory at bulk packaging level
- `UnpackingCalculator` - Show conversion from cartons to retail units
- `QCApprovalDialog` - Approve/reject batches

**Features Needed**:
- Create PO for bulk units (cartons, boxes)
- Receive at bulk level
- Auto-calculate retail units (e.g., 50 cartons = 50,000 tablets)
- QC workflow (quarantine → approve/reject)
- Batch approval interface

---

## Backend APIs Already Available

✅ **All Backend APIs Are Ready**:
- `GET/POST /api/pharma/products/` - Drug products CRUD
- `POST /api/pharma/packaging-levels/bulk-create/` - Packaging hierarchy
- `POST /api/pharma/batches/receive/` - Receive inventory
- `POST /api/pharma/batches/{id}/approve/` - Approve batches
- `GET /api/pharma/batches/available_batches/` - FEFO batch selection
- `POST /api/pharma/dispensing/` - Dispense drugs
- `GET /api/pharma/inventory/` - Real-time inventory status

**Backend is 100% ready** - Frontend just needs to consume these APIs.

---

## Recommended Implementation Approach

### Phase 1: Core Components (8-10 hours)
1. **Drug Product Management**
   - `DrugProductDialog` with comprehensive form
   - `PackagingLevelsDialog` for hierarchy setup
   - Drug products list with search/filter

2. **Basic Inventory Display**
   - `BatchInventoryTab` showing stock levels
   - Simple alerts for low stock

### Phase 2: Dispensing (6-8 hours)
3. **Dispensing Interface**
   - `DispensingDialog` with packaging level selector
   - Batch selector with FEFO
   - Unit conversion display
   - Prescription capture

### Phase 3: Purchase & Receiving (6-8 hours)
4. **Purchase Orders**
   - Create PO for bulk units
   - `ReceiveBatchDialog` for receiving
   - QC approval workflow

### Phase 4: Advanced Features (4-6 hours)
5. **Alerts & Monitoring**
   - Expiry alerts with timeline
   - Low stock dashboard
   - Serialization tracking

**Total Estimated Time**: 24-32 hours of development

---

## Technical Stack

**What Should Be Used**:
- ✅ React + TypeScript (matches existing frontend)
- ✅ shadcn/ui components (already in use)
- ✅ React Hook Form + Zod (for validation)
- ✅ TanStack Query (for API calls)
- ✅ Tailwind CSS (for styling)

---

## Files Started

I've created the foundation:

1. **`apps/frontend/app/dashboard/pharmacy/page.tsx`** ✅
   - Main pharmacy page with tabs
   - Stats cards for overview
   - Tab structure for all features

2. **`apps/frontend/components/pharmacy/drug-products-tab.tsx`** ✅
   - Drug products list
   - Search functionality
   - Skeleton for dialogs

**Remaining Files Needed** (20+):
- `components/pharmacy/drug-product-dialog.tsx` - Form for creating/editing drugs
- `components/pharmacy/packaging-levels-dialog.tsx` - Packaging hierarchy builder
- `components/pharmacy/batch-inventory-tab.tsx` - Batch inventory display
- `components/pharmacy/dispensing-tab.tsx` - Dispensing interface
- `components/pharmacy/dispensing-dialog.tsx` - Dispensing form
- `components/pharmacy/purchase-orders-tab.tsx` - Purchase orders list
- `components/pharmacy/receive-batch-dialog.tsx` - Receive inventory
- `components/pharmacy/expiry-alerts-tab.tsx` - Expiry monitoring
- `components/pharmacy/batch-selector.tsx` - FEFO batch selection
- `components/pharmacy/packaging-level-selector.tsx` - Level selector
- `components/pharmacy/unit-converter.tsx` - Conversion display
- `lib/validations/drug-product.ts` - Zod schemas
- `lib/hooks/useDrugProducts.ts` - React Query hooks
- `lib/hooks/useBatches.ts` - Batch management hooks
- `lib/hooks/useDispensing.ts` - Dispensing hooks
- And 10+ more...

---

## Sample Component Structure

### Drug Product Form
```typescript
// Required fields
{
  generic_name: string          // Required
  brand_name?: string
  dosage_form: 'tablet' | ...   // Required
  strength: string              // Required (validated: "500mg")
  route_of_administration       // Required
  therapeutic_class: string     // Required
  
  // Regulatory
  marketing_authorization_number?: string
  gtin?: string
  barcode?: string
  ndc_code?: string
  
  // Storage
  storage_conditions: 'room_temp' | ...
  requires_cold_chain: boolean
  
  // Prescription
  requires_prescription: boolean
  is_controlled_substance: boolean
  controlled_substance_schedule?: string
}
```

### Dispensing Flow
```typescript
1. Select drug product
2. Select packaging level (tablet/strip/box)
3. Enter quantity
4. System shows FEFO-recommended batch
5. Confirm batch or select different one
6. Enter prescription details (if required)
7. System:
   - Converts units automatically
   - Deducts from batch
   - Updates inventory
   - Generates dispensing record
```

---

## Integration Example

```typescript
// Hook for drug products
const { data: products } = useDrugProducts({
  search: searchQuery,
  status: 'active'
})

// Create drug product
const { mutate: createProduct } = useCreateDrugProduct()

createProduct({
  generic_name: 'Paracetamol',
  dosage_form: 'tablet',
  strength: '500mg',
  route_of_administration: 'oral',
  therapeutic_class: 'Analgesic'
})

// Dispense drug
const { mutate: dispense } = useDispenseDrug()

dispense({
  drug_product: productId,
  batch: batchId,
  packaging_level: stripLevelId,
  quantity_dispensed: 5,
  patient_name: 'John Doe',
  prescription_number: 'RX-12345',
  unit_price: 9.00
})
```

---

## Current Implementation Status

### Completed: 5%
- ✅ Main pharmacy page layout
- ✅ Tab structure
- ✅ Stats cards skeleton
- ✅ Drug products tab skeleton

### Remaining: 95%
- ❌ All dialogs and forms
- ❌ Dispensing interface
- ❌ Batch management
- ❌ Purchase orders
- ❌ Expiry alerts
- ❌ API integration
- ❌ Form validation
- ❌ Real-time updates

---

## Recommendation

**Two Options**:

### Option A: Complete Implementation
- Implement all 20+ components
- Full pharmacy UI with all features
- Estimated time: 24-32 hours
- Result: Production-ready pharmacy system

### Option B: MVP Implementation
- Core drug products management (4 hours)
- Basic dispensing (4 hours)
- Simple batch receiving (3 hours)
- Estimated time: 11-15 hours
- Result: Basic functional pharmacy UI

---

## Next Steps

If you want to proceed with implementation:

1. **Confirm scope**: Full implementation or MVP?
2. **Priority features**: Which features are most critical?
3. **Timeline**: When do you need this?

Then I can:
- Implement all components systematically
- Create comprehensive forms with validation
- Integrate with backend APIs
- Add real-time features
- Test end-to-end workflows

---

**Status**: Foundation started (5% complete)  
**Backend**: 100% ready  
**Estimated remaining work**: 24-32 hours for full implementation  


