"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  TrendingUp,
  Warehouse,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  FileText,
  AlertTriangle,
} from "lucide-react"
import { Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const keyMetrics = [
    {
      title: "Total Stock Value",
      value: metrics?.metrics?.total_stock_value ? `$${Number(metrics.metrics.total_stock_value).toLocaleString()}` : "$2,847,392",
      change: "+15.3%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Active Warehouses",
      value: metrics?.metrics?.active_warehouses ? String(metrics.metrics.active_warehouses) : "12",
      change: "+2",
      trend: "up",
      icon: Warehouse,
    },
    {
      title: "Pending Orders",
      value: metrics?.metrics?.pending_orders ? String(metrics.metrics.pending_orders) : "87",
      change: "-12.5%",
      trend: "down",
      icon: ShoppingCart,
    },
    {
      title: "Purchase Requests",
      value: metrics?.metrics?.purchase_requests ? String(metrics.metrics.purchase_requests) : "34",
      change: "+8.2%",
      trend: "up",
      icon: FileText,
    },
    {
      title: "Low Stock Items",
      value: metrics?.metrics?.low_stock_items ? String(metrics.metrics.low_stock_items) : "23",
      change: "+2.3%",
      trend: "up",
      icon: AlertTriangle,
    },
  ]

  const inventoryData = [
    { month: "Jan", value: 2100000 },
    { month: "Feb", value: 2350000 },
    { month: "Mar", value: 2200000 },
    { month: "Apr", value: 2650000 },
    { month: "May", value: 2500000 },
    { month: "Jun", value: 2847392 },
  ]

  const topProducts = [
  {
    id: "SKU-1001",
    name: "Industrial Bearing Set",
    category: "Hardware",
    sold: 1243,
    revenue: "$186,450",
    trend: "up",
  },
  {
    id: "SKU-1002",
    name: "Hydraulic Pump Assembly",
    category: "Machinery",
    sold: 892,
    revenue: "$267,600",
    trend: "up",
  },
  { id: "SKU-1003", name: "Steel Fastener Kit", category: "Hardware", sold: 756, revenue: "$45,360", trend: "down" },
  { id: "SKU-1004", name: "Electric Motor 5HP", category: "Electrical", sold: 634, revenue: "$190,200", trend: "up" },
  { id: "SKU-1005", name: "Safety Equipment Bundle", category: "Safety", sold: 521, revenue: "$78,150", trend: "up"   },
]

  const lowStockAlerts = [
  {
    sku: "SKU-2341",
    name: "Welding Electrodes",
    current: 45,
    minimum: 200,
    warehouse: "Warehouse A",
    severity: "high",
  },
  { sku: "SKU-5672", name: "Cutting Blades", current: 78, minimum: 150, warehouse: "Warehouse C", severity: "high" },
  {
    sku: "SKU-8923",
    name: "Lubricant Oil 5L",
    current: 112,
    minimum: 180,
    warehouse: "Warehouse B",
    severity: "medium",
  },
  {
    sku: "SKU-3456",
    name: "Protective Gloves",
    current: 234,
    minimum: 300,
    warehouse: "Warehouse D",
    severity: "medium",
  },
  { sku: "SKU-7891", name: "Cable Ties Pack", current: 156, minimum: 200, warehouse: "Warehouse A", severity: "low" },
]

  const warehouseData = [
  { name: "Warehouse A", value: 85, color: "var(--color-chart-1)" },
  { name: "Warehouse B", value: 72, color: "var(--color-chart-2)" },
  { name: "Warehouse C", value: 91, color: "var(--color-chart-3)" },
  { name: "Warehouse D", value: 68, color: "var(--color-chart-4)" },
  { name: "Warehouse E", value: 78, color: "var(--color-chart-5)" },
]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Dashboard Overview</h1>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Real-time insights into your inventory, procurement, and warehouse operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {keyMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <metric.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs mt-1">
                {metric.trend === "up" && (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-accent" />
                    <span className="text-accent font-medium">{metric.change}</span>
                  </>
                )}
                {metric.trend === "down" && (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-destructive" />
                    <span className="text-destructive font-medium">{metric.change}</span>
                  </>
                )}
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Value Trend</CardTitle>
            <CardDescription>Total stock value over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Stock Value",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Stock Value"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-chart-1)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warehouse Utilization</CardTitle>
            <CardDescription>Current capacity usage across all warehouses</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: {
                  label: "Utilization %",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={warehouseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {warehouseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => [`${value}%`, "Utilization"]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top-Selling Products</CardTitle>
          <CardDescription>Best performing items in the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Units Sold</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Revenue</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Trend</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-mono">{product.id}</td>
                    <td className="py-3 px-4 text-sm font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{product.category}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{product.sold.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium">{product.revenue}</td>
                    <td className="py-3 px-4 text-center">
                      {product.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-accent inline-block" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive inline-block" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Items requiring immediate attention and restocking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockAlerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.severity === "high"
                    ? "border-destructive/50 bg-destructive/5"
                    : alert.severity === "medium"
                      ? "border-orange-500/50 bg-orange-500/5"
                      : "border-yellow-500/50 bg-yellow-500/5"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        alert.severity === "high"
                          ? "bg-destructive"
                          : alert.severity === "medium"
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-sm">{alert.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{alert.sku}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Current Stock</p>
                    <p className="font-bold">{alert.current} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Minimum Required</p>
                    <p className="font-medium">{alert.minimum} units</p>
                  </div>
                  <div className="text-right min-w-[120px]">
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium">{alert.warehouse}</p>
                  </div>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
                    Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
