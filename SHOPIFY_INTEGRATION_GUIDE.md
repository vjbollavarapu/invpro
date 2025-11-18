# Shopify Integration Configuration Guide

## Required Environment Variables

### Backend Configuration (`apps/backend/.env`)

```env
# Shopify Integration Settings
SHOPIFY_API_VERSION=2024-01                    # Shopify API version
SHOPIFY_WEBHOOK_BASE_URL=http://localhost:8000 # Base URL for webhooks
SHOPIFY_MAX_REQUESTS_PER_SECOND=40             # Rate limiting (Shopify's limit)
SHOPIFY_SYNC_INTERVAL_PRODUCTS=3600            # Products sync interval (seconds)
SHOPIFY_SYNC_INTERVAL_ORDERS=1800              # Orders sync interval (seconds)
SHOPIFY_SYNC_INTERVAL_CUSTOMERS=7200           # Customers sync interval (seconds)
SHOPIFY_SYNC_INTERVAL_INVENTORY=900            # Inventory sync interval (seconds)
SHOPIFY_MAX_RETRY_ATTEMPTS=3                   # Max retry attempts for failed requests
SHOPIFY_RETRY_DELAY=5                          # Retry delay in seconds
SHOPIFY_DEBUG_LOGGING=False                   # Enable debug logging
SHOPIFY_LOG_LEVEL=INFO                         # Log level (DEBUG, INFO, WARNING, ERROR)
```

### Frontend Configuration (`apps/frontend/.env.local`)

```env
# Shopify Integration (Frontend)
NEXT_PUBLIC_SHOPIFY_ENABLED=true              # Enable Shopify features
NEXT_PUBLIC_SHOPIFY_API_VERSION=2024-01        # API version for frontend
NEXT_PUBLIC_SHOPIFY_SYNC_INTERVAL=300000       # Sync interval (milliseconds)
NEXT_PUBLIC_SHOPIFY_UI_ENABLED=true            # Enable Shopify UI components
NEXT_PUBLIC_SHOPIFY_DASHBOARD_WIDGET=true      # Show dashboard widget
NEXT_PUBLIC_SHOPIFY_NOTIFICATIONS=true         # Enable Shopify notifications
```

## Shopify App Setup

### 1. Create Shopify App

