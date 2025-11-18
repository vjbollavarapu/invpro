import Papa from "papaparse"
import * as XLSX from "xlsx"
import { Product } from "@/types"

// CSV Export
export function exportToCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, `${filename}.csv`)
}

// Excel Export
export function exportToExcel(data: any[], filename: string, sheetName: string = "Sheet1") {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// CSV Import
export function importFromCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors[0].message}`))
        } else {
          resolve(results.data)
        }
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

// Excel Import
export async function importFromExcel(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        resolve(json)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }
    
    reader.readAsBinaryString(file)
  })
}

// Download blob helper
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Product-specific export with proper formatting
export function exportProducts(products: Product[], format: "csv" | "excel" = "csv") {
  const exportData = products.map((product) => ({
    "Product ID": product.id,
    "Name": product.name,
    "SKU": product.sku,
    "Category": product.category,
    "Quantity": product.quantity,
    "Unit": product.unit,
    "Unit Cost": product.unitCost,
    "Selling Price": product.sellingPrice,
    "Total Value": product.totalValue,
    "Reorder Level": product.reorderLevel,
    "Stock Status": product.stockStatus,
    "Warehouse": typeof product.warehouse === "object" ? product.warehouse.name : product.warehouse,
  }))

  const filename = `products_export_${new Date().toISOString().split("T")[0]}`
  
  if (format === "csv") {
    exportToCSV(exportData, filename)
  } else {
    exportToExcel(exportData, filename, "Products")
  }
}

// Product import template
export function downloadProductTemplate(format: "csv" | "excel" = "csv") {
  const template = [
    {
      "Name": "Sample Product",
      "SKU": "SKU-001",
      "Category": "Raw Materials",
      "Quantity": "100",
      "Unit": "pcs",
      "Unit Cost": "10.50",
      "Selling Price": "15.00",
      "Reorder Level": "20",
      "Description": "Sample product description",
    },
  ]

  const filename = "product_import_template"
  
  if (format === "csv") {
    exportToCSV(template, filename)
  } else {
    exportToExcel(template, filename, "Template")
  }
}

// Validate imported product data
export function validateProductImport(data: any[]): {
  valid: any[]
  invalid: any[]
  errors: string[]
} {
  const valid: any[] = []
  const invalid: any[] = []
  const errors: string[] = []

  data.forEach((row, index) => {
    const rowErrors: string[] = []

    // Required fields validation
    if (!row.Name || row.Name.trim() === "") {
      rowErrors.push(`Row ${index + 1}: Name is required`)
    }
    if (!row.Category) {
      rowErrors.push(`Row ${index + 1}: Category is required`)
    }
    if (row.Quantity === undefined || row.Quantity === null) {
      rowErrors.push(`Row ${index + 1}: Quantity is required`)
    }
    if (!row.Unit) {
      rowErrors.push(`Row ${index + 1}: Unit is required`)
    }

    // Numeric validation
    if (isNaN(Number(row.Quantity)) || Number(row.Quantity) < 0) {
      rowErrors.push(`Row ${index + 1}: Quantity must be a positive number`)
    }
    if (row["Unit Cost"] && (isNaN(Number(row["Unit Cost"])) || Number(row["Unit Cost"]) < 0)) {
      rowErrors.push(`Row ${index + 1}: Unit Cost must be a positive number`)
    }
    if (row["Selling Price"] && (isNaN(Number(row["Selling Price"])) || Number(row["Selling Price"]) < 0)) {
      rowErrors.push(`Row ${index + 1}: Selling Price must be a positive number`)
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      invalid.push({ row: index + 1, data: row, errors: rowErrors })
    } else {
      // Transform to API format
      valid.push({
        name: row.Name,
        sku: row.SKU || `AUTO-${Date.now()}-${index}`,
        description: row.Description || "",
        category: row.Category,
        quantity: Number(row.Quantity),
        unit: row.Unit,
        unit_cost: Number(row["Unit Cost"] || 0),
        selling_price: Number(row["Selling Price"] || 0),
        reorder_level: Number(row["Reorder Level"] || 0),
      })
    }
  })

  return { valid, invalid, errors }
}

