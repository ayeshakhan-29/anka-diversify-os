"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Users,
  FolderKanban,
  MoreHorizontal,
  Settings,
  UserPlus,
  ArrowRight,
  Code2,
  Palette,
  Package,
  Megaphone,
  Trash2,
  Edit,
  UserMinus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

function getHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem("authToken")
  const userStr = localStorage.getItem("user")
  const user = userStr ? JSON.parse(userStr) : null
  return {
    "Content-Type": "application/json",
    "X-User-ID": user?.id || "demo-user-id",
    "X-User-Name": user?.name || "Admin",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

interface Member {
  id: string
  name: string | null
  email: string
  role: string
  status: string
}

interface Project {
  id: string
  name: string
  phase: string | null
  progress: number | null
  status: string
}

interface Department {
  id: string
  name: string
  description: string
  headUserId: string | null
  head: Member | null
  members: Member[]
  projects: Project[]
}

const departmentIcons: Record<string, React.ElementType> = {
  Development: Code2,
  Design: Palette,
  Product: Package,
  Marketing: Megaphone,
}

const departmentColors: Record<string, string> = {
  Development: "bg-primary/20 text-primary",
  Design: "bg-chart-4/20 text-chart-4",
  Product: "bg-accent/20 text-accent",
  Marketing: "bg-warning/20 text-warning",
}

function initials(name: string | null, email: string) {
  return (name ?? email).split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}

const emptyForm = { name: "", description: "", headUserId: "" }

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [allUsers, setAllUsers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Add member dialog
  const [addMemberDept, setAddMemberDept] = useState<Department | null>(null)
  const [selectedUserId, setSelectedUserId] = useState("")
  const [addingMember, setAddingMember] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${BASE_URL}/admin/departments`, { headers: getHeaders() }).then((r) => r.json()),
      fetch(`${BASE_URL}/admin/stats`, { headers: getHeaders() }).then((r) => r.json()),
    ])
      .then(([depts, stats]) => {
        setDepartments(depts.data ?? [])
        setAllUsers(stats.data?.users ?? [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setEditingDept(null)
    setForm(emptyForm)
    setFormError("")
    setDialogOpen(true)
  }

  const openEdit = (dept: Department) => {
    setEditingDept(dept)
    setForm({ name: dept.name, description: dept.description, headUserId: dept.headUserId ?? "" })
    setFormError("")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    setFormError("")
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        headUserId: form.headUserId || null,
      }
      if (editingDept) {
        const res = await fetch(`${BASE_URL}/admin/departments/${editingDept.id}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) { setFormError(json.message); return }
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === editingDept.id
              ? { ...d, ...json.data, members: d.members, projects: d.projects }
              : d
          )
        )
      } else {
        const res = await fetch(`${BASE_URL}/admin/departments`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (!res.ok) { setFormError(json.message); return }
        setDepartments((prev) => [...prev, json.data])
      }
      setDialogOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`${BASE_URL}/admin/departments/${deleteId}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).catch(console.error)
    setDepartments((prev) => prev.filter((d) => d.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const handleAddMember = async () => {
    if (!addMemberDept || !selectedUserId) return
    setAddingMember(true)
    await fetch(`${BASE_URL}/admin/departments/${addMemberDept.id}/members`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ userId: selectedUserId }),
    }).catch(console.error)
    const user = allUsers.find((u) => u.id === selectedUserId)
    if (user) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === addMemberDept.id && !d.members.find((m) => m.id === user.id)
            ? { ...d, members: [...d.members, user] }
            : d
        )
      )
    }
    setAddMemberDept(null)
    setSelectedUserId("")
    setAddingMember(false)
  }

  const handleRemoveMember = async (deptId: string, userId: string) => {
    await fetch(`${BASE_URL}/admin/departments/${deptId}/members/${userId}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).catch(console.error)
    setDepartments((prev) =>
      prev.map((d) =>
        d.id === deptId ? { ...d, members: d.members.filter((m) => m.id !== userId) } : d
      )
    )
  }

  const totalMembers = departments.reduce((s, d) => s + d.members.length, 0)
  const totalProjects = new Set(departments.flatMap((d) => d.projects.map((p) => p.id))).size

  // Users not already in this dept — for the add member select
  const availableUsers = addMemberDept
    ? allUsers.filter((u) => !addMemberDept.members.find((m) => m.id === u.id))
    : []

  return (
    <MainLayout breadcrumb={["Admin", "Departments"]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Departments</p>
                  <p className="text-2xl font-semibold text-foreground">{departments.length}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-semibold text-foreground">{totalMembers}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-2xl font-semibold text-foreground">{totalProjects}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <div className="h-3 w-3 rounded-full bg-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Departments Overview</h2>
            <p className="text-sm text-muted-foreground">Manage organizational structure and team assignments</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Add Department
          </Button>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading departments…</div>
        ) : departments.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No departments yet. Create your first one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {departments.map((dept) => {
              const Icon = departmentIcons[dept.name] || FolderKanban
              const colorClass = departmentColors[dept.name] || "bg-muted text-muted-foreground"

              return (
                <Card key={dept.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-start justify-between pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg shrink-0 ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">{dept.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{dept.description || "No description"}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(dept)}>
                          <Edit className="h-4 w-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAddMemberDept(dept); setSelectedUserId("") }}>
                          <UserPlus className="h-4 w-4 mr-2" />Add Member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(dept.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Department Head */}
                    {dept.head ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {initials(dept.head.name, dept.head.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">{dept.head.name ?? dept.head.email}</p>
                            <p className="text-xs text-muted-foreground">Department Head</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{dept.head.role}</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 text-muted-foreground text-sm">
                        <Users className="h-4 w-4" />
                        <span>No head assigned</span>
                        <Button variant="ghost" size="sm" className="ml-auto text-xs h-7" onClick={() => openEdit(dept)}>
                          Assign
                        </Button>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">Members</span>
                        </div>
                        <p className="text-xl font-semibold text-foreground mt-1">{dept.members.length}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FolderKanban className="h-4 w-4" />
                          <span className="text-xs">Projects</span>
                        </div>
                        <p className="text-xl font-semibold text-foreground mt-1">{dept.projects.length}</p>
                      </div>
                    </div>

                    {/* Team Members */}
                    {dept.members.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Team Members</p>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {dept.members.slice(0, 4).map((member) => (
                              <Avatar key={member.id} className="h-8 w-8 border-2 border-card">
                                <AvatarFallback className="bg-secondary text-foreground text-xs">
                                  {initials(member.name, member.email)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {dept.members.length > 4 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium text-muted-foreground">
                                +{dept.members.length - 4}
                              </div>
                            )}
                          </div>
                          <div className="ml-auto flex gap-1">
                            {dept.members.slice(0, 3).map((member) => (
                              <Button
                                key={member.id}
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                title={`Remove ${member.name ?? member.email}`}
                                onClick={() => handleRemoveMember(dept.id, member.id)}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Projects */}
                    {dept.projects.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Recent Projects</p>
                        <div className="space-y-2">
                          {dept.projects.slice(0, 2).map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Progress value={project.progress ?? 0} className="h-1 flex-1" />
                                  <span className="text-xs text-muted-foreground shrink-0">{project.progress ?? 0}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(dept)}>
                        <Settings className="h-4 w-4 mr-2" />Manage
                      </Button>
                      <Link href="/development/projects" className="flex-1">
                        <Button size="sm" className="w-full">
                          View Projects <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit Department" : "Create New Department"}</DialogTitle>
            <DialogDescription>
              {editingDept ? "Update department details and head." : "Add a new department to your organization."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-2">
              <Label>Department Name</Label>
              <Input
                placeholder="e.g., Engineering"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Department description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Department Head</Label>
              <Select value={form.headUserId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, headUserId: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select head (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.email} — {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? "Saving…" : editingDept ? "Save Changes" : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member dialog */}
      <Dialog open={!!addMemberDept} onOpenChange={(o) => { if (!o) setAddMemberDept(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Member to {addMemberDept?.name}</DialogTitle>
            <DialogDescription>Assign a user to this department.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name ?? u.email} — {u.role}
                  </SelectItem>
                ))}
                {availableUsers.length === 0 && (
                  <SelectItem value="none" disabled>All users already assigned</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDept(null)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={addingMember || !selectedUserId}>
              {addingMember ? "Adding…" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              This will delete the department and unassign all its members. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
