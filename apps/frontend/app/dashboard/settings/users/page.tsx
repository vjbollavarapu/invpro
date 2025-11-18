"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Shield, Search, MoreVertical, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for users
const mockUsers = [
  { id: 1, name: "John Smith", email: "john.smith@invpro360.com", role: "Admin", status: "Active" },
  { id: 2, name: "Sarah Johnson", email: "sarah.j@invpro360.com", role: "Procurement Manager", status: "Active" },
  { id: 3, name: "Michael Chen", email: "m.chen@invpro360.com", role: "Sales Executive", status: "Active" },
  { id: 4, name: "Emily Davis", email: "emily.d@invpro360.com", role: "Warehouse Manager", status: "Active" },
  { id: 5, name: "Robert Wilson", email: "r.wilson@invpro360.com", role: "Accountant", status: "Active" },
  { id: 6, name: "Lisa Anderson", email: "lisa.a@invpro360.com", role: "Sales Executive", status: "Inactive" },
]

// Mock data for roles
const mockRoles = [
  {
    id: 1,
    name: "Admin",
    description: "Full system access",
    userCount: 1,
    permissions: {
      inventory: { view: true, create: true, edit: true, delete: true },
      procurement: { view: true, create: true, edit: true, delete: true },
      sales: { view: true, create: true, edit: true, delete: true },
      warehouses: { view: true, create: true, edit: true, delete: true },
      finance: { view: true, create: true, edit: true, delete: true },
      reports: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: 2,
    name: "Procurement Manager",
    description: "Manage purchase orders and suppliers",
    userCount: 1,
    permissions: {
      inventory: { view: true, create: false, edit: false, delete: false },
      procurement: { view: true, create: true, edit: true, delete: true },
      sales: { view: true, create: false, edit: false, delete: false },
      warehouses: { view: true, create: false, edit: false, delete: false },
      finance: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, create: true, edit: false, delete: false },
    },
  },
  {
    id: 3,
    name: "Sales Executive",
    description: "Manage sales orders and customers",
    userCount: 2,
    permissions: {
      inventory: { view: true, create: false, edit: false, delete: false },
      procurement: { view: false, create: false, edit: false, delete: false },
      sales: { view: true, create: true, edit: true, delete: false },
      warehouses: { view: true, create: false, edit: false, delete: false },
      finance: { view: true, create: false, edit: false, delete: false },
      reports: { view: true, create: true, edit: false, delete: false },
    },
  },
  {
    id: 4,
    name: "Warehouse Manager",
    description: "Manage warehouse operations and inventory",
    userCount: 1,
    permissions: {
      inventory: { view: true, create: true, edit: true, delete: false },
      procurement: { view: true, create: false, edit: false, delete: false },
      sales: { view: true, create: false, edit: false, delete: false },
      warehouses: { view: true, create: true, edit: true, delete: false },
      finance: { view: false, create: false, edit: false, delete: false },
      reports: { view: true, create: true, edit: false, delete: false },
    },
  },
  {
    id: 5,
    name: "Accountant",
    description: "Manage financial records and reports",
    userCount: 1,
    permissions: {
      inventory: { view: true, create: false, edit: false, delete: false },
      procurement: { view: true, create: false, edit: false, delete: false },
      sales: { view: true, create: false, edit: false, delete: false },
      warehouses: { view: true, create: false, edit: false, delete: false },
      finance: { view: true, create: true, edit: true, delete: false },
      reports: { view: true, create: true, edit: false, delete: false },
    },
  },
]

const modules = [
  { id: "inventory", name: "Inventory Management" },
  { id: "procurement", name: "Procurement" },
  { id: "sales", name: "Sales & Orders" },
  { id: "warehouses", name: "Warehouses" },
  { id: "finance", name: "Finance & Cost" },
  { id: "reports", name: "Reports & Analytics" },
]

