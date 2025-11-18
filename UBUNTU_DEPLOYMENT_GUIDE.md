# Ubuntu 22.04 Deployment Guide - InvPro360

Complete step-by-step guide for deploying InvPro360 backend and frontend on Ubuntu 22.04 server using SSH.

---

## 📋 Prerequisites

- Ubuntu 22.04 LTS server
- SSH access to the server
- Domain name (optional but recommended)
- Root or sudo access

---

## 🚀 Step 1: Initial Server Setup

### 1.1 Connect to Server

```bash
ssh username@your-server-ip
```

### 1.2 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Create Application User

```bash
# Create a dedicated user for the application
sudo adduser invpro
sudo usermod -aG sudo invpro

# Switch to the new user
su - invpro
```

### 1.4 Install Essential Tools

```bash
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban
```

---

## 🗄️ Step 2: Install PostgreSQL Database

### 2.1 Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
```

### 2.2 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE invpro_db;
CREATE USER invpro_user WITH PASSWORD 'your-secure-password-here';
ALTER ROLE invpro_user SET client_encoding TO 'utf8';
ALTER ROLE invpro_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE invpro_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE invpro_db TO invpro_user;
\q
```

### 2.3 Configure PostgreSQL

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and update:
# listen_addresses = 'localhost'

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Ensure local connections are trusted:
# local   all             all                                     peer
# host    all             all             127.0.0.1/32            md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

---

## 🐍 Step 3: Install Python and Backend Dependencies

### 3.1 Install Python 3.11

```bash
# Add deadsnakes PPA for Python 3.11
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Install pip for Python 3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
```

### 3.2 Install Additional System Dependencies

```bash
sudo apt install -y \
    libpq-dev \
    gcc \
    g++ \
    libssl-dev \
    libffi-dev \
    libjpeg-dev \
    libpng-dev \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev
```

---

## 📦 Step 4: Deploy Backend Application

### 4.1 Create Application Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/invpro
sudo chown invpro:invpro /var/www/invpro
cd /var/www/invpro
```

### 4.2 Clone or Upload Backend Code

**Option A: Using Git (if repository is on GitHub/GitLab)**

```bash
git clone https://github.com/yourusername/invpro.git .
# Or clone only backend
git clone https://github.com/yourusername/invpro.git temp
mv temp/apps/backend /var/www/invpro/backend
rm -rf temp
```

**Option B: Using SCP (from your local machine)**

```bash
# From your local machine, run:
scp -r apps/backend invpro@your-server-ip:/var/www/invpro/
```

### 4.3 Set Up Python Virtual Environment

```bash
cd /var/www/invpro/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.4 Install Gunicorn

```bash
pip install gunicorn
```

### 4.5 Configure Environment Variables

```bash
# Create .env file
nano /var/www/invpro/backend/.env
```

Add the following content:

```env
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-generate-using-python-secrets-module
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,your-server-ip

# Database
POSTGRES_DB=invpro_db
POSTGRES_USER=invpro_user
POSTGRES_PASSWORD=your-secure-password-here
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Shopify Integration
SHOPIFY_WEBHOOK_BASE_URL=https://yourdomain.com
SHOPIFY_API_VERSION=2024-10
SHOPIFY_MAX_REQUESTS_PER_SECOND=40
SHOPIFY_SYNC_INTERVAL_PRODUCTS=3600
SHOPIFY_SYNC_INTERVAL_ORDERS=1800
SHOPIFY_SYNC_INTERVAL_CUSTOMERS=7200
SHOPIFY_SYNC_INTERVAL_INVENTORY=900

# Redis (if using Celery)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
```

**Generate SECRET_KEY:**

```bash
python3.11 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4.6 Run Migrations

```bash
cd /var/www/invpro/backend
source venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
```

### 4.7 Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

---

## 🎨 Step 5: Deploy Frontend Application

### 5.1 Install Node.js 20

```bash
# Install Node.js 20 using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 5.2 Set Up Frontend Directory

