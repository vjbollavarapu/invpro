/**
 * Industry-Aware UI Registry
 * Defines which fields and components to render based on tenant's industry
 */

export type Industry = 'pharmacy' | 'retail' | 'logistics' | 'manufacturing' | 'general'

export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'boolean' | 'custom'
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: any
  description?: string
  component?: string
}

export interface FormConfig {
  fields: FieldConfig[]
  sections?: { title: string; fields: string[] }[]
}

export interface DashboardConfig {
  metrics: string[]
  charts: string[]
  tables: string[]
}

export interface IndustryUIConfig {
  name: string
  displayName: string
  icon: string
  color: string
  forms: {
    ProductForm: FormConfig
    OrderForm?: FormConfig
    [key: string]: FormConfig | undefined
  }
  dashboard: DashboardConfig
  navigation: {
    label: string
    path: string
    icon: string
    enabled: boolean
  }[]
}

export const INDUSTRY_UI_REGISTRY: Record<Industry, IndustryUIConfig> = {
  pharmacy: {
    name: 'pharmacy',
    displayName: 'Pharmacy',
    icon: 'Pill',
    color: 'blue',
    forms: {
      ProductForm: {
        fields: [
          { name: 'generic_name', label: 'Generic Name', type: 'text', required: true, placeholder: 'e.g., Paracetamol' },
          { name: 'brand_name', label: 'Brand Name', type: 'text', required: false, placeholder: 'e.g., Tylenol' },
          { name: 'dosage_form', label: 'Dosage Form', type: 'select', required: true, options: [
            { value: 'tablet', label: 'Tablet' },
            { value: 'capsule', label: 'Capsule' },
            { value: 'syrup', label: 'Syrup' },
            { value: 'injection', label: 'Injection' },
          ]},
          { name: 'strength', label: 'Strength', type: 'text', required: true, placeholder: 'e.g., 500mg', description: 'Include unit (mg, ml, g)' },
          { name: 'route_of_administration', label: 'Route', type: 'select', required: true, options: [
            { value: 'oral', label: 'Oral' },
            { value: 'intravenous', label: 'Intravenous (IV)' },
            { value: 'topical', label: 'Topical' },
          ]},
          { name: 'therapeutic_class', label: 'Therapeutic Class', type: 'text', required: true, placeholder: 'e.g., Antibiotic' },
          { name: 'requires_prescription', label: 'Requires Prescription', type: 'boolean', required: false },
          { name: 'batch_number', label: 'Batch Number', type: 'text', required: false },
          { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: false },
          { name: 'storage_conditions', label: 'Storage', type: 'select', required: true, options: [
            { value: 'room_temp', label: 'Room Temperature' },
            { value: 'refrigerated', label: 'Refrigerated (2-8°C)' },
            { value: 'frozen', label: 'Frozen' },
          ]},
        ],
        sections: [
          { title: 'Basic Information', fields: ['generic_name', 'brand_name', 'dosage_form', 'strength'] },
          { title: 'Classification', fields: ['route_of_administration', 'therapeutic_class'] },
          { title: 'Regulatory', fields: ['requires_prescription', 'batch_number', 'expiry_date'] },
          { title: 'Storage', fields: ['storage_conditions'] },
        ],
      },
    },
    dashboard: {
      metrics: ['total_drugs', 'low_stock', 'expiring_batches', 'pending_orders'],
      charts: ['expiry_timeline', 'batch_status'],
      tables: ['recent_dispensing', 'expiring_drugs'],
    },
    navigation: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', enabled: true },
      { label: 'Pharmacy', path: '/dashboard/pharmacy', icon: 'Pill', enabled: true },
      { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package', enabled: true },
      { label: 'Sales', path: '/dashboard/sales', icon: 'ShoppingCart', enabled: true },
      { label: 'Warehouses', path: '/dashboard/warehouses', icon: 'Warehouse', enabled: true },
    ],
  },

  retail: {
    name: 'retail',
    displayName: 'Retail',
    icon: 'Store',
    color: 'green',
    forms: {
      ProductForm: {
        fields: [
          { name: 'sku', label: 'SKU', type: 'text', required: true, placeholder: 'PROD-001' },
          { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'T-Shirt' },
          { name: 'category', label: 'Category', type: 'select', required: true, options: [
            { value: 'Electronics', label: 'Electronics' },
            { value: 'Clothing', label: 'Clothing' },
            { value: 'Food', label: 'Food' },
            { value: 'Home', label: 'Home & Garden' },
          ]},
          { name: 'unit_cost', label: 'Unit Cost', type: 'number', required: true, placeholder: '0.00' },
          { name: 'selling_price', label: 'Selling Price', type: 'number', required: true, placeholder: '0.00' },
          { name: 'quantity', label: 'Stock Quantity', type: 'number', required: false, placeholder: '0' },
          { name: 'reorder_level', label: 'Reorder Level', type: 'number', required: false, placeholder: '0' },
          { name: 'supplier', label: 'Supplier', type: 'select', required: false },
          { name: 'barcode', label: 'Barcode', type: 'text', required: false },
        ],
        sections: [
          { title: 'Product Details', fields: ['sku', 'name', 'category', 'barcode'] },
          { title: 'Pricing', fields: ['unit_cost', 'selling_price'] },
          { title: 'Inventory', fields: ['quantity', 'reorder_level', 'supplier'] },
        ],
      },
    },
    dashboard: {
      metrics: ['total_products', 'total_sales', 'revenue', 'top_selling'],
      charts: ['sales_trend', 'category_breakdown'],
      tables: ['recent_orders', 'low_stock'],
    },
    navigation: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', enabled: true },
      { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package', enabled: true },
      { label: 'Sales', path: '/dashboard/sales', icon: 'ShoppingCart', enabled: true },
      { label: 'Customers', path: '/dashboard/customers', icon: 'Users', enabled: true },
      { label: 'Reports', path: '/dashboard/reports', icon: 'FileText', enabled: true },
    ],
  },

  logistics: {
    name: 'logistics',
    displayName: 'Logistics',
    icon: 'Truck',
    color: 'orange',
    forms: {
      ProductForm: {
        fields: [
          { name: 'sku', label: 'SKU', type: 'text', required: true },
          { name: 'name', label: 'Product Name', type: 'text', required: true },
          { name: 'weight', label: 'Weight (kg)', type: 'number', required: false },
          { name: 'dimensions', label: 'Dimensions (LxWxH)', type: 'text', required: false },
          { name: 'warehouse', label: 'Warehouse', type: 'select', required: true },
          { name: 'quantity', label: 'Quantity', type: 'number', required: true },
          { name: 'location', label: 'Storage Location', type: 'text', required: false, placeholder: 'e.g., Aisle 5, Shelf B' },
        ],
        sections: [
          { title: 'Product Info', fields: ['sku', 'name'] },
          { title: 'Physical Attributes', fields: ['weight', 'dimensions'] },
          { title: 'Location', fields: ['warehouse', 'location', 'quantity'] },
        ],
      },
    },
    dashboard: {
      metrics: ['total_warehouses', 'pending_transfers', 'in_transit', 'total_capacity'],
      charts: ['warehouse_utilization', 'transfer_status'],
      tables: ['recent_transfers', 'warehouse_status'],
    },
    navigation: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', enabled: true },
      { label: 'Warehouses', path: '/dashboard/warehouses', icon: 'Warehouse', enabled: true },
      { label: 'Transfers', path: '/dashboard/transfers', icon: 'Truck', enabled: true },
      { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package', enabled: true },
    ],
  },

  manufacturing: {
    name: 'manufacturing',
    displayName: 'Manufacturing',
    icon: 'Factory',
    color: 'purple',
    forms: {
      ProductForm: {
        fields: [
          { name: 'sku', label: 'SKU/Part Number', type: 'text', required: true },
          { name: 'name', label: 'Product Name', type: 'text', required: true },
          { name: 'category', label: 'Category', type: 'select', required: true },
          { name: 'unit_cost', label: 'Unit Cost', type: 'number', required: true },
          { name: 'supplier', label: 'Supplier', type: 'select', required: false },
          { name: 'lead_time', label: 'Lead Time (days)', type: 'number', required: false },
          { name: 'minimum_order_quantity', label: 'Min Order Qty', type: 'number', required: false },
        ],
        sections: [
          { title: 'Product Details', fields: ['sku', 'name', 'category'] },
          { title: 'Procurement', fields: ['unit_cost', 'supplier', 'lead_time', 'minimum_order_quantity'] },
        ],
      },
    },
    dashboard: {
      metrics: ['total_products', 'pending_po', 'suppliers', 'production_orders'],
      charts: ['procurement_trend', 'supplier_performance'],
      tables: ['pending_orders', 'supplier_list'],
    },
    navigation: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', enabled: true },
      { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package', enabled: true },
      { label: 'Procurement', path: '/dashboard/procurement', icon: 'ShoppingCart', enabled: true },
      { label: 'Suppliers', path: '/dashboard/suppliers', icon: 'Users', enabled: true },
    ],
  },

  general: {
    name: 'general',
    displayName: 'General',
    icon: 'Box',
    color: 'gray',
    forms: {
      ProductForm: {
        fields: [
          { name: 'name', label: 'Product Name', type: 'text', required: true },
          { name: 'sku', label: 'SKU', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false },
          { name: 'category', label: 'Category', type: 'select', required: false },
          { name: 'unit_cost', label: 'Unit Cost', type: 'number', required: false },
          { name: 'selling_price', label: 'Selling Price', type: 'number', required: false },
          { name: 'quantity', label: 'Quantity', type: 'number', required: false },
          { name: 'reorder_level', label: 'Reorder Level', type: 'number', required: false },
        ],
        sections: [
          { title: 'Basic Info', fields: ['name', 'sku', 'description', 'category'] },
          { title: 'Pricing & Stock', fields: ['unit_cost', 'selling_price', 'quantity', 'reorder_level'] },
        ],
      },
    },
    dashboard: {
      metrics: ['total_stock_value', 'active_warehouses', 'pending_orders', 'low_stock'],
      charts: ['inventory_value', 'sales_trend'],
      tables: ['recent_activities', 'low_stock_items'],
    },
    navigation: [
      { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', enabled: true },
      { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package', enabled: true },
      { label: 'Sales', path: '/dashboard/sales', icon: 'ShoppingCart', enabled: true },
      { label: 'Warehouses', path: '/dashboard/warehouses', icon: 'Warehouse', enabled: true },
      { label: 'Finance', path: '/dashboard/finance', icon: 'DollarSign', enabled: true },
    ],
  },
}

export class IndustryUIRegistry {
  static getConfig(industry: Industry): IndustryUIConfig {
    return INDUSTRY_UI_REGISTRY[industry] || INDUSTRY_UI_REGISTRY.general
  }

  static getFormConfig(industry: Industry, formName: string): FormConfig | undefined {
    const config = this.getConfig(industry)
    return config.forms[formName]
  }

  static getDashboardConfig(industry: Industry): DashboardConfig {
    return this.getConfig(industry).dashboard
  }

  static getNavigationItems(industry: Industry) {
    return this.getConfig(industry).navigation
  }

  static getFieldConfig(industry: Industry, formName: string, fieldName: string): FieldConfig | undefined {
    const formConfig = this.getFormConfig(industry, formName)
    return formConfig?.fields.find(f => f.name === fieldName)
  }

  static isFieldVisible(industry: Industry, formName: string, fieldName: string): boolean {
    const formConfig = this.getFormConfig(industry, formName)
    return !!formConfig?.fields.find(f => f.name === fieldName)
  }

  static getRequiredFields(industry: Industry, formName: string): string[] {
    const formConfig = this.getFormConfig(industry, formName)
    return formConfig?.fields.filter(f => f.required).map(f => f.name) || []
  }

  static getAvailableIndustries(): Industry[] {
    return Object.keys(INDUSTRY_UI_REGISTRY) as Industry[]
  }
}