1. Go to [Shopify Partner Dashboard](https://partners.shopify.com/)
2. Create a new app
3. Choose "Public app" or "Custom app" based on your needs

### 2. Required Scopes

Configure these scopes in your Shopify app:

```json
{
  "scopes": [
    "read_products",
    "write_products", 
    "read_orders",
    "write_orders",
    "read_customers",
    "write_customers",
    "read_inventory",
    "write_inventory",
    "read_locations",
    "read_fulfillments",
    "write_fulfillments"
  ]
}
```

### 3. Webhook Configuration

Set up webhooks for real-time updates:

| Topic | Endpoint |
|-------|----------|
| `products/create` | `{BASE_URL}/api/integrations/shopify/webhook/` |
| `products/update` | `{BASE_URL}/api/integrations/shopify/webhook/` |
| `orders/create` | `{BASE_URL}/api/integrations/shopify/webhook/` |
| `orders/updated` | `{BASE_URL}/api/integrations/shopify/webhook/` |
| `customers/create` | `{BASE_URL}/api/integrations/shopify/webhook/` |
| `customers/update` | `{BASE_URL}/api/integrations/shopify/webhook/` |
| `inventory_levels/update` | `{BASE_URL}/api/integrations/shopify/webhook/` |

### 4. OAuth Configuration

For OAuth flow (if needed):

1. Set redirect URL: `{BASE_URL}/api/integrations/shopify/oauth/callback/`
2. Configure allowed domains
3. Set up OAuth scopes

## Connection Process

### 1. Get Credentials

From your Shopify app settings, collect:

- **Store URL**: `mystore.myshopify.com`
- **API Key**: Client ID from app settings
- **API Secret**: Client Secret from app settings  
- **Access Token**: From OAuth flow or app installation

### 2. Connect via UI

1. Navigate to Settings → Integrations → Shopify
2. Click "Connect Shopify"
3. Enter credentials:
   - Store URL: `mystore.myshopify.com`
   - API Key: Your app's client ID
   - API Secret: Your app's client secret
   - Access Token: Your access token
4. Click "Connect"

### 3. Test Connection

The system will automatically test the connection and verify:
- Store accessibility
- API credentials validity
- Required permissions

## Sync Configuration

### 1. Sync Types

- **Full Sync**: All data types
- **Products**: Product information and variants
- **Orders**: Order details and line items
- **Customers**: Customer profiles and addresses
- **Inventory**: Real-time stock levels

### 2. Sync Settings

Configure what to sync:

```python
# In ShopifyIntegration model
sync_products = True      # Sync products
sync_orders = True        # Sync orders  
sync_customers = True     # Sync customers
sync_inventory = True     # Sync inventory levels
auto_sync_enabled = True  # Enable automatic syncing
```

### 3. Sync Intervals

Set sync intervals via environment variables:

```env
SHOPIFY_SYNC_INTERVAL_PRODUCTS=3600   # 1 hour
SHOPIFY_SYNC_INTERVAL_ORDERS=1800     # 30 minutes
SHOPIFY_SYNC_INTERVAL_CUSTOMERS=7200  # 2 hours
SHOPIFY_SYNC_INTERVAL_INVENTORY=900   # 15 minutes
```

## Data Mapping

### Products

| Shopify Field | Internal Field | Notes |
|---------------|----------------|-------|
| `id` | `shopify_id` | Shopify product ID |
| `title` | `name` | Product name |
| `body_html` | `description` | Product description |
| `product_type` | `category` | Product category |
| `variants[0].sku` | `sku` | Product SKU |
| `variants[0].price` | `selling_price` | Selling price |
| `variants[0].cost_price` | `unit_cost` | Cost price |
| `variants[0].inventory_quantity` | `quantity` | Stock quantity |
| `variants[0].inventory_item_id` | `shopify_inventory_item_id` | Inventory item ID |

### Orders

| Shopify Field | Internal Field | Notes |
|---------------|----------------|-------|
| `id` | `shopify_id` | Shopify order ID |
| `name` | `shopify_order_number` | Order number |
| `total_price` | `total_amount` | Order total |
| `fulfillment_status` | `status` | Mapped to internal status |
| `customer.id` | `shopify_customer_id` | Customer ID |
| `customer.email` | `customer_email` | Customer email |

### Customers

| Shopify Field | Internal Field | Notes |
|---------------|----------------|-------|
| `id` | `shopify_id` | Shopify customer ID |
| `first_name + last_name` | `name` | Full name |
| `email` | `email` | Email address |
| `phone` | `phone` | Phone number |
| `default_address` | `address` | Formatted address |

## Error Handling

### 1. Rate Limiting

- Respects Shopify's 40 requests/second limit
- Configurable via `SHOPIFY_MAX_REQUESTS_PER_SECOND`
- Automatic retry with exponential backoff

### 2. Retry Logic

- Configurable retry attempts via `SHOPIFY_MAX_RETRY_ATTEMPTS`
- Retry delay via `SHOPIFY_RETRY_DELAY`
- Exponential backoff for failed requests

### 3. Error Logging

- Comprehensive error logging
- Configurable log levels
- Error tracking in sync logs

## Monitoring

### 1. Sync Logs

View sync activity:

```python
# Get recent sync logs
logs = ShopifySyncLog.objects.filter(
    tenant_id=tenant_id
).order_by('-started_at')[:50]
```

### 2. Status Monitoring

Check integration status:

```python
# Get integration status
integration = ShopifyIntegration.objects.get(tenant_id=tenant_id)
status = {
    'connected': integration.is_connected,
    'last_sync': integration.last_sync,
    'error_count': integration.error_count,
    'last_error': integration.last_error
}
```

### 3. Performance Metrics

Track sync performance:

- Items processed per sync
- Sync duration
- Success/failure rates
- Error frequency

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify store URL format
   - Check API credentials
   - Ensure app has required scopes

2. **Rate Limited**
   - Reduce sync frequency
   - Increase `SHOPIFY_MAX_REQUESTS_PER_SECOND`
   - Check for concurrent syncs

3. **Data Not Syncing**
   - Check sync settings
   - Verify webhook configuration
   - Review sync logs for errors

4. **Webhook Issues**
   - Verify webhook URLs are accessible
   - Check webhook secret configuration
   - Ensure proper SSL certificates

### Debug Mode

Enable debug logging:

```env
SHOPIFY_DEBUG_LOGGING=True
SHOPIFY_LOG_LEVEL=DEBUG
```

This will provide detailed logs for troubleshooting.
