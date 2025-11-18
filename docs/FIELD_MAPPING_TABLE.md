# Frontend-Backend Field Mapping Reference

Quick reference table for all data structures.

---

## 1. INVENTORY / PRODUCTS

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | string | `product_code` | ❌ MISSING | Need to add, e.g. "PRD-001" |
| `name` | string | `name` | ✅ EXISTS | |
| `sku` | string | `sku` | ✅ EXISTS | |
| `category` | string | `category` | ✅ EXISTS | |
| `quantity` | number | `stock_qty` | ⚠️ RENAME | Rename to `quantity` |
| `unit` | string | - | ❌ MISSING | Add field: "pcs", "kg", "meters" |
| `reorderLevel` | number | `reorder_level` | ✅ EXISTS | |
| `unitCost` | number | `unit_cost` | ✅ EXISTS | |
| `sellingPrice` | number | `selling_price` | ✅ EXISTS | Not used in frontend |
| `totalValue` | number | - | 🔵 CALCULATED | quantity × unitCost |
| `warehouse` | string | - | ❌ MISSING | Need ProductWarehouseStock model |
| `status` | string | `status` | ⚠️ LOGIC | Frontend calculates, backend stores |
| `lastUpdated` | date | - | ❌ MISSING | Add `last_updated` field |
| `description` | string | - | ❌ MISSING | Add `description` TextField |
| `supplier` | string | - | ❌ MISSING | Add FK to Supplier |

---

## 2. SALES / ORDERS

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | string | `order_id` | ⚠️ RENAME | Rename to `order_number` |
| `customer` | string | `customer.name` | ✅ EXISTS | Serialize customer name |
| `customerEmail` | string | `customer.email` | ✅ EXISTS | |
| `channel` | string | `channel` | ✅ EXISTS | "Shopify" or "Manual" |
| `total` | number | `total_amount` | ✅ EXISTS | |
| `status` | string | `status` | ⚠️ FORMAT | lowercase vs UPPERCASE |
| `fulfillmentDate` | date | `fulfilled_at` | ✅ EXISTS | |
| `items` | number | - | 🔵 CALCULATED | Count from OrderItem |

### OrderItem

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `productId` | string | `product.id` | ✅ EXISTS | |
| `productName` | string | `product.name` | ✅ EXISTS | |
| `quantity` | number | `quantity` | ✅ EXISTS | |
| `unitPrice` | number | `price` | ✅ EXISTS | |
| `total` | number | - | 🔵 CALCULATED | quantity × price |

### Customer (for Top Customers analytics)

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `name` | string | `name` | ✅ EXISTS | |
| `orders` | number | - | 🔵 CALCULATED | Count related orders |
| `revenue` | number | - | 🔵 CALCULATED | Sum order totals |
| `growth` | number | - | 🔵 CALCULATED | Period comparison |

---

## 3. PROCUREMENT

### Suppliers

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | string | - | ❌ MISSING | Add `supplier_code` |
| `name` | string | `name` | ✅ EXISTS | |
| `contact` | string | - | ❌ MISSING | Add `contact_person` |
| `email` | string | `email` | ✅ EXISTS | |
| `phone` | string | `phone` | ✅ EXISTS | |
| `address` | string | `address` | ✅ EXISTS | |
| `rating` | number | `rating` | ✅ EXISTS | |
| `totalOrders` | number | - | 🔵 CALCULATED | Count POs |
| `activeOrders` | number | - | 🔵 CALCULATED | Count active POs |

### Purchase Orders

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `poNo` | string | - | ❌ MISSING | Add `po_number` |
| `supplier` | string | `supplier.name` | ✅ EXISTS | Serialize name |
| `total` | number | `total_amount` | ✅ EXISTS | |
| `date` | date | `created_at` | ✅ EXISTS | |
| `status` | string | `status` | ⚠️ FORMAT | Case sensitivity |
| `deliveryDate` | date | - | ❌ MISSING | Add `expected_delivery_date` |

### Purchase Requests

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | string | - | ❌ MISSING | Add `request_number` |
| `item` | string | `item.name` | ✅ EXISTS | Serialize product name |
| `quantity` | number | `quantity` | ✅ EXISTS | |
| `requestedBy` | string | `requested_by.name` | ✅ EXISTS | Serialize user name |
| `status` | string | `status` | ⚠️ FORMAT | Case sensitivity |
| `date` | date | `created_at` | ✅ EXISTS | |

---

## 4. FINANCE

### Cost Centers

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | number | `id` | ✅ EXISTS | |
| `name` | string | `name` | ✅ EXISTS | |
| `budget` | number | `budget` | ✅ EXISTS | |
| `actualCost` | number | `actual_cost` | ✅ EXISTS | |
| `variance` | number | - | 🔵 CALCULATED | actualCost - budget |

