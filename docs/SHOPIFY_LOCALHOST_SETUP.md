# Shopify Integration - Localhost Development Guide

## Overview

Yes, you can integrate with Shopify from localhost! However, Shopify requires **publicly accessible URLs** for:
- OAuth callback URLs
- Webhook endpoints

This guide shows you how to set up localhost development using tunneling services.

## Quick Setup Options

### Option 1: Using ngrok (Recommended)

**ngrok** is the most popular tunneling service for local development.

#### Step 1: Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Step 2: Start your Django backend

```bash
cd apps/backend
source venv/bin/activate
python manage.py runserver 8000
```

#### Step 3: Start ngrok tunnel

```bash
# Expose port 8000 (Django backend)
ngrok http 8000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:8000
```

#### Step 4: Configure Environment Variables

Create or update `.env.local` in your backend directory:

```bash
# Backend .env.local
SHOPIFY_WEBHOOK_BASE_URL=https://abc123.ngrok.io
SHOPIFY_API_VERSION=2024-10
```

**Important**: Use the **HTTPS** URL from ngrok (not HTTP).

#### Step 5: Configure Shopify App

1. Go to your Shopify Partner Dashboard: https://partners.shopify.com
2. Select your app
3. Go to **App Setup** → **App URL**
4. Set **App URL**: `https://abc123.ngrok.io`
5. Set **Allowed redirection URL(s)**:
   - `https://abc123.ngrok.io/api/shopify/oauth/callback/`
   - `https://abc123.ngrok.io/shopify/oauth/success` (for frontend redirect)

6. Go to **Webhooks** section
7. Add webhook endpoints:
   - `https://abc123.ngrok.io/api/shopify/webhook/`

#### Step 6: Restart Django Server

After setting environment variables, restart your Django server:

```bash
python manage.py runserver 8000
```

### Option 2: Using localtunnel (Free Alternative)

**localtunnel** is a free, open-source alternative to ngrok.

#### Step 1: Install localtunnel

```bash
npm install -g localtunnel
```

#### Step 2: Start tunnel

```bash
lt --port 8000 --subdomain your-unique-name
```

You'll get a URL like: `https://your-unique-name.loca.lt`

#### Step 3: Configure Environment Variables

```bash
SHOPIFY_WEBHOOK_BASE_URL=https://your-unique-name.loca.lt
```

### Option 3: Using Cloudflare Tunnel (Free, Persistent)

**Cloudflare Tunnel** (formerly Argo Tunnel) provides free, persistent tunnels.

#### Step 1: Install cloudflared

```bash
# macOS
brew install cloudflare/cloudflare/cloudflared
```

#### Step 2: Authenticate

```bash
cloudflared tunnel login
```

#### Step 3: Create and run tunnel

```bash
cloudflared tunnel --url http://localhost:8000
```

## Configuration Details

### Environment Variables

The integration uses these environment variables (set in `.env.local`):

```bash
# Required for localhost development
SHOPIFY_WEBHOOK_BASE_URL=https://your-tunnel-url.ngrok.io

# Optional (defaults shown)
SHOPIFY_API_VERSION=2024-10
SHOPIFY_MAX_REQUESTS_PER_SECOND=40
SHOPIFY_SYNC_INTERVAL_PRODUCTS=3600
SHOPIFY_SYNC_INTERVAL_ORDERS=1800
SHOPIFY_SYNC_INTERVAL_CUSTOMERS=7200
SHOPIFY_SYNC_INTERVAL_INVENTORY=900
SHOPIFY_MAX_RETRY_ATTEMPTS=3
SHOPIFY_RETRY_DELAY=5
```

### Shopify App Configuration

In your Shopify Partner Dashboard, configure:

1. **App URL**: Your tunnel URL (e.g., `https://abc123.ngrok.io`)
2. **Allowed redirection URLs**:
   ```
   https://abc123.ngrok.io/api/shopify/oauth/callback/
   https://abc123.ngrok.io/shopify/oauth/success
   ```
