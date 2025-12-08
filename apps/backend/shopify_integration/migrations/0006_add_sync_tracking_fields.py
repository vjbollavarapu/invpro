# Generated migration to add sync tracking fields for bidirectional sync

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shopify_integration', '0005_alter_shopifyintegration_api_version_and_more'),
    ]

    operations = [
        # Add sync tracking fields to ShopifyProduct
        migrations.AddField(
            model_name='shopifyproduct',
            name='sync_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('synced', 'Synced'),
                    ('conflict', 'Conflict'),
                    ('error', 'Error'),
                ],
                default='pending',
                help_text='Sync status for bidirectional synchronization',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='last_pulled_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last successful pull from Shopify',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='last_pushed_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last successful push to Shopify',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='pending_push',
            field=models.BooleanField(
                default=False,
                help_text='Whether this product has pending changes to push to Shopify',
            ),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='last_push_error',
            field=models.TextField(
                blank=True,
                help_text='Error message from last failed push attempt',
            ),
        ),
        migrations.AddField(
            model_name='shopifyproduct',
            name='conflict_data',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Stores conflict information when sync conflicts are detected',
            ),
        ),
        # Add sync tracking fields to ShopifyInventoryLevel
        migrations.AddField(
            model_name='shopifyinventorylevel',
            name='sync_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('synced', 'Synced'),
                    ('conflict', 'Conflict'),
                    ('error', 'Error'),
                ],
                default='pending',
                help_text='Sync status for bidirectional synchronization',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='shopifyinventorylevel',
            name='last_pulled_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last successful pull from Shopify',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='shopifyinventorylevel',
            name='last_pushed_at',
            field=models.DateTimeField(
                blank=True,
                help_text='Timestamp of last successful push to Shopify',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='shopifyinventorylevel',
            name='pending_push',
            field=models.BooleanField(
                default=False,
                help_text='Whether this inventory level has pending changes to push to Shopify',
            ),
        ),
        migrations.AddField(
            model_name='shopifyinventorylevel',
            name='last_push_error',
            field=models.TextField(
                blank=True,
                help_text='Error message from last failed push attempt',
            ),
        ),
        # Add indexes for sync status queries
        migrations.AddIndex(
            model_name='shopifyproduct',
            index=models.Index(
                fields=['sync_status', 'pending_push'],
                name='shopify_prod_sync_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='shopifyinventorylevel',
            index=models.Index(
                fields=['sync_status', 'pending_push'],
                name='shopify_inv_sync_idx',
            ),
        ),
    ]

