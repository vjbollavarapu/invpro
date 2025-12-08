# Shopify Connection Debugging Steps

## Current Issue
Backend is getting: `"Invalid API key or access token"` from Shopify API, but credentials work with curl.

## What to Check

### 1. Check Backend Logs

Look for these log messages in your Django logs:

```bash
# On production or localhost
tail -f /path/to/django/logs/error.log
# Or if using runserver:
# Check the terminal where Django is running
```

Look for:
- `"Shopify connection attempt:"` - Shows what store_url and token are being received
- `"Built Shopify URL:"` - Shows the exact URL being constructed
- `"Shopify API request:"` - Shows the request details
- `"Shopify API client error 401:"` - Shows the error

### 2. Verify Token Format

The token should be:
- Format: `shpat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (example)
- Length: 64 characters
- No leading/trailing spaces
- Starts with `shpat_`

### 3. Verify Store URL Format

The store URL should be:
- Format: `your-store.myshopify.com` (example)
- No `https://` prefix
- No trailing slash
- No path after `.com`

### 4. Test the Exact Request

Try making the exact same request the backend makes:

```bash
# This is what the backend should be sending
curl -X GET "https://your-store.myshopify.com/admin/api/2024-10/shop.json" \
  -H "X-Shopify-Access-Token: YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

If this works but the backend doesn't, there's something different in how the backend is making the request.

## Common Issues

### Issue 1: Token Has Extra Spaces
**Solution**: The code now strips whitespace, but check logs to verify

### Issue 2: Store URL Format Wrong
**Solution**: Check logs for `"Built Shopify URL:"` - should be `https://your-store.myshopify.com/admin/api/2024-10/shop.json`

### Issue 3: API Version Mismatch
**Solution**: Check logs - should be `2024-10`

### Issue 4: Token Modified During Transmission
**Solution**: Check the logs for `token_length` and `token_preview` to see if token is being modified

## Next Steps

1. **Check the backend logs** when you try to connect
2. **Share the log output** showing:
   - The store_url being used
   - The token_length and token_preview
   - The URL being built
   - The exact error from Shopify

This will help identify what's different between the working curl request and the failing backend request.

