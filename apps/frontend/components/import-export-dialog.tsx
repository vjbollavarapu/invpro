"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { 
  exportProducts, 
  downloadProductTemplate, 
  importFromCSV, 
  importFromExcel, 
  validateProductImport 
} from "@/lib/utils/import-export"
import { Product } from "@/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface ImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  onImportComplete: () => void
}

export function ImportExportDialog({
  open,
  onOpenChange,
  products,
  onImportComplete,
}: ImportExportDialogProps) {
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    total: number
    successful: number
    failed: number
    errors: string[]
  } | null>(null)

  const handleExport = (format: "csv" | "excel") => {
    try {
      exportProducts(products, format)
      toast({
        title: "Export successful",
        description: `${products.length} products exported to ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export products",
        variant: "destructive",
      })
    }
  }

  const handleDownloadTemplate = (format: "csv" | "excel") => {
    try {
      downloadProductTemplate(format)
      toast({
        title: "Template downloaded",
        description: `Import template downloaded as ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download template",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResults(null)
    setImportProgress(0)

    try {
      // Parse file
      let data: any[]
      if (file.name.endsWith(".csv")) {
        data = await importFromCSV(file)
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        data = await importFromExcel(file)
      } else {
        throw new Error("Unsupported file format. Please use CSV or Excel.")
      }

      setImportProgress(30)

      // Validate data
      const { valid, invalid, errors } = validateProductImport(data)
      
      setImportProgress(50)

      if (valid.length === 0) {
        throw new Error("No valid products found in file")
      }

      // Import valid products
      const token = localStorage.getItem("invpro_token")
      const tenantData = localStorage.getItem("invpro_current_tenant")
      const tenant = tenantData ? JSON.parse(tenantData) : null

      let successful = 0
      let failed = 0

      for (let i = 0; i < valid.length; i++) {
        try {
          const response = await fetch("/api/inventory", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "X-Tenant-ID": tenant?.id || "",
            },
            body: JSON.stringify(valid[i]),
          })

          if (response.ok) {
            successful++
          } else {
            failed++
          }
        } catch {
          failed++
        }

        setImportProgress(50 + ((i + 1) / valid.length) * 50)
      }

      setImportResults({
        total: data.length,
        successful,
        failed: failed + invalid.length,
        errors,
      })

      toast({
        title: "Import complete",
        description: `${successful} products imported successfully`,
      })

      onImportComplete()
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import products",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
      setImportProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export Products</DialogTitle>
          <DialogDescription>
            Import products from CSV or Excel, or export your current inventory
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Export Current Inventory</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Download all products ({products.length} items) in your preferred format
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => handleExport("csv")} variant="outline" className="flex-1">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as CSV
                  </Button>
                  <Button onClick={() => handleExport("excel")} variant="outline" className="flex-1">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export as Excel
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Download Template</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Start with our template to ensure correct formatting
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownloadTemplate("csv")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV Template
                  </Button>
                  <Button
                    onClick={() => handleDownloadTemplate("excel")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel Template
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-2">Upload File</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV or Excel file with product data
                </p>
                <div className="flex items-center gap-2">
                  <Label htmlFor="file-upload" className="flex-1">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">CSV or Excel files only</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={importing}
                      className="hidden"
                    />
                  </Label>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <Label>Import Progress</Label>
                  <Progress value={importProgress} />
                  <p className="text-sm text-muted-foreground">
                    {importProgress < 30 && "Reading file..."}
                    {importProgress >= 30 && importProgress < 50 && "Validating data..."}
                    {importProgress >= 50 && "Importing products..."}
                  </p>
                </div>
              )}

              {importResults && (
                <Alert variant={importResults.failed > 0 ? "destructive" : "default"}>
                  {importResults.failed === 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    <p className="font-medium">Import Results:</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>Total rows: {importResults.total}</li>
                      <li className="text-green-600">Successful: {importResults.successful}</li>
                      {importResults.failed > 0 && (
                        <li className="text-destructive">Failed: {importResults.failed}</li>
                      )}
                    </ul>
                    {importResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Errors:</p>
                        <ul className="text-xs space-y-1 mt-1">
                          {importResults.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                          {importResults.errors.length > 5 && (
                            <li>... and {importResults.errors.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

