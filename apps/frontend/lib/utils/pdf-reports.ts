import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Product, Order, DashboardData } from "@/types"

// Inventory Valuation Report
export function generateInventoryReport(products: Product[], tenantName: string) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text("Inventory Valuation Report", 14, 20)
  
  doc.setFontSize(10)
  doc.text(`Company: ${tenantName}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 33)
  doc.text(`Total Products: ${products.length}`, 14, 38)

  // Calculate totals
  const totalValue = products.reduce((sum, p) => sum + (p.totalValue || 0), 0)
  const lowStockCount = products.filter(p => p.stockStatus === "Low Stock").length
  const outOfStockCount = products.filter(p => p.stockStatus === "Out of Stock").length

  doc.setFontSize(12)
  doc.text(`Total Inventory Value: $${totalValue.toLocaleString()}`, 14, 45)
  doc.setFontSize(10)
  doc.text(`Low Stock Items: ${lowStockCount}`, 14, 51)
  doc.text(`Out of Stock Items: ${outOfStockCount}`, 14, 56)

  // Product Table
  const tableData = products.map(product => [
    product.sku,
    product.name,
    product.category,
    product.quantity,
    product.unit,
    `$${product.unitCost.toFixed(2)}`,
    `$${product.totalValue.toLocaleString()}`,
    product.stockStatus,
  ])

  autoTable(doc, {
    startY: 65,
    head: [["SKU", "Product", "Category", "Qty", "Unit", "Cost", "Value", "Status"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 },
      6: { cellWidth: 25 },
      7: { cellWidth: 20 },
    },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }

  // Save
  doc.save(`inventory_report_${new Date().toISOString().split("T")[0]}.pdf`)
}

// Sales Summary Report
export function generateSalesReport(orders: Order[], tenantName: string, dateFrom?: string, dateTo?: string) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text("Sales Summary Report", 14, 20)
  
  doc.setFontSize(10)
  doc.text(`Company: ${tenantName}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 33)
  if (dateFrom && dateTo) {
    doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 38)
  }

  // Calculate totals
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const ordersByStatus = {
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  }

  doc.setFontSize(12)
  doc.text(`Total Orders: ${orders.length}`, 14, 45)
  doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 14, 52)
  
  doc.setFontSize(10)
  doc.text(`Pending: ${ordersByStatus.pending}`, 14, 60)
  doc.text(`Processing: ${ordersByStatus.processing}`, 60, 60)
  doc.text(`Delivered: ${ordersByStatus.delivered}`, 110, 60)

  // Orders Table
  const tableData = orders.map(order => [
    order.orderNumber,
    order.customerName || "N/A",
    new Date(order.orderDate).toLocaleDateString(),
    order.status,
    order.itemsCount || 0,
    `$${order.totalAmount.toLocaleString()}`,
  ])

  autoTable(doc, {
    startY: 70,
    head: [["Order #", "Customer", "Date", "Status", "Items", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    )
  }

  doc.save(`sales_report_${new Date().toISOString().split("T")[0]}.pdf`)
}

// Dashboard Summary Report
export function generateDashboardReport(dashboardData: DashboardData) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(24)
  doc.text("Business Dashboard Report", 14, 20)
  
  doc.setFontSize(12)
  doc.text(dashboardData.tenant.name, 14, 30)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 36)

  // Key Metrics Section
  doc.setFontSize(14)
  doc.setTextColor(59, 130, 246)
  doc.text("Key Metrics", 14, 50)
  doc.setTextColor(0, 0, 0)

  const metrics = dashboardData.metrics
  doc.setFontSize(10)
  let yPos = 58

  doc.text(`Total Stock Value: $${metrics.totalStockValue.toLocaleString()}`, 20, yPos)
  yPos += 7
  doc.text(`Active Warehouses: ${metrics.activeWarehouses}`, 20, yPos)
  yPos += 7
  doc.text(`Pending Orders: ${metrics.pendingOrders}`, 20, yPos)
  yPos += 7
  doc.text(`Purchase Requests: ${metrics.purchaseRequests}`, 20, yPos)
  yPos += 7
  doc.text(`Low Stock Items: ${metrics.lowStockItems}`, 20, yPos)
  yPos += 7
  doc.text(`Out of Stock Items: ${metrics.outOfStockItems}`, 20, yPos)
  yPos += 7
  doc.text(`30-Day Revenue: $${metrics.recentRevenue30d.toLocaleString()}`, 20, yPos)

  // Statistics Section
  yPos += 15
  doc.setFontSize(14)
  doc.setTextColor(59, 130, 246)
  doc.text("Business Statistics", 14, yPos)
  doc.setTextColor(0, 0, 0)

  const stats = dashboardData.stats
  yPos += 8
  doc.setFontSize(10)

  doc.text(`Total Products: ${stats.totalProducts}`, 20, yPos)
  yPos += 7
  doc.text(`Total Customers: ${stats.totalCustomers}`, 20, yPos)
  yPos += 7
  doc.text(`Total Suppliers: ${stats.totalSuppliers}`, 20, yPos)
  yPos += 7
  doc.text(`Total Warehouses: ${stats.totalWarehouses}`, 20, yPos)
  yPos += 7
  doc.text(`Total Orders: ${stats.totalOrders}`, 20, yPos)
  yPos += 7
  doc.text(`Recent Orders (30 days): ${stats.recentOrders30d}`, 20, yPos)

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text(
    "InvPro360 - Inventory & Warehouse Management System",
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  )

  doc.save(`dashboard_report_${new Date().toISOString().split("T")[0]}.pdf`)
}

// Low Stock Alert Report
export function generateLowStockReport(products: Product[], tenantName: string) {
  const lowStockProducts = products.filter(
    p => p.stockStatus === "Low Stock" || p.stockStatus === "Out of Stock"
  )

  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text("Low Stock Alert Report", 14, 20)
  
  doc.setFontSize(10)
  doc.text(`Company: ${tenantName}`, 14, 28)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 33)
  
  doc.setFontSize(12)
  doc.setTextColor(220, 38, 38)
  doc.text(`⚠ ${lowStockProducts.length} Items Need Attention`, 14, 42)
  doc.setTextColor(0, 0, 0)

  // Table
  const tableData = lowStockProducts.map(product => [
    product.sku,
    product.name,
    product.quantity,
    product.unit,
    product.reorderLevel,
    product.stockStatus,
    typeof product.warehouse === "object" ? product.warehouse.name : product.warehouse,
  ])

  autoTable(doc, {
    startY: 50,
    head: [["SKU", "Product", "Current", "Unit", "Reorder Level", "Status", "Warehouse"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 9 },
  })

  doc.save(`low_stock_report_${new Date().toISOString().split("T")[0]}.pdf`)
}

