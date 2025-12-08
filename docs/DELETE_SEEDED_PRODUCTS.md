# Delete Seeded Products Guide

This guide explains how to delete all seeded/mock products from your inventory, keeping only products imported from Shopify.

## Overview

The `delete_seeded_products` management command removes all products that are NOT imported from Shopify. Products are identified by their `data_source` field:
- **Seeded products**: `data_source='manual'` (will be deleted)
- **Shopify products**: `data_source='shopify'` (will be kept)

## Usage

### 1. Preview What Will Be Deleted (Dry Run)

Before deleting, preview what will be removed:

```bash
cd apps/backend
source venv/bin/activate
python manage.py delete_seeded_products --dry-run
```

This shows:
- Number of products that will be deleted
- Sample of products to be deleted
- Number of Shopify products that will be kept

### 2. Delete Seeded Products

To actually delete the seeded products:

```bash
python manage.py delete_seeded_products
```

You'll be prompted to type "DELETE" to confirm.

### 3. Skip Confirmation (Force Delete)

To skip the confirmation prompt:

```bash
python manage.py delete_seeded_products --force
```

### 4. Delete for Specific Tenant

If you have multiple tenants, delete products for a specific tenant:

```bash
python manage.py delete_seeded_products --tenant-id=<tenant-uuid>
```

## Example Output

```
================================================================================
🗑️  DELETE SEEDED PRODUCTS
================================================================================

📊 Found 13 product(s) to delete:
   - PRD-001 - Industrial Steel Pipes (SKU: ISP-2024-001, Source: manual)
   - PRD-002 - Hydraulic Pumps (SKU: HP-2024-002, Source: manual)
   - PRD-003 - Safety Helmets (SKU: SH-2024-003, Source: manual)
   ...

✅ 0 Shopify product(s) will be kept

⚠️  WARNING: This will permanently delete these products!
Type "DELETE" to confirm: DELETE

🗑️  Deleting products...

✅ Successfully deleted 13 product(s)!
✅ 0 Shopify product(s) remain in inventory
```

## Important Notes

⚠️ **Warning**: This operation is **irreversible**. Once deleted, seeded products cannot be recovered unless you re-run the seed command.

✅ **Safe**: Only products with `data_source='manual'` are deleted. All Shopify-imported products (`data_source='shopify'`) are preserved.

## After Deletion

After deleting seeded products:
1. Go to your Inventory page - you should only see Shopify products
2. If you don't see any products, make sure you've:
   - Connected to Shopify
   - Synced products from Shopify
   - Imported products to inventory (using the "Import Products" button)

## Re-seeding Data

If you need to restore the seeded data for testing:

```bash
python manage.py seed_data
```

This will create new seeded products (with `data_source='manual'`).

