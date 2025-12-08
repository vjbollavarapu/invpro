# Deployment Clone Guide - Backend & Frontend Only

This guide shows how to clone only the `apps/backend` and `apps/frontend` directories from the git repository to your production server.

---

## 🎯 Method 1: Git Sparse Checkout (Recommended)

This is the cleanest method - Git will only download the directories you need.

### Step 1: Initialize Empty Repository

```bash
# On production server
cd /var/www/invpro
git init
git remote add origin https://github.com/yourusername/invpro.git
# or
git remote add origin git@github.com:yourusername/invpro.git
```

### Step 2: Enable Sparse Checkout

```bash
git config core.sparseCheckout true
```

### Step 3: Specify Directories to Checkout

```bash
# Create sparse-checkout file
echo "apps/backend/*" >> .git/info/sparse-checkout
echo "apps/frontend/*" >> .git/info/sparse-checkout

# Also include root-level files you might need
echo "docker-compose.yml" >> .git/info/sparse-checkout
echo ".gitignore" >> .git/info/sparse-checkout
```

### Step 4: Pull Specific Branch

```bash
# Pull from specific branch (e.g., main)
git pull origin main

# Or checkout specific branch
git fetch origin
git checkout -b main origin/main
```

### Result

You'll have:
```
/var/www/invpro/
├── apps/
│   ├── backend/     ✅
│   └── frontend/    ✅
├── docker-compose.yml (if included)
└── .gitignore (if included)
```

---

## 🎯 Method 2: Git Archive (Alternative)

This creates a tarball with only the specified directories.

### On Your Local Machine

```bash
# Create archive with only backend and frontend
git archive --format=tar.gz --output=invpro-deploy.tar.gz HEAD apps/backend apps/frontend

# Or for a specific branch
git archive --format=tar.gz --output=invpro-deploy.tar.gz main apps/backend apps/frontend
```

### Transfer to Production Server

```bash
# Using SCP
scp invpro-deploy.tar.gz user@production-server:/var/www/invpro/

# Or using rsync
rsync -avz invpro-deploy.tar.gz user@production-server:/var/www/invpro/
```

### Extract on Production Server

```bash
# SSH into production server
ssh user@production-server

# Extract
cd /var/www/invpro
tar -xzf invpro-deploy.tar.gz

# Result:
# /var/www/invpro/apps/backend/
# /var/www/invpro/apps/frontend/
```

---

## 🎯 Method 3: Clone Full Repo, Then Clean (Simple)

If you want to keep git history but remove unnecessary files.

### Step 1: Clone Full Repository

```bash
cd /var/www
git clone https://github.com/yourusername/invpro.git
cd invpro
```

### Step 2: Remove Unnecessary Directories

```bash
# Remove everything except apps/backend and apps/frontend
find . -mindepth 1 -maxdepth 1 ! -name 'apps' ! -name '.git' -exec rm -rf {} +

# Remove other apps if any (keep only backend and frontend)
cd apps
find . -mindepth 1 -maxdepth 1 ! -name 'backend' ! -name 'frontend' -exec rm -rf {} +
cd ..
```

### Step 3: Clean Git (Optional)

```bash
# Remove git history of deleted files
git gc --aggressive --prune=now
```

---

## 🎯 Method 4: Deployment Script (Automated)

Create a script that handles the sparse checkout automatically.

### Create Deployment Script

```bash
nano /var/www/invpro/deploy-clone.sh
```

Add the following:

```bash
#!/bin/bash

set -e

REPO_URL="https://github.com/yourusername/invpro.git"
BRANCH="main"
TARGET_DIR="/var/www/invpro"

echo "🚀 Starting deployment clone..."

# Create directory if it doesn't exist
mkdir -p $TARGET_DIR
cd $TARGET_DIR

# Initialize git if not already
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git remote add origin $REPO_URL
fi

# Configure sparse checkout
echo "⚙️  Configuring sparse checkout..."
git config core.sparseCheckout true

# Create sparse-checkout file
cat > .git/info/sparse-checkout << EOF
apps/backend/*
apps/frontend/*
docker-compose.yml
.gitignore
EOF

# Fetch and checkout
echo "📥 Fetching from repository..."
git fetch origin $BRANCH

# Checkout files
echo "📂 Checking out files..."
git checkout $BRANCH || git checkout -b $BRANCH origin/$BRANCH

echo "✅ Deployment clone complete!"
echo "📁 Directories available:"
ls -la apps/

# Show structure
echo ""
echo "📊 Directory structure:"
tree -L 3 apps/ || find apps/ -type d -maxdepth 2
```

