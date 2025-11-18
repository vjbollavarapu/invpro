"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productSchema, type ProductFormData } from "@/lib/validations/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  defaultValues?: Partial<ProductFormData>
  isLoading?: boolean
}

export function ProductForm({ onSubmit, onCancel, defaultValues, isLoading }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
      category: "",
      unit: "pcs",
      quantity: 0,
      unitCost: 0,
      sellingPrice: 0,
      reorderLevel: 0,
    },
  })

  const category = watch("category")
  const unit = watch("unit")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Product Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Product Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter product name"
          {...register("name")}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* SKU and Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            placeholder="Auto-generated if empty"
            {...register("sku")}
            disabled={isLoading}
          />
          {errors.sku && (
            <p className="text-sm text-destructive">{errors.sku.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Select
            value={category}
            onValueChange={(value) => setValue("category", value)}
            disabled={isLoading}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Raw Materials">Raw Materials</SelectItem>
              <SelectItem value="Equipment">Equipment</SelectItem>
              <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Tools">Tools</SelectItem>
              <SelectItem value="Consumables">Consumables</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter product description"
          rows={3}
          {...register("description")}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Quantity and Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">
            Initial Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            placeholder="0"
            {...register("quantity")}
            disabled={isLoading}
          />
          {errors.quantity && (
            <p className="text-sm text-destructive">{errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">
            Unit <span className="text-destructive">*</span>
          </Label>
          <Select
            value={unit}
            onValueChange={(value) => setValue("unit", value)}
            disabled={isLoading}
          >
            <SelectTrigger id="unit">
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pcs">Pieces</SelectItem>
              <SelectItem value="kg">Kilograms</SelectItem>
              <SelectItem value="lbs">Pounds</SelectItem>
              <SelectItem value="meters">Meters</SelectItem>
              <SelectItem value="liters">Liters</SelectItem>
              <SelectItem value="boxes">Boxes</SelectItem>
              <SelectItem value="pallets">Pallets</SelectItem>
            </SelectContent>
          </Select>
          {errors.unit && (
            <p className="text-sm text-destructive">{errors.unit.message}</p>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unitCost">
            Unit Cost <span className="text-destructive">*</span>
          </Label>
          <Input
            id="unitCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...register("unitCost")}
            disabled={isLoading}
          />
          {errors.unitCost && (
            <p className="text-sm text-destructive">{errors.unitCost.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPrice">
            Selling Price <span className="text-destructive">*</span>
          </Label>
          <Input
            id="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            {...register("sellingPrice")}
            disabled={isLoading}
          />
          {errors.sellingPrice && (
            <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>
          )}
        </div>
      </div>

      {/* Reorder Level */}
      <div className="space-y-2">
        <Label htmlFor="reorderLevel">
          Reorder Level <span className="text-destructive">*</span>
        </Label>
        <Input
          id="reorderLevel"
          type="number"
          min="0"
          placeholder="0"
          {...register("reorderLevel")}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Alert when stock falls below this level
        </p>
        {errors.reorderLevel && (
          <p className="text-sm text-destructive">{errors.reorderLevel.message}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? "Update Product" : "Add Product"}
        </Button>
      </div>
    </form>
  )
}

