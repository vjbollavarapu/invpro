"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package } from "lucide-react"
import { ReceiveBatchDialog } from "./receive-batch-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PurchaseOrdersTab() {
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)

  const handleReceiveSuccess = () => {
    // Refresh data
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Purchase Orders & Receiving</CardTitle>
            <Button onClick={() => setIsReceiveDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Receive Batch
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              <strong>Bulk Receiving Workflow:</strong>
              <ol className="mt-2 space-y-1 text-sm list-decimal list-inside">
                <li>Receive inventory at bulk packaging level (cartons, boxes)</li>
                <li>System automatically unpacks into base units (tablets, ml)</li>
                <li>Batch enters quarantine status</li>
                <li>QC team approves in "Batch Inventory" tab</li>
                <li>Approved batches become available for dispensing</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Pending QC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Batches in quarantine</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Approved This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Batches approved</p>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Failed QC</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center py-8 text-muted-foreground">
            <p>Use "Receive Batch" button above to receive new inventory</p>
            <p className="text-sm mt-1">Batches will appear in the "Batch Inventory" tab for QC approval</p>
          </div>
        </CardContent>
      </Card>

      <ReceiveBatchDialog
        open={isReceiveDialogOpen}
        onOpenChange={setIsReceiveDialogOpen}
        onSuccess={handleReceiveSuccess}
      />
    </>
  )
}

