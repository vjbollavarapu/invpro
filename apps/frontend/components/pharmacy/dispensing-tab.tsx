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
import { Plus, Search, Calendar } from "lucide-react"
import { DispensingDialog } from "./dispensing-dialog"
import { useToast } from "@/hooks/use-toast"

export function DispensingTab() {
  const [dispensings, setDispensings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchDispensings()
  }, [searchQuery])

  const fetchDispensings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('invpro_token')
      const tenantData = localStorage.getItem('invpro_current_tenant')
      const tenant = tenantData ? JSON.parse(tenantData) : null

      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/pharma/dispensing?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.id || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDispensings(data.results || data || [])
      }
    } catch (error) {
      console.error('Failed to fetch dispensings:', error)
      toast({
        title: "Error",
        description: "Failed to load dispensing records",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDispensingSuccess = () => {
    fetchDispensings()
    toast({
      title: "Success",
      description: "Drug dispensed and inventory updated",
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dispensing Records</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patient, prescription..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Dispense Drug
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispensing #</TableHead>
                <TableHead>Drug Product</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Packaging Level</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading dispensing records...
                  </TableCell>
                </TableRow>
              ) : dispensings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No dispensing records found
                  </TableCell>
                </TableRow>
              ) : (
                dispensings.map((dispensing) => (
                  <TableRow key={dispensing.id}>
                    <TableCell className="font-mono text-sm">
                      {dispensing.dispensing_number}
                    </TableCell>
                    <TableCell className="font-medium">
                      {dispensing.drug_product_name}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {dispensing.batch_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{dispensing.packaging_level_name}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {Number(dispensing.quantity_dispensed).toLocaleString()}
                    </TableCell>
                    <TableCell>{dispensing.patient_name || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {dispensing.prescription_number || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(dispensing.dispensing_date || dispensing.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${Number(dispensing.total_price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DispensingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleDispensingSuccess}
      />
    </>
  )
}

