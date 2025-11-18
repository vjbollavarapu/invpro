# Auto-Number Generation System Design

## Overview

Implement a dual ID system where each model has:
1. **Auto-increment integer ID** (primary key) - for database
2. **Configurable formatted number** - for display to users

---

## Architecture

### 1. Configuration Model

Store number format configurations per tenant:

```python
# apps/common/models.py

class NumberSequence(BaseModel):
    """Manages auto-number generation with custom formats per tenant"""
    
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    entity_type = models.CharField(max_length=50, choices=[
        ('product', 'Product'),
        ('order', 'Sales Order'),
        ('purchase_order', 'Purchase Order'),
        ('purchase_request', 'Purchase Request'),
        ('warehouse', 'Warehouse'),
        ('transfer', 'Transfer'),
        ('supplier', 'Supplier'),
        ('customer', 'Customer'),
    ])
    
    # Format configuration
    prefix = models.CharField(max_length=20, default='PRD')
    include_year = models.BooleanField(default=False)
    include_month = models.BooleanField(default=False)
    separator = models.CharField(max_length=5, default='-')
    padding = models.IntegerField(default=3)  # Number of digits (001, 0001, etc.)
    
    # Sequence tracking
    current_sequence = models.IntegerField(default=0)
    reset_on_year = models.BooleanField(default=False)
    reset_on_month = models.BooleanField(default=False)
    
    # Example format result
    sample_format = models.CharField(max_length=100, blank=True)
    # e.g., "PRD-001", "PO-2024-001", "INV-2024-10-0001"
    
    class Meta:
        unique_together = ('tenant', 'entity_type')
    
    def save(self, *args, **kwargs):
        # Auto-generate sample format
        self.sample_format = self.generate_sample()
        super().save(*args, **kwargs)
    
    def generate_sample(self):
        """Generate sample format string"""
        parts = [self.prefix]
        
        if self.include_year:
            parts.append('YYYY')
        if self.include_month:
            parts.append('MM')
        
        parts.append('0' * self.padding)
        return self.separator.join(parts)
    
    def get_next_number(self):
        """Generate next number in sequence"""
        from datetime import datetime
        
        now = datetime.now()
        
        # Check if reset needed
        if self.reset_on_year:
            # Check if year changed - reset sequence
            last_reset = getattr(self, '_last_reset_year', None)
            if last_reset != now.year:
                self.current_sequence = 0
                self._last_reset_year = now.year
        
        if self.reset_on_month:
            last_reset = getattr(self, '_last_reset_month', None)
            if last_reset != (now.year, now.month):
                self.current_sequence = 0
                self._last_reset_month = (now.year, now.month)
        
        # Increment sequence
        self.current_sequence += 1
        self.save()
        
        # Build number
        parts = [self.prefix]
        
        if self.include_year:
            parts.append(str(now.year))
        if self.include_month:
            parts.append(str(now.month).zfill(2))
        
        # Add padded sequence number
        parts.append(str(self.current_sequence).zfill(self.padding))
        
        return self.separator.join(parts)
```

---

### 2. Update Models with Dual IDs

Example for Product model:

```python
# apps/inventory/models.py

from apps.common.utils import get_next_number

class Product(TenantAwareModel):
    # Auto-increment primary key (automatic)
    # id = models.AutoField(primary_key=True)  # Django creates this automatically
    
    # User-facing formatted number
    product_code = models.CharField(
        max_length=100, 
        unique=False,  # Not globally unique, but unique per tenant
        blank=True,
        db_index=True
    )
    
    # Rest of fields
    sku = models.CharField(max_length=64, unique=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=120, blank=True)
    unit = models.CharField(max_length=20, default='pcs')  # NEW
    description = models.TextField(blank=True)  # NEW
    
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity = models.IntegerField(default=0)  # Renamed from stock_qty
    reorder_level = models.IntegerField(default=0)
    status = models.CharField(max_length=40, default="active")
    
    supplier = models.ForeignKey(
        'procurement.Supplier', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )  # NEW
    
    last_updated = models.DateTimeField(auto_now=True)  # NEW
    
    class Meta:
        unique_together = ('tenant', 'product_code')  # Unique within tenant
    
    def save(self, *args, **kwargs):
        # Auto-generate product_code if not set
        if not self.product_code:
            from apps.common.utils import get_next_number
            self.product_code = get_next_number(self.tenant, 'product')
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.product_code} - {self.name}"
```