```bash
# Create frontend directory
sudo mkdir -p /var/www/invpro/frontend
sudo chown invpro:invpro /var/www/invpro/frontend
cd /var/www/invpro/frontend
```

### 5.3 Clone or Upload Frontend Code

**Option A: Using Git**

```bash
# If you cloned the full repo earlier
cp -r /var/www/invpro/apps/frontend/* /var/www/invpro/frontend/
```

**Option B: Using SCP (from your local machine)**

```bash
# From your local machine:
scp -r apps/frontend/* invpro@your-server-ip:/var/www/invpro/frontend/
```

### 5.4 Install Dependencies

```bash
cd /var/www/invpro/frontend
npm install --legacy-peer-deps
```

### 5.5 Configure Environment Variables

```bash
# Create .env.local file
nano /var/www/invpro/frontend/.env.local
```

Add the following:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# Or if backend and frontend on same domain:
# NEXT_PUBLIC_API_URL=https://yourdomain.com/api

NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 5.6 Configure Next.js for Production

```bash
# Check if next.config exists
cd /var/www/invpro/frontend
ls -la next.config.*

# Edit the config file (could be .js, .mjs, or .ts)
nano next.config.mjs
# or
nano next.config.js
```

Add `output: 'standalone'` to enable standalone build:

**For .mjs (ES modules):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For production deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
```

**For .js (CommonJS):**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For production deployment
  reactStrictMode: true,
}

module.exports = nextConfig
```

### 5.7 Build Frontend

```bash
cd /var/www/invpro/frontend
npm run build
```

**Note:** The build will create a `.next/standalone` directory that contains all necessary files for production.

---

## 🔄 Step 6: Install Redis (for Celery)

### 6.1 Install Redis

```bash
sudo apt install -y redis-server
```

### 6.2 Configure Redis

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Find and set:
# supervised systemd

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

---

## 🌐 Step 7: Configure Nginx

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Configure Backend (API) Server Block

```bash
sudo nano /etc/nginx/sites-available/invpro-backend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com your-server-ip;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files
    location /static/ {
        alias /var/www/invpro/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/invpro/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

### 7.3 Configure Frontend Server Block

```bash
sudo nano /etc/nginx/sites-available/invpro-frontend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

### 7.4 Enable Sites

```bash
# Enable backend
sudo ln -s /etc/nginx/sites-available/invpro-backend /etc/nginx/sites-enabled/

# Enable frontend
sudo ln -s /etc/nginx/sites-available/invpro-frontend /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 Step 8: Install SSL Certificate (Let's Encrypt)

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain SSL Certificate

```bash
# For backend API
sudo certbot --nginx -d api.yourdomain.com

# For frontend
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 8.3 Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up renewal via systemd timer
```

### 8.4 Update Nginx Configs for HTTPS

After SSL installation, update the server blocks to redirect HTTP to HTTPS and update proxy settings.

---

## ⚙️ Step 9: Set Up Systemd Services

### 9.1 Create Backend Service

```bash
sudo nano /etc/systemd/system/invpro-backend.service
```

Add the following:

```ini
[Unit]
Description=InvPro360 Django Backend
After=network.target postgresql.service

[Service]
Type=notify
User=invpro
Group=invpro
WorkingDirectory=/var/www/invpro/backend
Environment="PATH=/var/www/invpro/backend/venv/bin"
ExecStart=/var/www/invpro/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/invpro/backend-access.log \
    --error-logfile /var/log/invpro/backend-error.log \
    backend.wsgi:application
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 9.2 Create Frontend Service

```bash
sudo nano /etc/systemd/system/invpro-frontend.service
```

Add the following (choose one option):

**Option A: Using npm start (if not using standalone build)**

