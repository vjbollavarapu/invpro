from django.db import models
from common.models import TenantAwareModel


class ShopifyIntegration(TenantAwareModel):
    """
    Shopify integration configuration for each tenant.
    """
    store_url = models.CharField(max_length=255, help_text="Shopify store URL (e.g., mystore.myshopify.com)")
    api_key = models.CharField(max_length=255, help_text="Shopify API key")
    api_secret = models.CharField(max_length=255, help_text="Shopify API secret")
    access_token = models.CharField(max_length=255, blank=True, help_text="Shopify access token")
    
    STATUS_CHOICES = [
        ('DISCONNECTED', 'Disconnected'),
        ('CONNECTED', 'Connected'),
        ('SYNCING', 'Syncing'),
        ('ERROR', 'Error'),
        ('PAUSED', 'Paused'),
    ]
    status = models.CharField(max_length=40, choices=STATUS_CHOICES, default="DISCONNECTED")
    
    last_sync = models.DateTimeField(null=True, blank=True, help_text="Last successful sync")
    last_sync_products = models.DateTimeField(null=True, blank=True)
    last_sync_orders = models.DateTimeField(null=True, blank=True)
    last_sync_customers = models.DateTimeField(null=True, blank=True)
    last_sync_inventory = models.DateTimeField(null=True, blank=True)
    
    # Sync settings
    auto_sync_enabled = models.BooleanField(default=True, help_text="Enable automatic syncing")
    sync_products = models.BooleanField(default=True, help_text="Sync products")
    sync_orders = models.BooleanField(default=True, help_text="Sync orders")
    sync_customers = models.BooleanField(default=True, help_text="Sync customers")
    sync_inventory = models.BooleanField(default=True, help_text="Sync inventory levels")
    
    # Webhook settings
    webhook_secret = models.CharField(max_length=255, blank=True, help_text="Webhook secret for verification")
    webhooks_enabled = models.BooleanField(default=True, help_text="Enable webhooks for real-time updates")
    
    # Error tracking
    last_error = models.TextField(blank=True, help_text="Last error message")
    error_count = models.IntegerField(default=0, help_text="Number of consecutive errors")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('tenant_id', 'store_url')
        verbose_name = 'Shopify Integration'
        verbose_name_plural = 'Shopify Integrations'
    
    def __str__(self):
        return f"{self.tenant.name} - {self.store_url}"
    
    @property
    def is_connected(self):
        return self.status == 'CONNECTED'
    
    @property
    def needs_sync(self):
        """Check if integration needs syncing based on last sync time"""
        if not self.last_sync:
            return True
        
        # Sync if last sync was more than 1 hour ago
        from django.utils import timezone
        return (timezone.now() - self.last_sync).total_seconds() > 3600


class ShopifySyncLog(TenantAwareModel):
    """
    Log of Shopify synchronization activities.
    """
    integration = models.ForeignKey(ShopifyIntegration, on_delete=models.CASCADE, related_name='sync_logs')
    
    SYNC_TYPE_CHOICES = [
        ('FULL', 'Full Sync'),
        ('PRODUCTS', 'Products'),
        ('ORDERS', 'Orders'),
        ('CUSTOMERS', 'Customers'),
        ('INVENTORY', 'Inventory'),
    ]
    
    sync_type = models.CharField(max_length=20, choices=SYNC_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=[
        ('STARTED', 'Started'),
        ('SUCCESS', 'Success'),
        ('ERROR', 'Error'),
        ('PARTIAL', 'Partial Success'),
    ])
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    items_processed = models.IntegerField(default=0)
    items_created = models.IntegerField(default=0)
    items_updated = models.IntegerField(default=0)
    items_failed = models.IntegerField(default=0)
    
    # Error details
    error_message = models.TextField(blank=True)
    error_details = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-started_at']
        verbose_name = 'Shopify Sync Log'
        verbose_name_plural = 'Shopify Sync Logs'
    
    def __str__(self):
        return f"{self.integration.store_url} - {self.sync_type} - {self.status}"
    
    @property
    def duration(self):
        if self.completed_at and self.started_at:
            return self.completed_at - self.started_at
        return None


