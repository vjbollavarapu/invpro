# InvPro360 Frontend

**Multi-Tenant Inventory & Procurement Management System - Frontend Application**

A modern, responsive web application built with Next.js 15, React 19, and TypeScript for managing inventory, sales, procurement, warehouses, finance, and pharmaceutical operations across multiple tenants and industries.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [API Integration](#api-integration)
- [Key Components](#key-components)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

InvPro360 Frontend is a comprehensive inventory management system that provides:

- **Multi-Tenant Architecture**: Support for multiple organizations with complete data isolation
- **Industry-Aware**: Adapts UI and features based on industry type (Retail, Pharmacy, Manufacturing, etc.)
- **Real-Time Updates**: Live data synchronization with backend APIs
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI/UX**: Built with Radix UI and Tailwind CSS for a polished, accessible interface

---

## 🛠 Tech Stack

### Core Framework
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety

### UI & Styling
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **next-themes** - Dark mode support

### State Management & Data Fetching
- **TanStack Query (React Query) 5.90.3** - Server state management
- **React Hook Form 7.65.0** - Form handling
- **Zod 3.25.76** - Schema validation

### Charts & Visualization
- **Recharts** - Chart library
- **jsPDF & jsPDF-AutoTable** - PDF generation

### Testing
- **Jest 30.2.0** - Unit testing
- **Playwright 1.56.0** - E2E testing
- **Testing Library** - React component testing

### Other Libraries
- **date-fns 4.1.0** - Date manipulation
- **PapaParse 5.5.3** - CSV parsing
- **XLSX 0.18.5** - Excel file handling
- **Sonner 1.7.4** - Toast notifications

---

## ✨ Features

### 🔐 Authentication & Authorization
- User login/registration
- Email verification
- Password reset
- JWT token management
- Protected routes
- Role-based access control
- Multi-tenant user context

### 📊 Dashboard
- Real-time metrics and KPIs
- Interactive charts and graphs
- Quick actions
- Recent activity feed
- Industry-specific dashboards

### 📦 Inventory Management
- Product catalog management
- Stock level tracking
- Inventory adjustments
- Stock movements history
- Low stock alerts
- Multi-warehouse support

### 💰 Sales Management
- Customer management
- Sales order creation and tracking
- Order status management
- Sales reports and analytics
- Customer history

### 🛒 Procurement
- Supplier management
- Purchase request creation
- Purchase order management
- Receiving and fulfillment
- Supplier performance tracking

### 🏭 Warehouse Management
- Multi-warehouse support
- Warehouse transfers
- Location tracking
- Stock allocation

### 💵 Finance Management
- Cost center management
- Expense tracking
- Financial reports
- Budget management

### 💊 Pharmaceutical Module (Industry-Specific)
- Drug product management
- Batch tracking with expiry dates
- Dispensing management
- Expiry alerts
- Packaging levels
- Regulatory compliance

### 🔌 Third-Party Integrations
- **Shopify Integration**
  - Store connection
  - Product synchronization
  - Order synchronization
  - Customer synchronization
  - Inventory sync
  - Webhook support

- **Stripe Integration**
  - Payment processing
  - Test/Live mode support
  - Webhook configuration

- **Email Service Integration**
  - SMTP configuration
  - Multiple providers (SendGrid, Mailgun, AWS SES, Gmail)
  - Email sending management

### ⚙️ Settings & Configuration
- Company information
- User management
- Role management
- Integration settings
- System preferences
- Notification settings

### 📈 Reports & Analytics
- Inventory reports
- Sales reports
- Procurement reports
- Warehouse reports
- Financial reports
- Export to PDF/Excel/CSV

### 📤 Import/Export
- Bulk data import (CSV, Excel)
- Data export (PDF, Excel, CSV)
- Template downloads

### 🔔 Notifications
- Real-time notifications
- Notification center
- Mark as read/unread
- Notification preferences

---

## 📁 Project Structure

```
apps/frontend/
├── app/                          # Next.js App Router
│   ├── api/                      # API route handlers (proxies to backend)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── dashboard/            # Dashboard data
│   │   ├── inventory/            # Inventory endpoints
│   │   ├── sales/                # Sales endpoints
│   │   ├── procurement/          # Procurement endpoints
│   │   ├── finance/              # Finance endpoints
│   │   ├── pharma/               # Pharmaceutical endpoints
│   │   ├── integrations/         # Third-party integrations
│   │   └── ...
│   ├── dashboard/                # Dashboard pages
│   │   ├── inventory/            # Inventory management
│   │   ├── sales/                # Sales management
│   │   ├── procurement/          # Procurement management
│   │   ├── finance/              # Finance management
│   │   ├── pharmacy/             # Pharmaceutical module
│   │   ├── warehouses/           # Warehouse management
│   │   ├── reports/              # Reports and analytics
│   │   ├── settings/             # Settings pages
│   │   └── ...
│   ├── login/                    # Login page
│   ├── register/                # Registration page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── ui/                       # Base UI components (Radix UI)
│   ├── forms/                    # Form components
│   ├── charts/                   # Chart components
│   ├── pharmacy/                 # Pharmacy-specific components
│   ├── auth-provider.tsx         # Authentication context
│   ├── industry-provider.tsx     # Industry context
│   └── ...
├── lib/                          # Utilities and helpers
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   ├── validations/              # Zod schemas
│   ├── api-client.ts             # API client
│   └── industry-registry.ts      # Industry configurations
├── hooks/                        # Global hooks
├── types/                        # TypeScript type definitions
├── styles/                       # Global styles
├── public/                       # Static assets
├── e2e/                          # End-to-end tests
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
└── tailwind.config.js            # Tailwind CSS configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **npm** or **yarn** or **pnpm**
- Backend API running (see backend README)

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd apps/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   NODE_ENV=development
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage

# E2E Testing
npm run test:e2e     # Run Playwright tests
npm run test:e2e:ui  # Run tests with UI
npm run test:e2e:headed # Run tests in headed mode
npm run test:e2e:report # Show test report
```

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test:**
   ```bash
   npm run dev
   ```

3. **Run tests:**
   ```bash
   npm run test
   npm run test:e2e
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Code formatting (if configured)
- **Components**: Use functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions

---

## 🏗 Building for Production

### Build Process

```bash
# Build the application
npm run build

# The build output will be in .next/ directory
# For standalone build, configure next.config.mjs:
# output: 'standalone'
```

### Standalone Build

For production deployment, enable standalone output:

```javascript
// next.config.mjs
const nextConfig = {
  output: 'standalone',
  // ... other config
}
```

Then build:
```bash
npm run build
```

The standalone build creates a minimal server in `.next/standalone/` that includes only necessary files.

### Production Server

```bash
# Start production server
npm run start

# Or use the standalone build
cd .next/standalone
node server.js
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run Playwright tests
npm run test:e2e

# With UI
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed
```

### Test Files Location

- Unit tests: `components/__tests__/`, `lib/utils/__tests__/`
- E2E tests: `e2e/*.spec.ts`

---

## 🔧 Environment Variables

Create `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
# Production: https://api.yourdomain.com/api

# Environment
NODE_ENV=development

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_SHOPIFY=true
NEXT_PUBLIC_ENABLE_STRIPE=true
```

### Required Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL

### Optional Variables

- `NODE_ENV` - Environment (development/production)
- `NEXT_PUBLIC_ANALYTICS_ID` - Analytics tracking ID
- Feature flags for enabling/disabling features

---

## 🔌 API Integration

### API Client

The application uses a centralized API client located in `lib/api-client.ts`:

```typescript
import { apiRequest } from '@/lib/api-client'

// GET request
const data = await apiRequest('/inventory/products/')

// POST request
const result = await apiRequest('/inventory/products/', {
  method: 'POST',
  body: JSON.stringify({ name: 'Product Name' })
})
```

### React Query Hooks

Custom hooks for data fetching are in `lib/hooks/`:

```typescript
import { useProducts } from '@/lib/hooks/useProducts'

function MyComponent() {
  const { data, isLoading, error } = useProducts()
  // ...
}
```

### Available Hooks

- `useProducts()` - Product management
- `useOrders()` - Sales orders
- `useCustomers()` - Customer management
- `useInventory()` - Inventory operations
- `useShopifyStatus()` - Shopify integration
- `useDashboardData()` - Dashboard metrics
- And more...

---

## 🧩 Key Components

### Authentication

- **AuthProvider** (`components/auth-provider.tsx`) - Manages authentication state
- **ProtectedRoute** (`components/protected-route.tsx`) - Route protection
- **Login/Register Pages** - Authentication UI

### Layout

- **DashboardLayout** - Main dashboard layout with sidebar
- **DashboardSidebar** - Navigation sidebar
- **DashboardHeader** - Top header with user menu

### Industry-Aware

- **IndustryProvider** - Industry context
- **IndustrySelector** - Industry selection component
- **IndustryAwareDashboard** - Industry-specific dashboard

### Forms

- **DynamicFormBuilder** - Dynamic form generation
- **ProductForm** - Product creation/editing
- **ImportExportDialog** - Bulk import/export

### Pharmacy

- **DrugProductsTab** - Drug product management
- **BatchInventoryTab** - Batch tracking
- **DispensingTab** - Dispensing operations
- **ExpiryAlertsTab** - Expiry monitoring

### Integrations

- **Shopify Integration Pages** - Shopify connection and management
- **Stripe Integration Pages** - Payment gateway setup
- **Email Service Pages** - Email configuration

---

## 🚢 Deployment

### Docker Deployment

```bash
# Build Docker image
docker build -t invpro-frontend .

# Run container
docker run -p 3000:3000 invpro-frontend
```

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment

See [UBUNTU_DEPLOYMENT_GUIDE.md](../../UBUNTU_DEPLOYMENT_GUIDE.md) for detailed Ubuntu deployment instructions.

### Production Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` to production API
- [ ] Build with `npm run build`
- [ ] Test production build locally
- [ ] Configure environment variables
- [ ] Set up SSL/HTTPS
- [ ] Configure CORS on backend
- [ ] Set up monitoring
- [ ] Configure error tracking

---

## 🐛 Troubleshooting

### Common Issues

**Issue: API requests failing**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS configuration on backend

**Issue: Build errors**
- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run build`

**Issue: Authentication not working**
- Verify JWT tokens are being stored
- Check localStorage in browser DevTools
- Verify backend authentication endpoint

**Issue: Styling issues**
- Clear browser cache
- Restart dev server
- Check Tailwind CSS configuration

### Debug Mode

Enable debug logging:

```typescript
// In api-client.ts or components
console.log('Debug info:', data)
```

### Getting Help

- Check backend API documentation
- Review error messages in browser console
- Check network tab in DevTools
- Review server logs

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 🤝 Contributing

1. Follow the code style guidelines
2. Write tests for new features
3. Update documentation
4. Submit pull requests with clear descriptions

---

## 📄 License

[Your License Here]

---

## 👥 Team

InvPro360 Development Team

---

**Built with ❤️ using Next.js, React, and TypeScript**