3. **Webhook endpoints**:
   ```
   https://abc123.ngrok.io/api/shopify/webhook/
   ```

### Using Development Stores

For testing, use **Shopify Development Stores**:

1. Create a development store: https://partners.shopify.com → Stores → Add store
2. Development stores are free and perfect for testing
3. Use test API keys (they start with `test_`)

## Testing the Integration

### 1. Test OAuth Flow

1. Navigate to: `/dashboard/settings/integrations/shopify`
2. Enter your Shopify store URL (e.g., `your-dev-store.myshopify.com`)
3. Enter API Key and API Secret from your Shopify app
4. Click "Connect"
5. You'll be redirected to Shopify for authorization
6. After approval, you'll be redirected back to your app

### 2. Test Webhooks

After connecting, Shopify will send webhooks to:
```
https://your-tunnel-url.ngrok.io/api/shopify/webhook/
```

You can test webhooks using:
- Shopify CLI: `shopify webhook trigger`
- Shopify Admin → Settings → Notifications → Webhooks

### 3. Test API Calls

Once connected, test syncing:
- Products: `/api/shopify/products/`
- Orders: `/api/shopify/orders/`
- Customers: `/api/shopify/customers/`

## Troubleshooting

### Issue: "Invalid redirect_uri"

**Solution**: 
- Ensure `SHOPIFY_WEBHOOK_BASE_URL` matches exactly what's configured in Shopify
- Check that the redirect URI in Shopify includes the full path: `/api/shopify/oauth/callback/`
- Use HTTPS (not HTTP) for the tunnel URL

### Issue: Webhooks not received

**Solution**:
- Verify webhook URL in Shopify matches your tunnel URL
- Check that ngrok/localtunnel is still running
- Ensure webhook endpoint is accessible: `https://your-tunnel-url.ngrok.io/api/shopify/webhook/`
- Check Django logs for incoming webhook requests

### Issue: ngrok URL changes on restart

**Solution**:
- Use ngrok's reserved domains (paid feature)
- Or use localtunnel with a fixed subdomain: `lt --port 8000 --subdomain your-fixed-name`
- Or use Cloudflare Tunnel for persistent URLs

### Issue: CORS errors

**Solution**:
- Ensure your frontend is also accessible (or use the same tunnel)
- Configure CORS in Django settings if needed

## Production Deployment

When deploying to production:

1. Set `SHOPIFY_WEBHOOK_BASE_URL` to your production domain:
   ```bash
   SHOPIFY_WEBHOOK_BASE_URL=https://your-production-domain.com
   ```

2. Update Shopify app configuration with production URLs

3. Use environment-specific app credentials (separate apps for dev/prod)

## Quick Reference

### ngrok Commands

```bash
# Basic tunnel
ngrok http 8000

# With custom domain (paid)
ngrok http 8000 --domain=your-domain.ngrok.io

# View requests (web interface)
# Open http://localhost:4040 in browser
```

### localtunnel Commands

```bash
# Random subdomain
lt --port 8000

# Fixed subdomain
lt --port 8000 --subdomain your-name
```

### Cloudflare Tunnel Commands

```bash
# Quick tunnel
cloudflared tunnel --url http://localhost:8000

# Named tunnel (persistent)
cloudflared tunnel create my-tunnel
cloudflared tunnel route dns my-tunnel your-domain.com
cloudflared tunnel run my-tunnel
```

## Security Notes

1. **Never commit tunnel URLs** to version control
2. **Use different apps** for development and production
3. **Rotate tunnel URLs** regularly if using free services
4. **Use HTTPS** always (ngrok provides this automatically)
5. **Validate webhook signatures** (already implemented in the integration)

## Additional Resources

- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify Webhooks Guide](https://shopify.dev/docs/apps/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
- [Shopify Development Stores](https://help.shopify.com/en/partners/dashboard/development-stores)

