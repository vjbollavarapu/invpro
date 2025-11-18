"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, XCircle, Calendar, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ExpiryAlertsTab() {
  const [expiringData, setExpiringData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchExpiringBatches()
  }, [])

  const fetchExpiringBatches = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch('/api/pharma/products/expiring_soon/?days=90', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExpiringData(data || [])
      }
    } catch (error) {
      console.error('Failed to fetch expiring batches:', error)
      toast({
        title: "Error",
        description: "Failed to load expiry alerts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const categorizeByUrgency = () => {
    const expired: any[] = []
    const critical30: any[] = []  // Expiring in 30 days
    const warning90: any[] = []   // Expiring in 31-90 days

    expiringData.forEach(item => {
      item.expiring_batches?.forEach((batch: any) => {
        const itemWithBatch = { ...item, batch }
        if (batch.days_until_expiry < 0) {
          expired.push(itemWithBatch)
        } else if (batch.days_until_expiry <= 30) {
          critical30.push(itemWithBatch)
        } else {
          warning90.push(itemWithBatch)
        }
      })
    })

    return { expired, critical30, warning90 }
  }

  const { expired, critical30, warning90 } = categorizeByUrgency()

  const renderBatchTable = (batches: any[], title: string, variant: 'destructive' | 'default') => (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {batches.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No batches in this category</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Drug Product</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Days Remaining</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Warehouse</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  {item.product?.generic_name} {item.product?.strength}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {item.batch.batch_number}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(item.batch.expiry_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Badge variant={variant}>
                    {item.batch.days_until_expiry < 0 ? 'EXPIRED' : `${item.batch.days_until_expiry} days`}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {Number(item.batch.quantity).toLocaleString()}
                </TableCell>
                <TableCell>{item.batch.warehouse}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Expired Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{expired.length}</div>
            <p className="text-xs text-red-600 mt-1">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical (≤30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{critical30.length}</div>
            <p className="text-xs text-orange-600 mt-1">Expiring within 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-yellow-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Warning (31-90 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{warning90.length}</div>
            <p className="text-xs text-yellow-600 mt-1">Plan for disposal or return</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiry Alerts by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Expiry Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="expired" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expired" className="data-[state=active]:bg-red-100">
                Expired ({expired.length})
              </TabsTrigger>
              <TabsTrigger value="critical" className="data-[state=active]:bg-orange-100">
                Critical ({critical30.length})
              </TabsTrigger>
              <TabsTrigger value="warning" className="data-[state=active]:bg-yellow-100">
                Warning ({warning90.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expired" className="space-y-4">
              {expired.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Expired Batches Detected</AlertTitle>
                  <AlertDescription>
                    These batches have expired and must be removed from active inventory immediately.
                    Consider disposal or return to supplier procedures.
                  </AlertDescription>
                </Alert>
              )}
              {renderBatchTable(expired, 'Expired Batches', 'destructive')}
            </TabsContent>

            <TabsContent value="critical" className="space-y-4">
              {critical30.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Critical Expiry Alert</AlertTitle>
                  <AlertDescription>
                    These batches expire within 30 days. Prioritize dispensing or plan for disposal/return.
                  </AlertDescription>
                </Alert>
              )}
              {renderBatchTable(critical30, 'Expiring in 30 Days', 'destructive')}
            </TabsContent>

            <TabsContent value="warning" className="space-y-4">
              {renderBatchTable(warning90, 'Expiring in 31-90 Days', 'default')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

