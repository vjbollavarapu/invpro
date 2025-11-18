# Frontend-Backend Model Comparison Analysis

## Executive Summary

This document provides a detailed comparison between the frontend UI/UX data requirements and the backend Django models to identify gaps and required modifications before integration.

---

## ✅ WELL-MATCHED MODELS

### 1. **Inventory / Product**

**Backend Model (`inventory.Product`):**
```python
- sku
- name
- category
- unit_cost (DecimalField)
- selling_price (DecimalField)
- stock_qty (IntegerField)
- reorder_level (IntegerField)
- status
```

**Frontend Requirements:**
```typescript
- id (like "PRD-001")
- name
- sku
- category
- quantity
- unit (like "pcs", "meters", "kg")
- reorderLevel
- unitCost
- totalValue (calculated)
- warehouse
- status ("In Stock", "Low Stock", "Out of Stock")
- lastUpdated (date)
```

**✅ Match Level: 70%**

**⚠️ GAPS:**
- Missing: `unit` field (measurement unit)
- Missing: `description` field (shown in add product form)
- Missing: Direct `warehouse` foreign key (frontend shows warehouse per product)
- Missing: `lastUpdated` timestamp field
- Missing: `supplier` foreign key (shown in add product form)
- Backend has `selling_price` but frontend doesn't use it much
- `stock_qty` should be renamed to `quantity` for consistency
- `status` logic differs (frontend calculates from stock, backend stores as string)

---

### 2. **Sales / Order**

**Backend Model (`sales.Order`):**
```python
- customer (ForeignKey to Customer)
- order_id
- channel ("Manual" or "Shopify")
- total_amount
- status ("PENDING", etc.)
- fulfilled_at (DateTimeField)
```

**Frontend Requirements:**
```typescript
- id (like "ORD-2024-001")
- customer (string name)
- channel ("Shopify" or "Manual")
- total
- status ("delivered", "processing", "shipped", "pending")
- fulfillmentDate
- items (count)
```

**✅ Match Level: 85%**

**⚠️ GAPS:**
- Missing: `items_count` field (or need to count from OrderItem)
- `order_id` vs `id` naming
- Status values differ: Backend "PENDING" vs Frontend "pending" (case sensitivity)

**Backend Model (`sales.OrderItem`):**
- ✅ Matches frontend expectations well

**Backend Model (`sales.Customer`):**
```python
- name
- email
- phone
- address
```

**Frontend Needs:**
- Also expects customer revenue, order count, growth percentage for "Top Customers" analytics
- These are calculated fields, not stored

---

### 3. **Procurement**

**Backend Model (`procurement.Supplier`):**
```python
- name
- email
- phone
- address
- rating
```

**Frontend Requirements:**
```typescript
- id (like "SUP-001")
- name
- contact (person name)
- email
- phone
- address
- rating
- totalOrders (count)
- activeOrders (count)
```

**✅ Match Level: 70%**

**⚠️ GAPS:**
- Missing: `contact` (contact person name)
- Missing: `totalOrders` and `activeOrders` (need computed fields)

**Backend Model (`procurement.PurchaseOrder`):**
```python
- supplier (ForeignKey)
- total_amount
- status
- created_at
```

**Frontend Needs:**
```typescript
- poNo (like "PO-2024-001")
- supplier (name)
- total
- date
- status ("delivered", "in-transit", "processing", "pending")
```

**⚠️ GAPS:**
- Missing: `po_number` field (unique identifier)
- Missing: `expected_delivery_date` field
- Status naming differs

**Backend Model (`procurement.PurchaseRequest`):**
```python
- requested_by (User)
- item (Product)
- quantity
- status
```

**Frontend Needs:**
```typescript
- id ("PR-001")
- item (name)
- quantity
- requestedBy (name)
- status
- date
```

**⚠️ GAPS:**
- Missing: `request_number` field
- Need to display user's name, not just FK

---

### 4. **Finance**

**Backend Model (`finance.CostCenter`):**
```python
- name
- budget
- actual_cost
```

**Frontend Requirements:**
```typescript
- id
- name
- budget
- actualCost
- variance (calculated)
```

**✅ Match Level: 95%** - Nearly perfect match

