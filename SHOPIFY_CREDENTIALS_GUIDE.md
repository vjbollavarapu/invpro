# How to Get and Add Shopify API Credentials

This guide explains how to obtain Shopify API credentials and add them to your application.

## 📋 Table of Contents

1. [Method 1: Custom App (Recommended for Development)](#method-1-custom-app-recommended-for-development)
2. [Method 2: OAuth App (Recommended for Production)](#method-2-oauth-app-recommended-for-production)
3. [Adding Credentials to Your Application](#adding-credentials-to-your-application)
4. [Troubleshooting](#troubleshooting)

---

## Method 1: Custom App (Recommended for Development)

**Best for**: Development, testing, or single-store integrations

### Step 1: Access Your Shopify Admin

1. Log in to your Shopify store admin panel
2. Go to **Settings** → **Apps and sales channels**
3. Click **Develop apps** (at the bottom of the page)

### Step 2: Create a Custom App

1. Click **Create an app**
2. Enter an app name (e.g., "InvPro360 Integration")
3. Enter your developer email (optional)
4. Click **Create app**

### Step 3: Configure API Scopes

1. Click **Configure Admin API scopes**
2. Select the following scopes:
   - ✅ `read_products`
   - ✅ `write_products`
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_customers`
   - ✅ `write_customers`
   - ✅ `read_inventory`
   - ✅ `write_inventory`
   - ✅ `read_locations`
   - ✅ `read_fulfillments`
   - ✅ `write_fulfillments`

3. Click **Save**

### Step 4: Install the App

1. Click **Install app** at the top of the page
2. Review the permissions and click **Install**

### Step 5: Get Your Credentials

After installation, you'll see:

1. **API credentials** section with:
   - **API key** (Client ID) - Copy this
   - **API secret key** (Client Secret) - Click "Reveal" and copy this

2. **Admin API access token** section:
   - Click **Install app** if not already installed
   - Copy the **Admin API access token** (this is your access token)

### Step 6: Get Your Store URL

Your store URL is in the format: `yourstore.myshopify.com`

You can find it:
- In your browser's address bar when in Shopify admin
- In Settings → General → Store details

---

## Method 2: OAuth App (Recommended for Production)

**Best for**: Production apps, multi-store integrations, public apps

### Step 1: Create a Shopify Partner Account

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Sign up or log in
3. Create a partner account (free)

### Step 2: Create an App

1. In Partner Dashboard, go to **Apps**
2. Click **Create app**
3. Choose **Public app** or **Custom app**:
   - **Public app**: For distribution to multiple stores
   - **Custom app**: For specific stores only

### Step 3: Configure App Settings

1. **App name**: Enter your app name
2. **App URL**: Your application's base URL
   - Example: `https://yourdomain.com`
3. **Allowed redirection URL(s)**: 
   - Add: `https://yourdomain.com/api/shopify/oauth/callback`
   - Or for local dev: `http://localhost:8000/api/shopify/oauth/callback`

### Step 4: Configure API Scopes

1. Go to **API credentials** tab
2. Under **Scopes**, select:
   - ✅ `read_products`
   - ✅ `write_products`
   - ✅ `read_orders`
   - ✅ `write_orders`
   - ✅ `read_customers`
   - ✅ `write_customers`
   - ✅ `read_inventory`
   - ✅ `write_inventory`
   - ✅ `read_locations`
   - ✅ `read_fulfillments`
   - ✅ `write_fulfillments`

3. Click **Save**

### Step 5: Get Your Credentials

1. **Client ID** (API Key) - Copy this
2. **Client secret** (API Secret) - Click "Reveal" and copy this

**Note**: With OAuth, you don't get an access token directly. The access token is obtained through the OAuth flow when a store installs your app.

---

## Adding Credentials to Your Application

You have **two ways** to add credentials:

### Option A: Via Web UI (Recommended)

1. **Navigate to the Integration Page**:
   - Go to: `http://localhost:3000/dashboard/settings/integrations/shopify`
   - Or: Settings → Integrations → Shopify

2. **Click "Connect Shopify"**

3. **Enter Your Credentials**:
   - **Store URL**: `yourstore.myshopify.com` (without https://)
   - **API Key**: Your Client ID / API Key
   - **API Secret**: Your Client Secret / API Secret Key
   - **Access Token**: 
     - For Custom App: Use the Admin API access token
     - For OAuth: Leave empty (will be obtained via OAuth flow)

4. **Click "Connect"**

5. **Connection Test**: The system will automatically test the connection before saving

### Option B: Via API (For Development/Testing)

#### Using cURL:

```bash
curl -X POST http://localhost:8000/api/shopify/connect/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "store_url": "yourstore.myshopify.com",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "access_token": "your_access_token",
    "auto_sync_enabled": true,
    "sync_products": true,
    "sync_orders": true,
    "sync_customers": true,
    "sync_inventory": true
  }'
```

#### Using Python:

```python
import requests

url = "http://localhost:8000/api/shopify/connect/"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_JWT_TOKEN"
}
data = {
    "store_url": "yourstore.myshopify.com",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "access_token": "your_access_token",
    "auto_sync_enabled": True,
    "sync_products": True,
    "sync_orders": True,
    "sync_customers": True,
    "sync_inventory": True
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### Option C: Using OAuth Flow (For Production)

If you're using OAuth, the flow is different:

1. **Initiate OAuth**:
   ```bash
   POST /api/shopify/oauth/initiate/
   {
     "store_url": "yourstore.myshopify.com",
     "api_key": "your_client_id",
     "api_secret": "your_client_secret",
     "scopes": "read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_inventory,write_inventory"
   }
   ```

2. **Redirect User**: The response will contain an `oauth_url`. Redirect the user to this URL.

3. **Handle Callback**: After the user authorizes, Shopify will redirect to your callback URL with a code.

4. **Token Exchange**: The callback endpoint automatically exchanges the code for an access token.

---

## Credential Summary

Here's what each credential is used for:

| Credential | Where to Find | Used For |
|-----------|--------------|----------|
| **Store URL** | Shopify admin URL or Settings → General | Identifying your store |
| **API Key** | Custom App: API credentials section<br>OAuth App: Client ID | Authenticating API requests |
| **API Secret** | Custom App: API credentials section<br>OAuth App: Client Secret | OAuth token exchange, webhook validation |
| **Access Token** | Custom App: Admin API access token<br>OAuth: Obtained via OAuth flow | Making authenticated API requests |

---

## Troubleshooting

### "Connection test failed"

**Possible causes:**
1. **Invalid Store URL**: Make sure it's in format `store.myshopify.com` (no https://)
2. **Invalid Access Token**: Token may have expired or been revoked
3. **Insufficient Permissions**: App doesn't have required scopes
4. **Store Not Accessible**: Store may be paused or deleted

**Solutions:**
- Verify store URL format
- Regenerate access token in Shopify admin
- Reinstall the app with correct scopes
- Check store status in Shopify

### "Invalid credentials"

**Possible causes:**
1. API Key and Secret don't match
2. Access token is for a different store
3. Credentials were copied incorrectly

**Solutions:**
- Double-check all credentials are from the same app
- Regenerate credentials if needed
- Ensure no extra spaces when copying

### "Rate limit exceeded"

**Possible causes:**
- Making too many API requests too quickly
- Shopify's rate limit is 40 requests/second

**Solutions:**
- The integration automatically handles rate limiting
- Wait a few seconds and try again
- Check sync intervals in environment variables

### OAuth Callback Not Working

**Possible causes:**
1. Redirect URL not configured correctly in Shopify app
2. Callback URL doesn't match exactly
3. State parameter expired

**Solutions:**
- Verify redirect URL in Shopify Partner Dashboard matches exactly
- Ensure callback endpoint is accessible
- Try initiating OAuth flow again

---

## Security Best Practices

1. **Never commit credentials to Git**: Use environment variables
2. **Store secrets securely**: Use Django's secret management
3. **Rotate credentials regularly**: Especially in production
4. **Use OAuth for production**: More secure than storing access tokens
5. **Limit API scopes**: Only request permissions you actually need
6. **Monitor access**: Regularly review which apps have access to your store

---

## Next Steps

After successfully connecting:

1. **Check Status**: Visit `/api/shopify/status/` to verify connection
2. **Test Sync**: Manually trigger a sync to test data flow
3. **Configure Webhooks**: Set up webhooks for real-time updates
4. **Monitor Logs**: Check sync logs for any issues
5. **Set Sync Intervals**: Configure automatic sync intervals via environment variables

---

## Quick Reference

### Custom App Credentials Location
```
Shopify Admin → Settings → Apps and sales channels → Develop apps → [Your App] → API credentials
```

### OAuth App Credentials Location
```
Shopify Partners → Apps → [Your App] → API credentials
```

### API Endpoints
- **Connect**: `POST /api/shopify/connect/`
- **Status**: `GET /api/shopify/status/`
- **Disconnect**: `DELETE /api/shopify/connect/`
- **OAuth Initiate**: `POST /api/shopify/oauth/initiate/`
- **OAuth Callback**: `GET /api/shopify/oauth/callback/`

---

## Need Help?

- Check the [Shopify Integration Guide](./SHOPIFY_INTEGRATION_GUIDE.md) for detailed configuration
- Review [Integration Status](./apps/backend/shopify_integration/INTEGRATION_STATUS.md) for feature completion
- Consult [Shopify API Documentation](https://shopify.dev/docs/api/admin-rest)

