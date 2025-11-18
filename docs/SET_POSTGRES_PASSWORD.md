# Set PostgreSQL Password (Optional)

## If You Want to Set a Password

### 1. Set Password in PostgreSQL

```bash
# Connect to PostgreSQL
psql -U vijay -h localhost -d invpro_db

# Set password (replace 'your-password' with your actual password)
ALTER USER vijay WITH PASSWORD 'your-password';

# Exit
\q
```

### 2. Update .env File

```bash
# Edit apps/backend/.env
POSTGRES_PASSWORD=your-password
```

### 3. Test Connection

```bash
cd apps/backend
source venv/bin/activate
python manage.py check --database default
```

---

## When to Use Passwords

### Local Development
- **Blank Password**: ✅ Fine (trust authentication)
- **With Password**: ✅ Also fine (more explicit)

### Production/Deployment
- **Blank Password**: ❌ Not secure
- **With Password**: ✅ Required

### Team Environment
- **Blank Password**: ❌ Won't work for others
- **With Password**: ✅ Everyone can connect

---

## Current Status

Your setup works because:
1. PostgreSQL installed via Homebrew
2. Default authentication is "trust" for localhost
3. Your macOS user matches PostgreSQL user
4. Connection is from localhost

This is **perfectly fine for solo development**!

