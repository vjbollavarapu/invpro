"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, TrendingDown, Package, ShoppingCart, DollarSign, ArrowRight, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

interface ActionItem {
  id: string
  type: "order" | "stop" | "fix" | "review"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  action?: string
  link?: string
}

interface ZeroBullshitReportProps {
  inventoryData?: any
  salesData?: any
  lowStockItems?: any[]
  outOfStockItems?: any[]
  slowMovingItems?: any[]
}

export function ZeroBullshitReport({
  inventoryData,
  salesData,
  lowStockItems = [],
  outOfStockItems = [],
  slowMovingItems = [],
}: ZeroBullshitReportProps) {
  // Calculate key metrics in plain language
  const totalStockValue = inventoryData?.data?.total_stock_value || 0
  const totalProducts = inventoryData?.data?.total_products || 0
  const lowStockCount = lowStockItems.length
  const outOfStockCount = outOfStockItems.length
  const totalRevenue = salesData?.data?.total_revenue || 0
  const totalOrders = salesData?.data?.total_orders || 0

  // Generate actionable items
  const actionItems: ActionItem[] = []

  // High priority: Out of stock items
  outOfStockItems.slice(0, 5).forEach((item) => {
    actionItems.push({
      id: `out-${item.id}`,
      type: "fix",
      priority: "high",
      title: `Fix "${item.name}" - Out of Stock`,
      description: `You're losing sales. This product has 0 in stock and needs immediate attention.`,
      action: "Restock Now",
      link: `/dashboard/inventory?product=${item.id}`,
    })
  })

  // High priority: Low stock items
  lowStockItems.slice(0, 5).forEach((item) => {
    const suggestedQty = Math.max(
      (item.reorder_level * 2) - item.quantity,
      item.reorder_level
    )
    actionItems.push({
      id: `low-${item.id}`,
      type: "order",
      priority: "high",
      title: `Order ${suggestedQty} more of "${item.name}"`,
      description: `Only ${item.quantity} left. Reorder level is ${item.reorder_level}. Running low.`,
      action: item.supplier ? "Create PO" : "Add Supplier First",
      link: item.supplier ? `/dashboard/procurement` : `/dashboard/inventory?product=${item.id}`,
    })
  })

  // Medium priority: Slow moving items
  slowMovingItems.slice(0, 3).forEach((item) => {
    actionItems.push({
      id: `slow-${item.id}`,
      type: "stop",
      priority: "medium",
      title: `Stop ordering "${item.name}"`,
      description: `Not selling (${item.quantity} in stock, 0 sold this month). Consider discounting or discontinuing.`,
      action: "Review Product",
      link: `/dashboard/inventory?product=${item.id}`,
    })
  })

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  actionItems.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4" />
      case "stop":
        return <XCircle className="h-4 w-4" />
      case "fix":
        return <AlertTriangle className="h-4 w-4" />
      case "review":
        return <Package className="h-4 w-4" />
      default:
        return <CheckCircle2 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header - Plain Language Summary */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">📊 Your Inventory at a Glance</CardTitle>
          <CardDescription>What you need to know, in plain English</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">What Your Stock is Worth</p>
                <p className="text-2xl font-bold">
                  ${(totalStockValue / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Items Needing Attention</p>
                <p className="text-2xl font-bold text-destructive">
                  {lowStockCount + outOfStockCount}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What You Need to Do - Action Items */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            What You Need to Do
          </CardTitle>
          <CardDescription>
            {actionItems.length === 0
              ? "Everything looks good! No urgent actions needed."
              : `${actionItems.length} items need your attention.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">All Good!</p>
              <p className="text-muted-foreground">No urgent actions needed right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
                    item.priority === "high"
                      ? "border-destructive/50 bg-destructive/5"
                      : item.priority === "medium"
                        ? "border-orange-500/50 bg-orange-500/5"
                        : "border-yellow-500/50 bg-yellow-500/5"
                  }`}
                >
                  <div
                    className={`mt-1 p-2 rounded-full ${
                      item.priority === "high"
                        ? "bg-destructive/20 text-destructive"
                        : item.priority === "medium"
                          ? "bg-orange-500/20 text-orange-600"
                          : "bg-yellow-500/20 text-yellow-600"
                    }`}
                  >
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <Badge variant={getPriorityColor(item.priority) as any} className="text-xs">
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    {item.action && (
                      <Button
                        size="sm"
                        variant={item.priority === "high" ? "destructive" : "outline"}
                        asChild
                      >
                        <Link href={item.link || "/dashboard/inventory"}>
                          {item.action}
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How You're Doing - Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              How You're Doing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                <span className="text-sm">Selling Well</span>
                <span className="text-lg font-bold text-green-600">
                  {totalProducts - lowStockCount - outOfStockCount - slowMovingItems.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
                <span className="text-sm">Running Low</span>
                <span className="text-lg font-bold text-yellow-600">{lowStockCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                <span className="text-sm">Out of Stock</span>
                <span className="text-lg font-bold text-red-600">{outOfStockCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                <span className="text-sm">Not Selling</span>
                <span className="text-lg font-bold text-orange-600">
                  {slowMovingItems.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Sales This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">
                  ${(totalRevenue / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Orders</p>
                <p className="text-2xl font-semibold">{totalOrders}</p>
              </div>
              {totalOrders > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Average Order Value</p>
                  <p className="text-xl font-semibold">
                    ${(totalRevenue / totalOrders).toFixed(0)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

