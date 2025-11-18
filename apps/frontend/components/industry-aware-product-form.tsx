"use client"

import { DynamicFormBuilder } from "./dynamic-form-builder"
import { useIndustry } from "@/lib/hooks/useIndustry"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

interface IndustryAwareProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: any
  onSuccess?: () => void
}

export function IndustryAwareProductForm({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: IndustryAwareProductFormProps) {
  const { industry, getFormConfig } = useIndustry()
  const { toast } = useToast()

  const formConfig = getFormConfig('ProductForm')

  if (!formConfig) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Form configuration not found for this industry
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  const handleSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      // Determine endpoint based on industry
      const endpoint = industry === 'pharmacy' 
        ? '/api/pharma/products'
        : '/api/inventory/products'

      const response = await fetch(endpoint, {
        method: initialData?.id ? 'PATCH' : 'POST',
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
          description: initialData?.id ? "Product updated" : "Product created",
        })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        throw new Error('Failed to save product')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? 'Edit' : 'Add'} Product - {industry.toUpperCase()} Mode
          </DialogTitle>
          <DialogDescription>
            Form fields are customized for {industry} industry
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Industry: <strong>{industry}</strong> | 
            Required fields: {formConfig.fields.filter(f => f.required).length} | 
            Total fields: {formConfig.fields.length}
          </AlertDescription>
        </Alert>

        <DynamicFormBuilder
          formConfig={formConfig}
          onSubmit={handleSubmit}
          initialData={initialData}
          submitButtonText={initialData?.id ? 'Save Changes' : 'Create Product'}
        />
      </DialogContent>
    </Dialog>
  )
}

