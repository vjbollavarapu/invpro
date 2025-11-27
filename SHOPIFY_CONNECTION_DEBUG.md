# Shopify Connection Debugging Guide

## 🔍 How to Debug the Connection Error

### Step 1: Check Browser Console

1. Open your browser DevTools (F12)
2. Go to **Console** tab
3. Try connecting to Shopify
4. Look for error messages

You should see logs like:
```
Shopify connect request: { url: '...', hasAuth: true, hasTenant: true }
Shopify connection error: { status: 401, error: {...} }
```

### Step 2: Check Network Tab

1. Open **Network** tab in DevTools
2. Try connecting to Shopify
3. Find the request to `/api/integrations/shopify/connect`
4. Click on it and check:
   - **Request Headers**: Should include `Authorization: Bearer ...` and `X-Tenant-ID: ...`
   - **Request Payload**: Should include all credentials
   - **Response**: Check the error message

### Step 3: Check Backend Logs

On your production server:

```bash
# Check Django logs
tail -f /var/log/django/error.log

# Or check gunicorn logs
journalctl -u gunicorn -f

# Or check if using systemd
sudo journalctl -u your-django-service -f
```

Look for:
- Authentication errors
- Connection test failures
- API request errors

### Step 4: Test Backend Directly

Test the backend API directly (bypassing frontend):

```bash
# Get your JWT token from browser localStorage
# In browser console: localStorage.getItem('invpro_token')

TOKEN="your_jwt_token_here"
TENANT_ID="your_tenant_id_here"

curl -X POST "https://api.mangostack.io/api/shopify/connect/" \
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

### Step 5: Common Issues

#### Issue: "Authentication failed" (401)

**Cause:** JWT token is missing or invalid

**Solution:**
1. Check if you're logged in
2. Check browser console for token
3. Try logging out and back in
4. Check token expiration

#### Issue: "Tenant context required" (400)

**Cause:** X-Tenant-ID header is missing

**Solution:**
1. Check if tenant is selected in the UI
2. Check browser localStorage for `invpro_current_tenant`
3. Ensure tenant ID is being sent in headers

#### Issue: "Connection test failed" (400)

**Cause:** Shopify API credentials are invalid or connection test failed

**Solution:**
1. Verify credentials are correct
2. Test with curl command (see Step 4)
3. Check Shopify app permissions/scopes
4. Verify access token hasn't expired

#### Issue: "Failed to fetch" (Network Error)

**Cause:** Cannot reach backend API

**Solution:**
1. Check `NEXT_PUBLIC_API_URL` environment variable
2. Verify backend is running
3. Check CORS configuration
4. Check network connectivity

---

## 🔧 Quick Fixes

### Fix 1: Clear Browser Storage

```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
// Then refresh and login again
```

### Fix 2: Check API URL

```javascript
// In browser console
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
// Should show: https://api.mangostack.io/api
```

### Fix 3: Verify Authentication

```javascript
// In browser console
const token = localStorage.getItem('invpro_token')
const tenant = localStorage.getItem('invpro_current_tenant')
console.log('Token:', token ? 'Present' : 'Missing')
console.log('Tenant:', tenant ? JSON.parse(tenant) : 'Missing')
```

---

## 📋 Debug Checklist

- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows request is being sent
- [ ] Request includes Authorization header
- [ ] Request includes X-Tenant-ID header
- [ ] Backend is accessible (test with curl)
- [ ] JWT token is valid (not expired)
- [ ] Tenant ID is correct
- [ ] Shopify credentials are correct
- [ ] Backend logs show the request arriving
- [ ] CORS is configured correctly

---

## 🆘 Still Not Working?

If you've tried all the above:

1. **Share the exact error message** from browser console
2. **Share the response** from Network tab
3. **Share backend logs** (if accessible)
4. **Test with curl** and share the result

The improved error handling should now show more specific error messages to help identify the issue.

