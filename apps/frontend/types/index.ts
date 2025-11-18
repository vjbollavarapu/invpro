// User and Authentication Types
export interface User {
  id: string | number
  email: string
  username?: string
  name: string
  firstName?: string
  lastName?: string
  tenantId: string | number
  tenantName?: string
  role: string
  tenants?: TenantMembership[]
}

export interface TenantMembership {
  tenantId: string | number
  tenantName: string
  role: string
  isActive?: boolean
}

export interface Tenant {
  id: string | number
  name: string
  code: string
  domain?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Subscription {
  id: string | number
  planId: number
  planName: string
  status: "active" | "inactive" | "trial" | "cancelled"
  expiresAt: string
}

// Product and Inventory Types
export interface Product {
  id: string | number
  name: string
  sku: string
  description?: string
  category: string
  quantity: number
  unit: string
  unitCost: number
  sellingPrice: number
  totalValue: number
  reorderLevel: number
  warehouse?: Warehouse | string
  supplier?: Supplier | string | number
  status: string
  stockStatus: "In Stock" | "Low Stock" | "Out of Stock"
  lastUpdated?: string
  createdAt?: string
  updatedAt?: string
}

export interface StockMovement {
  id: string | number
  product: Product | number
  productName?: string
  movementType: "in" | "out" | "adjustment" | "transfer"
  quantity: number
  fromWarehouse?: Warehouse | number
  toWarehouse?: Warehouse | number
  performedBy?: User | number
  performedByName?: string
  reason?: string
  referenceNumber?: string
  createdAt: string
}

// Warehouse Types
export interface Warehouse {
  id: string | number
  name: string
  code?: string
  location?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  capacity?: number
  currentCapacity?: number
  capacityPercentage?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface WarehouseTransfer {
  id: string | number
  product: Product | number
  productName?: string
  fromWarehouse: Warehouse | number
  toWarehouse: Warehouse | number
  quantity: number
  status: "pending" | "in_transit" | "completed" | "cancelled"
  transferDate: string
  completedDate?: string
  notes?: string
  createdAt: string
}

// Sales Types
export interface Customer {
  id: string | number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  totalOrders?: number
  totalRevenue?: number
  createdAt?: string
  updatedAt?: string
}

export interface Order {
  id: string | number
  orderNumber: string
  customer: Customer | number
  customerName?: string
  orderDate: string
  deliveryDate?: string
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  totalAmount: number
  itemsCount?: number
  items?: OrderItem[]
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface OrderItem {
  id: string | number
  order?: number
  product: Product | number
  productName?: string
  quantity: number
  price: number
  total: number
}

// Procurement Types
export interface Supplier {
  id: string | number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  totalOrders?: number
  activeOrders?: number
  rating?: number
  createdAt?: string
  updatedAt?: string
}

export interface PurchaseRequest {
  id: string | number
  requestNumber: string
  product: Product | number
  productName?: string
  quantity: number
  requestedBy: User | number
  requestedByName?: string
  status: "pending" | "approved" | "rejected" | "ordered"
  priority: "low" | "medium" | "high" | "urgent"
  reason?: string
  requestDate: string
  approvedDate?: string
  createdAt?: string
}

export interface PurchaseOrder {
  id: string | number
  orderNumber: string
  supplier: Supplier | number
  supplierName?: string
  orderDate: string
  expectedDelivery?: string
  status: "draft" | "pending" | "approved" | "ordered" | "received" | "cancelled"
  totalAmount: number
  itemsCount?: number
  items?: PurchaseOrderItem[]
  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface PurchaseOrderItem {
  id: string | number
  purchaseOrder?: number
  product: Product | number
  productName?: string
  quantity: number
  price: number
  total: number
  receivedQuantity?: number
}

// Finance Types
export interface CostCenter {
  id: string | number
  name: string
  code?: string
  description?: string
  budget?: number
  spent?: number
  variance?: number
  variancePercentage?: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Expense {
  id: string | number
  expenseNumber: string
  costCenter: CostCenter | number
  costCenterName?: string
  category: string
  amount: number
  description?: string
  expenseDate: string
  status: "draft" | "pending" | "approved" | "paid" | "rejected"
  linkedTo?: string
  linkedId?: number
  paymentMethod?: string
  receiptUrl?: string
  createdAt?: string
  updatedAt?: string
}

// Dashboard Types
export interface DashboardMetrics {
  totalStockValue: number
  activeWarehouses: number
  pendingOrders: number
  purchaseRequests: number
  lowStockItems: number
  outOfStockItems: number
  recentRevenue30d: number
  budgetVariance: number
}

export interface DashboardStats {
  totalProducts: number
  totalCustomers: number
  totalSuppliers: number
  totalWarehouses: number
  totalOrders: number
  recentOrders30d: number
}

export interface DashboardData {
  tenant: Tenant
  metrics: DashboardMetrics
  stats: DashboardStats
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  count: number
  next?: string | null
  previous?: string | null
  page?: number
  pageSize?: number
  totalPages?: number
}

// Notification Types
export interface Notification {
  id: string | number
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  link?: string
  createdAt: string
}

// Common Types
export interface NumberSequence {
  id: string | number
  entityType: string
  prefix: string
  currentNumber: number
  padding: number
  includeYear: boolean
  includeMonth: boolean
  resetMonthly: boolean
  resetYearly: boolean
}

// Form Types
export type FormMode = "create" | "edit" | "view"

export interface FormProps<T> {
  mode: FormMode
  initialData?: T
  onSubmit: (data: T) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

// Filter and Search Types
export interface FilterOptions {
  category?: string
  status?: string
  warehouse?: string
  supplier?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface SortOptions {
  field: string
  direction: "asc" | "desc"
}

