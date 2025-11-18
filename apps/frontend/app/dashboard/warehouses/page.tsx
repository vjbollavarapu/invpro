"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Warehouse,
  MapPin,
  Users,
  Package,
  Share2,
  ArrowRightLeft,
  TrendingUp,
  Plus,
  Search,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from "lucide-react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useToast } from "@/hooks/use-toast"
import { 
  useWarehouses, 
  useCreateWarehouse, 
  useTransfers, 
  useCreateTransfer,
  type Warehouse as WarehouseType,
  type Transfer
} from "@/lib/hooks/useWarehouses"
import { useProducts } from "@/lib/hooks/useProducts"

const statusColors = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  inactive: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  maintenance: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
}

const transferStatusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "in-transit": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
}

export default function WarehousesPage() {
  const { toast } = useToast()
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [isCreateWarehouseOpen, setIsCreateWarehouseOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Fetch data using hooks
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouses({
    search: searchQuery,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    page: currentPage,
    pageSize: pageSize,
  })

  const { data: transfersData, isLoading: transfersLoading } = useTransfers({
    search: searchQuery,
    page: currentPage,
    pageSize: pageSize,
  })

  const { data: productsData } = useProducts({ pageSize: 100 })

  // Extract data from API responses
  const warehouses = warehousesData?.data || []
  const transfers = transfersData?.data || []
  const products = productsData?.data || []

  // Reset to first page when search or status changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedStatus])

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Mutations
  const createWarehouse = useCreateWarehouse()
  const createTransfer = useCreateTransfer()

  const handleCreateWarehouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await createWarehouse.mutateAsync({
        name: formData.get("name") as string,
        location: formData.get("location") as string,
        max_capacity: parseInt(formData.get("max_capacity") as string) || 1000,
        current_utilization: parseInt(formData.get("current_utilization") as string) || 0,
        active_clients: parseInt(formData.get("active_clients") as string) || 0,
        total_skus: parseInt(formData.get("total_skus") as string) || 0,
        status: (formData.get("status") as string) || "active",
      })
      setIsCreateWarehouseOpen(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error("Failed to create warehouse:", error)
    }
  }

  const handleCreateTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await createTransfer.mutateAsync({
        from_warehouse: parseInt(formData.get("from_warehouse") as string),
        to_warehouse: parseInt(formData.get("to_warehouse") as string),
        product: parseInt(formData.get("product") as string),
        quantity: parseInt(formData.get("quantity") as string),
        status: "pending",
      })
      setTransferModalOpen(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error("Failed to create transfer:", error)
    }
  }

  const getCapacityColor = (capacity: number) => {
    if (capacity >= 90) return "text-red-600 dark:text-red-400"
    if (capacity >= 75) return "text-yellow-600 dark:text-yellow-400"
    return "text-green-600 dark:text-green-400"
  }

  const getCapacityBgColor = (capacity: number) => {
    if (capacity >= 90) return "bg-red-500"
    if (capacity >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )

  // Calculate stats from real data
  const totalWarehouses = warehouses.length
  const activeWarehouses = warehouses.filter(w => w.status === 'active').length
  const totalCapacity = warehouses.reduce((sum, w) => sum + w.max_capacity, 0)
  const totalUtilization = warehouses.reduce((sum, w) => sum + w.current_utilization, 0)
  const avgUtilization = totalCapacity > 0 ? (totalUtilization / totalCapacity) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
          <p className="text-muted-foreground">Manage shared warehouses, transfers, and partner access</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Warehouse Transfer</DialogTitle>
                <DialogDescription>Transfer inventory between warehouses</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTransfer} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="from_warehouse">From Warehouse</Label>
                    <Select name="from_warehouse" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id.toString()}>
                            {wh.name} ({wh.warehouse_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="to_warehouse">To Warehouse</Label>
                    <Select name="to_warehouse" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((wh) => (
                          <SelectItem key={wh.id} value={wh.id.toString()}>
                            {wh.name} ({wh.warehouse_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select name="product" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" placeholder="150" required />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTransfer.isPending}>
                    {createTransfer.isPending ? "Creating..." : "Create Transfer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateWarehouseOpen} onOpenChange={setIsCreateWarehouseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Warehouse</DialogTitle>
                <DialogDescription>Add a new warehouse to your system</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateWarehouse} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Warehouse Name</Label>
                  <Input id="name" name="name" placeholder="Central Distribution Center" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="New York, NY" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_capacity">Max Capacity</Label>
                  <Input id="max_capacity" name="max_capacity" type="number" placeholder="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_utilization">Current Utilization</Label>
                  <Input id="current_utilization" name="current_utilization" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="active_clients">Active Clients</Label>
                  <Input id="active_clients" name="active_clients" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_skus">Total SKUs</Label>
                  <Input id="total_skus" name="total_skus" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateWarehouseOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createWarehouse.isPending}>
                    {createWarehouse.isPending ? "Adding..." : "Add Warehouse"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warehouses</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWarehouses}</div>
            <p className="text-xs text-muted-foreground">{activeWarehouses} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Storage units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all warehouses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warehouses.reduce((sum, w) => sum + w.active_clients, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total clients</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Warehouses</CardTitle>
                  <CardDescription>Manage your warehouse locations</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search warehouses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {warehousesLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Warehouse Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Clients</TableHead>
                          <TableHead>SKUs</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warehouses.map((warehouse) => (
                          <TableRow key={warehouse.id}>
                            <TableCell className="font-medium">{warehouse.warehouse_code}</TableCell>
                            <TableCell className="font-medium">{warehouse.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                {warehouse.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>{warehouse.current_utilization}/{warehouse.max_capacity}</span>
                                  <span className={getCapacityColor(warehouse.capacity_percentage)}>
                                    {warehouse.capacity_percentage}%
                                  </span>
                                </div>
                                <Progress
                                  value={warehouse.capacity_percentage}
                                  className="h-2"
                                  indicatorClassName={getCapacityBgColor(warehouse.capacity_percentage)}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[warehouse.status]}>
                                {warehouse.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{warehouse.active_clients}</TableCell>
                            <TableCell>{warehouse.total_skus}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {warehousesData && warehousesData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={warehousesData.totalPages}
                      totalItems={warehousesData.total}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Transfers</CardTitle>
                  <CardDescription>Track inventory transfers between warehouses</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transfers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transfer #</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transfers.map((transfer) => (
                          <TableRow key={transfer.id}>
                            <TableCell className="font-medium">{transfer.transfer_number}</TableCell>
                            <TableCell>{transfer.from_warehouse_name}</TableCell>
                            <TableCell>{transfer.to_warehouse_name}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transfer.product_name}</div>
                                <div className="text-sm text-muted-foreground">{transfer.product_sku}</div>
                              </div>
                            </TableCell>
                            <TableCell>{transfer.quantity}</TableCell>
                            <TableCell>
                              <Badge className={transferStatusColors[transfer.status]}>
                                {transfer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {transfersData && transfersData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={transfersData.totalPages}
                      totalItems={transfersData.total}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}