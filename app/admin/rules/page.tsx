"use client"

import { useState, useEffect, useRef } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  MoreHorizontal,
  Filter,
  Shield,
  Workflow,
  KeyRound,
  Bell,
  Edit,
  Trash2,
  Copy,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

type Category = "security" | "workflow" | "access" | "notification"

interface Rule {
  id: string
  name: string
  description: string
  category: Category
  enabled: boolean
  conditions: string[]
  actions: string[]
  createdBy: string
  createdAt: string
}

const categoryIcons = {
  security: Shield,
  workflow: Workflow,
  access: KeyRound,
  notification: Bell,
}

const categoryColors = {
  security: "bg-destructive/20 text-destructive",
  workflow: "bg-primary/20 text-primary",
  access: "bg-warning/20 text-warning",
  notification: "bg-accent/20 text-accent",
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function splitLines(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

interface RuleCardProps {
  rule: Rule
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (rule: Rule) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

function RuleCard({ rule, onToggle, onEdit, onDuplicate, onDelete }: RuleCardProps) {
  const Icon = categoryIcons[rule.category]

  return (
    <Card className={cn("bg-card border-border transition-all hover:border-primary/50", !rule.enabled && "opacity-60")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", categoryColors[rule.category])}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground">{rule.name}</h3>
                <Badge variant="outline" className="text-xs capitalize">{rule.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Conditions:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.conditions.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-mono">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Actions:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.actions.map((a, i) => (
                      <Badge key={i} className="text-xs bg-primary/10 text-primary">{a}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <span>Created by {rule.createdBy}</span>
                <span>on {formatDate(rule.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={rule.enabled} onCheckedChange={(checked) => onToggle(rule.id, checked)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(rule)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Rule
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(rule.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(rule.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Rule
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const emptyForm = { name: "", description: "", category: "workflow" as Category, conditions: "", actions: "" }

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Create / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`${BASE_URL}/admin/rules`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((json) => setRules(json.data ?? []))
      .catch(console.error)
  }, [])

  const openCreate = () => {
    setEditingRule(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (rule: Rule) => {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      description: rule.description,
      category: rule.category,
      conditions: rule.conditions.join("\n"),
      actions: rule.actions.join("\n"),
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        conditions: splitLines(form.conditions),
        actions: splitLines(form.actions),
      }
      if (editingRule) {
        const res = await fetch(`${BASE_URL}/admin/rules/${editingRule.id}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...r, ...json.data } : r)))
      } else {
        const res = await fetch(`${BASE_URL}/admin/rules`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        setRules((prev) => [json.data, ...prev])
      }
      setDialogOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)))
    await fetch(`${BASE_URL}/admin/rules/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ enabled }),
    }).catch(console.error)
  }

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`${BASE_URL}/admin/rules/${id}/duplicate`, {
      method: "POST",
      headers: getHeaders(),
    })
    const json = await res.json()
    setRules((prev) => [json.data, ...prev])
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`${BASE_URL}/admin/rules/${deleteId}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).catch(console.error)
    setRules((prev) => prev.filter((r) => r.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
  }

  const filtered = rules.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || rule.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const enabledCount = rules.filter((r) => r.enabled).length
  const securityCount = rules.filter((r) => r.category === "security").length

  return (
    <MainLayout breadcrumb={["Admin", "Rules"]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rules</p>
                  <p className="text-2xl font-semibold text-foreground">{rules.length}</p>
                </div>
                <Workflow className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-semibold text-foreground">{enabledCount}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                  <div className="h-3 w-3 rounded-full bg-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Security Rules</p>
                  <p className="text-2xl font-semibold text-foreground">{securityCount}</p>
                </div>
                <Shield className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Automation Rules</h2>
              <p className="text-sm text-muted-foreground">Manage workflow automation and business rules</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="access">Access Control</SelectItem>
                <SelectItem value="notification">Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rules Grid */}
          <div className="grid gap-4">
            {filtered.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDuplicate={handleDuplicate}
                onDelete={(id) => setDeleteId(id)}
              />
            ))}
            {filtered.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Workflow className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">{rules.length === 0 ? "No rules yet. Create your first rule." : "No rules match your search."}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Create New Rule"}</DialogTitle>
            <DialogDescription>Define conditions and actions for automated workflows.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                placeholder="Enter rule name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe what this rule does"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="access">Access Control</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conditions <span className="text-xs text-muted-foreground">(one per line)</span></Label>
              <Textarea
                placeholder={"priority == critical\nassignee == null"}
                className="font-mono text-sm"
                value={form.conditions}
                onChange={(e) => setForm((f) => ({ ...f, conditions: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Actions <span className="text-xs text-muted-foreground">(one per line)</span></Label>
              <Textarea
                placeholder={"send notification\nassign to team lead"}
                className="font-mono text-sm"
                value={form.actions}
                onChange={(e) => setForm((f) => ({ ...f, actions: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>
              {saving ? "Saving…" : editingRule ? "Save Changes" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              This will permanently delete the rule. This action cannot be undone.
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
