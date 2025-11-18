"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { FormConfig, FieldConfig } from "@/lib/industry-registry"

interface DynamicFormBuilderProps {
  formConfig: FormConfig
  onSubmit: (data: any) => void
  initialData?: any
  loading?: boolean
  submitButtonText?: string
}

export function DynamicFormBuilder({
  formConfig,
  onSubmit,
  initialData = {},
  loading = false,
  submitButtonText = "Submit",
}: DynamicFormBuilderProps) {
  const form = useForm({
    defaultValues: initialData,
  })

  const renderField = (field: FieldConfig) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        rules={{ required: field.required }}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </FormLabel>
            <FormControl>
              {renderFieldInput(field, formField)}
            </FormControl>
            {field.description && (
              <FormDescription className="text-xs">{field.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  const renderFieldInput = (field: FieldConfig, formField: any) => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder}
            {...formField}
            disabled={loading}
          />
        )

      case 'number':
        return (
          <Input
            type="number"
            step="0.01"
            placeholder={field.placeholder}
            {...formField}
            onChange={(e) => formField.onChange(Number(e.target.value))}
            disabled={loading}
          />
        )

      case 'date':
        return (
          <Input
            type="date"
            {...formField}
            disabled={loading}
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            rows={3}
            {...formField}
            disabled={loading}
          />
        )

      case 'boolean':
        return (
          <Switch
            checked={formField.value}
            onCheckedChange={formField.onChange}
            disabled={loading}
          />
        )

      case 'select':
        return (
          <Select
            onValueChange={formField.onChange}
            defaultValue={formField.value}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            placeholder={field.placeholder}
            {...formField}
            disabled={loading}
          />
        )
    }
  }

  const renderFormContent = () => {
    // If sections are defined, render by sections
    if (formConfig.sections && formConfig.sections.length > 0) {
      return (
        <div className="space-y-6">
          {formConfig.sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle className="text-base">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {section.fields.map((fieldName) => {
                  const field = formConfig.fields.find(f => f.name === fieldName)
                  return field ? renderField(field) : null
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    // Otherwise, render all fields in a grid
    return (
      <div className="grid grid-cols-2 gap-4">
        {formConfig.fields.map((field) => renderField(field))}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {renderFormContent()}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}

