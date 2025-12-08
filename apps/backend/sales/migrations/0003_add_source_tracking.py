# Generated migration to add source tracking fields for multi-integration support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales', '0002_initial'),
    ]

    operations = [
        # Add source tracking to Customer
        migrations.AddField(
            model_name='customer',
            name='data_source',
            field=models.CharField(
                choices=[
                    ('shopify', 'Shopify'),
                    ('xero', 'Xero'),
                    ('manual', 'Manual'),
                ],
                default='manual',
                help_text='Source of this customer data',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='customer',
            name='source_id',
            field=models.CharField(
                blank=True,
                help_text='ID of the source record in the integration table (e.g., ShopifyCustomer.id)',
                max_length=100,
            ),
        ),
        migrations.AddField(
            model_name='customer',
            name='last_imported_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last import from integration source',
                null=True,
            ),
        ),
        migrations.AddIndex(
            model_name='customer',
            index=models.Index(
                fields=['data_source', 'source_id'],
                name='customer_source_idx',
            ),
        ),
        # Add source tracking to Order
        migrations.AddField(
            model_name='order',
            name='data_source',
            field=models.CharField(
                choices=[
                    ('shopify', 'Shopify'),
                    ('xero', 'Xero'),
                    ('manual', 'Manual'),
                ],
                default='manual',
                help_text='Source of this order data',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='source_id',
            field=models.CharField(
                blank=True,
                help_text='ID of the source record in the integration table (e.g., ShopifyOrder.id)',
                max_length=100,
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='last_imported_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last import from integration source',
                null=True,
            ),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(
                fields=['data_source', 'source_id'],
                name='order_source_idx',
            ),
        ),
    ]

