# Bidirectional Sync - Quick Start Guide

## 🎯 Overview

This guide provides a quick reference for implementing bidirectional sync (read & write) with Shopify, Xero, and other integrations.

## 📊 Architecture Decision

### ✅ Recommended: Hybrid Approach

**Integration-Specific Tables** (Raw Data)
- `ShopifyProduct`, `ShopifyOrder`, `ShopifyCustomer`
- Store raw API responses
- Track sync status and timestamps
- Preserve integration-specific metadata

**Common Tables** (Unified Inventory)
- `Product`, `Order`, `Customer`
- Unified business logic
- Track data source (`data_source`, `source_id`)
- Single source of truth for inventory

**Import/Export Layer**
- Import: Integration tables → Common tables
- Export: Common tables → Integration tables
- Handles transformation and conflict resolution

## 🚀 Quick Implementation Checklist

### Phase 1: Basic Push (Week 1-2)
- [ ] Extend `ShopifyApiClient` with write methods
  - [ ] `create_product()`
  - [ ] `update_product()`
  - [ ] `update_inventory_level()`
  - [ ] `create_order()`
  - [ ] `update_order()`

- [ ] Add sync tracking to models
  - [ ] `sync_status` field
  - [ ] `last_pushed_at` timestamp
  - [ ] `pending_push` boolean flag

- [ ] Create push services
  - [ ] `ShopifyProductPushService`
  - [ ] `ShopifyInventoryPushService`

- [ ] Add API endpoints
  - [ ] `POST /api/shopify/push/products/`
  - [ ] `POST /api/shopify/push/inventory/`

### Phase 2: Import Layer (Week 3-4)
- [ ] Create import services
  - [ ] `ProductImportService`
  - [ ] `OrderImportService`

- [ ] Add source tracking to common models
  - [ ] `Product.data_source`
  - [ ] `Product.source_id`

- [ ] Add import endpoints
  - [ ] `POST /api/integrations/import/products/`

### Phase 3: Bidirectional Sync (Week 5-6)
- [ ] Conflict detection
- [ ] Conflict resolution UI
- [ ] Sync orchestrator
- [ ] Sync policies

## 🔧 Code Examples

### Extend API Client

```python
# apps/backend/shopify_integration/services/shopify_api_client.py

class ShopifyApiClient:
    # ... existing read methods ...
    
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
```

### Add Sync Tracking

```python
# Migration: Add to ShopifyProduct model

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
last_pushed_at = models.DateTimeField(null=True, blank=True)
pending_push = models.BooleanField(default=False)
```

### Create Push Service

```python
# apps/backend/shopify_integration/services/product_push_service.py

class ShopifyProductPushService:
    def __init__(self, integration: ShopifyIntegration, api_client: ShopifyApiClient):
        self.integration = integration
        self.client = api_client
    
    def push_product(self, shopify_product: ShopifyProduct) -> dict:
        product_data = self._transform_for_shopify(shopify_product)
        
        if shopify_product.shopify_product_id:
            result = self.client.update_product(
                shopify_product.shopify_product_id,
                product_data
            )
        else:
            result = self.client.create_product(product_data)
            shopify_product.shopify_product_id = result['product']['id']
        
        shopify_product.sync_status = 'synced'
        shopify_product.last_pushed_at = timezone.now()
        shopify_product.pending_push = False
        shopify_product.save()
        
        return {'success': True, 'data': result}
```

## 📝 API Endpoints

### Push Products
```bash
POST /api/shopify/push/products/
{
    "product_ids": [1, 2, 3]  # Optional
}
```

### Push Inventory
```bash
POST /api/shopify/push/inventory/
{
    "location_id": "123",
    "updates": [
        {"inventory_item_id": "456", "quantity": 100}
    ]
}
```

### Import to Common Tables
```bash
POST /api/integrations/import/products/
{
    "source": "shopify",
    "product_ids": [1, 2, 3]  # Optional
}
```

## 🔄 Data Flow

### Pull (Read)
```
Shopify API → ShopifyProduct → [Import] → Product
```

### Push (Write)
```
Product (modified) → [Push] → ShopifyProduct → Shopify API
```

### Bidirectional
```
Local Change → Check Status → Conflict? → Push/Pull → Sync
```

## ⚠️ Conflict Resolution

### Strategies
1. **Last Write Wins** (Default)
   - Compare timestamps
   - Push most recent version

2. **Source Priority**
   - Define priority order
   - Always use higher priority

3. **Manual Resolution**
   - Flag for user review
   - User chooses version

4. **Field-Level Merge**
   - Merge non-conflicting fields
   - Flag conflicts for review

## 📚 Related Documents

- [Full Roadmap](./BIDIRECTIONAL_SYNC_ROADMAP.md) - Detailed implementation plan
- [Shopify API Docs](https://shopify.dev/docs/api/admin-rest) - API reference

## 🎯 Next Steps

1. Review the full roadmap
2. Start with Phase 1 (Basic Push)
3. Test with a single product
4. Iterate and expand

