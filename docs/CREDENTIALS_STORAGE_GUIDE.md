# API Credentials Storage Guide
## Shopify, Stripe, and Other Integration Credentials

### Overview

API credentials (API keys, secrets, access tokens) for integrations like Shopify, Stripe, etc., are **stored in the database** in the `ShopifyIntegration` model. For security reasons, credentials are **not returned** in API responses.

---

## ✅ Credential Storage

### Database Model

Credentials are stored in the `ShopifyIntegration` table:

```python
class ShopifyIntegration(ShopifyBaseModel):
    store_url = models.CharField(max_length=255)
    api_key = models.CharField(max_length=255)        # ✅ Stored
    api_secret = models.CharField(max_length=255)      # ✅ Stored
    access_token = models.CharField(max_length=255)    # ✅ Stored
    # ... other fields
```

### How Credentials Are Saved

When you connect via `POST /api/shopify/connect/`:

1. **Credentials are received** from the frontend
2. **Connection is tested** with Shopify API
3. **Credentials are saved** to database using `update_or_create()`
4. **Status is updated** to `CONNECTED`

```python
# From connect_view.py
integration, created = ShopifyIntegration.objects.update_or_create(
    tenant_id=tenant_id,
    store_url=store_url,
    defaults={
        'api_key': payload['api_key'],           # ✅ Saved
        'api_secret': payload['api_secret'],      # ✅ Saved
        'access_token': payload['access_token'],  # ✅ Saved
        'status': ShopifyIntegration.STATUS_CONNECTED,
        # ... other fields
    },
)
```

---

## 🔒 Security: Credentials Not Exposed

### Why Credentials Are Hidden

For security reasons, credentials are **intentionally NOT returned** in API responses:

```python
# From connect_view.py - _serialize_integration()
def _serialize_integration(self, integration):
    return {
        'id': integration.id,
        'store_url': integration.store_url,
        'status': integration.status,
        # ❌ api_key NOT included
        # ❌ api_secret NOT included
        # ❌ access_token NOT included
        # ... only non-sensitive fields
    }
```

This is a **security best practice** - never expose credentials in API responses.

---

## ✅ Verifying Credentials Are Stored

### Method 1: API Endpoint (Recommended)

**GET `/api/shopify/credentials/`**

Returns credential status without exposing actual values:

```json
{
    "has_integration": true,
    "store_url": "mystore.myshopify.com",
    "status": "CONNECTED",
    "is_connected": true,
    "credentials": {
        "api_key": {
            "present": true,
            "length": 32,
            "preview": "922a..."
        },
        "api_secret": {
            "present": true,
            "length": 64,
            "preview": "shpss..."
        },
        "access_token": {
            "present": true,
            "length": 64,
            "preview": "shpat..."
        }
    },
    "all_credentials_present": true,
    "message": "Credentials are stored"
}
```

**POST `/api/shopify/credentials/`**

Tests if stored credentials work by making a test API call:

```json
{
    "success": true,
    "message": "Credentials are valid and working",
    "test_result": {
        "shop_name": "My Store",
        "shop_domain": "mystore.myshopify.com"
    }
}
```

### Method 2: Management Command

```bash
# Check all integrations
python manage.py verify_credentials

# Check specific tenant
python manage.py verify_credentials --tenant-id <tenant-uuid>
```

Output:
```
Found 1 integration(s):

Integration: mystore.myshopify.com
  Status: CONNECTED
  Tenant ID: abc123...
  API Key: ✅ Present (length: 32)
  API Secret: ✅ Present (length: 64)
  Access Token: ✅ Present (length: 64)
  ✅ All credentials are present
```

### Method 3: Django Shell

```python
from shopify_integration.models import ShopifyIntegration

integration = ShopifyIntegration.objects.first()

# Check if credentials are present (without exposing them)
print(f"Has credentials: {integration.has_credentials()}")
print(f"Credentials status: {integration.get_credentials_status()}")

# Verify they're actually stored (length check)
print(f"API Key length: {len(integration.api_key) if integration.api_key else 0}")
print(f"API Secret length: {len(integration.api_secret) if integration.api_secret else 0}")
print(f"Access Token length: {len(integration.access_token) if integration.access_token else 0}")
```

---

## 🔧 How Credentials Are Used

### Automatic Usage

When making API calls, credentials are **automatically retrieved** from the database:

```python
# From shopify_api_client.py
integration = ShopifyIntegration.objects.get(...)
access_token = integration.access_token  # ✅ Retrieved from DB
headers = {
    "X-Shopify-Access-Token": access_token,
}
```

### No Manual Retrieval Needed

You don't need to manually fetch credentials - they're automatically used when:
- Syncing data from Shopify
- Pushing data to Shopify
- Testing connections
- Making any API calls

---

## 🛠️ Troubleshooting

### Issue: "Credentials not found"

**Check:**
1. Verify integration exists: `GET /api/shopify/status/`
2. Check credentials endpoint: `GET /api/shopify/credentials/`
3. Run management command: `python manage.py verify_credentials`

**Solution:**
- Re-connect via `POST /api/shopify/connect/` with credentials
- Ensure all three fields are provided: `api_key`, `api_secret`, `access_token`

### Issue: "Credentials stored but API calls fail"

**Check:**
1. Test credentials: `POST /api/shopify/credentials/`
2. Verify credentials are correct (not expired, correct format)
3. Check Shopify app permissions/scopes

**Solution:**
- Update credentials via `POST /api/shopify/connect/`
- Verify Shopify app has required permissions

### Issue: "Credentials missing after connection"

**Check:**
1. Look at backend logs for save confirmation
2. Check database directly: `SELECT api_key, api_secret, access_token FROM shopify_integration;`
3. Verify `update_or_create` is working

**Solution:**
- Check for database transaction issues
- Verify tenant_id is correct
- Check for any validation errors

---

## 🔐 Future: Encryption (Optional Enhancement)

Currently, credentials are stored in **plain text** in the database. For enhanced security, we can add encryption:

### Encryption Utility (Already Created)

```python
# shopify_integration/utils/encryption.py
from cryptography.fernet import Fernet

class CredentialEncryption:
    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        # Encrypts credentials before storage
    
    @classmethod
    def decrypt(cls, ciphertext: str) -> str:
        # Decrypts credentials when retrieved
```

### Encrypted Field Type (Already Created)

```python
# shopify_integration/models/encrypted_fields.py
class EncryptedCharField(models.CharField):
    # Automatically encrypts/decrypts values
```

### To Enable Encryption

1. Update model fields to use `EncryptedCharField`
2. Create migration to encrypt existing credentials
3. Set `CREDENTIAL_ENCRYPTION_KEY` in environment

**Note:** This is optional - current plain text storage works, but encryption adds an extra security layer.

---

## 📋 Summary

✅ **Credentials ARE saved** to the database  
✅ **Credentials ARE used** automatically for API calls  
❌ **Credentials are NOT exposed** in API responses (security)  
✅ **Verification endpoints** available to check credential status  
✅ **Management command** available to verify storage  

---

## 🚀 Quick Verification

```bash
# 1. Check if credentials are stored
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/shopify/credentials/

# 2. Test if credentials work
curl -X POST \
     -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/shopify/credentials/

# 3. Or use management command
python manage.py verify_credentials
```

---

**Status**: ✅ Credentials are stored and working  
**Security**: ✅ Credentials are not exposed in API responses  
**Verification**: ✅ Multiple methods available to verify storage

