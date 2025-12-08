# JWT Token Expired - Quick Fix

## 🔴 The Problem

You're getting this error:
```
Token is invalid or expired
Given token not valid for any token type
```

This means your **JWT authentication token has expired**. This is NOT a Shopify issue - it's an authentication issue.

## ✅ Quick Solution

### Step 1: Log Out
1. Click on your user profile/avatar in the top right
2. Click "Logout" or "Sign Out"

### Step 2: Log Back In
1. Go to the login page
2. Enter your credentials
3. Click "Login"

### Step 3: Try Shopify Connection Again
1. Go to Settings → Integrations → Shopify
2. Enter your Shopify credentials:
   - Store URL: `your-store.myshopify.com`
   - API Key: `YOUR_API_KEY`
   - API Secret: `YOUR_API_SECRET`
   - Access Token: `YOUR_ACCESS_TOKEN`
3. Click "Connect Shopify"

## 🔍 Why This Happened

JWT tokens have an expiration time (usually 15 minutes to 1 hour). When the token expires:
- All API requests return 401 Unauthorized
- You need to log in again to get a fresh token

## 🛠️ Alternative: Clear Browser Storage

If logging out doesn't work, clear the browser storage:

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → your domain
4. Delete these items:
   - `invpro_token`
   - `invpro_user`
   - `invpro_current_tenant`
5. Refresh the page
6. Log in again

## 📝 Note

Your Shopify credentials are **valid** (verified with curl). The issue is only with the JWT authentication token. Once you log back in, the Shopify connection should work perfectly.

