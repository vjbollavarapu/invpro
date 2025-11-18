"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Pill, Package, Activity, ShoppingCart, AlertTriangle, Calendar } from "lucide-react"
import { DrugProductsTab } from "@/components/pharmacy/drug-products-tab"
import { BatchInventoryTab } from "@/components/pharmacy/batch-inventory-tab"
import { DispensingTab } from "@/components/pharmacy/dispensing-tab"
import { PurchaseOrdersTab } from "@/components/pharmacy/purchase-orders-tab"
import { ExpiryAlertsTab } from "@/components/pharmacy/expiry-alerts-tab"
import { useDrugProducts } from "@/lib/hooks/useDrugProducts"
import { useQuery } from "@tanstack/react-query"

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState("products")

  // Fetch real data for stats
  const { data: drugProductsData } = useDrugProducts({ pageSize: 1000 })
  const { data: expiringData } = useQuery({
    queryKey: ['expiring-drugs'],
    queryFn: async () => {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/pharma/products/expiring_soon', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch expiring drugs')
      }

      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Calculate stats from real data
  const totalDrugs = drugProductsData?.results?.length || 0
  const lowStockItems = drugProductsData?.results?.filter((product: any) => 
    product.current_stock <= product.minimum_stock
  ).length || 0
  const expiringBatches = expiringData?.results?.length || 0
  const pendingOrders = 0 // This would need to be fetched from procurement API

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pharmacy Management</h1>
        <p className="text-muted-foreground">
          Manage drug inventory, batches, expiry, and dispensing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrugs}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiringBatches}</div>
            <p className="text-xs text-muted-foreground">Batches in 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Purchase orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products">
            <Pill className="mr-2 h-4 w-4" />
            Drug Products
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Batch Inventory
          </TabsTrigger>
          <TabsTrigger value="dispensing">
            <Activity className="mr-2 h-4 w-4" />
            Dispensing
          </TabsTrigger>
          <TabsTrigger value="purchase">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Expiry Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <DrugProductsTab />
        </TabsContent>

        <TabsContent value="inventory">
          <BatchInventoryTab />
        </TabsContent>

        <TabsContent value="dispensing">
          <DispensingTab />
        </TabsContent>

        <TabsContent value="purchase">
          <PurchaseOrdersTab />
        </TabsContent>

        <TabsContent value="alerts">
          <ExpiryAlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}