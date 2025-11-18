"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { drugProductSchema, type DrugProductFormValues } from "@/lib/validations/drug-product"
import { useCreateDrugProduct, useUpdateDrugProduct } from "@/lib/hooks/useDrugProducts"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

interface DrugProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  onSaved?: () => void
}

export function DrugProductDialog({ open, onOpenChange, product, onSaved }: DrugProductDialogProps) {
  const isEdit = !!product
  const createMutation = useCreateDrugProduct()
  const updateMutation = useUpdateDrugProduct()

  const form = useForm<DrugProductFormValues>({
    resolver: zodResolver(drugProductSchema),
    defaultValues: product ? {
      generic_name: product.generic_name,
      brand_name: product.brand_name || '',
      dosage_form: product.dosage_form,
      strength: product.strength,
      route_of_administration: product.route_of_administration,
      therapeutic_class: product.therapeutic_class,
      pharmacological_class: product.pharmacological_class || '',
      marketing_authorization_number: product.marketing_authorization_number || '',
      gtin: product.gtin || '',
      barcode: product.barcode || '',
      ndc_code: product.ndc_code || '',
      storage_conditions: product.storage_conditions,
      storage_instructions: product.storage_instructions || '',
      requires_cold_chain: product.requires_cold_chain || false,
      requires_prescription: product.requires_prescription !== false,
      is_controlled_substance: product.is_controlled_substance || false,
      controlled_substance_schedule: product.controlled_substance_schedule || '',
      manufacturer: product.manufacturer || '',
      importer: product.importer || '',
      active_ingredients: product.active_ingredients,
      description: product.description || '',
      warnings: product.warnings || '',
      status: product.status || 'active',
      supplier: product.supplier || null,
    } : {
      generic_name: '',
      brand_name: '',
      dosage_form: 'tablet',
      strength: '',
      route_of_administration: 'oral',
      therapeutic_class: '',
      pharmacological_class: '',
      marketing_authorization_number: '',
      gtin: '',
      barcode: '',
      ndc_code: '',
      storage_conditions: 'room_temp',
      storage_instructions: '',
      requires_cold_chain: false,
      requires_prescription: true,
      is_controlled_substance: false,
      controlled_substance_schedule: '',
      manufacturer: '',
      importer: '',
      active_ingredients: '',
      description: '',
      warnings: '',
      status: 'active',
      supplier: null,
    },
  })

  const onSubmit = async (data: DrugProductFormValues) => {
    if (isEdit) {
      updateMutation.mutate(
        { id: product.id, data },
        {
          onSuccess: () => {
            onOpenChange(false)
            if (onSaved) onSaved()
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          onOpenChange(false)
          form.reset()
          if (onSaved) onSaved()
        },
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Drug Product' : 'Add New Drug Product'}</DialogTitle>
          <DialogDescription>
            Enter complete pharmaceutical information including regulatory details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
                <TabsTrigger value="storage">Storage & Safety</TabsTrigger>
                <TabsTrigger value="additional">Additional</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="generic_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Generic Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Paracetamol" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Tylenol" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="dosage_form"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosage Form *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select form" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tablet">Tablet</SelectItem>
                            <SelectItem value="capsule">Capsule</SelectItem>
                            <SelectItem value="syrup">Syrup</SelectItem>
                            <SelectItem value="suspension">Suspension</SelectItem>
                            <SelectItem value="injection">Injection</SelectItem>
                            <SelectItem value="cream">Cream</SelectItem>
                            <SelectItem value="ointment">Ointment</SelectItem>
                            <SelectItem value="drops">Drops</SelectItem>
                            <SelectItem value="inhaler">Inhaler</SelectItem>
                            <SelectItem value="powder">Powder</SelectItem>
                            <SelectItem value="solution">Solution</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="strength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strength *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 500mg" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Format: 500mg, 10ml, 2%, etc.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="route_of_administration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Route *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select route" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="oral">Oral</SelectItem>
                            <SelectItem value="topical">Topical</SelectItem>
                            <SelectItem value="intravenous">Intravenous (IV)</SelectItem>
                            <SelectItem value="intramuscular">Intramuscular (IM)</SelectItem>
                            <SelectItem value="subcutaneous">Subcutaneous (SC)</SelectItem>
                            <SelectItem value="inhalation">Inhalation</SelectItem>
                            <SelectItem value="rectal">Rectal</SelectItem>
                            <SelectItem value="ophthalmic">Ophthalmic</SelectItem>
                            <SelectItem value="otic">Otic</SelectItem>
                            <SelectItem value="nasal">Nasal</SelectItem>
                            <SelectItem value="transdermal">Transdermal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="therapeutic_class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Therapeutic Class *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Antibiotic, Analgesic" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pharmacological_class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pharmacological Class</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Beta-lactam" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="active_ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Ingredients *</FormLabel>
                      <FormControl>
                        <Input placeholder="Comma-separated list" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Regulatory Tab */}
              <TabsContent value="regulatory" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marketing_authorization_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marketing Authorization Number</FormLabel>
                        <FormControl>
                          <Input placeholder="MA Number" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ndc_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NDC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="National Drug Code" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gtin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GTIN (14 digits)</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678901234" maxLength={14} {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                          <Input placeholder="Product barcode" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <FormControl>
                          <Input placeholder="Manufacturer name" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="importer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importer</FormLabel>
                        <FormControl>
                          <Input placeholder="Importer name" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="requires_prescription"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Requires Prescription</FormLabel>
                          <FormDescription>Is this a prescription-only medication?</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_controlled_substance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Controlled Substance</FormLabel>
                          <FormDescription>Is this a controlled/scheduled substance?</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('is_controlled_substance') && (
                    <FormField
                      control={form.control}
                      name="controlled_substance_schedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Controlled Substance Schedule</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Schedule II, Schedule IV" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </TabsContent>

              {/* Storage & Safety Tab */}
              <TabsContent value="storage" className="space-y-4">
                <FormField
                  control={form.control}
                  name="storage_conditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Conditions *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select storage condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="room_temp">Room Temperature (15-25°C)</SelectItem>
                          <SelectItem value="cool">Cool (8-15°C)</SelectItem>
                          <SelectItem value="refrigerated">Refrigerated (2-8°C)</SelectItem>
                          <SelectItem value="frozen">Frozen (-15°C or below)</SelectItem>
                          <SelectItem value="controlled_room">Controlled Room Temp (20-25°C)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storage_instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional storage requirements or special handling" 
                          rows={3}
                          {...field} 
                          disabled={isLoading} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requires_cold_chain"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Cold Chain Required</FormLabel>
                        <FormDescription>
                          Requires temperature-controlled logistics
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="warnings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warnings & Precautions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Safety warnings, contraindications, and precautions" 
                          rows={4}
                          {...field} 
                          disabled={isLoading} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Additional Information Tab */}
              <TabsContent value="additional" className="space-y-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Product description, indications, usage" 
                          rows={4}
                          {...field} 
                          disabled={isLoading} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="discontinued">Discontinued</SelectItem>
                          <SelectItem value="recalled">Recalled</SelectItem>
                          <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Drug Product'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