---

### 3. Utility Function

```python
# apps/common/utils.py

def get_next_number(tenant, entity_type):
    """
    Get next auto-generated number for entity type
    
    Args:
        tenant: Tenant instance
        entity_type: str - 'product', 'order', 'purchase_order', etc.
    
    Returns:
        str: Formatted number like "PRD-001" or "PO-2024-001"
    """
    from apps.common.models import NumberSequence
    
    # Get or create number sequence config for this tenant and entity
    sequence, created = NumberSequence.objects.get_or_create(
        tenant=tenant,
        entity_type=entity_type,
        defaults={
            'prefix': get_default_prefix(entity_type),
            'padding': 3,
            'separator': '-',
        }
    )
    
    return sequence.get_next_number()


def get_default_prefix(entity_type):
    """Get default prefix for entity type"""
    prefixes = {
        'product': 'PRD',
        'order': 'ORD',
        'purchase_order': 'PO',
        'purchase_request': 'PR',
        'warehouse': 'WH',
        'transfer': 'TRF',
        'supplier': 'SUP',
        'customer': 'CUST',
    }
    return prefixes.get(entity_type, 'DOC')
```

---

### 4. All Models Updated

Apply same pattern to all main models:

#### Sales Order
```python
class Order(TenantAwareModel):
    order_number = models.CharField(max_length=100, blank=True, db_index=True)
    # ... rest of fields
    
    class Meta:
        unique_together = ('tenant', 'order_number')
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            from apps.common.utils import get_next_number
            self.order_number = get_next_number(self.tenant, 'order')
        super().save(*args, **kwargs)
```

#### Purchase Order
```python
class PurchaseOrder(TenantAwareModel):
    po_number = models.CharField(max_length=100, blank=True, db_index=True)
    # ... rest of fields
    
    class Meta:
        unique_together = ('tenant', 'po_number')
```

#### Warehouse
```python
class Warehouse(TenantAwareModel):
    warehouse_code = models.CharField(max_length=100, blank=True, db_index=True)
    # ... rest of fields
```

---

## User Interface for Configuration

### Admin/Settings Page

Users can configure number formats through settings:

```python
# Example API endpoint
POST /api/settings/number-formats/

{
  "entity_type": "product",
  "prefix": "PROD",
  "include_year": true,
  "include_month": false,
  "separator": "-",
  "padding": 4,
  "reset_on_year": true
}

# This would generate: PROD-2024-0001, PROD-2024-0002, etc.
# In 2025: PROD-2025-0001 (resets)
```

### UI Component (React)

```typescript
interface NumberFormatConfig {
  entityType: string
  prefix: string
  includeYear: boolean
  includeMonth: boolean
  separator: string
  padding: number
  resetOnYear: boolean
  resetOnMonth: boolean
  sampleFormat: string  // Preview: "PRD-2024-001"
}

// Form to configure formats
<Select>
  <SelectItem value="product">Products</SelectItem>
  <SelectItem value="order">Sales Orders</SelectItem>
  <SelectItem value="purchase_order">Purchase Orders</SelectItem>
</Select>

<Input label="Prefix" value="PRD" />
<Checkbox label="Include Year" />
<Checkbox label="Include Month" />
<Input label="Separator" value="-" />
<Select label="Padding">
  <SelectItem value="3">3 digits (001)</SelectItem>
  <SelectItem value="4">4 digits (0001)</SelectItem>
  <SelectItem value="5">5 digits (00001)</SelectItem>
</Select>

<div className="preview">
  Preview: {sampleFormat}
</div>
```

---

## Examples of Generated Numbers

### Configuration Examples

