# Quick Guide: Delete Seeded Products

## To delete all seeded/mock products and keep only Shopify products:

```bash
cd apps/backend
source venv/bin/activate
python manage.py delete_seeded_products
```

Type "DELETE" when prompted to confirm.

## To preview what will be deleted first:

```bash
python manage.py delete_seeded_products --dry-run
```

This shows you what will be deleted without actually deleting anything.

## After deletion:

1. Go to Inventory page - you should only see Shopify products
2. If no products show, make sure you've:
   - Synced products from Shopify (Settings → Integrations → Shopify → Sync tab)
   - Imported products to inventory (Settings → Integrations → Shopify → Sync tab → "Import Products" button)