class StripeIntegration(TenantAwareModel):
    """
    Stripe payment integration configuration for each tenant.
    """
    publishable_key = models.CharField(max_length=255, help_text="Stripe publishable key")
    secret_key = models.CharField(max_length=255, help_text="Stripe secret key")
    webhook_secret = models.CharField(max_length=255, blank=True, help_text="Stripe webhook secret")
    
    STATUS_CHOICES = [
        ('DISCONNECTED', 'Disconnected'),
        ('CONNECTED', 'Connected'),
        ('ERROR', 'Error'),
        ('PAUSED', 'Paused'),
    ]
    status = models.CharField(max_length=40, choices=STATUS_CHOICES, default="DISCONNECTED")
    
    # Settings
    test_mode = models.BooleanField(default=True, help_text="Use Stripe test mode")
    auto_capture = models.BooleanField(default=True, help_text="Automatically capture payments")
    enable_webhooks = models.BooleanField(default=True, help_text="Enable webhook processing")
    
    # Error tracking
    last_error = models.TextField(blank=True, help_text="Last error message")
    error_count = models.IntegerField(default=0, help_text="Number of consecutive errors")
    last_test_at = models.DateTimeField(null=True, blank=True, help_text="Last connection test")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('tenant_id',)
        verbose_name = 'Stripe Integration'
        verbose_name_plural = 'Stripe Integrations'
    
    def __str__(self):
        return f"{self.tenant_id} - Stripe ({'Test' if self.test_mode else 'Live'})"
    
    @property
    def is_connected(self):
        return self.status == 'CONNECTED'


class EmailServiceIntegration(TenantAwareModel):
    """
    Email service (SMTP) integration configuration for each tenant.
    """
    service_provider = models.CharField(
        max_length=50,
        choices=[
            ('SMTP', 'SMTP'),
            ('SENDGRID', 'SendGrid'),
            ('MAILGUN', 'Mailgun'),
            ('AWS_SES', 'AWS SES'),
            ('GMAIL', 'Gmail'),
        ],
        default='SMTP',
        help_text="Email service provider"
    )
    
    # SMTP Settings
    smtp_host = models.CharField(max_length=255, help_text="SMTP server host")
    smtp_port = models.IntegerField(default=587, help_text="SMTP server port")
    smtp_username = models.CharField(max_length=255, help_text="SMTP username/email")
    smtp_password = models.CharField(max_length=255, help_text="SMTP password")
    use_tls = models.BooleanField(default=True, help_text="Use TLS encryption")
    use_ssl = models.BooleanField(default=False, help_text="Use SSL encryption")
    
    # Service-specific API keys (for SendGrid, Mailgun, etc.)
    api_key = models.CharField(max_length=255, blank=True, help_text="Service API key")
    api_secret = models.CharField(max_length=255, blank=True, help_text="Service API secret")
    
    # From address
    from_email = models.EmailField(help_text="Default from email address")
    from_name = models.CharField(max_length=255, blank=True, help_text="Default from name")
    
    STATUS_CHOICES = [
        ('DISCONNECTED', 'Disconnected'),
        ('CONNECTED', 'Connected'),
        ('ERROR', 'Error'),
        ('PAUSED', 'Paused'),
    ]
    status = models.CharField(max_length=40, choices=STATUS_CHOICES, default="DISCONNECTED")
    
    # Settings
    enable_sending = models.BooleanField(default=True, help_text="Enable email sending")
    daily_limit = models.IntegerField(default=1000, help_text="Daily email sending limit")
    emails_sent_today = models.IntegerField(default=0, help_text="Emails sent today")
    last_reset_date = models.DateField(null=True, blank=True, help_text="Last date emails_sent_today was reset")
    
    # Error tracking
    last_error = models.TextField(blank=True, help_text="Last error message")
    error_count = models.IntegerField(default=0, help_text="Number of consecutive errors")
    last_test_at = models.DateTimeField(null=True, blank=True, help_text="Last connection test")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('tenant_id',)
        verbose_name = 'Email Service Integration'
        verbose_name_plural = 'Email Service Integrations'
    
    def __str__(self):
        return f"{self.tenant_id} - {self.service_provider} ({self.from_email})"
    
    @property
    def is_connected(self):
        return self.status == 'CONNECTED'
    
    @property
    def can_send_email(self):
        """Check if email can be sent based on daily limit"""
        from django.utils import timezone
        from datetime import date
        
        # Reset counter if it's a new day
        today = date.today()
        if self.last_reset_date != today:
            self.emails_sent_today = 0
            self.last_reset_date = today
            self.save(update_fields=['emails_sent_today', 'last_reset_date'])
        
        return self.is_connected and self.enable_sending and self.emails_sent_today < self.daily_limit
