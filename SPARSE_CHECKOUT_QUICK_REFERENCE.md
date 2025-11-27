# Git Sparse Checkout - Quick Reference

Quick commands to clone only `apps/backend` and `apps/frontend` from the repository.

---

## 🚀 Quick Command (Copy & Paste)

```bash
# On production server
cd /var/www/invpro
git init
git remote add origin https://github.com/yourusername/invpro.git
git config core.sparseCheckout true
cat > .git/info/sparse-checkout << EOF
apps/backend/*
apps/frontend/*
docker-compose.yml
.gitignore
EOF
git fetch origin main
git checkout main
```

---

## 📋 Step-by-Step

### 1. Initialize Repository

```bash
cd /var/www/invpro
git init
git remote add origin https://github.com/yourusername/invpro.git
```

### 2. Enable Sparse Checkout

```bash
git config core.sparseCheckout true
```

### 3. Configure Directories

```bash
cat > .git/info/sparse-checkout << EOF
apps/backend/*
apps/frontend/*
docker-compose.yml
.gitignore
EOF
```

### 4. Fetch and Checkout

```bash
git fetch origin main
git checkout main
```

### 5. Verify

```bash
ls -la apps/
# Should show: backend/  frontend/
```

---

## 🔄 Updating

After initial clone, update with:

```bash
cd /var/www/invpro
git pull origin main
```

---

## ➕ Adding More Files Later

If you need additional files:

```bash
# Edit sparse-checkout file
nano .git/info/sparse-checkout

# Add new paths:
# docs/
# scripts/

# Refresh
git read-tree -mu HEAD
```

---

## 🗑️ Removing Files from Sparse Checkout

```bash
# Edit sparse-checkout file
nano .git/info/sparse-checkout

# Remove unwanted paths, then:
git read-tree -mu HEAD
```

---

## ✅ Verification Commands

```bash
# Check what's checked out
git ls-files | head -20

# Check structure
tree -L 3 apps/ || find apps/ -type d -maxdepth 2

# Verify backend
ls apps/backend/ | grep -E "manage.py|requirements.txt"

# Verify frontend
ls apps/frontend/ | grep -E "package.json|next.config"
```

---

**That's it! You now have only backend and frontend directories.** 🎉

