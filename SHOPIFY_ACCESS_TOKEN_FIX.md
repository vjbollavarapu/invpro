# Shopify Access Token Issue - Troubleshooting

## ✅ Your Credentials

**⚠️ IMPORTANT**: Never commit your Shopify credentials to git!

Your credentials should be stored in `.shopify` file (which is gitignored):
- **Store URL**: `invpro.myshopify.com`
- **API Key**: (stored in `.shopify` file)
- **API Secret**: (stored in `.shopify` file)
- **Access Token**: (stored in `.shopify` file)

✅ **Verified**: The access token works with curl, so credentials are valid.

## 🔍 Common Causes of "Invalid API key or access token"

### Issue 1: App Not Installed

**Most Common Issue!** After creating a Custom App, you must **install it** before the access token works.

**Solution:**
1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps"
3. Click your app name
4. Look for "Install app" button (if visible)
5. Click "Install app"
6. **Get a NEW access token** after installation
7. The token will be different after installation

### Issue 2: Wrong Token Type

Make sure you're using the **Admin API access token**, not:
- ❌ Storefront API token
- ❌ Private app token (old method)
- ❌ OAuth token (unless using OAuth flow)

**Solution:**
- Go to your app → "Admin API access token"
- Click "Reveal token"
- Copy the token (starts with `shpat_`)

### Issue 3: Token Copied Incorrectly

**Solution:**
- Make sure there are no extra spaces
- Copy the entire token (they're long!)
- Try copying again from Shopify

### Issue 4: App Permissions/Scopes

Your app needs these scopes:
- `read_products`, `write_products`
- `read_orders`, `write_orders`
- `read_customers`, `write_customers`
- `read_inventory`, `write_inventory`

**Solution:**
1. Go to your app → "Configure Admin API scopes"
2. Select all required scopes
3. Save
4. **Reinstall the app** (this is important!)
5. Get a new access token

## 🔧 Step-by-Step Fix

### Step 1: Verify App is Installed

1. Go to Shopify Admin → Settings → Apps and sales channels
2. Click "Develop apps"
3. Find your app
4. Check if it says "Installed" or "Install app"
5. **If "Install app" is visible, click it!**

### Step 2: Get Fresh Access Token

1. After installing, go to "Admin API access token"
2. Click "Reveal token"
3. Copy the **entire** token
4. Make sure it starts with `shpat_`

### Step 3: Test Token Manually

```bash
curl -X GET "https://invpro.myshopify.com/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: YOUR_NEW_TOKEN" \
  -H "Content-Type: application/json"
```

If this works, the token is valid.

### Step 4: Use in Application

1. Enter the new token in the Shopify Integration form
2. Make sure there are no extra spaces
3. Click "Connect Shopify"

## 🐛 Debugging

### Check Backend Logs

On production server:
```bash
# Check Django logs
tail -f /var/log/django/error.log

# Or gunicorn logs
journalctl -u gunicorn -f
```

Look for:
- "Shopify connection attempt" - shows what credentials are being used
- "Shopify API request" - shows the URL being called
- "Shopify API client error" - shows the exact error from Shopify

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Try connecting
4. Look for detailed error messages

## ⚠️ Important Notes

1. **Installation is Required**: Custom apps must be installed before tokens work
2. **Token Changes After Install**: The token might change after installation
3. **Scopes Matter**: Make sure all required scopes are selected
4. **No Extra Spaces**: Copy tokens carefully, no leading/trailing spaces

## 🎯 Quick Checklist

- [ ] App is created in Shopify
- [ ] App is **INSTALLED** (most important!)
- [ ] All required scopes are selected
- [ ] Access token is from "Admin API access token" section
- [ ] Token starts with `shpat_`
- [ ] Token works with curl test
- [ ] No extra spaces in token when pasting
- [ ] Store URL is correct: `invpro.myshopify.com`

---

**Most likely issue**: The app needs to be **installed** after creation. The access token you get before installation might not work. Install the app and get a fresh token!