```ini
[Unit]
Description=InvPro360 Next.js Frontend
After=network.target

[Service]
Type=simple
User=invpro
Group=invpro
WorkingDirectory=/var/www/invpro/frontend
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="HOSTNAME=0.0.0.0"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Option B: Using standalone build (recommended, more efficient)**

```ini
[Unit]
Description=InvPro360 Next.js Frontend
After=network.target

[Service]
Type=simple
User=invpro
Group=invpro
WorkingDirectory=/var/www/invpro/frontend/.next/standalone
Environment="NODE_ENV=production"
Environment="PORT=3000"
Environment="HOSTNAME=0.0.0.0"
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Note:** If using Option B, you need to:
1. Ensure `next.config.js` has `output: 'standalone'`
2. Copy public and static files:
   ```bash
   cp -r /var/www/invpro/frontend/.next/static /var/www/invpro/frontend/.next/standalone/.next/static
   cp -r /var/www/invpro/frontend/public /var/www/invpro/frontend/.next/standalone/public
   ```

### 9.3 Create Celery Worker Service (Optional)

```bash
sudo nano /etc/systemd/system/invpro-celery.service
```

Add the following:

```ini
[Unit]
Description=InvPro360 Celery Worker
After=network.target redis.service

[Service]
Type=simple
User=invpro
Group=invpro
WorkingDirectory=/var/www/invpro/backend
Environment="PATH=/var/www/invpro/backend/venv/bin"
ExecStart=/var/www/invpro/backend/venv/bin/celery -A backend worker -l info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 9.4 Create Celery Beat Service (Optional)

```bash
sudo nano /etc/systemd/system/invpro-celery-beat.service
```

Add the following:

```ini
[Unit]
Description=InvPro360 Celery Beat
After=network.target redis.service

[Service]
Type=simple
User=invpro
Group=invpro
WorkingDirectory=/var/www/invpro/backend
Environment="PATH=/var/www/invpro/backend/venv/bin"
ExecStart=/var/www/invpro/backend/venv/bin/celery -A backend beat -l info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 9.5 Create Log Directory

```bash
sudo mkdir -p /var/log/invpro
sudo chown invpro:invpro /var/log/invpro
```

### 9.6 Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable invpro-backend
sudo systemctl enable invpro-frontend
sudo systemctl enable invpro-celery
sudo systemctl enable invpro-celery-beat

# Start services
sudo systemctl start invpro-backend
sudo systemctl start invpro-frontend
sudo systemctl start invpro-celery
sudo systemctl start invpro-celery-beat

# Check status
sudo systemctl status invpro-backend
sudo systemctl status invpro-frontend
```

---

## 🔥 Step 10: Configure Firewall

### 10.1 Set Up UFW

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## ✅ Step 11: Verify Deployment

### 11.1 Check Services

```bash
# Check backend
curl http://localhost:8000/api/

# Check frontend
curl http://localhost:3000

# Check Nginx
curl http://your-server-ip
```

### 11.2 Check Logs

```bash
# Backend logs
sudo journalctl -u invpro-backend -f

# Frontend logs
sudo journalctl -u invpro-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 11.3 Test Application

1. Access frontend: `https://yourdomain.com`
2. Test login
3. Navigate to Settings → Integrations → Shopify
4. Enter Shopify credentials
5. Test product sync

---

## 🔄 Step 12: Deployment Scripts

### 12.1 Create Deployment Script

```bash
nano /var/www/invpro/deploy.sh
```

Add the following:

```bash
#!/bin/bash

set -e

echo "Starting deployment..."

# Backend deployment
cd /var/www/invpro/backend
source venv/bin/activate
git pull origin main  # If using git
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart invpro-backend
sudo systemctl restart invpro-celery
sudo systemctl restart invpro-celery-beat

# Frontend deployment
cd /var/www/invpro/frontend
git pull origin main  # If using git
npm install --legacy-peer-deps
npm run build

# If using standalone build, copy static files
if [ -d ".next/standalone" ]; then
    cp -r .next/static .next/standalone/.next/static
    cp -r public .next/standalone/public
fi

sudo systemctl restart invpro-frontend

# Reload Nginx
sudo systemctl reload nginx

echo "Deployment complete!"
```

