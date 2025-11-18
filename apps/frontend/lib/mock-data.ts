// Mock subscription plans
export const mockPlans = [
  {
    id: 1,
    name: "Starter",
    price: 49,
    features: ["1 Warehouse", "Basic Reports", "Email Support"],
  },
  {
    id: 2,
    name: "Pro",
    price: 99,
    features: ["5 Warehouses", "AI Forecasting", "Priority Support"],
  },
  {
    id: 3,
    name: "Enterprise",
    price: 199,
    features: ["Unlimited", "Automation Rules", "Dedicated Manager"],
  },
]

// Mock company profile
export const mockCompanyProfile = {
  name: "Demo Tenant",
  industry: "Retail",
  timezone: "Asia/Kuala_Lumpur",
  currency: "MYR",
}

// Mock tenant memberships
export const mockTenantMemberships = [
  {
    tenantId: "tenant-1",
    tenantName: "Acme Corporation",
    role: "Admin",
  },
  {
    tenantId: "tenant-2",
    tenantName: "TechStart Inc",
    role: "Manager",
  },
  {
    tenantId: "tenant-3",
    tenantName: "Global Logistics Ltd",
    role: "Viewer",
  },
]
