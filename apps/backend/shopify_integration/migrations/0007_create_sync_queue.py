# Generated migration to create sync queue for managing pending operations

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('shopify_integration', '0006_add_sync_tracking_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='SyncQueueItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant_id', models.UUIDField(db_index=True, help_text='Tenant ID for multi-tenant isolation')),
                ('operation', models.CharField(choices=[('push_product', 'Push Product'), ('push_inventory', 'Push Inventory'), ('pull_products', 'Pull Products'), ('pull_orders', 'Pull Orders'), ('import_products', 'Import Products'), ('bidirectional_sync', 'Bidirectional Sync')], help_text='Type of sync operation', max_length=50)),
                ('entity_type', models.CharField(blank=True, help_text='Entity type (products, orders, etc.)', max_length=50)),
                ('entity_id', models.IntegerField(blank=True, help_text='ID of the specific entity to sync', null=True)),
                ('priority', models.IntegerField(choices=[(1, 'Low'), (2, 'Normal'), (3, 'High'), (4, 'Urgent')], default=2, help_text='Priority level for processing')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed'), ('cancelled', 'Cancelled')], db_index=True, default='pending', max_length=20)),
                ('retry_count', models.PositiveIntegerField(default=0, help_text='Number of retry attempts')),
                ('max_retries', models.PositiveIntegerField(default=3, help_text='Maximum number of retry attempts')),
                ('scheduled_at', models.DateTimeField(blank=True, help_text='When to process this item', null=True)),
                ('started_at', models.DateTimeField(blank=True, help_text='When processing started', null=True)),
                ('completed_at', models.DateTimeField(blank=True, help_text='When processing completed', null=True)),
                ('error_message', models.TextField(blank=True, help_text='Error message if operation failed')),
                ('operation_data', models.JSONField(blank=True, default=dict, help_text='Additional data for the operation')),
                ('integration', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='queue_items', to='shopify_integration.shopifyintegration')),
            ],
            options={
                'verbose_name': 'Sync Queue Item',
                'verbose_name_plural': 'Sync Queue Items',
                'ordering': ['-priority', 'scheduled_at', 'created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='syncqueueitem',
            index=models.Index(fields=['integration', 'status', 'priority'], name='shopify_queue_status_idx'),
        ),
        migrations.AddIndex(
            model_name='syncqueueitem',
            index=models.Index(fields=['status', 'scheduled_at'], name='shopify_queue_scheduled_idx'),
        ),
        migrations.AddIndex(
            model_name='syncqueueitem',
            index=models.Index(fields=['tenant_id', 'status'], name='shopify_queue_tenant_idx'),
        ),
    ]

