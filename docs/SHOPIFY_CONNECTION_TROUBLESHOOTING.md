# Shopify Connection Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue 1: "Connection test failed" or "Invalid credentials"

#### Symptoms:
- Error message: "Connection test failed"
- Status remains "DISCONNECTED" or "ERROR"
- No specific error details shown

#### Solutions:

**1. Verify Store URL Format**
- ✅ Correct: `mystore.myshopify.com`
- ✅ Also works: `https://mystore.myshopify.com`
- ❌ Wrong: `mystore.com` or `www.mystore.com`

**2. Check Access Token**
- Access token must be from a **Custom App** or **OAuth App**
- Token must have required scopes:
  - `read_products`, `write_products`
  - `read_orders`, `write_orders`
  - `read_customers`, `write_customers`
  - `read_inventory`, `write_inventory`
- Token should not be expired

**3. Verify API Credentials**
- API Key and API Secret must match the app
- For Custom Apps: Get from Shopify Admin → Settings → Apps → Your App → API credentials
- For OAuth Apps: Get from Shopify Partners Dashboard

**4. Test Connection Manually**

```bash
# Test with curl
curl -X GET "https://YOUR_STORE.myshopify.com/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: YOUR_ACCESS_TOKEN"
```

Expected response:
```json
{
  "shop": {
    "id": 123456,
    "name": "Your Store Name",
    ...
  }
}
```

---

### Issue 2: "Invalid access token" (401 Unauthorized)

#### Symptoms:
- Error: "Invalid access token"
- Status code: 401

#### Solutions:

**1. Regenerate Access Token**
- Go to Shopify Admin → Settings → Apps → Your App
- Click "Admin API access token"
- Click "Reveal token" or regenerate if needed
- Copy the new token

**2. Check Token Type**
- Must be an **Admin API access token** (not a Storefront API token)
- Custom App tokens work immediately
- OAuth tokens require OAuth flow

**3. Verify Token Permissions**
- Token must have all required scopes
- Check in Shopify Admin → Apps → Your App → API access

---

### Issue 3: "Access denied" or "Forbidden" (403)

#### Symptoms:
- Error: "Access denied" or "Forbidden"
- Status code: 403

#### Solutions:

**1. Check API Scopes**
Your app needs these scopes:
- `read_products`
- `write_products`
- `read_orders`
- `write_orders`
- `read_customers`
- `write_customers`
- `read_inventory`
- `write_inventory`

**2. Update App Scopes**
- Go to Shopify Admin → Settings → Apps → Your App
- Click "Configure Admin API scopes"
- Select all required scopes
- Save and reinstall the app
- Get a new access token

---

### Issue 4: "Store not found" (404)

#### Symptoms:
- Error: "Store not found"
- Status code: 404

#### Solutions:

**1. Verify Store URL**
- Must be in format: `mystore.myshopify.com`
- Check for typos
- Ensure store is active (not paused or closed)

**2. Check Store Status**
- Login to Shopify Admin
- Verify store is active
- Check if store is on a development store (may have limitations)

---

### Issue 5: Connection works but status shows "ERROR"

#### Symptoms:
- Connection test passes
- But status shows "ERROR"
- Error count > 0

#### Solutions:

**1. Check Last Error Message**
- View the error message in the integration settings
- Common causes:
  - Rate limiting
  - Network issues
  - API version mismatch

**2. Reset Error Count**
- Disconnect and reconnect
- Or manually reset in database

---

## 🔧 Step-by-Step Debugging

### Step 1: Verify Credentials Format

```bash
# Store URL should be:
mystore.myshopify.com  # ✅ Correct
https://mystore.myshopify.com  # ✅ Also works
mystore.com  # ❌ Wrong
```

### Step 2: Test API Connection Directly

```bash
# Replace with your values
STORE_URL="yourstore.myshopify.com"
ACCESS_TOKEN="your_access_token"

curl -X GET "https://${STORE_URL}/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected Success Response:**
```json
{
  "shop": {
    "id": 123456,
    "name": "Your Store",
    "domain": "yourstore.myshopify.com",
    ...
  }
}
```

**Common Error Responses:**

**401 Unauthorized:**
```json
{
  "errors": "Invalid API key or access token"
}
```
→ Check your access token

**403 Forbidden:**
```json
{
  "errors": "Access denied"
}
```
→ Check API scopes

**404 Not Found:**
```json
{
  "errors": "Not Found"
}
```
→ Check store URL

### Step 3: Check Backend Logs

On production server:
```bash
# Check Django logs
tail -f /var/log/django/error.log

# Or check gunicorn logs
journalctl -u gunicorn -f
```

Look for:
- Connection errors
- API request failures
- Rate limiting messages

### Step 4: Verify Database Entry

```bash
# Connect to database
python manage.py shell

# Check integration
from shopify_integration.models import ShopifyIntegration
integration = ShopifyIntegration.objects.first()
print(f"Store: {integration.store_url}")
print(f"Status: {integration.status}")
print(f"Error: {integration.last_error_message}")
print(f"Error Count: {integration.error_count}")
```

---

## ✅ Verification Checklist

Before connecting, verify:

- [ ] Store URL is correct format: `mystore.myshopify.com`
- [ ] Access token is valid and not expired
- [ ] Access token has all required scopes
- [ ] API Key and Secret match the app
- [ ] Store is active (not paused/closed)
- [ ] Network connectivity to Shopify API
- [ ] No firewall blocking Shopify API requests

---

## 🆘 Still Not Working?

### 1. Check Browser Console

Open browser DevTools (F12) → Console tab:
- Look for JavaScript errors
- Check network requests to `/api/integrations/shopify/connect`
- Verify request payload

### 2. Check Backend Response

In browser DevTools → Network tab:
- Find the connect request
- Check response status code
- Read error message in response body

### 3. Test with API Directly

```bash
# Get your JWT token first
TOKEN="your_jwt_token"
TENANT_ID="your_tenant_id"

# Test connection
curl -X POST "https://api.mangostack.io/api/shopify/connect/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "store_url": "yourstore.myshopify.com",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "access_token": "your_access_token"
  }'
```

### 4. Common Mistakes

❌ **Using Storefront API token instead of Admin API token**
- Storefront tokens can't access admin endpoints
- Solution: Use Admin API access token

❌ **Wrong store URL format**
- Must end with `.myshopify.com`
- Solution: Use format `mystore.myshopify.com`

❌ **Missing required scopes**
- App needs read/write permissions
- Solution: Update app scopes and regenerate token

❌ **Using expired token**
- Tokens can expire or be revoked
- Solution: Generate new access token

---

## 📞 Getting Help

If you've tried all the above and still can't connect:

1. **Collect Information:**
   - Store URL (without sensitive parts)
   - Error message from UI
   - Response from API test (curl command)
   - Backend logs (if accessible)

2. **Check Shopify Status:**
   - Visit: https://status.shopify.com/
   - Ensure Shopify API is operational

3. **Verify App Status:**
   - Check app is installed and active
   - Verify app hasn't been uninstalled

---

## 🔄 Quick Fix: Disconnect and Reconnect

If connection is stuck:

1. Click "Disconnect" in the UI
2. Wait a few seconds
3. Re-enter all credentials
4. Click "Connect" again

This clears any cached errors and resets the connection state.

---

**Last Updated:** 2025-01-27

