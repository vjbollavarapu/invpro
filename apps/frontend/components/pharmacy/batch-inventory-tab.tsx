"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { Search, CheckCircle, XCircle, AlertTriangle, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function BatchInventoryTab() {
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchBatches()
  }, [searchQuery, statusFilter])

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/pharma/batches?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBatches(data.results || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
      toast({
        title: "Error",
        description: "Failed to load batch inventory",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveBatch = async (batchId: number) => {
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const response = await fetch(`/api/pharma/batches/${batchId}/approve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Batch approved for dispensing",
        })
        fetchBatches()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: any = {
      quarantine: <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Quarantine</Badge>,
      approved: <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>,
      rejected: <Badge variant="destructive">Rejected</Badge>,
      expired: <Badge variant="destructive">Expired</Badge>,
    }
    return badges[status] || <Badge variant="secondary">{status}</Badge>
  }

  const getExpiryWarning = (days: number) => {
    if (days < 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Expired
      </Badge>
    } else if (days <= 30) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {days}d
      </Badge>
    } else if (days <= 90) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {days}d
      </Badge>
    }
    return <Badge variant="secondary">{days}d</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Batch Inventory</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="quarantine">Quarantine</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Number</TableHead>
              <TableHead>Drug Product</TableHead>
              <TableHead>Packaging Level</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Current Qty</TableHead>
              <TableHead>Manufacture Date</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Days to Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Loading batches...
                </TableCell>
              </TableRow>
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No batches found
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono font-medium">
                    {batch.batch_number}
                  </TableCell>
                  <TableCell>{batch.drug_product_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{batch.packaging_level_name}</Badge>
                  </TableCell>
                  <TableCell>{batch.warehouse_name}</TableCell>
                  <TableCell className="text-right font-mono">
                    {Number(batch.current_quantity).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(batch.manufacture_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(batch.expiry_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {getExpiryWarning(batch.days_until_expiry || 0)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(batch.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {batch.status === 'quarantine' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveBatch(batch.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