**Backend Model (`finance.Expense`):**
```python
- date
- description
- category
- amount
- linked_order (FK to Order)
- linked_po (FK to PurchaseOrder)
```

**Frontend Requirements:**
```typescript
- id
- date
- description
- category
- amount
- linkedTo (order/PO number as string)
```

**✅ Match Level: 90%**

**⚠️ GAPS:**
- Frontend displays linked order/PO as a string ID, need to serialize properly

---

### 5. **Warehouse**

**Backend Model (`warehouse.Warehouse`):**
```python
- name
- location
- capacity (integer, total slots)
- active_clients
- total_skus
```

**Frontend Requirements:**
```typescript
- id ("WH001")
- name
- location
- capacity (percentage: 85%)
- activeClients
- totalSKUs
- status ("active")
```

**✅ Match Level: 70%**

**⚠️ GAPS:**
- `capacity` semantics differ:
  - Backend: Total slots (absolute number)
  - Frontend: Utilization percentage
  - Need `current_utilization` and `max_capacity` fields
- Missing: `status` field
- Missing: `warehouse_code` field for IDs like "WH001"

**Backend Model (`warehouse.Transfer`):**
```python
- from_warehouse (FK)
- to_warehouse (FK)
- product (FK)
- quantity
- status
```

**Frontend Requirements:**
```typescript
- id ("TRF001")
- type ("outbound" or "inbound")
- from (warehouse name)
- to (warehouse name)
- items (count)
- status
- date
```

**⚠️ GAPS:**
- Missing: `transfer_number` field
- `items` is actually item count, but backend has single product + quantity
- Missing: `created_at` field
- Need to serialize warehouse names, not IDs

---

### 6. **Inventory Movement / Stock Movement**

**Backend Model (`inventory.StockMovement`):**
```python
- product (FK)
- source_warehouse (FK)
- destination_warehouse (FK)
- quantity
- movement_type ("IN", "OUT", "TRANSFER")
- timestamp
```

**Frontend Needs:**
- Shown in inventory adjust stock dialog
- Needs reason/notes field

**⚠️ GAPS:**
- Missing: `reason` or `notes` field
- Missing: `performed_by` (User FK)

---

## ⚠️ MISSING MODELS IN BACKEND

### 1. **User Roles & Permissions**

**Frontend Has:**
- Detailed role management system
- Per-module permissions (view, create, edit, delete)
- Modules: inventory, procurement, sales, warehouses, finance, reports

**Backend Status:**
- ❌ No `Role` model
- ❌ No `Permission` model  
- Only basic `User` model extending AbstractUser

**ACTION REQUIRED:**
- Create `Role` model with permission structure
- Add `role` FK to User model

---

### 2. **Notifications**

**Frontend Shows:**
- Notification system in dashboard header

**Backend:**
- ✅ Has `notifications` app but models not visible
- Need to check if implemented

---

### 3. **Shopify Integration**

**Frontend Expects:**
- Shopify sync functionality
- Channel tracking in orders

**Backend:**
- ✅ Has `integrations` app
- Backend Order model has `channel` field
- Need to verify Shopify integration models exist

---

## 🔴 CRITICAL ISSUES TO RESOLVE

### Issue 1: **Field Naming Conventions**
- Backend uses snake_case: `unit_cost`, `stock_qty`
- Frontend uses camelCase: `unitCost`, `quantity`
- **Solution:** Use DRF serializers with `source` parameter for field mapping

### Issue 2: **ID/Number Fields**
- Frontend displays human-readable IDs: "PRD-001", "PO-2024-001"
- Backend uses auto-increment integer IDs
- **Solution:** Add dedicated number fields and auto-generation logic

### Issue 3: **Status Enums**
- Backend: UPPERCASE strings ("PENDING")
- Frontend: lowercase strings ("pending")
- **Solution:** Standardize on lowercase, use Django choices properly

### Issue 4: **Calculated Fields**
- Frontend expects many calculated fields:
  - `totalValue` = quantity × unitCost
  - `variance` = actualCost - budget
  - Order `items` count
  - Supplier `totalOrders`, `activeOrders`
- **Solution:** Use DRF `SerializerMethodField` or computed properties

### Issue 5: **Multi-Tenant Architecture**
- Backend: All models extend `TenantAwareModel`
- Frontend: No tenant switching visible in UI
- **Action:** Verify tenant handling in API layer

