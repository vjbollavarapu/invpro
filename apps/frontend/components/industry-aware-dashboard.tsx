"use client"

import { useIndustry } from "@/lib/hooks/useIndustry"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Package, ShoppingCart, Warehouse, DollarSign, 
  Pill, AlertTriangle, Calendar, Truck 
} from "lucide-react"

export function IndustryAwareDashboard({ metrics }: { metrics: any }) {
  const { industry, getDashboardConfig } = useIndustry()
  const dashboardConfig = getDashboardConfig()

  const getMetricCard = (metricKey: string) => {
    // Define metric configurations
    const metricConfigs: Record<string, any> = {
      total_drugs: {
        title: 'Total Drugs',
        value: metrics?.total_products || 0,
        icon: Pill,
        color: 'text-blue-600',
        description: 'Active products',
      },
      low_stock: {
        title: 'Low Stock',
        value: metrics?.low_stock_items || 0,
        icon: AlertTriangle,
        color: 'text-orange-600',
        description: 'Items need reorder',
      },
      expiring_batches: {
        title: 'Expiring Soon',
        value: metrics?.expiring_batches || 0,
        icon: Calendar,
        color: 'text-red-600',
        description: 'Within 90 days',
      },
      pending_orders: {
        title: 'Pending Orders',
        value: metrics?.pending_orders || 0,
        icon: ShoppingCart,
        color: 'text-purple-600',
        description: 'Awaiting processing',
      },
      total_products: {
        title: 'Total Products',
        value: metrics?.total_products || 0,
        icon: Package,
        color: 'text-blue-600',
        description: 'In inventory',
      },
      total_sales: {
        title: 'Total Sales',
        value: metrics?.total_orders || 0,
        icon: ShoppingCart,
        color: 'text-green-600',
        description: 'This month',
      },
      revenue: {
        title: 'Revenue',
        value: `$${(metrics?.recent_revenue_30d || 0).toLocaleString()}`,
        icon: DollarSign,
        color: 'text-green-600',
        description: 'Last 30 days',
      },
      total_warehouses: {
        title: 'Warehouses',
        value: metrics?.active_warehouses || 0,
        icon: Warehouse,
        color: 'text-purple-600',
        description: 'Active locations',
      },
      pending_transfers: {
        title: 'Pending Transfers',
        value: metrics?.pending_transfers || 0,
        icon: Truck,
        color: 'text-orange-600',
        description: 'In transit',
      },
      total_stock_value: {
        title: 'Stock Value',
        value: `$${(metrics?.total_stock_value || 0).toLocaleString()}`,
        icon: DollarSign,
        color: 'text-blue-600',
        description: 'Total inventory value',
      },
    }

    const config = metricConfigs[metricKey]
    if (!config) return null

    const Icon = config.icon

    return (
      <Card key={metricKey}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{config.value}</div>
          <p className="text-xs text-muted-foreground">{config.description}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Industry Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <Badge variant="outline" className="text-sm">
          {industry.toUpperCase()} Mode
        </Badge>
      </div>

      {/* Dynamic Metrics based on Industry */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardConfig.metrics.map(metricKey => getMetricCard(metricKey))}
      </div>

      {/* Industry-specific sections would go here */}
      <div className="grid gap-6 md:grid-cols-2">
        {dashboardConfig.charts.map(chartKey => (
          <Card key={chartKey}>
            <CardHeader>
              <CardTitle className="text-base capitalize">
                {chartKey.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Chart: {chartKey}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

