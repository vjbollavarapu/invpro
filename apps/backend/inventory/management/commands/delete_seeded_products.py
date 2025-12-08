"""
Django management command to delete seeded/mock products.

This command deletes all products that are NOT imported from Shopify,
keeping only Shopify-imported products.

Usage:
    python manage.py delete_seeded_products                    # Delete all non-Shopify products
    python manage.py delete_seeded_products --tenant-id=<uuid>  # Delete for specific tenant
    python manage.py delete_seeded_products --dry-run            # Preview what will be deleted
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from inventory.models import Product


class Command(BaseCommand):
    help = 'Delete all seeded/mock products, keeping only Shopify-imported products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=str,
            help='Tenant ID to delete products for (if not provided, deletes for all tenants)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what will be deleted without actually deleting',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip confirmation prompt',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        dry_run = options.get('dry_run', False)
        force = options.get('force', False)

        # Build query to find non-Shopify products
        queryset = Product.objects.exclude(data_source='shopify')
        
        if tenant_id:
            queryset = queryset.filter(tenant_id=tenant_id)
            self.stdout.write(f"Filtering for tenant: {tenant_id}")

        # Count products to be deleted
        count = queryset.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('✅ No seeded products found. All products are from Shopify.'))
            return

        # Show preview
        self.stdout.write(self.style.WARNING('\n' + '='*80))
        self.stdout.write(self.style.WARNING('🗑️  DELETE SEEDED PRODUCTS'))
        self.stdout.write(self.style.WARNING('='*80))
        self.stdout.write(f'\n📊 Found {count} product(s) to delete:')
        
        # Show sample products
        sample_products = queryset[:10]
        for product in sample_products:
            self.stdout.write(f"   - {product.product_code} - {product.name} (SKU: {product.sku}, Source: {product.data_source})")
        
        if count > 10:
            self.stdout.write(f"   ... and {count - 10} more products")
        
        # Show Shopify products count (will be kept)
        shopify_count = Product.objects.filter(data_source='shopify')
        if tenant_id:
            shopify_count = shopify_count.filter(tenant_id=tenant_id)
        shopify_count = shopify_count.count()
        
        self.stdout.write(f'\n✅ {shopify_count} Shopify product(s) will be kept')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\n🔍 DRY RUN MODE - No products will be deleted'))
            return

        # Confirm deletion
        if not force:
            self.stdout.write(self.style.WARNING('\n⚠️  WARNING: This will permanently delete these products!'))
            confirm = input('Type "DELETE" to confirm: ')
            if confirm != 'DELETE':
                self.stdout.write(self.style.ERROR('❌ Deletion cancelled'))
                return

        # Delete products
        self.stdout.write('\n🗑️  Deleting products...')
        
        with transaction.atomic():
            deleted_count = queryset.count()
            queryset.delete()
            
            self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully deleted {deleted_count} product(s)!'))
            self.stdout.write(self.style.SUCCESS(f'✅ {shopify_count} Shopify product(s) remain in inventory'))

