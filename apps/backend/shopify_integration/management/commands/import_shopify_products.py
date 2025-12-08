"""
Django management command to import Shopify products to the common Product table.

Usage:
    python manage.py import_shopify_products                    # Import all Shopify products
    python manage.py import_shopify_products --tenant-id=<uuid>  # Import for specific tenant
    python manage.py import_shopify_products --dry-run            # Preview what will be imported
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from shopify_integration.models import ShopifyIntegration, ShopifyProduct
from shopify_integration.services import ProductImportService


class Command(BaseCommand):
    help = 'Import Shopify products to the common Product table'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=str,
            help='Tenant ID to import products for (if not provided, imports for all tenants)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what will be imported without actually importing',
        )
        parser.add_argument(
            '--merge-strategy',
            type=str,
            choices=['last_write_wins', 'skip', 'overwrite'],
            default='last_write_wins',
            help='Strategy for handling conflicts (default: last_write_wins)',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        dry_run = options.get('dry_run', False)
        merge_strategy = options.get('merge_strategy', 'last_write_wins')

        # Get integrations
        integrations = ShopifyIntegration.objects.filter(status=ShopifyIntegration.STATUS_CONNECTED)
        
        if tenant_id:
            integrations = integrations.filter(tenant_id=tenant_id)
            self.stdout.write(f"Filtering for tenant: {tenant_id}")

        if not integrations.exists():
            self.stdout.write(self.style.ERROR('❌ No connected Shopify integrations found.'))
            self.stdout.write(self.style.WARNING('Please connect to Shopify first.'))
            return

        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('📦 IMPORT SHOPIFY PRODUCTS'))
        self.stdout.write(self.style.SUCCESS('='*80))

        for integration in integrations:
            self.stdout.write(f'\n🏪 Store: {integration.store_url}')
            
            # Count products to import
            shopify_products = ShopifyProduct.objects.filter(integration=integration)
            count = shopify_products.count()
            
            if count == 0:
                self.stdout.write(self.style.WARNING(f'   ⚠️  No products synced for this store. Sync products first.'))
                continue

            self.stdout.write(f'   📊 Found {count} product(s) to import:')
            
            # Show sample products
            sample_products = shopify_products[:5]
            for product in sample_products:
                self.stdout.write(f"      - {product.title} (ID: {product.shopify_product_id})")
            
            if count > 5:
                self.stdout.write(f"      ... and {count - 5} more products")

            if dry_run:
                self.stdout.write(self.style.WARNING(f'\n   🔍 DRY RUN MODE - No products will be imported'))
                continue

            # Import products
            self.stdout.write(f'\n   📥 Importing products...')
            
            try:
                import_service = ProductImportService(integration)
                results = import_service.import_batch(merge_strategy=merge_strategy)
                
                self.stdout.write(self.style.SUCCESS(f'   ✅ Imported {results["created"]} new product(s)'))
                if results["updated"] > 0:
                    self.stdout.write(self.style.SUCCESS(f'   ✅ Updated {results["updated"]} existing product(s)'))
                if results["skipped"] > 0:
                    self.stdout.write(self.style.WARNING(f'   ⏭️  Skipped {results["skipped"]} product(s)'))
                if results.get("errors"):
                    self.stdout.write(self.style.ERROR(f'   ❌ {len(results["errors"])} error(s) occurred'))
                    for error in results["errors"][:3]:
                        self.stdout.write(self.style.ERROR(f'      - {error.get("title", "Unknown")}: {error.get("error", "Unknown error")}'))
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Error importing products: {str(e)}'))

        if not dry_run:
            self.stdout.write(self.style.SUCCESS('\n' + '='*80))
            self.stdout.write(self.style.SUCCESS('🎉 IMPORT COMPLETE!'))
            self.stdout.write(self.style.SUCCESS('='*80))
            self.stdout.write(self.style.SUCCESS('\n✅ Products are now available in your Inventory page!'))

