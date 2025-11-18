// Pharmacy-specific TypeScript types

export interface DrugProduct {
  id: number
  product_code: string
  generic_name: string
  brand_name?: string
  dosage_form: DosageForm
  strength: string
  route_of_administration: RouteOfAdministration
  therapeutic_class: string
  pharmacological_class?: string
  marketing_authorization_number?: string
  gtin?: string
  barcode?: string
  ndc_code?: string
  storage_conditions: StorageCondition
  storage_instructions?: string
  requires_cold_chain: boolean
  requires_prescription: boolean
  is_controlled_substance: boolean
  controlled_substance_schedule?: string
  manufacturer?: string
  importer?: string
  active_ingredients: string
  description?: string
  warnings?: string
  status: 'active' | 'discontinued' | 'recalled' | 'pending_approval'
  supplier?: number
  packaging_levels?: PackagingLevel[]
  total_stock_base_units?: number
  expiry_alerts?: {
    expired: number
    expiring_30_days: number
    expiring_90_days: number
  }
  created_at?: string
  updated_at?: string
}

export type DosageForm = 
  | 'tablet'
  | 'capsule'
  | 'syrup'
  | 'suspension'
  | 'injection'
  | 'cream'
  | 'ointment'
  | 'drops'
  | 'inhaler'
  | 'powder'
  | 'solution'
  | 'other'

export type RouteOfAdministration =
  | 'oral'
  | 'topical'
  | 'intravenous'
  | 'intramuscular'
  | 'subcutaneous'
  | 'inhalation'
  | 'rectal'
  | 'ophthalmic'
  | 'otic'
  | 'nasal'
  | 'transdermal'

export type StorageCondition =
  | 'room_temp'
  | 'cool'
  | 'refrigerated'
  | 'frozen'
  | 'controlled_room'

export interface PackagingLevel {
  id: number
  drug_product: number
  level_name: string
  level_order: number
  base_unit_quantity: string | number
  unit_of_measure: UnitOfMeasure
  packaging_description?: string
  barcode?: string
  gtin?: string
  cost_price: string | number
  selling_price: string | number
  can_dispense: boolean
  can_purchase: boolean
  length?: string | number
  width?: string | number
  height?: string | number
  weight?: string | number
  converted_base_units?: number
  cost_per_base_unit?: number
}

export type UnitOfMeasure =
  | 'unit'
  | 'tablet'
  | 'capsule'
  | 'ml'
  | 'gm'
  | 'strip'
  | 'bottle'
  | 'vial'
  | 'ampoule'
  | 'box'
  | 'carton'
  | 'pallet'

export interface DrugBatch {
  id: number
  drug_product: number
  drug_product_name?: string
  batch_number: string
  lot_number?: string
  manufacture_date: string
  expiry_date: string
  initial_quantity: string | number
  current_quantity: string | number
  quantity_dispensed?: number
  packaging_level: number
  packaging_level_name?: string
  status: 'quarantine' | 'approved' | 'rejected' | 'expired' | 'recalled'
  certificate_of_analysis?: string
  qc_notes?: string
  warehouse: number
  warehouse_name?: string
  storage_location?: string
  serial_numbers?: string[]
  supplier?: number
  purchase_order_number?: string
  unit_cost: string | number
  is_expired?: boolean
  days_until_expiry?: number
  created_at?: string
  updated_at?: string
}

export interface DrugDispensing {
  id: number
  dispensing_number?: string
  drug_product: number
  drug_product_name?: string
  batch: number
  batch_number?: string
  packaging_level: number
  packaging_level_name?: string
  quantity_dispensed: string | number
  quantity_in_base_units?: string | number
  sales_order?: number
  customer?: number
  customer_name?: string
  patient_name?: string
  prescription_number?: string
  prescriber_name?: string
  prescriber_license?: string
  dispensed_by?: number
  dispensed_by_name?: string
  dispensing_date?: string
  unit_price: string | number
  total_price?: string | number
  dispensing_notes?: string
  created_at?: string
}

export interface DrugInventory {
  id: number
  drug_product: number
  drug_product_name?: string
  drug_product_strength?: string
  warehouse: number
  warehouse_name?: string
  packaging_level: number
  packaging_level_name?: string
  quantity_available: string | number
  quantity_reserved: string | number
  quantity_quarantine: string | number
  total_quantity?: string | number
  reorder_level: string | number
  reorder_quantity: string | number
  is_below_reorder_level?: boolean
  last_updated?: string
}

export interface PurchaseOrderItem {
  drug_product: number
  drug_product_name?: string
  packaging_level: number
  packaging_level_name?: string
  quantity: number
  unit_price: number
  total: number
}

export interface BatchReceive {
  drug_product: number
  batch_number: string
  lot_number?: string
  manufacture_date: string
  expiry_date: string
  packaging_level: number
  quantity_received: number
  warehouse: number
  storage_location?: string
  supplier?: number
  purchase_order_number?: string
  unit_cost: number
}