### Expenses

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | number | `id` | ✅ EXISTS | |
| `date` | date | `date` | ✅ EXISTS | |
| `description` | string | `description` | ✅ EXISTS | |
| `category` | string | `category` | ✅ EXISTS | |
| `amount` | number | `amount` | ✅ EXISTS | |
| `linkedTo` | string | `linked_order` or `linked_po` | ⚠️ FORMAT | Serialize as order/PO number |

---

## 5. WAREHOUSES

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | string | - | ❌ MISSING | Add `warehouse_code` "WH001" |
| `name` | string | `name` | ✅ EXISTS | |
| `location` | string | `location` | ✅ EXISTS | |
| `capacity` | number (%) | `capacity` | ⚠️ SEMANTICS | Backend is absolute, frontend is % |
| `activeClients` | number | `active_clients` | ✅ EXISTS | |
| `totalSKUs` | number | `total_skus` | ✅ EXISTS | |
| `status` | string | - | ❌ MISSING | Add `status` field |

**Capacity Field Fix Required:**
```python
# Current
capacity = models.IntegerField(default=0)  # total slots

# Needed
max_capacity = models.IntegerField(default=1000)
current_utilization = models.IntegerField(default=0)

# Then calculate percentage: (current_utilization / max_capacity) * 100
```

### Transfers

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | string | - | ❌ MISSING | Add `transfer_number` |
| `type` | string | - | 🔵 CALCULATED | "inbound" or "outbound" based on context |
| `from` | string | `from_warehouse.name` | ✅ EXISTS | Serialize name |
| `to` | string | `to_warehouse.name` | ✅ EXISTS | Serialize name |
| `items` | number | - | ⚠️ SEMANTICS | Backend has single product+qty |
| `status` | string | `status` | ✅ EXISTS | |
| `date` | date | - | ❌ MISSING | Add `created_at` |

---

## 6. USERS & ROLES

### Users

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | number | `id` | ✅ EXISTS | |
| `name` | string | `first_name + last_name` | ⚠️ FORMAT | Combine fields |
| `email` | string | `email` | ✅ EXISTS | |
| `role` | string | - | ❌ MISSING | Add `role` FK |
| `status` | string | `is_active` | ⚠️ FORMAT | Convert bool to "Active"/"Inactive" |

### Roles

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `id` | number | - | ❌ MISSING | Create Role model |
| `name` | string | - | ❌ MISSING | |
| `description` | string | - | ❌ MISSING | |
| `userCount` | number | - | 🔵 CALCULATED | |
| `permissions` | object | - | ❌ MISSING | JSONField with structure |

**Required Role Model:**
```python
class Role(TenantAwareModel):
    name = models.CharField(max_length=100)
    description = models.TextField()
    permissions = models.JSONField(default=dict)
    # permissions structure:
    # {
    #   "inventory": {"view": true, "create": true, "edit": true, "delete": false},
    #   "procurement": {...},
    #   ...
    # }
```

---

## 7. STOCK MOVEMENTS / INVENTORY ADJUSTMENTS

| Frontend Field | Type | Backend Field | Status | Notes |
|---------------|------|---------------|--------|-------|
| `product` | string | `product.name` | ✅ EXISTS | |
| `quantity` | number | `quantity` | ✅ EXISTS | |
| `movementType` | string | `movement_type` | ✅ EXISTS | |
| `reason` | string | - | ❌ MISSING | Add `reason` TextField |
| `performedBy` | string | - | ❌ MISSING | Add `performed_by` FK to User |
| `timestamp` | date | `timestamp` | ✅ EXISTS | |
| `sourceWarehouse` | string | `source_warehouse.name` | ✅ EXISTS | |
| `destinationWarehouse` | string | `destination_warehouse.name` | ✅ EXISTS | |

---

## LEGEND

| Symbol | Meaning |
|--------|---------|
| ✅ EXISTS | Field exists and matches well |
| ❌ MISSING | Field doesn't exist in backend, needs to be added |
| ⚠️ RENAME | Field exists but name should be changed |
| ⚠️ FORMAT | Field exists but format/type differs |
| ⚠️ LOGIC | Field exists but logic/calculation differs |
| ⚠️ SEMANTICS | Field exists but meaning differs |
| 🔵 CALCULATED | Not stored, should be calculated in serializer |

---

## PRIORITY ACTIONS

### 🔴 Critical (Must Fix Before Integration)

1. Add all "❌ MISSING" ID/number fields (product_code, po_number, etc.)
2. Create Role & Permission models
3. Fix Warehouse capacity semantics
4. Add ProductWarehouseStock intermediary model
5. Standardize status values (lowercase)

### 🟡 High Priority (Fix During Configuration)

1. Add missing fields: unit, description, supplier to Product
2. Add contact_person to Supplier
3. Add reason, performed_by to StockMovement
4. Add expected_delivery_date to PurchaseOrder
5. Add warehouse_code, status to Warehouse

### 🟢 Medium Priority (Can Fix After Basic Integration)

1. Rename fields for consistency (stock_qty → quantity)
2. Add all timestamp fields
3. Optimize calculated field queries
4. Add proper indexes

---

*Last Updated: 2025-10-13*

