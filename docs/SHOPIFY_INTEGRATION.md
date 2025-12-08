# Shopify Integration Guide

Complete guide for setting up and using the Shopify integration.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Credentials Setup](#credentials-setup)
3. [Connection](#connection)
4. [Bidirectional Sync](#bidirectional-sync)
5. [Troubleshooting](#troubleshooting)
6. [API Reference](#api-reference)

---

## Quick Start

### 1. Get Shopify Credentials

**Option A: Custom App (Recommended for Development)**
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps" → "Create an app"
3. Configure Admin API scopes:
   - `read_products`, `write_products`
   - `read_orders`, `write_orders`
   - `read_customers`, `write_customers`
   - `read_inventory`, `write_inventory`
4. Install app and copy:
   - API Key (Client ID)
   - API Secret (Client Secret)
   - Admin API access token

**Option B: OAuth App (Recommended for Production)**
1. Create app in Shopify Partners dashboard
2. Configure OAuth redirect URL
3. Use OAuth flow to get access token

### 2. Connect Integration

```bash
POST /api/shopify/connect/
{
  "store_url": "mystore.myshopify.com",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "access_token": "your_access_token"
}
```

### 3. Sync Data

```bash
# Full sync
POST /api/shopify/sync/
{"type": "full"}

# Sync specific entity
POST /api/shopify/sync/
{"type": "products"}
```

---

## Credentials Setup

### Storing Credentials

Credentials are automatically saved to the database when you connect. They are:
- ✅ Stored securely in `ShopifyIntegration` model
- ✅ Not exposed in API responses (security)
- ✅ Automatically used for API calls

### Verifying Credentials

**Check if credentials are stored:**
```bash
GET /api/shopify/credentials/
```

**Test if credentials work:**
```bash
POST /api/shopify/credentials/
```

**Using management command:**
```bash
python manage.py verify_credentials
```

### Credentials Management

- Credentials are stored in plain text (encryption available for future)
- Never commit credentials to Git
- Use environment variables for sensitive data
- Rotate credentials regularly

---

## Connection

### Connection Status

```bash
GET /api/shopify/status/
```

Response includes:
- Connection status
- Store URL
- Sync settings
- Last sync timestamp
- Error count

### Disconnect

```bash
DELETE /api/shopify/connect/
```

---

## Bidirectional Sync

### Overview

The system supports bidirectional sync:
- **Pull**: Fetch data from Shopify
- **Push**: Send data to Shopify
- **Import**: Transform Shopify data to common tables
- **Bidirectional**: Automatic two-way sync with conflict resolution

### Push Operations

**Push Products:**
```bash
POST /api/shopify/push/products/
{"product_ids": [1, 2, 3]}  # Optional, pushes all if omitted
```

**Push Inventory:**
```bash
POST /api/shopify/push/inventory/
{"inventory_ids": [1, 2, 3]}  # Optional
```

### Import Operations

**Import to Common Tables:**
```bash
POST /api/shopify/import/products/
{"product_ids": [1, 2, 3]}  # Optional
```

### Bidirectional Sync

**Full Bidirectional Sync:**
```bash
POST /api/shopify/sync/bidirectional/
{
  "entity_types": ["products", "inventory"],
  "conflict_strategy": "last_write_wins",
  "auto_resolve": true
}
```

**Conflict Resolution:**
```bash
# List conflicts
GET /api/shopify/conflicts/products/

# Resolve conflict
POST /api/shopify/conflicts/products/123/resolve/
{
  "strategy": "use_local"  # or "use_remote", "merge"
}
```

---

## Troubleshooting

### Connection Issues

**"Connection test failed"**
- ✅ Check store URL format: `store.myshopify.com` (no https://, no trailing slash)
- ✅ Verify access token is correct and not expired
- ✅ Ensure app has required scopes installed
- ✅ Check store is active (not paused)

**"Invalid credentials"**
- ✅ Ensure API Key and Secret are from the same app
- ✅ Verify access token matches the store
- ✅ Check for extra spaces when copying

**"Rate limit exceeded"**
- ✅ Wait a few seconds and try again
- ✅ Check sync intervals in settings

### Sync Issues

**"Failed to sync data"**
- ✅ Check credentials are valid
- ✅ ✅ Check sync logs: `GET /api/shopify/logs/`
- ✅ Verify integration status: `GET /api/shopify/status/`

**"No sync logs present"**
- ✅ Trigger a manual sync first
- ✅ Check if sync is enabled in settings
- ✅ Verify integration is connected

### JWT Token Issues

**"Token expired"**
- ✅ Log out and log back in
- ✅ Check token refresh endpoint
- ✅ Verify JWT settings in backend

---

## API Reference

### Endpoints

**Connection:**
- `POST /api/shopify/connect/` - Connect to Shopify
- `DELETE /api/shopify/connect/` - Disconnect
- `GET /api/shopify/status/` - Get status
- `GET /api/shopify/credentials/` - Verify credentials
- `POST /api/shopify/credentials/` - Test credentials

**Sync:**
- `POST /api/shopify/sync/` - Trigger sync
- `GET /api/shopify/logs/` - Get sync logs
- `POST /api/shopify/push/<entity>/` - Push to Shopify
- `POST /api/shopify/import/<entity>/` - Import to common tables
- `POST /api/shopify/sync/bidirectional/` - Bidirectional sync

**Monitoring:**
- `GET /api/shopify/monitoring/` - Health and metrics
- `POST /api/shopify/retry/` - Retry failed operations
- `GET /api/shopify/queue/` - Queue status
- `POST /api/shopify/queue/` - Process queue

**Conflicts:**
- `GET /api/shopify/conflicts/<entity>/` - List conflicts
- `POST /api/shopify/conflicts/<entity>/<id>/resolve/` - Resolve conflict

**Webhooks:**
- `POST /api/shopify/webhook/` - Receive webhooks from Shopify

---

## Implementation Phases

### Phase 1: Push Operations ✅
- Push products to Shopify
- Push inventory levels to Shopify
- Status tracking and error handling

### Phase 2: Import Operations ✅
- Import Shopify data to common tables
- Transform and normalize data
- Source tracking

### Phase 3: Bidirectional Sync ✅
- Automatic two-way sync
- Conflict detection
- Conflict resolution strategies

### Phase 4: Advanced Features ✅
- Webhook confirmations
- Retry mechanism
- Queue management
- Monitoring and metrics

---

## Additional Resources

- [Bidirectional Sync Roadmap](./BIDIRECTIONAL_SYNC_ROADMAP.md)
- [Phase Implementation Guides](./PHASE1_IMPLEMENTATION_COMPLETE.md)
- [Credentials Storage Guide](./CREDENTIALS_STORAGE_GUIDE.md)
- [Shopify API Documentation](https://shopify.dev/docs/api/admin-rest)

---

**Last Updated**: January 2025  
**Status**: ✅ Production Ready

