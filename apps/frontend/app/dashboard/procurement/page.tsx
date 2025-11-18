"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Eye, CheckCircle, XCircle, Star, Phone, Mail, MapPin, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { 
  useSuppliers, 
  useCreateSupplier, 
  usePurchaseRequests, 
  useCreatePurchaseRequest, 
  usePurchaseOrders, 
  useCreatePurchaseOrder,
  type Supplier,
  type PurchaseRequest,
  type PurchaseOrder
} from "@/lib/hooks/useProcurement"
import { useProducts } from "@/lib/hooks/useProducts"

const statusColors = {
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  approved: "bg-green-500/10 text-green-700 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  "in-transit": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-400",
  cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

interface LineItem {
  id: string
  product: string
  quantity: number
  unitCost: number
  total: number
}

export default function ProcurementPage() {
  const { toast } = useToast()
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false)
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false)
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false)
  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: "1", product: "", quantity: 1, unitCost: 0, total: 0 }])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Fetch data using hooks
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({
    search: searchQuery,
    page: currentPage,
    pageSize: pageSize,
  })

  const { data: requestsData, isLoading: requestsLoading } = usePurchaseRequests({
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    search: searchQuery,
    page: currentPage,
    pageSize: pageSize,
  })

  const { data: ordersData, isLoading: ordersLoading } = usePurchaseOrders({
    status: selectedStatus !== "all" ? selectedStatus : undefined,
    search: searchQuery,
    page: currentPage,
    pageSize: pageSize,
  })

  const { data: productsData } = useProducts({ pageSize: 100 })

  // Extract data from API responses
  const suppliers = suppliersData?.data || []
  const purchaseRequests = requestsData?.data || []
  const purchaseOrders = ordersData?.data || []
  const products = productsData?.data || []

  // Reset to first page when search or status changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedStatus])

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now().toString(), product: "", quantity: 1, unitCost: 0, total: 0 }])
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "unitCost") {
            updated.total = updated.quantity * updated.unitCost
          }
          return updated
        }
        return item
      }),
    )
  }

  const grandTotal = lineItems.reduce((sum, item) => sum + item.total, 0)

  // Mutations
  const createSupplier = useCreateSupplier()
  const createPurchaseRequest = useCreatePurchaseRequest()
  const createPurchaseOrder = useCreatePurchaseOrder()

  const handleCreatePO = async () => {
    try {
      await createPurchaseOrder.mutateAsync({
        supplier: 1, // This should be selected from a dropdown
        total_amount: grandTotal,
        status: "draft",
      })
      setIsCreatePOOpen(false)
      setLineItems([{ id: "1", product: "", quantity: 1, unitCost: 0, total: 0 }])
    } catch (error) {
      console.error("Failed to create purchase order:", error)
    }
  }

  const handleCreateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await createSupplier.mutateAsync({
        name: formData.get("name") as string,
        contact_person: formData.get("contact_person") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
        rating: parseFloat(formData.get("rating") as string) || 0,
      })
      setIsCreateSupplierOpen(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error("Failed to create supplier:", error)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await createPurchaseRequest.mutateAsync({
        item: parseInt(formData.get("item") as string),
        quantity: parseInt(formData.get("quantity") as string),
        status: "pending",
      })
      setIsCreateRequestOpen(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error("Failed to create purchase request:", error)
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement Management</h1>
          <p className="text-muted-foreground">Manage suppliers, purchase requests, and orders</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateRequestOpen} onOpenChange={setIsCreateRequestOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Purchase Request</DialogTitle>
                <DialogDescription>Request new items for procurement</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item">Product</Label>
                  <Select name="item" required>
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
                  <Input id="quantity" name="quantity" type="number" placeholder="100" required />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsCreateRequestOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPurchaseRequest.isPending}>
                    {createPurchaseRequest.isPending ? "Creating..." : "Create Request"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>Create a new purchase order with line items</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Line Items</Label>
                  <div className="space-y-2">
                    {lineItems.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <Select
                          value={item.product}
                          onValueChange={(value) => updateLineItem(item.id, "product", value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.name}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <Input
                          type="number"
                          placeholder="Cost"
                          value={item.unitCost}
                          onChange={(e) => updateLineItem(item.id, "unitCost", parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                        <span className="w-20 text-right">${item.total.toFixed(2)}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLineItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addLineItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Line Item
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end items-center gap-4 pt-4 border-t">
                  <span className="text-lg font-semibold">Grand Total:</span>
                  <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreatePOOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePO} disabled={createPurchaseOrder.isPending}>
                    {createPurchaseOrder.isPending ? "Creating..." : "Create Purchase Order"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList>
          <TabsTrigger value="requests">Purchase Requests</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Directory</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Purchase Requests</CardTitle>
                  <CardDescription>Manage and track purchase requests</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search requests..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Request #</TableHead>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Requested By</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.request_number}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{request.item_name}</div>
                                <div className="text-sm text-muted-foreground">{request.item_code}</div>
                              </div>
                            </TableCell>
                            <TableCell>{request.quantity}</TableCell>
                            <TableCell>{request.requested_by_name}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[request.status]}>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {request.status === "pending" && (
                                  <>
                                    <Button variant="outline" size="sm">
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {requestsData && requestsData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={requestsData.totalPages}
                      totalItems={requestsData.total}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Purchase Orders</CardTitle>
                  <CardDescription>Track purchase orders and their status</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search orders..."
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="in-transit">In Transit</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expected Delivery</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.po_number}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.supplier_name}</div>
                                <div className="text-sm text-muted-foreground">{order.supplier_code}</div>
                              </div>
                            </TableCell>
                            <TableCell>${Number(order.total_amount).toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[order.status]}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {order.expected_delivery_date 
                                ? new Date(order.expected_delivery_date).toLocaleDateString()
                                : "Not set"
                              }
                            </TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
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
                  {ordersData && ordersData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={ordersData.totalPages}
                      totalItems={ordersData.total}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Supplier Directory</CardTitle>
                  <CardDescription>Manage your supplier relationships</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Dialog open={isCreateSupplierOpen} onOpenChange={setIsCreateSupplierOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Supplier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                        <DialogDescription>Add a new supplier to your directory</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateSupplier} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Company Name</Label>
                          <Input id="name" name="name" placeholder="Global Supplies Inc." required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_person">Contact Person</Label>
                          <Input id="contact_person" name="contact_person" placeholder="John Smith" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" name="email" type="email" placeholder="contact@company.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" name="phone" placeholder="+1 (555) 123-4567" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" name="address" placeholder="123 Business St, City, State" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rating">Rating (0-5)</Label>
                          <Input id="rating" name="rating" type="number" step="0.1" min="0" max="5" placeholder="4.5" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setIsCreateSupplierOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createSupplier.isPending}>
                            {createSupplier.isPending ? "Adding..." : "Add Supplier"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {suppliersLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Supplier Code</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{supplier.name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {supplier.email}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {supplier.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{supplier.contact_person}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {supplier.address}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {Number(supplier.rating).toFixed(1)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>Total: {supplier.total_orders}</div>
                                <div className="text-muted-foreground">Active: {supplier.active_orders}</div>
                              </div>
                            </TableCell>
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
                  {suppliersData && suppliersData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={suppliersData.totalPages}
                      totalItems={suppliersData.total}
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