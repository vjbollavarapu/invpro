# Shopify Sync vs Import - Understanding the Difference

## 🔄 Two-Step Process

Your Shopify integration uses a **two-step process** to get products into your inventory:

### Step 1: **Sync** (Pull from Shopify)
- **What it does**: Pulls data from Shopify and stores it in **integration-specific tables** (`ShopifyProduct`, `ShopifyOrder`, etc.)
- **Where data goes**: `shopify_integration_shopifyproduct` table
- **Purpose**: Raw Shopify data storage, bidirectional sync tracking
- **When to use**: After connecting to Shopify, or when you want to update data from Shopify

### Step 2: **Import** (Move to Common Tables)
- **What it does**: Transforms and moves data from integration tables to **common tables** (`Product`, `Order`, `Customer`)
- **Where data goes**: `inventory_product` table (visible in Inventory page)
- **Purpose**: Make Shopify data available in your main inventory management
- **When to use**: After syncing, to make products visible in your Inventory page

---

## 📊 Data Flow

```
Shopify Store
    ↓
[Sync] → ShopifyProduct table (integration-specific)
    ↓
[Import] → Product table (common, visible in Inventory)
```

---

## 🎯 How to See Your Shopify Products in Inventory

### Option 1: Using the UI (Recommended)

1. **Go to**: Settings → Integrations → Shopify
2. **Click "Sync All"** or **"Sync Products"** (Step 1)
   - This pulls products from Shopify to integration tables
3. **Click "Import Products"** (Step 2)
   - This moves products from integration tables to common inventory table
4. **Go to**: Inventory page
   - Your Shopify products should now be visible!

### Option 2: Using API

**Step 1 - Sync:**
```bash
POST /api/shopify/sync/
{
  "type": "products"
}
```

**Step 2 - Import:**
```bash
POST /api/shopify/import/products/
{
  "merge_strategy": "last_write_wins"
}
```

---

## 🔍 Verify Products Were Synced

### Check Integration Tables:
```bash
# In Django shell
from shopify_integration.models import ShopifyProduct
products = ShopifyProduct.objects.all()
print(f"Synced products: {products.count()}")
for p in products[:5]:
    print(f"- {p.title} (ID: {p.shopify_product_id})")
```

### Check Common Tables:
```bash
# In Django shell
from inventory.models import Product
products = Product.objects.filter(data_source='shopify')
print(f"Imported products: {products.count()}")
for p in products[:5]:
    print(f"- {p.name} (SKU: {p.sku})")
```

---

## ⚠️ Common Issues

### "I synced but don't see products in Inventory"
- **Solution**: You need to **Import** after syncing
- Sync only stores data in integration tables
- Import moves it to common tables

### "Products are in ShopifyProduct but not in Product table"
- **Solution**: Run the import step
- Use "Import Products" button or API endpoint

### "I want to see Shopify products separately"
- **Solution**: View them in Settings → Integrations → Shopify → Products tab
- Or query `ShopifyProduct` table directly

---

## 💡 Best Practice Workflow

1. **Connect** to Shopify (one-time setup)
2. **Sync** regularly to keep integration tables updated
3. **Import** when you want products in your main inventory
4. **Use Inventory page** to manage all products (Shopify + local)

---

## 🔄 Automatic Import (Future Enhancement)

Currently, import is manual. Future versions may support:
- Auto-import after sync
- Scheduled imports
- Bidirectional sync with automatic import

---

**Quick Fix for Your Current Issue:**
1. Go to Settings → Integrations → Shopify
2. Click "Import Products" button
3. Check Inventory page - your Shopify products should appear!

