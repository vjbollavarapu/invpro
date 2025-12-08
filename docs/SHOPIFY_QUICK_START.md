# Shopify Integration - Quick Start Guide

## 🚀 Quick Steps to Connect Your Shopify Store

### Step 1: Get Credentials from Shopify

#### Option A: Custom App (Easiest for Development)

1. Go to your Shopify Admin: `https://YOURSTORE.myshopify.com/admin`
2. Navigate to: **Settings** → **Apps and sales channels**
3. Click **Develop apps** (bottom of page)
4. Click **Create an app**
5. Name it (e.g., "InvPro360 Integration")
6. Click **Configure Admin API scopes** and select:
   - `read_products`, `write_products`
   - `read_orders`, `write_orders`
   - `read_customers`, `write_customers`
   - `read_inventory`, `write_inventory`
7. Click **Install app**
8. **Copy these 4 values**:
   - **Store URL**: `YOURSTORE.myshopify.com` (from your browser URL)
   - **API Key**: From "API credentials" section
   - **API Secret**: Click "Reveal" in "API credentials" section
   - **Access Token**: From "Admin API access token" section

#### Option B: OAuth App (For Production)

1. Go to [Shopify Partners](https://partners.shopify.com/)
2. Create/Login to Partner account
3. Go to **Apps** → **Create app**
4. Configure:
   - **App URL**: Your app's base URL
   - **Redirect URL**: `https://yourdomain.com/api/shopify/oauth/callback`
5. Select API scopes (same as above)
6. **Copy these 3 values**:
   - **Store URL**: `YOURSTORE.myshopify.com`
   - **Client ID** (API Key)
   - **Client Secret** (API Secret)
   - **Access Token**: Will be obtained via OAuth flow

---

### Step 2: Add Credentials to Your Application

#### Via Web UI (Recommended)

1. **Start your application**:
   ```bash
   # Backend
   cd apps/backend
   source venv/bin/activate
   python manage.py runserver

   # Frontend (in another terminal)
   cd apps/frontend
   npm run dev
   ```

2. **Open the integration page**:
   - Navigate to: `http://localhost:3000/dashboard/settings/integrations/shopify`
   - Or: Login → Settings → Integrations → Shopify

3. **Click "Connect Shopify"**

4. **Enter your credentials**:
   - Store URL: `yourstore.myshopify.com` (no https://)
   - API Key: Your API key/client ID
   - API Secret: Your API secret/client secret
   - Access Token: Your access token (leave empty for OAuth)

5. **Click "Connect"**

6. **Verify**: The system will automatically test the connection

#### Via API (Alternative)

```bash
curl -X POST http://localhost:8000/api/shopify/connect/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "store_url": "yourstore.myshopify.com",
    "api_key": "your_api_key",
    "api_secret": "your_api_secret",
    "access_token": "your_access_token"
  }'
```

---

## 📍 Where to Find Credentials in Shopify

### Custom App Method

```
Shopify Admin
└── Settings
    └── Apps and sales channels
        └── Develop apps
            └── [Your App Name]
                ├── API credentials
                │   ├── API key ← Copy this
                │   └── API secret key ← Click "Reveal" and copy
                └── Admin API access token
                    └── Admin API access token ← Copy this
```

### OAuth App Method

```
Shopify Partners Dashboard
└── Apps
    └── [Your App Name]
        └── API credentials
            ├── Client ID ← Copy this (this is your API Key)
            └── Client secret ← Click "Reveal" and copy (this is your API Secret)
```

---

## ✅ Verification

After connecting, verify it worked:

1. **Check Status**:
   ```bash
   curl http://localhost:8000/api/shopify/status/ \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Expected Response**:
   ```json
   {
     "connected": true,
     "status": "CONNECTED",
     "auto_sync_enabled": true,
     "last_sync_at": null,
     "error_count": 0
   }
   ```

3. **Test Sync** (optional):
   - In the UI, click "Sync Now" or use the API to trigger a sync

---

## 🔧 Common Issues

### "Connection test failed"

- ✅ Check store URL format: `store.myshopify.com` (no https://, no trailing slash)
- ✅ Verify access token is correct and not expired
- ✅ Ensure app has required scopes installed
- ✅ Check store is active (not paused)

### "Invalid credentials"

- ✅ Ensure API Key and Secret are from the same app
- ✅ Verify access token matches the store
- ✅ Check for extra spaces when copying

### "Rate limit exceeded"

- ✅ Wait a few seconds and try again
- ✅ Check sync intervals in `.env` file

---

## 📚 Full Documentation

- **Detailed Credentials Guide**: [SHOPIFY_CREDENTIALS_GUIDE.md](./SHOPIFY_CREDENTIALS_GUIDE.md)
- **Integration Guide**: [SHOPIFY_INTEGRATION_GUIDE.md](./SHOPIFY_INTEGRATION_GUIDE.md)
- **API Reference**: Check `/api/docs/` when backend is running

---

## 🎯 Next Steps

Once connected:

1. ✅ **Verify Connection**: Check status endpoint
2. ✅ **Configure Sync**: Set sync intervals in `.env`
3. ✅ **Set Up Webhooks**: Configure webhook endpoints in Shopify
4. ✅ **Test Sync**: Trigger a manual sync to verify data flow
5. ✅ **Monitor Logs**: Check sync logs for any issues

---

## 💡 Pro Tips

- **Development**: Use Custom App method (faster setup)
- **Production**: Use OAuth App method (more secure)
- **Multiple Stores**: Each store needs separate credentials
- **Security**: Never commit credentials to Git - use environment variables
- **Testing**: Use Shopify's test stores for development

---

## 🆘 Need Help?

1. Check the [Troubleshooting section](./SHOPIFY_CREDENTIALS_GUIDE.md#troubleshooting)
2. Review [Shopify API Docs](https://shopify.dev/docs/api/admin-rest)
3. Check application logs for detailed error messages

