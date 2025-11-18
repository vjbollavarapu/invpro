"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { batchReceiveSchema, type BatchReceiveFormValues } from "@/lib/validations/drug-product"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Package, Calculator, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReceiveBatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReceiveBatchDialog({ open, onOpenChange, onSuccess }: ReceiveBatchDialogProps) {
  const [products, setProducts] = useState<any[]>([])
  const [packagingLevels, setPackagingLevels] = useState<any[]>([])
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedLevel, setSelectedLevel] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<BatchReceiveFormValues>({
    resolver: zodResolver(batchReceiveSchema),
    defaultValues: {
      drug_product: 0,
      batch_number: '',
      lot_number: '',
      manufacture_date: '',
      expiry_date: '',
      packaging_level: 0,
      quantity_received: 0,
      warehouse: 0,
      storage_location: '',
      purchase_order_number: '',
      unit_cost: 0,
    },
  })

  useEffect(() => {
    if (open) {
      fetchProducts()
      fetchWarehouses()
    }
  }, [open])

  // Fetch packaging levels when product selected
  const productId = form.watch('drug_product')
  useEffect(() => {
    if (productId && productId > 0) {
      fetchPackagingLevels(productId)
      const product = products.find(p => p.id === productId)
      setSelectedProduct(product)
    }
  }, [productId])

  const packagingLevelId = form.watch('packaging_level')
  useEffect(() => {
    if (packagingLevelId && packagingLevelId > 0) {
      const level = packagingLevels.find(l => l.id === packagingLevelId)
      setSelectedLevel(level)
    }
  }, [packagingLevelId])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/pharma/products?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.results || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchPackagingLevels = async (productId: number) => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch(`/api/pharma/packaging-levels?drug_product=${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPackagingLevels(data.results || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch packaging levels:', error)
    }
  }

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/warehouse/warehouses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setWarehouses(data.results || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch warehouses:', error)
    }
  }

  const onSubmit = async (data: BatchReceiveFormValues) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/pharma/batches/receive/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch received and added to quarantine",
        })
        form.reset()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to receive batch')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const quantityReceived = form.watch('quantity_received')
  const baseUnits = selectedLevel && quantityReceived
    ? Number(quantityReceived) * Number(selectedLevel.base_unit_quantity)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Batch Inventory</DialogTitle>
          <DialogDescription>
            Receive bulk inventory. Batch will be in quarantine until QC approval.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Batches are received at bulk packaging level (e.g., cartons, boxes) and automatically 
            converted to base units for inventory tracking.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="drug_product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Drug Product *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(Number(value))} 
                    value={field.value?.toString()}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select drug product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.generic_name} {product.strength}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Batch Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="BATCH-2024-001" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lot_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Number</FormLabel>
                    <FormControl>
                      <Input placeholder="LOT-12345" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacture_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacture Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Packaging Level */}
            {packagingLevels.length > 0 && (
              <FormField
                control={form.control}
                name="packaging_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging Level (Receiving At) *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packagingLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            {level.level_name} ({level.base_unit_quantity} base units each)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Bulk levels (carton, box) recommended for receiving
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity_received"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity Received *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001"
                        min="0.001"
                        placeholder="50" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {selectedLevel && `At: ${selectedLevel.level_name}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Unpacking Calculator */}
            {selectedLevel && quantityReceived > 0 && (
              <Card className="bg-green-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Automatic Unpacking Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Receiving:</span>
                    <span className="font-mono font-semibold">
                      {quantityReceived} {selectedLevel.level_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unpacks to:</span>
                    <span className="font-mono font-semibold text-green-700">
                      {baseUnits.toLocaleString()} base units
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      1 {selectedLevel.level_name} = {selectedLevel.base_unit_quantity} base units
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warehouse & Location */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="warehouse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                            {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storage_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Shelf A-12" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* PO Number */}
            <FormField
              control={form.control}
              name="purchase_order_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Order Number</FormLabel>
                  <FormControl>
                    <Input placeholder="PO-2024-001" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quarantine Notice */}
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                Batch will be added with <strong>Quarantine</strong> status and require QC approval 
                before it can be dispensed.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Receive Batch
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

