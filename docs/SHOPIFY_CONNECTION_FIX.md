# Shopify Connection Issue - Debugging Guide

## ✅ Credentials Verified

Your credentials work with curl:
- **Store URL**: `your-store.myshopify.com` ✅
- **Access Token**: `YOUR_ACCESS_TOKEN` ✅
- **API Key**: `YOUR_API_KEY` ✅
- **API Secret**: `YOUR_API_SECRET` ✅

## 🔍 What Error Are You Seeing?

Please share the **exact error message** you're getting when trying to connect. It could be:

1. **"Connection test failed"** - Generic error
2. **"Invalid access token"** - Token issue
3. **"Store not found"** - URL format issue
4. **"Access denied"** - Permissions issue
5. **Something else?**

## 🐛 Common Issues & Fixes

### Issue 1: Store URL Format

**Problem**: Store URL might have extra characters or wrong format

**Solution**: Make sure you enter exactly:
```
your-store.myshopify.com
```

**NOT**:
- ❌ `https://your-store.myshopify.com`
- ❌ `your-store.myshopify.com/`
- ❌ `www.your-store.myshopify.com`

### Issue 2: Access Token Has Extra Spaces

**Problem**: Token might have leading/trailing spaces when copied

**Solution**: 
1. Copy the token again from `.shopify` file
2. Make sure there are no spaces before or after
3. The token should start with `shpat_` and be exactly 64 characters

### Issue 3: App Not Installed

**Problem**: Custom app needs to be installed before token works

**Solution**:
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps"
3. Find your app
4. If you see "Install app" button, click it
5. Get a fresh access token after installation

### Issue 4: API Version Mismatch

**Problem**: Using wrong API version

**Solution**: The code uses `2024-10` which is correct. If you get version errors, check backend logs.

## 🔧 Debugging Steps

### Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try connecting to Shopify
4. Look for error messages
5. **Copy the exact error message**

### Step 2: Check Network Tab

1. Open **Network** tab in DevTools
2. Try connecting
3. Find the request to `/api/integrations/shopify/connect`
4. Click on it
5. Check:
   - **Request Payload**: Are all fields present?
   - **Response**: What error is returned?

### Step 3: Check Backend Logs

On production server:

```bash
# Check Django logs
tail -f /var/log/django/error.log

# Or gunicorn logs
journalctl -u gunicorn -f
```

Look for:
- "Testing Shopify connection" - shows what's being sent
- "Shopify authentication failed" - shows the error
- "Shopify connection test failed" - shows the issue

### Step 4: Test Manually

Test the exact same request the app makes:

```bash
# Get your JWT token from browser
TOKEN="your_jwt_token"
TENANT_ID="your_tenant_id"

curl -X POST "https://api.mangostack.io/api/integrations/shopify/connect/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-ID: ${TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "store_url": "your-store.myshopify.com",
    "api_key": "YOUR_API_KEY",
    "api_secret": "YOUR_API_SECRET",
    "access_token": "YOUR_ACCESS_TOKEN"
  }'
```

## 📋 Information Needed

To help debug, please provide:

1. **Exact error message** from browser console
2. **Response from Network tab** (the JSON error response)
3. **Backend logs** (if accessible)
4. **What you entered in the form**:
   - Store URL: ?
   - API Key: ? (first 10 chars)
   - API Secret: ? (first 10 chars)
   - Access Token: ? (first 10 chars)

## 🎯 Quick Checklist

- [ ] Store URL is exactly: `your-store.myshopify.com` (no https://, no trailing slash)
- [ ] Access token copied correctly (no extra spaces)
- [ ] App is installed in Shopify (if custom app)
- [ ] All required scopes are selected in Shopify app
- [ ] You're logged into the application
- [ ] Tenant is selected (if multi-tenant)

---

**Please share the exact error message you're seeing so I can help fix it!**

