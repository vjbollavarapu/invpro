"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Package, FileBarcode } from "lucide-react"
import { DrugProductDialog } from "./drug-product-dialog"
import { PackagingLevelsDialog } from "./packaging-levels-dialog"
import { useToast } from "@/hooks/use-toast"

export function DrugProductsTab() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isPackagingDialogOpen, setIsPackagingDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [searchQuery])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/pharma/products?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.results || data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      toast({
        title: "Error",
        description: "Failed to load drug products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = () => {
    setSelectedProduct(null)
    setIsProductDialogOpen(true)
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsProductDialogOpen(true)
  }

  const handleManagePackaging = (product: any) => {
    setSelectedProduct(product)
    setIsPackagingDialogOpen(true)
  }

  const handleProductSaved = () => {
    fetchProducts()
    setIsProductDialogOpen(false)
    toast({
      title: "Success",
      description: selectedProduct ? "Drug product updated" : "Drug product created",
    })
  }

  const getDosageFormBadge = (form: string) => {
    const colors: any = {
      tablet: 'bg-blue-100 text-blue-800',
      capsule: 'bg-green-100 text-green-800',
      syrup: 'bg-purple-100 text-purple-800',
      injection: 'bg-red-100 text-red-800',
    }
    return colors[form] || 'bg-gray-100 text-gray-800'
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Drug Products</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drugs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button onClick={handleCreateProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Add Drug Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead>Brand Name</TableHead>
                <TableHead>Dosage Form</TableHead>
                <TableHead>Strength</TableHead>
                <TableHead>Therapeutic Class</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No drug products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">
                      {product.product_code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.generic_name}
                    </TableCell>
                    <TableCell>{product.brand_name || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getDosageFormBadge(product.dosage_form)}>
                        {product.dosage_form}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {product.strength}
                    </TableCell>
                    <TableCell className="text-sm">
                      {product.therapeutic_class}
                    </TableCell>
                    <TableCell>
                      {product.requires_prescription ? (
                        <Badge variant="outline">Rx</Badge>
                      ) : (
                        <Badge variant="secondary">OTC</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManagePackaging(product)}
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DrugProductDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        product={selectedProduct}
        onSaved={handleProductSaved}
      />

      <PackagingLevelsDialog
        open={isPackagingDialogOpen}
        onOpenChange={setIsPackagingDialogOpen}
        product={selectedProduct}
      />
    </>
  )
}

