# Login Troubleshooting Guide

## ✅ User Created Successfully!

The seed data has been run and the demo user is now available.

## 🔑 Login Credentials

**Email**: `demo@example.com`  
**Password**: `Demo123456`

**Note**: The User model uses **email as the username**, so you should login with your **email address**, not a username.

## 🔍 How to Login

### Via Web UI:
1. Navigate to: `http://localhost:3000/login`
2. Enter:
   - **Email**: `demo@example.com`
   - **Password**: `Demo123456`
3. Click "Login"

### Via API (for testing):
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "demo@example.com",
    "password": "Demo123456"
  }'
```

## ⚠️ Common Issues

### Issue 1: "Invalid credentials"

**Possible causes:**
1. User doesn't exist (seed data not run)
2. Wrong email format
3. Password mismatch

**Solution:**
```bash
# Run seed data
cd apps/backend
source venv/bin/activate
python manage.py shell < seed_data.py
```

### Issue 2: "User not found"

**Check if user exists:**
```bash
cd apps/backend
source venv/bin/activate
python manage.py shell -c "from users.models import User; print(User.objects.filter(email='demo@example.com').exists())"
```

### Issue 3: "Password incorrect"

**Reset password (if needed):**
```bash
cd apps/backend
source venv/bin/activate
python manage.py shell -c "from users.models import User; u = User.objects.get(email='demo@example.com'); u.set_password('Demo123456'); u.save(); print('Password reset!')"
```

## 📋 All Available Test Users

After running seed data, these users are available:

| Email | Password | Tenant | Role |
|-------|----------|--------|------|
| `demo@example.com` | `Demo123456` | Demo Manufacturing Co | Admin |
| `test@example.com` | `Test123456` | Test Wholesale Inc | Admin |
| `multi@example.com` | `Multi123456` | Both tenants | Staff/Manager |

## 🔧 Verify User Setup

Run this command to verify everything is set up correctly:

```bash
cd apps/backend
source venv/bin/activate
python manage.py shell -c "
from users.models import User
from django.contrib.auth import authenticate

# Check user exists
u = User.objects.filter(email='demo@example.com').first()
if u:
    print(f'✅ User exists: {u.email}')
    print(f'✅ Password valid: {u.check_password(\"Demo123456\")}')
    
    # Test authentication
    auth = authenticate(username='demo@example.com', password='Demo123456')
    if auth:
        print(f'✅ Authentication works!')
    else:
        print('❌ Authentication failed')
else:
    print('❌ User not found - run seed_data.py')
"
```

## 🆘 Still Can't Login?

1. **Check backend is running**:
   ```bash
   curl http://localhost:8000/api/auth/login/ -X POST -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'
   ```

2. **Check frontend is running**:
   - Open: `http://localhost:3000/login`
   - Check browser console for errors

3. **Check database**:
   ```bash
   cd apps/backend
   source venv/bin/activate
   python manage.py dbshell
   # Then run: SELECT email FROM users_user WHERE email='demo@example.com';
   ```

4. **Re-run seed data**:
   ```bash
   cd apps/backend
   source venv/bin/activate
   python manage.py shell < seed_data.py
   ```

## ✅ Success Indicators

When login works, you should:
1. See a success toast notification
2. Be redirected to `/dashboard`
3. See your user info in the top-right corner
4. Have a JWT token stored in localStorage

Check browser DevTools → Application → Local Storage to see:
- `invpro_token` (JWT access token)
- `invpro_refresh_token` (JWT refresh token)
- `invpro_current_tenant` (tenant information)

