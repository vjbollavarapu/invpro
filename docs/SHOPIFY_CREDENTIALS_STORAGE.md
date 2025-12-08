# Where to Store Shopify Credentials

## 📍 Storage Location

Shopify credentials are stored in the **database** in the `shopify_integration_shopifyintegration` table.

### Database Model

The credentials are stored via the `ShopifyIntegration` model with these fields:

- `store_url` - Your Shopify store URL
- `api_key` - Shopify API key (Client ID)
- `api_secret` - Shopify API secret (Client Secret)
- `access_token` - Shopify access token
- `webhook_secret` - Webhook verification secret
- `tenant_id` - Multi-tenant isolation (each tenant has separate credentials)

### Database Table Structure

```sql
CREATE TABLE shopify_integration_shopifyintegration (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    store_url VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255) NOT NULL,
    access_token VARCHAR(255),
    webhook_secret VARCHAR(255),
    status VARCHAR(32) DEFAULT 'DISCONNECTED',
    -- ... other fields
    UNIQUE(tenant_id, store_url)
);
```

---

## 🔧 How to Add/Store Credentials

You have **3 ways** to store credentials:

### Method 1: Via Web UI (Recommended)

1. **Navigate to**: `http://localhost:3000/dashboard/settings/integrations/shopify`
2. **Click**: "Connect Shopify" button
3. **Enter credentials**:
   - Store URL: `yourstore.myshopify.com`
   - API Key: Your Shopify API key
   - API Secret: Your Shopify API secret
   - Access Token: Your Shopify access token
4. **Click**: "Connect"
5. **Result**: Credentials are saved to the database automatically

**What happens:**
- Credentials are sent to `POST /api/shopify/connect/`
- Backend validates and tests the connection
- If successful, saves to `ShopifyIntegration` table
- Returns connection status

### Method 2: Via API

```bash
POST http://localhost:8000/api/shopify/connect/
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "store_url": "yourstore.myshopify.com",
  "api_key": "your_api_key",
  "api_secret": "your_api_secret",
  "access_token": "your_access_token"
}
```

**Response:**
```json
{
  "id": 1,
  "store_url": "https://yourstore.myshopify.com",
  "status": "CONNECTED",
  "is_connected": true,
  "auto_sync_enabled": true
}
```

### Method 3: Via Django Admin

1. **Navigate to**: `http://localhost:8000/admin/`
2. **Go to**: Shopify Integration → Shopify integrations
3. **Click**: "Add Shopify integration"
4. **Fill in**:
   - Tenant: Select your tenant
   - Store URL: `https://yourstore.myshopify.com`
   - API Key: Your API key
   - API Secret: Your API secret
   - Access Token: Your access token
5. **Click**: "Save"

---

## 🔒 Security Considerations

### Current Implementation

**⚠️ Important**: Credentials are currently stored as **plain text** in the database.

The model fields are:
```python
api_key = models.CharField(max_length=255)  # Plain text
api_secret = models.CharField(max_length=255)  # Plain text
access_token = models.CharField(max_length=255)  # Plain text
```

### Security Best Practices

1. **Database Encryption** (Recommended for Production):
   - Use database-level encryption (PostgreSQL `pgcrypto`)
   - Or use Django's `encrypted_fields` package
   - Encrypt sensitive fields before storing

2. **Environment Variables** (For Development):
   - Never commit credentials to Git
   - Use `.env` files (already in `.gitignore`)
   - Store in secure secret management (AWS Secrets Manager, etc.)

3. **Access Control**:
   - Only authenticated users can add credentials
   - Multi-tenant isolation (each tenant sees only their credentials)
   - Admin access required for Django admin

4. **Audit Logging**:
   - Track when credentials are added/modified
   - Log access to sensitive data

### Recommended: Encrypt Sensitive Fields

To add encryption, you could modify the model:

```python
from encrypted_fields import fields

class ShopifyIntegration(ShopifyBaseModel):
    api_key = fields.EncryptedCharField(max_length=255)
    api_secret = fields.EncryptedCharField(max_length=255)
    access_token = fields.EncryptedCharField(max_length=255)
```

