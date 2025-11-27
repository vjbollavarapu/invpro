# Testing Frontend with Production API

This guide explains how to test the frontend application with the production API at `https://api.mangostack.io`.

## ✅ Setup Complete

The environment file `.env.local` has been created with the production API URL:
```
NEXT_PUBLIC_API_URL=https://api.mangostack.io/api
```

## 🚀 Quick Start

### 1. Install Dependencies (if not already done)

```bash
cd apps/frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The frontend will start at `http://localhost:3000` and connect to the production API.

### 3. Verify API Connection

Open your browser and check the console (F12 → Console tab). You should see API requests going to `https://api.mangostack.io/api`.

## 🧪 Testing Checklist

### Authentication Flow

1. **Register a new user**
   - Navigate to `/register`
   - Fill in the registration form
   - Verify email (if required)

2. **Login**
   - Navigate to `/login`
   - Enter credentials
   - Check that JWT tokens are stored in localStorage

3. **Access Protected Routes**
   - Navigate to `/dashboard`
   - Verify data loads from production API
   - Check Network tab for API calls

### API Endpoints to Test

1. **Dashboard**
   - `/dashboard` - Should load dashboard statistics

2. **Inventory**
   - `/dashboard/inventory` - Should list products
   - Create/Edit/Delete products

3. **Sales**
   - `/dashboard/sales` - Should load sales data

4. **Settings**
   - `/dashboard/settings` - Should load tenant settings

### Network Tab Verification

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Verify all requests go to `https://api.mangostack.io/api`
5. Check response status codes (should be 200, 201, etc.)

## 🔍 Debugging

### Check API URL

The API URL is configured in:
- `lib/api-client.ts` - Main API client
- `app/api/**/route.ts` - Next.js API routes

You can verify the URL is being used:

```typescript
// In browser console
console.log(process.env.NEXT_PUBLIC_API_URL)
// Should output: https://api.mangostack.io/api
```

### Common Issues

#### 1. CORS Errors

If you see CORS errors, the backend needs to allow your frontend origin. Update backend `CORS_ALLOWED_ORIGINS`:

```python
# In backend settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://your-frontend-domain.com',
]
```

#### 2. 401 Unauthorized

- Check that JWT tokens are being sent in Authorization header
- Verify token hasn't expired
- Check localStorage for `access_token` and `refresh_token`

#### 3. 404 Not Found

- Verify the API endpoint exists on the production server
- Check the API URL is correct (should end with `/api`)

#### 4. Network Errors

- Verify `https://api.mangostack.io` is accessible
- Check SSL certificate is valid
- Verify firewall/network settings

## 🔐 Security Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use HTTPS in production** - The API URL uses HTTPS
3. **Verify CORS settings** - Ensure backend allows your frontend origin

## 📝 Environment Variables

### Current Configuration

```env
NEXT_PUBLIC_API_URL=https://api.mangostack.io/api
NODE_ENV=development
```

### Switch Back to Local API

To test with local backend, update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Then restart the dev server.

## 🧪 Testing Specific Features

### Multi-Tenant Features

1. **Tenant Selection**
   - Verify tenant ID is sent in `X-Tenant-ID` header
   - Check that data is filtered by tenant

2. **Tenant Switching**
   - Use tenant switcher component
   - Verify data updates when switching tenants

### Authentication

1. **Token Refresh**
   - Let access token expire
   - Verify refresh token is used automatically
   - Check that user stays logged in

2. **Logout**
   - Click logout
   - Verify tokens are cleared
   - Verify redirect to login page

## 📊 Monitoring

### Browser DevTools

- **Console**: Check for errors and API logs
- **Network**: Monitor all API requests
- **Application**: Check localStorage for tokens

### API Response Times

Monitor response times in Network tab:
- Fast: < 200ms
- Normal: 200-500ms
- Slow: > 500ms

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Frontend loads without errors
2. ✅ Login/Register works
3. ✅ Dashboard loads data from production API
4. ✅ All API requests show 200/201 status codes
5. ✅ No CORS errors in console
6. ✅ JWT tokens are stored and sent correctly

## 🚨 Troubleshooting

### Reset Everything

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Restart dev server
npm run dev
```

### Check API Connectivity

```bash
# Test API endpoint directly
curl https://api.mangostack.io/api/health

# Or test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.mangostack.io/api/dashboard/
```

## 📞 Next Steps

After successful testing:

1. Update production frontend environment variables
2. Build production bundle: `npm run build`
3. Deploy frontend to production
4. Update backend CORS to include production frontend domain

---

**Note**: Make sure the backend at `https://api.mangostack.io` has CORS configured to allow requests from `http://localhost:3000` for local testing.