| Config | Result | Use Case |
|--------|--------|----------|
| Prefix: PRD, Padding: 3 | `PRD-001` | Simple products |
| Prefix: PO, Year: Yes, Padding: 3 | `PO-2024-001` | Purchase orders with year |
| Prefix: INV, Year: Yes, Month: Yes, Padding: 4 | `INV-2024-10-0001` | Invoices with month |
| Prefix: ORD, Year: Yes, Separator: /, Padding: 5 | `ORD/2024/00001` | Custom format |
| Prefix: WH, Padding: 2 | `WH-01` | Warehouses (fewer) |

### Reset Behavior

**With Reset on Year:**
- Dec 2024: `ORD-2024-158`
- Jan 2025: `ORD-2025-001` ✅ Resets to 001

**With Reset on Month:**
- Sep 2024: `INV-2024-09-0045`
- Oct 2024: `INV-2024-10-0001` ✅ Resets each month

**No Reset:**
- Continues forever: `PRD-001`, `PRD-002`, ... `PRD-9999`, `PRD-10000`

---

## Database Schema

```sql
-- NumberSequence table
CREATE TABLE common_numbersequence (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(20) DEFAULT 'PRD',
    include_year BOOLEAN DEFAULT FALSE,
    include_month BOOLEAN DEFAULT FALSE,
    separator VARCHAR(5) DEFAULT '-',
    padding INTEGER DEFAULT 3,
    current_sequence INTEGER DEFAULT 0,
    reset_on_year BOOLEAN DEFAULT FALSE,
    reset_on_month BOOLEAN DEFAULT FALSE,
    sample_format VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(tenant_id, entity_type)
);

-- Example Product table
CREATE TABLE inventory_product (
    id SERIAL PRIMARY KEY,  -- Auto-increment internal ID
    product_code VARCHAR(100),  -- User-facing formatted number
    tenant_id INTEGER NOT NULL,
    name VARCHAR(200),
    sku VARCHAR(64),
    -- ... other fields
    UNIQUE(tenant_id, product_code)
);
```

---

## API Response Examples

### List Products
```json
{
  "results": [
    {
      "id": 1,  // Internal ID for API operations
      "product_code": "PRD-001",  // Display to user
      "name": "Industrial Steel Pipes",
      "sku": "ISP-2024-001",
      "quantity": 450
    },
    {
      "id": 2,
      "product_code": "PRD-002",
      "name": "Hydraulic Pumps",
      "sku": "HP-2024-002",
      "quantity": 75
    }
  ]
}
```

### Frontend Display
- **In URLs**: Use internal ID: `/api/products/1/`
- **To Users**: Show product_code: "PRD-001"
- **In Tables**: Display both or just product_code

---

## Advantages

✅ **Database Efficiency**: Integer IDs are fast for joins, indexing
✅ **User-Friendly**: Meaningful, readable numbers for users
✅ **Flexible**: Each tenant can customize format
✅ **Sequential**: Guaranteed sequence per entity type
✅ **Multi-Tenant Safe**: Unique within tenant, not globally
✅ **Audit Trail**: Easy to trace when created (if year/month included)

---

## Migration Strategy

1. Add `NumberSequence` model
2. Add `*_code` / `*_number` fields to existing models
3. Run data migration to populate existing records
4. Update serializers to return formatted numbers
5. Frontend uses formatted numbers for display

---

## Thread Safety

For high-concurrency scenarios, use database-level locking:

```python
from django.db import transaction

def get_next_number(tenant, entity_type):
    with transaction.atomic():
        # Lock the row for update
        sequence = NumberSequence.objects.select_for_update().get(
            tenant=tenant,
            entity_type=entity_type
        )
        return sequence.get_next_number()
```

---

## Testing

```python
def test_number_generation():
    tenant = Tenant.objects.create(name="Test Co")
    
    # Create config
    config = NumberSequence.objects.create(
        tenant=tenant,
        entity_type='product',
        prefix='PRD',
        padding=3
    )
    
    # Generate numbers
    num1 = config.get_next_number()  # PRD-001
    num2 = config.get_next_number()  # PRD-002
    num3 = config.get_next_number()  # PRD-003
    
    assert num1 == "PRD-001"
    assert num2 == "PRD-002"
    assert num3 == "PRD-003"
```

---

*Generated: 2025-10-13*

