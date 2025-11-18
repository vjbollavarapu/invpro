# Shopify Integration Setup - Summary

## 📍 Where to Add Credentials

### Option 1: Via Web UI (Easiest)

1. **Navigate to**: `http://localhost:3000/dashboard/settings/integrations/shopify`
2. **Click**: "Connect Shopify" button
3. **Enter**:
   - Store URL: `yourstore.myshopify.com`
   - API Key: Your Shopify API key
   - API Secret: Your Shopify API secret
   - Access Token: Your Shopify access token
4. **Click**: "Connect"

### Option 2: Via API

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

---

## 🔑 How to Get Credentials from Shopify

### Method 1: Custom App (Development)

1. **Go to**: Shopify Admin → Settings → Apps and sales channels
2. **Click**: "Develop apps" (bottom of page)
3. **Click**: "Create an app"
4. **Name it**: e.g., "InvPro360 Integration"
5. **Configure scopes**: Click "Configure Admin API scopes" and select:
   - `read_products`, `write_products`
   - `read_orders`, `write_orders`
   - `read_customers`, `write_customers`
   - `read_inventory`, `write_inventory`
6. **Install app**: Click "Install app"
7. **Copy credentials**:
   - **Store URL**: From your browser (e.g., `mystore.myshopify.com`)
   - **API Key**: From "API credentials" section
   - **API Secret**: Click "Reveal" in "API credentials" section
   - **Access Token**: From "Admin API access token" section

### Method 2: OAuth App (Production)

1. **Go to**: [Shopify Partners](https://partners.shopify.com/)
2. **Create app**: Apps → Create app
3. **Configure**:
   - App URL: Your app's base URL
   - Redirect URL: `https://yourdomain.com/api/shopify/oauth/callback`
4. **Select scopes**: Same as above
5. **Copy credentials**:
   - **Client ID** (API Key)
   - **Client Secret** (API Secret)
   - **Access Token**: Obtained via OAuth flow

---

## ✅ Verification

After connecting, check status:

```bash
GET http://localhost:8000/api/shopify/status/
Authorization: Bearer YOUR_JWT_TOKEN
```

Expected response:
```json
{
  "connected": true,
  "status": "CONNECTED",
  "auto_sync_enabled": true,
  "error_count": 0
}
```

---

## 📚 Full Guides

- **Quick Start**: [SHOPIFY_QUICK_START.md](./SHOPIFY_QUICK_START.md)
- **Detailed Guide**: [SHOPIFY_CREDENTIALS_GUIDE.md](./SHOPIFY_CREDENTIALS_GUIDE.md)
- **Integration Guide**: [SHOPIFY_INTEGRATION_GUIDE.md](./SHOPIFY_INTEGRATION_GUIDE.md)

---

## 🔧 Backend Endpoints

All endpoints are under `/api/shopify/`:

- `POST /api/shopify/connect/` - Connect store
- `DELETE /api/shopify/connect/` - Disconnect store
- `GET /api/shopify/status/` - Get connection status
- `POST /api/shopify/webhook/` - Webhook receiver
- `POST /api/shopify/oauth/initiate/` - Start OAuth flow
- `GET /api/shopify/oauth/callback/` - OAuth callback
- `GET /api/shopify/products/` - List products
- `GET /api/shopify/orders/` - List orders
- `GET /api/shopify/customers/` - List customers
- `GET /api/shopify/inventory/` - List inventory

---

## 🆘 Troubleshooting

**Connection fails?**
- Check store URL format: `store.myshopify.com` (no https://)
- Verify access token is valid
- Ensure app has required scopes
- Check store is active

**Need help?**
- See [SHOPIFY_CREDENTIALS_GUIDE.md](./SHOPIFY_CREDENTIALS_GUIDE.md#troubleshooting)

