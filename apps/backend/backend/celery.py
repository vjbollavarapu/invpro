import os
from celery import Celery
from celery.schedules import crontab, timedelta

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('invpro360')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Import Shopify config for sync intervals
try:
    from shopify_integration.config import (
        SHOPIFY_SYNC_INTERVAL_PRODUCTS,
        SHOPIFY_SYNC_INTERVAL_ORDERS,
        SHOPIFY_SYNC_INTERVAL_CUSTOMERS,
        SHOPIFY_SYNC_INTERVAL_INVENTORY,
    )
except ImportError:
    # Fallback defaults if config not available
    SHOPIFY_SYNC_INTERVAL_PRODUCTS = 3600
    SHOPIFY_SYNC_INTERVAL_ORDERS = 1800
    SHOPIFY_SYNC_INTERVAL_CUSTOMERS = 7200
    SHOPIFY_SYNC_INTERVAL_INVENTORY = 900

# Celery Beat Schedule (for periodic tasks)
app.conf.beat_schedule = {
    # Check low stock every day at 9 AM
    'check-low-stock-daily': {
        'task': 'notifications.tasks.check_low_stock_alerts',
        'schedule': crontab(hour=9, minute=0),
    },
    # Send daily summary every day at 8 AM
    'send-daily-summary': {
        'task': 'notifications.tasks.send_daily_summary',
        'schedule': crontab(hour=8, minute=0),
    },
    # Clean old notifications weekly
    'cleanup-old-notifications': {
        'task': 'notifications.tasks.cleanup_old_notifications',
        'schedule': crontab(day_of_week=1, hour=0, minute=0),
    },
    # Shopify periodic syncs
    'shopify-sync-products': {
        'task': 'shopify_integration.tasks.periodic_sync.sync_shopify_products_periodic',
        'schedule': timedelta(seconds=SHOPIFY_SYNC_INTERVAL_PRODUCTS),
    },
    'shopify-sync-orders': {
        'task': 'shopify_integration.tasks.periodic_sync.sync_shopify_orders_periodic',
        'schedule': timedelta(seconds=SHOPIFY_SYNC_INTERVAL_ORDERS),
    },
    'shopify-sync-customers': {
        'task': 'shopify_integration.tasks.periodic_sync.sync_shopify_customers_periodic',
        'schedule': timedelta(seconds=SHOPIFY_SYNC_INTERVAL_CUSTOMERS),
    },
    'shopify-sync-inventory': {
        'task': 'shopify_integration.tasks.periodic_sync.sync_shopify_inventory_periodic',
        'schedule': timedelta(seconds=SHOPIFY_SYNC_INTERVAL_INVENTORY),
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

