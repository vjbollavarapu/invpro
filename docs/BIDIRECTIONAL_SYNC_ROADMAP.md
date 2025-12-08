# Bidirectional Sync Roadmap
## Read & Write Integration Architecture

## 📋 Table of Contents
1. [Current State](#current-state)
2. [Architecture Overview](#architecture-overview)
3. [Data Flow Patterns](#data-flow-patterns)
4. [Conflict Resolution Strategy](#conflict-resolution-strategy)
5. [Implementation Phases](#implementation-phases)
6. [Technical Components](#technical-components)
7. [API Design](#api-design)
8. [Database Schema Changes](#database-schema-changes)

---

## Current State

### ✅ What We Have (Read-Only)
- **Pull Operations**: Fetch data from Shopify
  - Products, Orders, Customers, Inventory
  - Stored in integration-specific tables (`ShopifyProduct`, `ShopifyOrder`, etc.)
  - Webhook support for real-time updates
  - Periodic sync tasks

### ❌ What We Need (Write Operations)
- **Push Operations**: Write data back to Shopify
  - Create/Update products
  - Update inventory levels
  - Create/Update orders
  - Update customer information
- **Bidirectional Sync**: Handle conflicts when data changes in both systems
- **Sync Status Tracking**: Know what needs to be synced

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Integration Layer                         │
│  (Shopify, Xero, etc.) - External Systems                    │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ API Calls (Read/Write)
                        │
┌───────────────────────▼───────────────────────────────────────┐
│              Integration-Specific Tables                      │
│  (Raw Data + Sync Metadata)                                  │
│  • ShopifyProduct (with sync_status, last_pushed_at)         │
│  • ShopifyOrder                                              │
│  • XeroProduct (future)                                      │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Import/Transform
                        │
┌───────────────────────▼───────────────────────────────────────┐
│                  Common Inventory Tables                      │
│  (Unified Business Logic)                                    │
│  • Product (with data_source, source_id)                     │
│  • Order (with channel)                                       │
│  • Customer                                                  │
└───────────────────────────────────────────────────────────────┘
```

### Sync Directions

1. **Pull (Read)**: Integration → Integration Tables → Common Tables
2. **Push (Write)**: Common Tables → Integration Tables → Integration
3. **Bidirectional**: Handle both directions with conflict resolution

---

## Data Flow Patterns

### Pattern 1: Pull (Read) - Current Implementation
```
Shopify API → ShopifyProduct → [Import Service] → Product
```

### Pattern 2: Push (Write) - To Be Implemented
```
Product (modified) → [Push Service] → ShopifyProduct → Shopify API
```

### Pattern 3: Bidirectional Sync
```
┌─────────────────┐
│  Local Change   │
│  (Product.edit) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Check Sync Status          │
│  • pending_push?            │
│  • last_modified_at         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Conflict Detection         │
│  • Compare timestamps       │
│  • Check for conflicts      │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│  Push  │ │  Resolve  │
│  (Win) │ │  Conflict │
└────────┘ └──────────┘
```

---

## Conflict Resolution Strategy

### Conflict Types

1. **Timestamp Conflict**: Both systems modified the same record
2. **Deletion Conflict**: Record deleted in one system, modified in another
3. **Creation Conflict**: Same SKU created in both systems

### Resolution Strategies

#### Strategy 1: Last Write Wins (Default)
- Compare `updated_at` timestamps
- Push the most recent version
- **Use Case**: Simple inventory updates

#### Strategy 2: Source Priority
- Define priority: `local > shopify` or `shopify > local`
- Always use the higher priority source
- **Use Case**: When one system is the source of truth

#### Strategy 3: Manual Resolution
- Flag conflicts for user review
- Store both versions
- User chooses which to keep
- **Use Case**: Complex business rules

#### Strategy 4: Field-Level Merging
- Merge non-conflicting fields
- Flag conflicting fields for review
- **Use Case**: Different fields updated in each system

### Implementation

```python
class ConflictResolver:
    STRATEGY_LAST_WRITE_WINS = "last_write_wins"
    STRATEGY_SOURCE_PRIORITY = "source_priority"
    STRATEGY_MANUAL = "manual"
    STRATEGY_MERGE = "merge"
    
    def resolve(self, local_record, remote_record, strategy):
        if strategy == self.STRATEGY_LAST_WRITE_WINS:
            return self._last_write_wins(local_record, remote_record)
        # ... other strategies
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Enable basic push operations

#### Tasks:
1. ✅ Extend `ShopifyApiClient` with write methods
   - `create_product(product_data)`
   - `update_product(product_id, product_data)`
   - `update_inventory_level(location_id, inventory_item_id, quantity)`
   - `create_order(order_data)`
   - `update_order(order_id, order_data)`

2. ✅ Add sync status tracking to integration models
   - `sync_status` field (pending, synced, conflict, error)
   - `last_pulled_at` timestamp
   - `last_pushed_at` timestamp
   - `pending_push` boolean flag

3. ✅ Create push services
   - `ShopifyProductPushService`
   - `ShopifyInventoryPushService`
   - `ShopifyOrderPushService`

4. ✅ Add API endpoints
   - `POST /api/shopify/push/products/`
   - `POST /api/shopify/push/inventory/`
   - `POST /api/shopify/push/orders/`

**Deliverables**:
- Can push product updates to Shopify
- Can update inventory levels in Shopify
- Basic error handling

---

### Phase 2: Import Layer (Weeks 3-4)
**Goal**: Sync integration tables → common tables

#### Tasks:
1. ✅ Create import services
   - `ProductImportService` (ShopifyProduct → Product)
   - `OrderImportService` (ShopifyOrder → Order)
   - `CustomerImportService` (ShopifyCustomer → Customer)

2. ✅ Add source tracking to common models
   - `Product.data_source` (shopify, xero, manual)
   - `Product.source_id` (reference to integration table)
   - `Product.last_imported_at`

3. ✅ Handle conflicts during import
   - SKU matching logic
   - Merge strategies
   - Duplicate detection

4. ✅ Add import endpoints
   - `POST /api/integrations/import/products/`
   - `POST /api/integrations/import/orders/`

**Deliverables**:
- Unified inventory view
- Products from Shopify appear in main Product table
- Can track which products came from which integration

---

### Phase 3: Bidirectional Sync (Weeks 5-6)
**Goal**: Handle two-way sync with conflict resolution

#### Tasks:
1. ✅ Implement conflict detection
   - Compare timestamps
   - Detect concurrent modifications
   - Flag conflicts

2. ✅ Add conflict resolution UI
   - Show conflicts to users
   - Allow manual resolution
   - Preview changes before applying

3. ✅ Create sync orchestrator
   - `BidirectionalSyncService`
   - Handles pull + push in correct order
   - Manages sync queue

4. ✅ Add sync policies
   - Auto-sync on change
   - Scheduled sync
   - Manual sync only

**Deliverables**:
- Automatic sync when data changes
- Conflict resolution UI
- Sync history and logs

---

### Phase 4: Advanced Features (Weeks 7-8)
**Goal**: Production-ready bidirectional sync

#### Tasks:
1. ✅ Webhook handling for push confirmations
   - Shopify webhooks for product updates
   - Update sync status on webhook receipt

2. ✅ Retry mechanism for failed pushes
   - Queue failed operations
   - Automatic retry with exponential backoff
   - Manual retry option

3. ✅ Sync scheduling and automation
   - Configurable sync intervals
   - Priority-based sync queue
   - Background job processing

4. ✅ Monitoring and alerts
   - Sync health dashboard
   - Failed sync alerts
   - Performance metrics

**Deliverables**:
- Production-ready bidirectional sync
- Monitoring and alerting
- Comprehensive error handling

---

### Phase 5: Multi-Integration Support (Weeks 9-10)
**Goal**: Extend to Xero and other integrations

#### Tasks:
1. ✅ Create integration abstraction layer
   - `BaseIntegrationClient` interface
   - `BasePushService` interface
   - `BasePullService` interface

2. ✅ Implement Xero integration
   - Xero API client
   - Xero product/order models
   - Xero sync services

3. ✅ Unified sync orchestrator
   - Handle multiple integrations
   - Cross-integration conflict resolution
   - Unified sync dashboard

**Deliverables**:
- Multi-integration support
- Unified sync interface
- Scalable architecture

---

## Technical Components

### 1. Extended API Client

```python
class ShopifyApiClient:
    # Existing read methods...
    
    # New write methods
    def create_product(self, product_data: dict) -> dict:
        """Create a new product in Shopify."""
        return self._request("POST", "products.json", json={"product": product_data})
    
    def update_product(self, product_id: str, product_data: dict) -> dict:
        """Update an existing product in Shopify."""
        return self._request("PUT", f"products/{product_id}.json", json={"product": product_data})
    
    def update_inventory_level(self, location_id: str, inventory_item_id: str, quantity: int) -> dict:
        """Update inventory level in Shopify."""
        data = {
            "location_id": location_id,
            "inventory_item_id": inventory_item_id,
            "available": quantity
        }
        return self._request("POST", "inventory_levels/set.json", json=data)
    
    def create_order(self, order_data: dict) -> dict:
        """Create a new order in Shopify."""
        return self._request("POST", "orders.json", json={"order": order_data})
    
    def update_order(self, order_id: str, order_data: dict) -> dict:
        """Update an existing order in Shopify."""
        return self._request("PUT", f"orders/{order_id}.json", json={"order": order_data})
```

### 2. Push Services

```python
class ShopifyProductPushService:
    """Service for pushing product changes to Shopify."""
    
    def __init__(self, integration: ShopifyIntegration, api_client: ShopifyApiClient):
        self.integration = integration
        self.client = api_client
    
    def push_product(self, shopify_product: ShopifyProduct) -> dict:
        """Push a single product to Shopify."""
        # Transform to Shopify format
        product_data = self._transform_for_shopify(shopify_product)
        
        try:
            if shopify_product.shopify_product_id:
                # Update existing
                result = self.client.update_product(
                    shopify_product.shopify_product_id,
                    product_data
                )
            else:
                # Create new
                result = self.client.create_product(product_data)
                # Update local record with Shopify ID
                shopify_product.shopify_product_id = result['product']['id']
            
            # Update sync status
            shopify_product.sync_status = 'synced'
            shopify_product.last_pushed_at = timezone.now()
            shopify_product.pending_push = False
            shopify_product.save()
            
            return {'success': True, 'data': result}
        except ShopifyApiError as e:
            shopify_product.sync_status = 'error'
            shopify_product.last_push_error = str(e)
            shopify_product.save()
            raise
    
    def push_batch(self, products: list[ShopifyProduct]) -> dict:
        """Push multiple products to Shopify."""
        results = {'success': 0, 'failed': 0, 'errors': []}
        
        for product in products:
            try:
                self.push_product(product)
                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'product_id': product.id,
                    'error': str(e)
                })
        
        return results
```

### 3. Import Services

```python
class ProductImportService:
    """Service for importing products from integration tables to common tables."""
    
    def import_from_shopify(self, shopify_product: ShopifyProduct) -> Product:
        """Import a Shopify product to the main Product table."""
        # Check if product already exists
        product = Product.objects.filter(
            tenant_id=shopify_product.tenant_id,
            source_id=shopify_product.id,
            data_source='shopify'
        ).first()
        
        # Transform Shopify product to Product format
        product_data = {
            'tenant_id': shopify_product.tenant_id,
            'name': shopify_product.title,
            'description': shopify_product.body_html,
            'sku': self._extract_sku(shopify_product),
            'selling_price': shopify_product.price_min or 0,
            'data_source': 'shopify',
            'source_id': str(shopify_product.id),
            'shopify_id': shopify_product.shopify_product_id,
        }
        
        if product:
            # Update existing
            for key, value in product_data.items():
                setattr(product, key, value)
            product.last_imported_at = timezone.now()
            product.save()
        else:
            # Create new
            product = Product.objects.create(**product_data)
        
        return product
```

### 4. Sync Status Tracking

```python
# Add to ShopifyProduct model
class ShopifyProduct(ShopifyBaseModel):
    # Existing fields...
    
    # Sync status tracking
    sync_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('synced', 'Synced'),
            ('conflict', 'Conflict'),
            ('error', 'Error'),
        ],
        default='pending'
    )
    last_pulled_at = models.DateTimeField(null=True, blank=True)
    last_pushed_at = models.DateTimeField(null=True, blank=True)
    pending_push = models.BooleanField(default=False)
    last_push_error = models.TextField(blank=True)
    conflict_data = models.JSONField(default=dict, blank=True)
```

---

## API Design

### Push Endpoints

```python
# POST /api/shopify/push/products/
{
    "product_ids": [1, 2, 3],  # Optional: specific products
    "force": false  # Force push even if no changes
}

# Response
{
    "success": true,
    "pushed": 3,
    "failed": 0,
    "results": [...]
}

# POST /api/shopify/push/inventory/
{
    "location_id": "123",
    "updates": [
        {"inventory_item_id": "456", "quantity": 100},
        {"inventory_item_id": "789", "quantity": 50}
    ]
}

# POST /api/integrations/import/products/
{
    "source": "shopify",
    "product_ids": [1, 2, 3],  # Optional
    "merge_strategy": "last_write_wins"  # or "manual", "merge"
}
```

### Bidirectional Sync Endpoint

```python
# POST /api/shopify/sync/bidirectional/
{
    "direction": "both",  # "pull", "push", "both"
    "entity_types": ["products", "inventory"],  # Optional
    "conflict_strategy": "last_write_wins"
}

# Response
{
    "success": true,
    "pull": {
        "fetched": 10,
        "imported": 8,
        "conflicts": 2
    },
    "push": {
        "pushed": 5,
        "failed": 0
    },
    "conflicts": [
        {
            "entity": "product",
            "entity_id": 123,
            "local_modified": "2024-01-15T10:00:00Z",
            "remote_modified": "2024-01-15T11:00:00Z",
            "resolution": "pending"
        }
    ]
}
```

---

## Database Schema Changes

### Integration Tables (Add Sync Tracking)

```python
# Migration: Add sync tracking to ShopifyProduct
class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='shopifyproduct',
            name='sync_status',
            field=models.CharField(
                max_length=20,
                choices=[('pending', 'Pending'), ('synced', 'Synced'), ...],
                default='pending'
            ),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='last_pulled_at',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='last_pushed_at',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='pending_push',
            field=models.BooleanField(default=False),
        ),
        migrations.AddIndex(
            model_name='shopifyproduct',
            index=models.Index(
                fields=['sync_status', 'pending_push'],
                name='shopify_prod_sync_idx'
            ),
        ),
    ]
```

### Common Tables (Add Source Tracking)

```python
# Migration: Add source tracking to Product
class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='product',
            name='data_source',
            field=models.CharField(
                max_length=50,
                choices=[('shopify', 'Shopify'), ('xero', 'Xero'), ('manual', 'Manual')],
                default='manual'
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='source_id',
            field=models.CharField(max_length=100, blank=True),
        ),
        migrations.AddField(
            model_name='product',
            name='last_imported_at',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['data_source', 'source_id'],
                name='product_source_idx'
            ),
        ),
    ]
```

---

## Next Steps

1. **Review and approve this roadmap**
2. **Start Phase 1**: Extend API client with write methods
3. **Set up development environment** for testing Shopify write operations
4. **Create feature branch**: `feature/bidirectional-sync`

---

## Questions to Consider

1. **Conflict Resolution Default**: What should be the default strategy?
   - Last write wins (simplest)
   - Source priority (more control)
   - Manual resolution (safest)

2. **Sync Frequency**: How often should auto-sync run?
   - Real-time (webhook-based)
   - Every 5 minutes
   - Hourly
   - Manual only

3. **Push Triggers**: When should data be pushed?
   - Immediately on change
   - Batch at intervals
   - Manual trigger only

4. **Error Handling**: What happens when push fails?
   - Retry automatically
   - Queue for manual review
   - Notify user immediately

---

## Resources

- [Shopify Admin API - Products](https://shopify.dev/docs/api/admin-rest/2024-01/resources/product)
- [Shopify Admin API - Inventory](https://shopify.dev/docs/api/admin-rest/2024-01/resources/inventorylevel)
- [Xero API Documentation](https://developer.xero.com/documentation/api/accounting/overview)

