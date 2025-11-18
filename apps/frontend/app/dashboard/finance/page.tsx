"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus,
  Search,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useToast } from "@/hooks/use-toast"
import { 
  useCostCenters, 
  useCreateCostCenter, 
  useExpenses, 
  useCreateExpense,
  type CostCenter,
  type Expense
} from "@/lib/hooks/useFinance"

export default function FinancePage() {
  const { toast } = useToast()
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [addCostCenterOpen, setAddCostCenterOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCostCenter, setSelectedCostCenter] = useState("all")

  // Fetch data using hooks
  const { data: costCentersData, isLoading: costCentersLoading } = useCostCenters({
    search: searchTerm,
    page: currentPage,
    pageSize: pageSize,
  })

  const { data: expensesData, isLoading: expensesLoading } = useExpenses({
    search: searchTerm,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    cost_center: selectedCostCenter !== "all" ? selectedCostCenter : undefined,
    page: currentPage,
    pageSize: pageSize,
  })

  // Extract data from API responses
  const costCenters = costCentersData?.data || []
  const expenses = expensesData?.data || []

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, selectedCostCenter])

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Mutations
  const createExpense = useCreateExpense()
  const createCostCenter = useCreateCostCenter()

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await createExpense.mutateAsync({
        date: formData.get("date") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        amount: parseFloat(formData.get("amount") as string),
        linked_to: formData.get("linkedTo") as string || null,
        cost_center: formData.get("costCenter") ? parseInt(formData.get("costCenter") as string) : null,
      })
      setAddExpenseOpen(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error("Failed to create expense:", error)
    }
  }

  const handleAddCostCenter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      await createCostCenter.mutateAsync({
        name: formData.get("name") as string,
        budget: parseFloat(formData.get("budget") as string),
        description: formData.get("description") as string,
        actual_cost: 0, // Start with 0 actual cost
        variance: 0, // Start with 0 variance
      })
      setAddCostCenterOpen(false)
      e.currentTarget.reset()
    } catch (error) {
      console.error("Failed to create cost center:", error)
    }
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )

  // Calculate stats from real data
  const totalBudget = costCenters.reduce((sum, cc) => sum + Number(cc.budget), 0)
  const totalActualCost = costCenters.reduce((sum, cc) => sum + Number(cc.actual_cost), 0)
  const totalVariance = totalBudget - totalActualCost
  const variancePercentage = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Management</h1>
          <p className="text-muted-foreground">Track expenses, cost centers, and financial performance</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={addCostCenterOpen} onOpenChange={setAddCostCenterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Cost Center
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Cost Center</DialogTitle>
                <DialogDescription>Create a new cost center for budget tracking</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCostCenter} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Cost Center Name</Label>
                  <Input id="name" name="name" placeholder="Warehouse Operations" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input id="budget" name="budget" type="number" step="0.01" placeholder="150000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Operations and maintenance costs" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setAddCostCenterOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCostCenter.isPending}>
                    {createCostCenter.isPending ? "Adding..." : "Add Cost Center"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
                <DialogDescription>Record a new business expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="e.g., Office supplies" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facilities">Facilities</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costCenter">Cost Center (Optional)</Label>
                  <Select name="costCenter">
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost center" />
                    </SelectTrigger>
                    <SelectContent>
                      {costCenters.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id.toString()}>
                          {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedTo">Linked Order/PO (Optional)</Label>
                  <Input id="linkedTo" name="linkedTo" placeholder="e.g., PO-2024-045" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setAddExpenseOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createExpense.isPending}>
                    {createExpense.isPending ? "Adding..." : "Add Expense"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All cost centers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Costs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalActualCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Spent so far</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(totalVariance).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalVariance >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All expenses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cost-centers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="cost-centers">Cost Centers</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="cost-centers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Cost Centers</CardTitle>
                  <CardDescription>Track budget vs actual costs by department</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cost centers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {costCentersLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cost Center</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Actual Cost</TableHead>
                          <TableHead>Variance</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costCenters.map((costCenter) => (
                          <TableRow key={costCenter.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{costCenter.name}</div>
                                <div className="text-sm text-muted-foreground">{costCenter.description}</div>
                              </div>
                            </TableCell>
                            <TableCell>${costCenter.budget.toLocaleString()}</TableCell>
                            <TableCell>${costCenter.actual_cost.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 ${costCenter.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {costCenter.variance >= 0 ? (
                                  <ArrowUpRight className="h-4 w-4" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4" />
                                )}
                                ${Math.abs(costCenter.variance).toLocaleString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={costCenter.variance >= 0 ? "default" : "destructive"}>
                                {costCenter.variance >= 0 ? "Under Budget" : "Over Budget"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {costCentersData && costCentersData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={costCentersData.totalPages}
                      totalItems={costCentersData.total}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Track and categorize business expenses</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="facilities">Facilities</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="it">IT</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Centers</SelectItem>
                      {costCenters.map((cc) => (
                        <SelectItem key={cc.id} value={cc.id.toString()}>
                          {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Cost Center</TableHead>
                          <TableHead>Linked To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{expense.category}</Badge>
                            </TableCell>
                            <TableCell>${expense.amount.toLocaleString()}</TableCell>
                            <TableCell>{expense.cost_center_name || "N/A"}</TableCell>
                            <TableCell>{expense.linked_to || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {expensesData && expensesData.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={expensesData.totalPages}
                      totalItems={expensesData.total}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}