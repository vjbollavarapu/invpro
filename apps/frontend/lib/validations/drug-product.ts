import * as z from "zod"

export const drugProductSchema = z.object({
  generic_name: z.string().min(2, "Generic name must be at least 2 characters").max(200),
  brand_name: z.string().optional(),
  dosage_form: z.enum([
    'tablet', 'capsule', 'syrup', 'suspension', 'injection',
    'cream', 'ointment', 'drops', 'inhaler', 'powder', 'solution', 'other'
  ]),
  strength: z.string()
    .min(1, "Strength is required")
    .regex(/^\d+(\.\d+)?\s*(mg|g|ml|mcg|%|IU|L|kg)$/i, "Invalid strength format. Use format like: 500mg, 10ml, 2%"),
  route_of_administration: z.enum([
    'oral', 'topical', 'intravenous', 'intramuscular', 'subcutaneous',
    'inhalation', 'rectal', 'ophthalmic', 'otic', 'nasal', 'transdermal'
  ]),
  therapeutic_class: z.string().min(2, "Therapeutic class is required"),
  pharmacological_class: z.string().optional(),
  
  // Regulatory
  marketing_authorization_number: z.string().optional(),
  gtin: z.string().length(14).optional().or(z.literal('')),
  barcode: z.string().optional(),
  ndc_code: z.string().optional(),
  
  // Storage
  storage_conditions: z.enum(['room_temp', 'cool', 'refrigerated', 'frozen', 'controlled_room']),
  storage_instructions: z.string().optional(),
  requires_cold_chain: z.boolean().default(false),
  
  // Prescription
  requires_prescription: z.boolean().default(true),
  is_controlled_substance: z.boolean().default(false),
  controlled_substance_schedule: z.string().optional(),
  
  // Additional info
  manufacturer: z.string().optional(),
  importer: z.string().optional(),
  active_ingredients: z.string().min(2, "Active ingredients are required"),
  description: z.string().optional(),
  warnings: z.string().optional(),
  status: z.enum(['active', 'discontinued', 'recalled', 'pending_approval']).default('active'),
  supplier: z.number().optional().nullable(),
})

export type DrugProductFormValues = z.infer<typeof drugProductSchema>

export const packagingLevelSchema = z.object({
  level_name: z.string().min(1, "Level name is required"),
  level_order: z.number().min(1, "Level order must be at least 1"),
  base_unit_quantity: z.preprocess(
    (val) => Number(val),
    z.number().min(0.001, "Quantity must be greater than 0")
  ),
  unit_of_measure: z.enum([
    'unit', 'tablet', 'capsule', 'ml', 'gm',
    'strip', 'bottle', 'vial', 'ampoule', 'box', 'carton', 'pallet'
  ]),
  packaging_description: z.string().optional(),
  barcode: z.string().optional(),
  gtin: z.string().optional(),
  cost_price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Cost price must be positive")
  ),
  selling_price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Selling price must be positive")
  ),
  can_dispense: z.boolean().default(true),
  can_purchase: z.boolean().default(false),
})

export type PackagingLevelFormValues = z.infer<typeof packagingLevelSchema>

export const batchReceiveSchema = z.object({
  drug_product: z.number().min(1, "Drug product is required"),
  batch_number: z.string().min(1, "Batch number is required"),
  lot_number: z.string().optional(),
  manufacture_date: z.string().min(1, "Manufacture date is required"),
  expiry_date: z.string().min(1, "Expiry date is required"),
  packaging_level: z.number().min(1, "Packaging level is required"),
  quantity_received: z.preprocess(
    (val) => Number(val),
    z.number().min(0.001, "Quantity must be greater than 0")
  ),
  warehouse: z.number().min(1, "Warehouse is required"),
  storage_location: z.string().optional(),
  supplier: z.number().optional().nullable(),
  purchase_order_number: z.string().optional(),
  unit_cost: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Unit cost must be positive")
  ),
}).refine((data) => {
  const mfgDate = new Date(data.manufacture_date)
  const expDate = new Date(data.expiry_date)
  return expDate > mfgDate
}, {
  message: "Expiry date must be after manufacture date",
  path: ["expiry_date"],
})

export type BatchReceiveFormValues = z.infer<typeof batchReceiveSchema>

export const dispensingSchema = z.object({
  drug_product: z.number().min(1, "Drug product is required"),
  batch: z.number().min(1, "Batch is required"),
  packaging_level: z.number().min(1, "Packaging level is required"),
  quantity_dispensed: z.preprocess(
    (val) => Number(val),
    z.number().min(0.001, "Quantity must be greater than 0")
  ),
  unit_price: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Unit price must be positive")
  ),
  customer: z.number().optional().nullable(),
  patient_name: z.string().optional(),
  prescription_number: z.string().optional(),
  prescriber_name: z.string().optional(),
  prescriber_license: z.string().optional(),
  dispensing_notes: z.string().optional(),
})

export type DispensingFormValues = z.infer<typeof dispensingSchema>

