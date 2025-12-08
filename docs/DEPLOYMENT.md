# Deployment Guide

Complete guide for deploying InvPro360 to production.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Ubuntu Server Deployment](#ubuntu-server-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Using Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd invpro

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Start services
docker-compose up -d

# 4. Run migrations
docker-compose exec backend python manage.py migrate

# 5. Create superuser
docker-compose exec backend python manage.py createsuperuser

# 6. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/
```

---

## Ubuntu Server Deployment

### Prerequisites
- Ubuntu 22.04 LTS server
- SSH access
- Domain name (optional)
- Root or sudo access

### Step 1: Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Create application user
sudo adduser invpro
sudo usermod -aG sudo invpro
su - invpro
```

### Step 2: Install Dependencies

**Python 3.11+ and PostgreSQL:**
```bash
# Install Python
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE invpro_db;
CREATE USER invpro_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE invpro_db TO invpro_user;
\q
```

**Node.js 18+ (for frontend):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Step 3: Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> invpro
sudo chown -R invpro:invpro invpro
cd invpro

# Backend setup
cd apps/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install --legacy-peer-deps
npm run build
```

### Step 4: Configure Services

**Systemd service for backend:**
```bash
sudo nano /etc/systemd/system/invpro-backend.service
```

```ini
[Unit]
Description=InvPro360 Backend
After=network.target

[Service]
User=invpro
WorkingDirectory=/var/www/invpro/apps/backend
Environment="PATH=/var/www/invpro/apps/backend/venv/bin"
ExecStart=/var/www/invpro/apps/backend/venv/bin/gunicorn backend.wsgi:application --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable invpro-backend
sudo systemctl start invpro-backend
```

**Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/invpro
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/invpro/apps/frontend/.next;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/invpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Docker Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./apps/backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./apps/backend:/app
    depends_on:
      - db

  frontend:
    build: ./apps/frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=invpro_db
      - POSTGRES_USER=invpro_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Deploy

```bash
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py collectstatic --noinput
```

---

## Environment Configuration

### Backend (.env)

```env
# Django
DEBUG=False
SECRET_KEY=your-secret-key-50-chars-minimum
ALLOWED_HOSTS=your-domain.com,api.your-domain.com

# Database
POSTGRES_DB=invpro_db
POSTGRES_USER=invpro_user
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Shopify
SHOPIFY_WEBHOOK_BASE_URL=https://your-domain.com
SHOPIFY_API_VERSION=2024-10

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

---

## Database Setup

### Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Seed data (optional)
python manage.py seed_data
```

### Static Files

```bash
python manage.py collectstatic --noinput
```

---

## Troubleshooting

### Migration Issues

**Permission errors:**
```bash
sudo chown -R invpro:invpro /var/www/invpro/apps/backend/shopify_integration/migrations
sudo chmod -R 775 /var/www/invpro/apps/backend/shopify_integration/migrations
```

**Migration conflicts:**
- Check for duplicate migration files
- Delete conflicting migrations
- Recreate: `python manage.py makemigrations`

### Connection Issues

**Database connection:**
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in `.env`
- Test connection: `psql -U invpro_user -d invpro_db`

**API connection:**
- Check backend is running: `sudo systemctl status invpro-backend`
- Check logs: `sudo journalctl -u invpro-backend -f`
- Verify CORS settings

### Static Files

**404 on static files:**
- Run `collectstatic`: `python manage.py collectstatic --noinput`
- Check `STATIC_ROOT` in settings
- Verify Nginx configuration

---

## Production Checklist

- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` generated
- [ ] `ALLOWED_HOSTS` configured
- [ ] Database credentials secure
- [ ] SSL/HTTPS configured
- [ ] Static files collected
- [ ] Migrations applied
- [ ] Superuser created
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Backups scheduled

---

**Last Updated**: January 2025  
**Status**: ✅ Production Ready

