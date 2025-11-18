"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"
import { FilterOptions } from "@/types"

interface AdvancedFilterProps {
  onFilterChange: (filters: FilterOptions) => void
  currentFilters: FilterOptions
}

export function AdvancedFilter({ onFilterChange, currentFilters }: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters)

  const handleApplyFilters = () => {
    onFilterChange(filters)
  }

  const handleClearFilters = () => {
    const emptyFilters: FilterOptions = {}
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const activeFilterCount = Object.values(currentFilters).filter(v => v && v !== 'all').length

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2 rounded-full px-1.5 py-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Advanced Filters</SheetTitle>
          <SheetDescription>
            Apply multiple filters to narrow down your search
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={filters.category || "all"}
              onValueChange={(value) => setFilters({ ...filters, category: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Tools">Tools</SelectItem>
                <SelectItem value="Consumables">Consumables</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Stock Status</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warehouse Filter */}
          <div className="space-y-2">
            <Label>Warehouse</Label>
            <Select
              value={filters.warehouse || "all"}
              onValueChange={(value) => setFilters({ ...filters, warehouse: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                <SelectItem value="Warehouse A">Warehouse A</SelectItem>
                <SelectItem value="Warehouse B">Warehouse B</SelectItem>
                <SelectItem value="Warehouse C">Warehouse C</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">From</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Search within filtered results */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              placeholder="Search by name, SKU, description..."
              value={filters.search || ""}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="space-y-2">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.category && filters.category !== 'all' && (
                  <Badge variant="secondary">
                    Category: {filters.category}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, category: undefined })}
                    />
                  </Badge>
                )}
                {filters.status && filters.status !== 'all' && (
                  <Badge variant="secondary">
                    Status: {filters.status}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, status: undefined })}
                    />
                  </Badge>
                )}
                {filters.warehouse && filters.warehouse !== 'all' && (
                  <Badge variant="secondary">
                    Warehouse: {filters.warehouse}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, warehouse: undefined })}
                    />
                  </Badge>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <Badge variant="secondary">
                    Date: {filters.dateFrom || 'Start'} - {filters.dateTo || 'End'}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer"
                      onClick={() => setFilters({ ...filters, dateFrom: undefined, dateTo: undefined })}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClearFilters} className="flex-1">
            Clear All
          </Button>
          <Button onClick={handleApplyFilters} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