### Issue 6: **Warehouse-Product Relationship**
- Frontend shows warehouse per product
- Backend StockMovement has warehouses, but Product doesn't
- **Solution:** Need `ProductWarehouseStock` intermediary model

---

## 📋 REQUIRED BACKEND CHANGES

### High Priority

1. **Add missing fields to `Product` model:**
   ```python
   unit = models.CharField(max_length=20, default="pcs")
   description = models.TextField(blank=True)
   supplier = models.ForeignKey(Supplier, ...)
   product_code = models.CharField(max_length=64, unique=True)  # For PRD-001
   ```

2. **Add number/code fields to all main models:**
   - `product_code` to Product
   - `po_number` to PurchaseOrder
   - `request_number` to PurchaseRequest
   - `transfer_number` to Transfer
   - `warehouse_code` to Warehouse
   - `order_number` to Order (rename `order_id`)

3. **Fix Warehouse capacity:**
   ```python
   max_capacity = models.IntegerField(default=1000)
   current_utilization = models.IntegerField(default=0)
   status = models.CharField(max_length=20, default="active")
   ```

4. **Create Role & Permission models:**
   ```python
   class Role(TenantAwareModel):
       name = models.CharField(max_length=100)
       description = models.TextField()
       permissions = models.JSONField(default=dict)
   
   class User(AbstractUser):
       role = models.ForeignKey(Role, ...)
   ```

5. **Add ProductWarehouseStock intermediary:**
   ```python
   class ProductWarehouseStock(TenantAwareModel):
       product = models.ForeignKey(Product)
       warehouse = models.ForeignKey(Warehouse)
       quantity = models.IntegerField(default=0)
       last_updated = models.DateTimeField(auto_now=True)
   ```

6. **Add missing timestamp fields:**
   - All models should have `created_at`, `updated_at` (TenantAwareModel → BaseModel has this ✅)

7. **Add to Supplier model:**
   ```python
   contact_person = models.CharField(max_length=150, blank=True)
   ```

8. **Add to PurchaseOrder:**
   ```python
   expected_delivery_date = models.DateField(null=True, blank=True)
   ```

9. **Add to StockMovement:**
   ```python
   reason = models.TextField(blank=True)
   performed_by = models.ForeignKey(User, ...)
   ```

### Medium Priority

10. **Standardize status choices across all models**
11. **Add analytics/computed fields as properties or serializer methods**
12. **Create audit log integration** (backend has `audit` app)

---

## ✅ RECOMMENDATIONS

1. **Before Configuration:**
   - Complete all High Priority backend model changes
   - Run migrations
   - Update serializers to match frontend expectations

2. **Serializer Strategy:**
   - Use `SerializerMethodField` for calculated values
   - Map snake_case to camelCase using `source`
   - Include nested serializers for ForeignKeys (e.g., show customer name not ID)

3. **API Response Format:**
   - Standardize on lowercase status values
   - Always include human-readable IDs
   - Return related object names for display

4. **Testing:**
   - Create fixtures with mock data matching frontend examples
   - Test each API endpoint against frontend component expectations

5. **Documentation:**
   - Create API schema (use drf-spectacular)
   - Document all calculated fields
   - Document status value enums

---

## 📊 OVERALL ASSESSMENT

**Backend Readiness: 60%**

**Strengths:**
- ✅ Core models exist for all major features
- ✅ Multi-tenant architecture in place
- ✅ Good relational structure

**Weaknesses:**
- ❌ Missing user-readable ID fields
- ❌ No Role/Permission system
- ❌ Warehouse-Product stock tracking needs work
- ❌ Many display fields missing
- ❌ Status enum inconsistencies

**Estimated Work Required:**
- Model changes: 4-6 hours
- Migrations: 1 hour
- Serializer creation: 6-8 hours
- View/URL setup: 4-6 hours
- Testing: 4-6 hours

**Total: 2-3 days of development**

---

## 🎯 NEXT STEPS

1. ✅ Review this document with stakeholders
2. Prioritize model changes
3. Create migrations
4. Update/create serializers
5. Begin API endpoint development
6. Test with frontend integration

---

*Generated: 2025-10-13*
*Project: InvPro360*

