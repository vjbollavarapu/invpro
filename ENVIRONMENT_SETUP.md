# Environment Setup Guide - InvPro360

## Backend Environment Variables

Create `apps/backend/.env` with:

```env
# Django Settings
DEBUG=1
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (PostgreSQL)
DB_NAME=invpro360
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

# Redis (Celery & Caching)
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-password
DEFAULT_FROM_EMAIL=noreply@invpro360.com

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Shopify Integration
# Default Shopify API version (can be overridden per integration)
SHOPIFY_API_VERSION=2024-01

# Shopify Webhook Settings
# Base URL for webhook endpoints (used for webhook creation)
SHOPIFY_WEBHOOK_BASE_URL=http://localhost:8000

# Shopify Rate Limiting
# Maximum requests per second (default: 40, Shopify's limit)
SHOPIFY_MAX_REQUESTS_PER_SECOND=40

# Shopify Sync Settings
# Default sync intervals (in seconds)
SHOPIFY_SYNC_INTERVAL_PRODUCTS=3600  # 1 hour
SHOPIFY_SYNC_INTERVAL_ORDERS=1800    # 30 minutes
SHOPIFY_SYNC_INTERVAL_CUSTOMERS=7200 # 2 hours
SHOPIFY_SYNC_INTERVAL_INVENTORY=900  # 15 minutes

# Shopify Error Handling
# Maximum retry attempts for failed requests
SHOPIFY_MAX_RETRY_ATTEMPTS=3
# Retry delay in seconds
SHOPIFY_RETRY_DELAY=5

# Shopify Logging
# Enable detailed Shopify API logging
SHOPIFY_DEBUG_LOGGING=False
# Log level for Shopify operations
SHOPIFY_LOG_LEVEL=INFO
```

## Frontend Environment Variables

Create `apps/frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=localhost:8000

# Shopify Integration (Frontend)
# Enable Shopify integration features
NEXT_PUBLIC_SHOPIFY_ENABLED=true

# Shopify API Configuration
# Default API version for frontend requests
NEXT_PUBLIC_SHOPIFY_API_VERSION=2024-01

# Shopify Sync Settings
# Default sync intervals (in milliseconds)
NEXT_PUBLIC_SHOPIFY_SYNC_INTERVAL=300000  # 5 minutes

# Shopify UI Settings
# Enable/disable Shopify-specific UI features
NEXT_PUBLIC_SHOPIFY_UI_ENABLED=true
# Show Shopify sync status in dashboard
NEXT_PUBLIC_SHOPIFY_DASHBOARD_WIDGET=true
# Enable Shopify-specific notifications
NEXT_PUBLIC_SHOPIFY_NOTIFICATIONS=true
```

## Quick Start

### 1. Backend Setup:
```bash
cd apps/backend
pip install -r requirements.txt
python manage.py migrate
python seed_pharmacy_data.py
python manage.py runserver
```

### 2. Frontend Setup:
```bash
cd apps/frontend
npm install --legacy-peer-deps
npm run dev
```

### 3. Access:
- Frontend: http://localhost:3000
- Pharmacy: http://localhost:3000/dashboard/pharmacy
- API Docs: http://localhost:8000/api/docs/

### 4. Test Credentials:
- Pharmacy: pharmacist@demo.com / Pharma123456
- Demo: demo@example.com / Demo123456

## Shopify Integration Setup

### 1. Create Shopify App:
1. Go to your Shopify Partner Dashboard
2. Create a new app
3. Configure the following scopes:
   - `read_products` - Read product information
   - `write_products` - Update product information
   - `read_orders` - Read order information
   - `write_orders` - Update order information
   - `read_customers` - Read customer information
   - `write_customers` - Update customer information
   - `read_inventory` - Read inventory levels
   - `write_inventory` - Update inventory levels

### 2. Get Shopify Credentials:
1. From your Shopify app settings, get:
   - **API Key** (Client ID)
   - **API Secret** (Client Secret)
   - **Access Token** (from OAuth flow)

### 3. Configure Webhooks (Optional):
1. Set webhook endpoints in your Shopify app:
   - Products: `http://your-domain.com/api/integrations/shopify/webhook/`
   - Orders: `http://your-domain.com/api/integrations/shopify/webhook/`
   - Customers: `http://your-domain.com/api/integrations/shopify/webhook/`
   - Inventory: `http://your-domain.com/api/integrations/shopify/webhook/`

### 4. Environment Variables:
Add the following to your `.env` files:

**Backend (`apps/backend/.env`):**
```env
# Shopify Integration
SHOPIFY_API_VERSION=2024-01
SHOPIFY_WEBHOOK_BASE_URL=http://localhost:8000
SHOPIFY_MAX_REQUESTS_PER_SECOND=40
SHOPIFY_SYNC_INTERVAL_PRODUCTS=3600
SHOPIFY_SYNC_INTERVAL_ORDERS=1800
SHOPIFY_SYNC_INTERVAL_CUSTOMERS=7200
SHOPIFY_SYNC_INTERVAL_INVENTORY=900
SHOPIFY_MAX_RETRY_ATTEMPTS=3
SHOPIFY_RETRY_DELAY=5
SHOPIFY_DEBUG_LOGGING=False
SHOPIFY_LOG_LEVEL=INFO
```

**Frontend (`apps/frontend/.env.local`):**
```env
# Shopify Integration (Frontend)
NEXT_PUBLIC_SHOPIFY_ENABLED=true
NEXT_PUBLIC_SHOPIFY_API_VERSION=2024-01
NEXT_PUBLIC_SHOPIFY_SYNC_INTERVAL=300000
NEXT_PUBLIC_SHOPIFY_UI_ENABLED=true
NEXT_PUBLIC_SHOPIFY_DASHBOARD_WIDGET=true
NEXT_PUBLIC_SHOPIFY_NOTIFICATIONS=true
```

### 5. Connect Shopify:
1. Go to Settings → Integrations → Shopify
2. Enter your Shopify store URL (e.g., `mystore.myshopify.com`)
3. Enter your API Key, API Secret, and Access Token
4. Click "Connect" to establish the connection
5. Configure sync settings and start syncing data

### 6. Sync Data:
- **Full Sync**: Syncs all products, orders, customers, and inventory
- **Products**: Sync product information and variants
- **Orders**: Sync order details and line items
- **Customers**: Sync customer profiles and addresses
- **Inventory**: Sync real-time stock levels

### 7. Monitor Activity:
- View sync status in the integration dashboard
- Check sync logs for detailed activity
- Monitor error rates and performance
- Set up webhooks for real-time updates

