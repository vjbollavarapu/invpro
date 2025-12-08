"""Django management command to verify Shopify credentials are stored correctly."""

from django.core.management.base import BaseCommand
from shopify_integration.models import ShopifyIntegration


class Command(BaseCommand):
    help = "Verify that Shopify integration credentials are stored in the database"

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=str,
            help='Tenant ID to check (optional, checks all if not provided)',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        
        if tenant_id:
            integrations = ShopifyIntegration.objects.filter(tenant_id=tenant_id)
        else:
            integrations = ShopifyIntegration.objects.all()

        if not integrations.exists():
            self.stdout.write(self.style.WARNING('No Shopify integrations found'))
            return

        self.stdout.write(self.style.SUCCESS(f'\nFound {integrations.count()} integration(s):\n'))

        for integration in integrations:
            self.stdout.write(f"Integration: {integration.store_url}")
            self.stdout.write(f"  Status: {integration.status}")
            self.stdout.write(f"  Tenant ID: {integration.tenant_id}")
            
            cred_status = integration.get_credentials_status()
            self.stdout.write(f"  API Key: {'✅ Present' if cred_status['api_key']['present'] else '❌ Missing'} (length: {cred_status['api_key']['length']})")
            self.stdout.write(f"  API Secret: {'✅ Present' if cred_status['api_secret']['present'] else '❌ Missing'} (length: {cred_status['api_secret']['length']})")
            self.stdout.write(f"  Access Token: {'✅ Present' if cred_status['access_token']['present'] else '❌ Missing'} (length: {cred_status['access_token']['length']})")
            
            if integration.has_credentials():
                self.stdout.write(self.style.SUCCESS('  ✅ All credentials are present'))
            else:
                self.stdout.write(self.style.ERROR('  ❌ Some credentials are missing'))
            
            self.stdout.write('')

