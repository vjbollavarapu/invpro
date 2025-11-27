# Quick Test Guide - Frontend with Production API

## ✅ Setup Complete!

The frontend is now configured to use the production API at `https://api.mangostack.io`.

## 🚀 Start Testing (3 Steps)

### 1. Start the Development Server

```bash
cd apps/frontend
npm run dev
```

### 2. Open Browser

Navigate to: `http://localhost:3000`

### 3. Check Console

Open DevTools (F12) → Console tab. You should see API requests to `https://api.mangostack.io/api`.

## 🧪 Quick Test Checklist

- [ ] Frontend loads at `http://localhost:3000`
- [ ] No console errors
- [ ] Navigate to `/login` - page loads
- [ ] Try to register/login (if you have credentials)
- [ ] Check Network tab - requests go to `api.mangostack.io`

## ⚠️ Important: CORS Configuration

**Before testing, ensure the production backend allows `http://localhost:3000` in CORS settings.**

If you see CORS errors, update the backend `CORS_ALLOWED_ORIGINS` environment variable:

```bash
# On production server
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

## 🔍 Verify API Connection

In browser console, run:
```javascript
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
// Should output: https://api.mangostack.io/api
```

## 📝 Switch Back to Local API

To test with local backend later, edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Then restart: `npm run dev`

---

**See `TESTING_PRODUCTION_API.md` for detailed testing instructions.**

