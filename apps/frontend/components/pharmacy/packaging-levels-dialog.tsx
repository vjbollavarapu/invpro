"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { packagingLevelSchema, type PackagingLevelFormValues } from "@/lib/validations/drug-product"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Package, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface PackagingLevelsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any
}

export function PackagingLevelsDialog({ open, onOpenChange, product }: PackagingLevelsDialogProps) {
  const [levels, setLevels] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddingLevel, setIsAddingLevel] = useState(false)
  const { toast } = useToast()

  const form = useForm<PackagingLevelFormValues>({
    resolver: zodResolver(packagingLevelSchema),
    defaultValues: {
      level_name: '',
      level_order: 1,
      base_unit_quantity: 1,
      unit_of_measure: 'unit',
      packaging_description: '',
      barcode: '',
      gtin: '',
      cost_price: 0,
      selling_price: 0,
      can_dispense: true,
      can_purchase: false,
    },
  })

  useEffect(() => {
    if (product && open) {
      fetchPackagingLevels()
    }
  }, [product, open])

  const fetchPackagingLevels = async () => {
    if (!product) return

    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch(`/api/pharma/packaging-levels?drug_product=${product.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLevels(data.results || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch packaging levels:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PackagingLevelFormValues) => {
    if (!product) return

    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/pharma/packaging-levels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          drug_product: product.id,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Packaging level added',
        })
        form.reset()
        setIsAddingLevel(false)
        fetchPackagingLevels()
      } else {
        throw new Error('Failed to add packaging level')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLevel = async (levelId: number) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch(`/api/pharma/packaging-levels/${levelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Packaging level deleted',
        })
        fetchPackagingLevels()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateConversion = (baseUnits: number) => {
    if (levels.length === 0) return '-'
    const baseLevel = levels[0]
    return `${baseUnits} ${baseLevel?.unit_of_measure || 'units'}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Packaging Hierarchy - {product?.generic_name}
            </div>
          </DialogTitle>
          <DialogDescription>
            Define packaging levels from smallest unit to bulk packaging (e.g., Tablet → Strip → Box → Carton)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Packaging Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Packaging Levels</CardTitle>
            </CardHeader>
            <CardContent>
              {levels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No packaging levels defined. Add levels below.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Base Units</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Sell Price</TableHead>
                      <TableHead>Dispense</TableHead>
                      <TableHead>Purchase</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {levels.map((level) => (
                      <TableRow key={level.id}>
                        <TableCell>
                          <Badge variant="outline">Level {level.level_order}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{level.level_name}</TableCell>
                        <TableCell className="font-mono">{level.base_unit_quantity}</TableCell>
                        <TableCell>{level.unit_of_measure}</TableCell>
                        <TableCell>${Number(level.cost_price).toFixed(2)}</TableCell>
                        <TableCell>${Number(level.selling_price).toFixed(2)}</TableCell>
                        <TableCell>
                          {level.can_dispense ? (
                            <Badge variant="default" className="text-xs">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {level.can_purchase ? (
                            <Badge variant="default" className="text-xs">Yes</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLevel(level.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Add New Level Form */}
          {!isAddingLevel ? (
            <Button onClick={() => setIsAddingLevel(true)} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Packaging Level
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add New Packaging Level</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="level_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Strip, Box" {...field} disabled={loading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="level_order"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Level Order *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                placeholder="1, 2, 3..." 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                disabled={loading}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">1 = smallest unit</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="base_unit_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Units *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.001"
                                min="0.001"
                                placeholder="10" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                                disabled={loading}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">Qty in smallest unit</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="unit_of_measure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit of Measure *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unit">Unit</SelectItem>
                              <SelectItem value="tablet">Tablet</SelectItem>
                              <SelectItem value="capsule">Capsule</SelectItem>
                              <SelectItem value="ml">Milliliter (ml)</SelectItem>
                              <SelectItem value="gm">Gram (gm)</SelectItem>
                              <SelectItem value="strip">Strip</SelectItem>
                              <SelectItem value="bottle">Bottle</SelectItem>
                              <SelectItem value="vial">Vial</SelectItem>
                              <SelectItem value="ampoule">Ampoule</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="carton">Carton</SelectItem>
                              <SelectItem value="pallet">Pallet</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cost_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cost Price *</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="selling_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Selling Price *</FormLabel>
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="can_dispense"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Can Dispense</FormLabel>
                              <FormDescription className="text-xs">
                                Allow direct sale to customers
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="can_purchase"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Can Purchase</FormLabel>
                              <FormDescription className="text-xs">
                                Allow bulk purchase from suppliers
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddingLevel(false)
                          form.reset()
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={loading}>
                        Add Level
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Conversion Calculator */}
          {levels.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Unit Conversion Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {levels.map((level, index) => {
                    if (index === 0) return null
                    const baseLevel = levels[0]
                    return (
                      <div key={level.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="font-medium">1 {level.level_name}</span>
                        <span className="text-muted-foreground">=</span>
                        <span className="font-mono">
                          {level.base_unit_quantity} {baseLevel.unit_of_measure}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

