# Generated migration to add source tracking fields for multi-integration support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='data_source',
            field=models.CharField(
                choices=[
                    ('shopify', 'Shopify'),
                    ('xero', 'Xero'),
                    ('manual', 'Manual'),
                ],
                default='manual',
                help_text='Source of this product data',
                max_length=50,
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='source_id',
            field=models.CharField(
                blank=True,
                help_text='ID of the source record in the integration table (e.g., ShopifyProduct.id)',
                max_length=100,
            ),
        ),
        migrations.AddField(
            model_name='product',
            name='last_imported_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last import from integration source',
                null=True,
            ),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(
                fields=['data_source', 'source_id'],
                name='product_source_idx',
            ),
        ),
    ]