### Make Executable

```bash
chmod +x /var/www/invpro/deploy-clone.sh
```

### Run Script

```bash
/var/www/invpro/deploy-clone.sh
```

---

## 🎯 Method 5: Using GitHub Actions / CI/CD

If you're using CI/CD, you can create a deployment artifact.

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Create Deployment Package

on:
  push:
    branches: [main]

jobs:
  package:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create deployment archive
        run: |
          tar -czf deployment.tar.gz \
            apps/backend \
            apps/frontend \
            docker-compose.yml \
            .gitignore
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: deployment-package
          path: deployment.tar.gz
```

Then download the artifact on your production server.

---

## 🔄 Updating Production (After Initial Clone)

### Using Sparse Checkout

```bash
cd /var/www/invpro
git pull origin main
```

### Using Git Archive (Manual)

```bash
# On local machine
git archive --format=tar.gz --output=update.tar.gz HEAD apps/backend apps/frontend

# Transfer and extract on server
scp update.tar.gz user@server:/var/www/invpro/
ssh user@server "cd /var/www/invpro && tar -xzf update.tar.gz --overwrite"
```

---

## 📋 Recommended Approach for Ubuntu Deployment

For the Ubuntu deployment guide, I recommend **Method 1 (Sparse Checkout)** because:

1. ✅ Keeps git history
2. ✅ Easy to update with `git pull`
3. ✅ No manual file transfer needed
4. ✅ Clean and efficient
5. ✅ Works with SSH deployment

### Updated Ubuntu Deployment Steps

In your `UBUNTU_DEPLOYMENT_GUIDE.md`, replace the clone steps with:

```bash
# Step 4.2: Clone Backend Code (Updated)
cd /var/www/invpro

# Initialize git
git init
git remote add origin https://github.com/yourusername/invpro.git

# Enable sparse checkout
git config core.sparseCheckout true

# Configure which directories to checkout
cat > .git/info/sparse-checkout << EOF
apps/backend/*
apps/frontend/*
docker-compose.yml
.gitignore
EOF

# Fetch and checkout
git fetch origin main
git checkout main
```

---

## 🔍 Verification

After cloning, verify you have the right structure:

```bash
# Check structure
ls -la apps/
# Should show: backend/  frontend/

# Verify backend files
ls apps/backend/ | head -10
# Should show: manage.py, requirements.txt, etc.

# Verify frontend files
ls apps/frontend/ | head -10
# Should show: package.json, next.config.mjs, etc.

# Check git status
git status
# Should show clean working directory
```

---

## ⚠️ Important Notes

### What Gets Cloned

✅ **Included:**
- `apps/backend/` - All backend files
- `apps/frontend/` - All frontend files
- Root files you specify (docker-compose.yml, .gitignore, etc.)

❌ **Not Included:**
- `docs/` directory
- `scripts/` directory
- Other root-level files
- Other apps if any

### Adding More Files Later

If you need additional files later:

```bash
# Edit sparse-checkout file
nano .git/info/sparse-checkout

# Add new paths:
# docs/
# scripts/

# Re-checkout
git read-tree -mu HEAD
```

### Updating Sparse Checkout

```bash
# Edit .git/info/sparse-checkout
nano .git/info/sparse-checkout

# Then refresh
git read-tree -mu HEAD
```

---

## 🚀 Quick Reference

### Sparse Checkout (Recommended)

```bash
git init
git remote add origin <repo-url>
git config core.sparseCheckout true
echo "apps/backend/*" >> .git/info/sparse-checkout
echo "apps/frontend/*" >> .git/info/sparse-checkout
git pull origin main
```

### Git Archive (One-time)

```bash
# Local
git archive --format=tar.gz -o deploy.tar.gz HEAD apps/backend apps/frontend

# Transfer and extract
scp deploy.tar.gz server:/var/www/invpro/
ssh server "cd /var/www/invpro && tar -xzf deploy.tar.gz"
```

---

## ✅ Summary

**Best Method for Production:** **Sparse Checkout (Method 1)**

- ✅ Efficient (only downloads what you need)
- ✅ Maintains git history
- ✅ Easy updates with `git pull`
- ✅ No manual file transfers
- ✅ Works seamlessly with deployment scripts

**Alternative:** **Git Archive (Method 2)** if you don't need git history on production server.

---

**Choose the method that best fits your deployment workflow!** 🚀

