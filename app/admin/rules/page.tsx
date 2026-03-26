"use client"

import { useState } from "react"
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
  DialogTrigger,
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
  Play,
} from "lucide-react"
import { rules } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Rule } from "@/lib/types"

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

function RuleCard({ rule, onToggle }: { rule: Rule; onToggle: (id: string) => void }) {
  const Icon = categoryIcons[rule.category]

  return (
    <Card className={cn(
      "bg-card border-border transition-all hover:border-primary/50",
      !rule.enabled && "opacity-60"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
              categoryColors[rule.category]
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground">{rule.name}</h3>
                <Badge variant="outline" className="text-xs capitalize">
                  {rule.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Conditions:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.conditions.map((condition, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-mono">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Actions:</p>
                  <div className="flex flex-wrap gap-1">
                    {rule.actions.map((action, i) => (
                      <Badge key={i} className="text-xs bg-primary/10 text-primary">
                        {action}
                      </Badge>
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
            <Switch
              checked={rule.enabled}
              onCheckedChange={() => onToggle(rule.id)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Rule
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Play className="h-4 w-4 mr-2" />
                  Test Rule
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
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

export default function RulesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [rulesState, setRulesState] = useState(rules)

  const toggleRule = (id: string) => {
    setRulesState((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  const filteredRules = rulesState.filter((rule) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || rule.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const enabledCount = rulesState.filter((r) => r.enabled).length
  const securityCount = rulesState.filter((r) => r.category === "security").length

  return (
    <MainLayout breadcrumb={["Admin", "Rules"]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rules</p>
                  <p className="text-2xl font-semibold text-foreground">{rulesState.length}</p>
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
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Triggers Today</p>
                  <p className="text-2xl font-semibold text-foreground">127</p>
                </div>
                <Bell className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Automation Rules</h2>
              <p className="text-sm text-muted-foreground">
                Manage workflow automation and business rules
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Rule</DialogTitle>
                  <DialogDescription>
                    Define conditions and actions for automated workflows.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input id="ruleName" placeholder="Enter rule name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruleDesc">Description</Label>
                    <Textarea id="ruleDesc" placeholder="Describe what this rule does" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
                    <Label htmlFor="conditions">Conditions</Label>
                    <Textarea
                      id="conditions"
                      placeholder="e.g., priority == critical, assignee == null"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actions">Actions</Label>
                    <Textarea
                      id="actions"
                      placeholder="e.g., send notification, assign to team lead"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            {filteredRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} />
            ))}
            {filteredRules.length === 0 && (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Workflow className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">No rules found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
