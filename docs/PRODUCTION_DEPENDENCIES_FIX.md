# Production Dependencies Fix

## Issue
Production server was unable to install `autobahn==25.10.2` because this version is not available in the production PyPI index.

## Solution
Updated `autobahn` to version `24.4.2`, which is confirmed to be available on production.

## Changes Made
- **File**: `apps/backend/requirements.txt`
- **Change**: `autobahn==25.10.2` → `autobahn==24.4.2`

## Why This Happened
The production server's pip/PyPI index may:
1. Have an older pip version that doesn't see newer package versions
2. Use a PyPI mirror that hasn't synced the latest versions
3. Have network restrictions blocking access to newer versions

## Verification
The version `24.4.2` is confirmed to exist in the error message:
```
(from versions: ..., 24.4.2)
```

## Next Steps
1. Deploy the updated `requirements.txt` to production
2. Run `pip install -r requirements.txt` on production
3. If other packages fail, check their versions similarly

## Note
If you need features from `autobahn` 25.x, you may need to:
1. Update pip on production: `pip install --upgrade pip`
2. Check if there's a PyPI mirror configuration that needs updating
3. Verify network access to PyPI