export default function UsersPage() {
  const [users, setUsers] = useState(mockUsers)
  const [roles, setRoles] = useState(mockRoles)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
  })

  // New role form state
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: {
      inventory: { view: false, create: false, edit: false, delete: false },
      procurement: { view: false, create: false, edit: false, delete: false },
      sales: { view: false, create: false, edit: false, delete: false },
      warehouses: { view: false, create: false, edit: false, delete: false },
      finance: { view: false, create: false, edit: false, delete: false },
      reports: { view: false, create: false, edit: false, delete: false },
    },
  })

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddUser = async () => {
    setIsLoading(true)
    // API call placeholder
    await fetch("/api/users/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    })

    // Mock adding user
    setTimeout(() => {
      setUsers([
        ...users,
        {
          id: users.length + 1,
          ...newUser,
          status: "Active",
        },
      ])
      setIsAddUserOpen(false)
      setNewUser({ name: "", email: "", role: "", password: "" })
      setIsLoading(false)
    }, 1000)
  }

  const handleAddRole = async () => {
    setIsLoading(true)
    // API call placeholder
    await fetch("/api/roles/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRole),
    })

    // Mock adding role
    setTimeout(() => {
      setRoles([
        ...roles,
        {
          id: roles.length + 1,
          ...newRole,
          userCount: 0,
        },
      ])
      setIsAddRoleOpen(false)
      setNewRole({
        name: "",
        description: "",
        permissions: {
          inventory: { view: false, create: false, edit: false, delete: false },
          procurement: { view: false, create: false, edit: false, delete: false },
          sales: { view: false, create: false, edit: false, delete: false },
          warehouses: { view: false, create: false, edit: false, delete: false },
          finance: { view: false, create: false, edit: false, delete: false },
          reports: { view: false, create: false, edit: false, delete: false },
        },
      })
      setIsLoading(false)
    }, 1000)
  }

  const handleEditRole = async () => {
    setIsLoading(true)
    // API call placeholder
    await fetch(`/api/roles/${selectedRole.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedRole),
    })

    // Mock updating role
    setTimeout(() => {
      setRoles(roles.map((r) => (r.id === selectedRole.id ? selectedRole : r)))
      setIsEditRoleOpen(false)
      setSelectedRole(null)
      setIsLoading(false)
    }, 1000)
  }

  const handleToggleUserStatus = async (userId: number) => {
    // API call placeholder
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: users.find((u) => u.id === userId)?.status === "Active" ? "Inactive" : "Active" }),
    })

    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: user.status === "Active" ? "Inactive" : "Active" } : user,
      ),
    )
  }

  const handleDeleteUser = async (userId: number) => {
    // API call placeholder
    await fetch(`/api/users/${userId}`, {
      method: "DELETE",
    })

    setUsers(users.filter((user) => user.id !== userId))
  }

  const updatePermission = (module: string, action: string, value: boolean, isEdit = false) => {
    if (isEdit && selectedRole) {
      setSelectedRole({
        ...selectedRole,
        permissions: {
          ...selectedRole.permissions,
          [module]: {
            ...selectedRole.permissions[module],
            [action]: value,
          },
        },
      })
    } else {
      setNewRole({
        ...newRole,
        permissions: {
          ...newRole.permissions,
          [module]: {
            ...newRole.permissions[module],
            [action]: value,
          },
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User & Role Management</h1>
        <p className="text-muted-foreground mt-2">Manage users, roles, and permissions across InvPro360</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage user accounts and access</CardDescription>
                </div>
                <Button onClick={() => setIsAddUserOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                            {user.status === "Active" ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                                {user.status === "Active" ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles & Permissions</CardTitle>
                  <CardDescription>Define roles and configure module access</CardDescription>
                </div>
                <Button onClick={() => setIsAddRoleOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                  <Card key={role.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <CardDescription className="mt-1">{role.description}</CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRole(role)
                                setIsEditRoleOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Users</span>
                          <Badge variant="secondary">{role.userCount}</Badge>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Permissions:</p>
                          <div className="space-y-1">
                            {Object.entries(role.permissions).map(([module, perms]: [string, any]) => {
                              const hasAnyPermission = Object.values(perms).some((v) => v)
                              if (!hasAnyPermission) return null
                              return (
                                <div key={module} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                  {modules.find((m) => m.id === module)?.name}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add User Modal */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account and assign a role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Smith"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.smith@invpro360.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">User will be prompted to change on first login</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Modal */}
      <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Define a new role and configure module permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g., Inventory Manager"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Input
                id="roleDescription"
                placeholder="Brief description of this role"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              />
            </div>
            <div className="space-y-4">
              <Label>Module Permissions</Label>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead className="text-center">View</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">{module.name}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={newRole.permissions[module.id as keyof typeof newRole.permissions]?.view}
                            onCheckedChange={(checked) => updatePermission(module.id, "view", checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={newRole.permissions[module.id as keyof typeof newRole.permissions]?.create}
                            onCheckedChange={(checked) => updatePermission(module.id, "create", checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={newRole.permissions[module.id as keyof typeof newRole.permissions]?.edit}
                            onCheckedChange={(checked) => updatePermission(module.id, "edit", checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={newRole.permissions[module.id as keyof typeof newRole.permissions]?.delete}
                            onCheckedChange={(checked) => updatePermission(module.id, "delete", checked as boolean)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role details and permissions</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editRoleName">Role Name</Label>
                <Input
                  id="editRoleName"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRoleDescription">Description</Label>
                <Input
                  id="editRoleDescription"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <Label>Module Permissions</Label>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Module</TableHead>
                        <TableHead className="text-center">View</TableHead>
                        <TableHead className="text-center">Create</TableHead>
                        <TableHead className="text-center">Edit</TableHead>
                        <TableHead className="text-center">Delete</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium">{module.name}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedRole.permissions[module.id]?.view}
                              onCheckedChange={(checked) =>
                                updatePermission(module.id, "view", checked as boolean, true)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedRole.permissions[module.id]?.create}
                              onCheckedChange={(checked) =>
                                updatePermission(module.id, "create", checked as boolean, true)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedRole.permissions[module.id]?.edit}
                              onCheckedChange={(checked) =>
                                updatePermission(module.id, "edit", checked as boolean, true)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedRole.permissions[module.id]?.delete}
                              onCheckedChange={(checked) =>
                                updatePermission(module.id, "delete", checked as boolean, true)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
