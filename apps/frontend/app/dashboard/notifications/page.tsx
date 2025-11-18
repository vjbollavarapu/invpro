"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  ShoppingCart,
  Package,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  useNotifications, 
  useNotificationStats, 
  useMarkNotificationAsRead, 
  useMarkAllAsRead 
} from "@/lib/hooks/useNotifications"

const severityColors = {
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  error: "bg-red-500/10 text-red-700 dark:text-red-400",
  success: "bg-green-500/10 text-green-700 dark:text-green-400",
}

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // Fetch real data using hooks
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications({
    type: selectedType !== "all" ? selectedType : undefined,
    page: currentPage,
    pageSize: pageSize,
  })

  const { data: statsData, isLoading: statsLoading } = useNotificationStats()

  // Mutations
  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllAsRead()

  // Extract data from API responses
  const notifications = notificationsData?.data || []
  const stats = statsData || { total: 0, unread: 0, byType: {} }

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead.mutateAsync(notificationId)
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications & Audit Trail</h1>
          <p className="text-muted-foreground mt-1">Stay updated with system alerts and track all user activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={markAllAsRead.isPending}>
            <CheckCheck className="h-4 w-4 mr-2" />
            {markAllAsRead.isPending ? "Marking..." : "Mark All Read"}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Audit Log
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {/* Notification Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.unread}</div>
                    <p className="text-xs text-muted-foreground">Requires attention</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.byType.low_stock || 0}</div>
                    <p className="text-xs text-muted-foreground">Items need reorder</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.byType.sales_order || 0}</div>
                    <p className="text-xs text-muted-foreground">Pending fulfillment</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Purchase Orders</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats.byType.purchase_order || 0}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>All Notifications</CardTitle>
                  <CardDescription>System alerts and important updates</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="purchase_order">Purchase Orders</SelectItem>
                      <SelectItem value="sales_order">Sales Orders</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Message</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {notifications.map((notification) => {
                          const SeverityIcon = severityIcons[notification.severity] || Info
                          return (
                            <TableRow key={notification.id}>
                              <TableCell>
                                <Badge variant="outline">{notification.type}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{notification.title}</TableCell>
                              <TableCell className="max-w-md truncate">{notification.message}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <SeverityIcon className="h-4 w-4" />
                                  <Badge className={severityColors[notification.severity]}>
                                    {notification.severity}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={notification.read ? "secondary" : "default"}>
                                  {notification.read ? "Read" : "Unread"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(notification.created_at).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {!notification.read && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      disabled={markAsRead.isPending}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {notificationsData && notificationsData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={notificationsData.totalPages}
                      totalItems={notificationsData.total}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>Track all user activities and system changes</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search audit logs..."
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="create">Created</SelectItem>
                      <SelectItem value="update">Updated</SelectItem>
                      <SelectItem value="delete">Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Audit Trail Coming Soon</h3>
                <p className="text-muted-foreground">
                  Comprehensive audit logging will be available in the next update.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}