import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Name is too long"),
  sku: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  quantity: z.coerce.number().min(0, "Quantity must be 0 or greater"),
  unitCost: z.coerce.number().min(0, "Unit cost must be 0 or greater"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be 0 or greater"),
  reorderLevel: z.coerce.number().min(0, "Reorder level must be 0 or greater"),
  warehouse: z.string().optional(),
  supplier: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

export const orderSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  orderDate: z.string().min(1, "Order date is required"),
  deliveryDate: z.string().optional(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
  notes: z.string().optional(),
  items: z.array(z.object({
    product: z.string().min(1, "Product is required"),
    quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
    price: z.coerce.number().min(0, "Price must be 0 or greater"),
  })).min(1, "At least one item is required"),
})

export type OrderFormData = z.infer<typeof orderSchema>

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>