Make it executable:

```bash
chmod +x /var/www/invpro/deploy.sh
```

---

## 📝 Step 13: Post-Deployment Checklist

- [ ] Backend service running: `sudo systemctl status invpro-backend`
- [ ] Frontend service running: `sudo systemctl status invpro-frontend`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] PostgreSQL running: `sudo systemctl status postgresql`
- [ ] Redis running: `sudo systemctl status redis-server`
- [ ] SSL certificate installed and valid
- [ ] Can access frontend via domain
- [ ] Can access backend API via domain
- [ ] Login functionality works
- [ ] Shopify integration works
- [ ] Product sync works
- [ ] Firewall configured
- [ ] Backups configured (see next section)

---

## 💾 Step 14: Set Up Backups

### 14.1 Database Backup Script

```bash
nano /var/www/invpro/backup-db.sh
```

Add the following:

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/invpro"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="invpro_db"
DB_USER="invpro_user"

mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD='your-db-password' pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

Make it executable:

```bash
chmod +x /var/www/invpro/backup-db.sh
```

### 14.2 Schedule Daily Backups

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/invpro/backup-db.sh >> /var/log/invpro/backup.log 2>&1
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check logs
sudo journalctl -u invpro-backend -n 50

# Check if port is in use
sudo netstat -tlnp | grep 8000

# Test manually
cd /var/www/invpro/backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

### Frontend Not Starting

```bash
# Check logs
sudo journalctl -u invpro-frontend -n 50

# Check if port is in use
sudo netstat -tlnp | grep 3000

# Test manually
cd /var/www/invpro/frontend
npm start
```

### Database Connection Issues

```bash
# Test connection
psql -U invpro_user -d invpro_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload Nginx
sudo systemctl reload nginx
```

---

## 🔐 Security Recommendations

1. **Keep system updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure fail2ban:**
   ```bash
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **Disable root SSH login:**
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

4. **Use SSH keys instead of passwords**

5. **Regular security updates**

---

## 📊 Monitoring

### Check Service Status

```bash
# All services
sudo systemctl status invpro-backend invpro-frontend invpro-celery invpro-celery-beat

# Resource usage
htop
df -h
free -h
```

### View Logs

```bash
# Backend logs
sudo journalctl -u invpro-backend -f

# Frontend logs
sudo journalctl -u invpro-frontend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🎉 Success!

Your InvPro360 application should now be running on Ubuntu 22.04!

**Access your application:**
- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com`
- Admin Panel: `https://api.yourdomain.com/admin/`

**Next Steps:**
1. Test all functionality
2. Configure monitoring (optional)
3. Set up automated backups
4. Configure email notifications
5. Set up SSL certificate auto-renewal monitoring

---

## 📞 Quick Reference Commands

```bash
# Restart services
sudo systemctl restart invpro-backend
sudo systemctl restart invpro-frontend
sudo systemctl restart nginx

# View logs
sudo journalctl -u invpro-backend -f
sudo journalctl -u invpro-frontend -f

# Check status
sudo systemctl status invpro-backend
sudo systemctl status invpro-frontend

# Run migrations
cd /var/www/invpro/backend
source venv/bin/activate
python manage.py migrate

# Deploy updates
/var/www/invpro/deploy.sh

# Check if services are listening
sudo netstat -tlnp | grep -E '8000|3000|5432|6379'
```

## 🔗 Alternative: Single Domain Setup

If you want to serve both frontend and backend from the same domain:

### Nginx Configuration (Single Domain)

```bash
sudo nano /etc/nginx/sites-available/invpro
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Static files
    location /static/ {
        alias /var/www/invpro/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /var/www/invpro/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Next.js static files
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Then update frontend `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

---

**Your application is now deployed and ready to use!** 🚀