**Install package:**
```bash
pip install django-encrypted-model-fields
```

---

## 📊 Where Credentials Are Used

Once stored, credentials are accessed from:

1. **API Client** (`shopify_api_client.py`):
   ```python
   client = ShopifyApiClient(integration)
   # Uses: integration.access_token, integration.store_url
   ```

2. **Sync Services**:
   - Product sync service
   - Order sync service
   - Customer sync service
   - Inventory sync service

3. **Webhook Service**:
   - Uses `webhook_secret` for HMAC validation

4. **OAuth Flow**:
   - Uses `api_key` and `api_secret` for token exchange

---

## 🔍 Viewing Stored Credentials

### Via API

```bash
GET http://localhost:8000/api/shopify/status/
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response** (credentials are NOT returned for security):
```json
{
  "connected": true,
  "status": "CONNECTED",
  "auto_sync_enabled": true,
  "last_sync_at": "2024-01-15T10:30:00Z"
}
```

### Via Django Admin

1. Go to: `http://localhost:8000/admin/shopify_integration/shopifyintegration/`
2. Click on an integration
3. **⚠️ Warning**: Credentials are visible in plain text in admin

### Via Database Query

```python
from shopify_integration.models import ShopifyIntegration

integration = ShopifyIntegration.objects.get(tenant_id=your_tenant_id)
print(integration.api_key)  # ⚠️ Plain text
print(integration.api_secret)  # ⚠️ Plain text
print(integration.access_token)  # ⚠️ Plain text
```

---

## 🗑️ Removing Credentials

### Via Web UI

1. Go to: `http://localhost:3000/dashboard/settings/integrations/shopify`
2. Click: "Disconnect" button
3. Credentials are deleted from database

### Via API

```bash
DELETE http://localhost:8000/api/shopify/connect/
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "store_url": "yourstore.myshopify.com"
}
```

### Via Django Admin

1. Go to: `http://localhost:8000/admin/shopify_integration/shopifyintegration/`
2. Select integration
3. Click: "Delete"

---

## 📝 Summary

| Aspect | Details |
|--------|---------|
| **Storage Location** | Database table: `shopify_integration_shopifyintegration` |
| **Storage Format** | Plain text (not encrypted by default) |
| **Multi-Tenant** | Each tenant has separate credentials |
| **How to Add** | Web UI, API, or Django Admin |
| **Security** | ⚠️ Consider encryption for production |
| **Access Control** | Authenticated users only, tenant-isolated |

---

## ✅ Recommended Workflow

1. **Development**:
   - Use Web UI to add credentials
   - Test connection
   - Verify sync works

2. **Production**:
   - Add encryption to sensitive fields
   - Use secure secret management
   - Enable audit logging
   - Restrict admin access

3. **Best Practice**:
   - Never commit credentials to Git
   - Rotate credentials regularly
   - Monitor access logs
   - Use OAuth flow when possible (more secure)

---

## 🆘 Troubleshooting

### "Credentials not found"

**Check if credentials exist:**
```bash
cd apps/backend
source venv/bin/activate
python manage.py shell -c "
from shopify_integration.models import ShopifyIntegration
print(ShopifyIntegration.objects.all().values('store_url', 'status'))
"
```

### "Connection fails after saving"

- Verify credentials are correct
- Check if access token is valid
- Ensure store URL format is correct
- Test connection via API client

### "Credentials visible in logs"

- ⚠️ Credentials may appear in Django logs if DEBUG=True
- Set `DEBUG=False` in production
- Use logging filters to exclude sensitive data

---

## 🔐 Security Checklist

- [ ] Credentials stored in database (not in code)
- [ ] Multi-tenant isolation working
- [ ] Access control enforced (authenticated users only)
- [ ] Consider encryption for production
- [ ] Credentials not in Git
- [ ] Admin access restricted
- [ ] Audit logging enabled
- [ ] Regular credential rotation planned

