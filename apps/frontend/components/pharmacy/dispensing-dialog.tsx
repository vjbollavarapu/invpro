"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { dispensingSchema, type DispensingFormValues } from "@/lib/validations/drug-product"
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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Calculator, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface DispensingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DispensingDialog({ open, onOpenChange, onSuccess }: DispensingDialogProps) {
  const [products, setProducts] = useState<any[]>([])
  const [packagingLevels, setPackagingLevels] = useState<any[]>([])
  const [availableBatches, setAvailableBatches] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedLevel, setSelectedLevel] = useState<any>(null)
  const [fefoRecommendation, setFefoRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<DispensingFormValues>({
    resolver: zodResolver(dispensingSchema),
    defaultValues: {
      drug_product: 0,
      batch: 0,
      packaging_level: 0,
      quantity_dispensed: 1,
      unit_price: 0,
      patient_name: '',
      prescription_number: '',
      prescriber_name: '',
      prescriber_license: '',
      dispensing_notes: '',
    },
  })

  // Fetch products on open
  useEffect(() => {
    if (open) {
      fetchProducts()
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

  // Fetch available batches when packaging level selected
  const packagingLevelId = form.watch('packaging_level')
  useEffect(() => {
    if (productId && productId > 0) {
      fetchAvailableBatches(productId)
    }
  }, [productId, packagingLevelId])

  // Update price when packaging level selected
  useEffect(() => {
    if (packagingLevelId && packagingLevelId > 0) {
      const level = packagingLevels.find(l => l.id === packagingLevelId)
      setSelectedLevel(level)
      if (level) {
        form.setValue('unit_price', Number(level.selling_price))
      }
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

      const response = await fetch(`/api/pharma/packaging-levels?drug_product=${productId}&can_dispense=true`, {
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

  const fetchAvailableBatches = async (productId: number) => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch(`/api/pharma/dispensing/available_batches/?drug_product=${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableBatches(data)
        // Set FEFO recommendation (first batch)
        if (data.length > 0) {
          setFefoRecommendation(data[0])
          form.setValue('batch', data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
    }
  }

  const onSubmit = async (data: DispensingFormValues) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/pharma/dispensing', {
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
          description: "Drug dispensed successfully",
        })
        form.reset()
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to dispense drug')
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

  const selectedBatch = availableBatches.find(b => b.id === form.watch('batch'))
  const quantityDispensed = form.watch('quantity_dispensed')
  const unitPrice = form.watch('unit_price')
  const totalPrice = Number(quantityDispensed) * Number(unitPrice)

  // Calculate base units
  const baseUnits = selectedLevel && quantityDispensed 
    ? Number(quantityDispensed) * Number(selectedLevel.base_unit_quantity)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dispense Drug</DialogTitle>
          <DialogDescription>
            Select product, packaging level, and batch. System uses FEFO (First-Expiry-First-Out) logic.
          </DialogDescription>
        </DialogHeader>

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
                          {product.generic_name} {product.strength} ({product.dosage_form})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Packaging Level Selection */}
            {packagingLevels.length > 0 && (
              <FormField
                control={form.control}
                name="packaging_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging Level *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(Number(value))} 
                      value={field.value?.toString()}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select packaging level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packagingLevels.map((level) => (
                          <SelectItem key={level.id} value={level.id.toString()}>
                            {level.level_name} ({level.base_unit_quantity} base units)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Batch Selection with FEFO */}
            {availableBatches.length > 0 && (
              <>
                {fefoRecommendation && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-semibold">FEFO Recommendation:</span> Batch {fefoRecommendation.batch_number} 
                      {' '}expires in {fefoRecommendation.days_until_expiry} days 
                      {' '}({new Date(fefoRecommendation.expiry_date).toLocaleDateString()})
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="batch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch (FEFO Sorted) *</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(Number(value))} 
                        value={field.value?.toString()}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableBatches.map((batch, index) => (
                            <SelectItem key={batch.id} value={batch.id.toString()}>
                              {batch.batch_number} - Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                              {' '}({batch.days_until_expiry}d) - Qty: {Number(batch.current_quantity).toLocaleString()}
                              {index === 0 && ' ⭐ FEFO'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Quantity and Price */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity_dispensed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.001"
                        min="0.001"
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {selectedLevel && `Dispensing at: ${selectedLevel.level_name}`}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price *</FormLabel>
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

            {/* Unit Conversion Display */}
            {selectedLevel && quantityDispensed > 0 && (
              <Card className="bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Automatic Unit Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Dispensing:</span>
                    <span className="font-mono font-semibold">
                      {quantityDispensed} {selectedLevel.level_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equals:</span>
                    <span className="font-mono font-semibold">
                      {baseUnits} base units
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total Price:</span>
                    <span className="font-mono font-bold text-lg">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning if batch is expiring soon */}
            {selectedBatch && selectedBatch.days_until_expiry <= 30 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: This batch expires in {selectedBatch.days_until_expiry} days 
                  ({new Date(selectedBatch.expiry_date).toLocaleDateString()})
                </AlertDescription>
              </Alert>
            )}

            {/* Prescription Information */}
            {selectedProduct?.requires_prescription && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Prescription Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patient_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Patient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Patient name" {...field} disabled={loading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prescription_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prescription Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Rx-12345" {...field} disabled={loading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="prescriber_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prescriber Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. Smith" {...field} disabled={loading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prescriber_license"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prescriber License</FormLabel>
                          <FormControl>
                            <Input placeholder="MD-12345" {...field} disabled={loading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dispensing Notes */}
            <FormField
              control={form.control}
              name="dispensing_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispensing Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Usage instructions, warnings, or other notes" 
                      rows={2}
                      {...field} 
                      disabled={loading} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit" disabled={loading || !selectedBatch}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Dispense Drug
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

