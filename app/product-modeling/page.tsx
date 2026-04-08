"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { projects as mockProjects, users as mockUsers } from "@/lib/mock-data"
import { 
  Search, Plus, Filter, Layers, FileText, Users, Calendar,
  Target, Lightbulb, PenTool, Workflow, BarChart3, CheckCircle2,
  Clock, AlertCircle, ArrowRight, ExternalLink, Folder, Star,
  TrendingUp, Eye, MessageSquare, Paperclip
} from "lucide-react"
import Link from "next/link"

const modelingPhases = [
  { id: "ideation", label: "Ideation", icon: Lightbulb, color: "text-chart-3", bgColor: "bg-chart-3/20" },
  { id: "research", label: "Research", icon: Target, color: "text-primary", bgColor: "bg-primary/20" },
  { id: "design", label: "Design", icon: PenTool, color: "text-chart-4", bgColor: "bg-chart-4/20" },
  { id: "validation", label: "Validation", icon: CheckCircle2, color: "text-success", bgColor: "bg-success/20" },
]

const productModels = [
  {
    id: "pm-1",
    name: "E-Commerce Platform v2",
    description: "Complete redesign of the shopping experience with AI recommendations",
    phase: "design",
    progress: 75,
    features: 12,
    completedFeatures: 9,
    teamIds: ["user-1", "user-2", "user-3"],
    priority: "high",
    createdAt: "2025-12-15",
    updatedAt: "2026-03-20",
    documents: 8,
    comments: 24,
  },
  {
    id: "pm-2",
    name: "Mobile Banking App",
    description: "Secure and intuitive mobile banking solution for retail customers",
    phase: "research",
    progress: 40,
    features: 18,
    completedFeatures: 7,
    teamIds: ["user-2", "user-4"],
    priority: "critical",
    createdAt: "2026-01-10",
    updatedAt: "2026-03-18",
    documents: 5,
    comments: 16,
  },
  {
    id: "pm-3",
    name: "Healthcare Dashboard",
    description: "Patient management and analytics dashboard for healthcare providers",
    phase: "ideation",
    progress: 15,
    features: 8,
    completedFeatures: 1,
    teamIds: ["user-1", "user-3"],
    priority: "medium",
    createdAt: "2026-02-20",
    updatedAt: "2026-03-22",
    documents: 3,
    comments: 8,
  },
  {
    id: "pm-4",
    name: "IoT Device Manager",
    description: "Centralized platform for managing and monitoring IoT devices",
    phase: "validation",
    progress: 90,
    features: 15,
    completedFeatures: 14,
    teamIds: ["user-1", "user-2", "user-4"],
    priority: "high",
    createdAt: "2025-10-05",
    updatedAt: "2026-03-24",
    documents: 12,
    comments: 45,
  },
]

const recentActivities = [
  { user: mockUsers[0], action: "updated wireframes for", target: "E-Commerce Platform v2", time: "2 hours ago" },
  { user: mockUsers[1], action: "added 3 user stories to", target: "Mobile Banking App", time: "4 hours ago" },
  { user: mockUsers[2], action: "completed feature spec for", target: "Healthcare Dashboard", time: "Yesterday" },
  { user: mockUsers[3], action: "approved validation for", target: "IoT Device Manager", time: "Yesterday" },
]

const priorityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-primary/20 text-primary border-primary/30",
  low: "bg-muted text-muted-foreground border-muted",
}

export default function ProductModelingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [phaseFilter, setPhaseFilter] = useState<string>("all")
  const [isNewModelOpen, setIsNewModelOpen] = useState(false)

  const filteredModels = productModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPhase = phaseFilter === "all" || model.phase === phaseFilter
    return matchesSearch && matchesPhase
  })

  const getPhaseInfo = (phaseId: string) => modelingPhases.find(p => p.id === phaseId)

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Product Modeling</h1>
            <p className="text-muted-foreground">Design, validate, and plan product features before development</p>
          </div>
          <Dialog open={isNewModelOpen} onOpenChange={setIsNewModelOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Product Model
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Product Model</DialogTitle>
                <DialogDescription>Start a new product modeling session</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Product Name</label>
                  <Input placeholder="Enter product name" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Describe the product concept" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Starting Phase</label>
                    <Select defaultValue="ideation">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modelingPhases.map(phase => (
                          <SelectItem key={phase.id} value={phase.id}>{phase.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewModelOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsNewModelOpen(false)}>Create Model</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Models</p>
                  <p className="text-2xl font-bold">{productModels.length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{productModels.filter(m => m.phase !== "validation").length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ready for Dev</p>
                  <p className="text-2xl font-bold">{productModels.filter(m => m.phase === "validation" && m.progress >= 90).length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Features</p>
                  <p className="text-2xl font-bold">{productModels.reduce((acc, m) => acc + m.features, 0)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-chart-4/20 flex items-center justify-center">
                  <Star className="h-5 w-5 text-chart-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phase Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Modeling Pipeline</CardTitle>
            <CardDescription>Track products through the modeling phases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {modelingPhases.map(phase => {
                const modelsInPhase = productModels.filter(m => m.phase === phase.id)
                const Icon = phase.icon
                return (
                  <div 
                    key={phase.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary/50 ${phaseFilter === phase.id ? "border-primary ring-1 ring-primary/20" : ""}`}
                    onClick={() => setPhaseFilter(phaseFilter === phase.id ? "all" : phase.id)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-8 w-8 rounded-lg ${phase.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${phase.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{phase.label}</p>
                        <p className="text-xs text-muted-foreground">{modelsInPhase.length} products</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {modelsInPhase.slice(0, 2).map(model => (
                        <div key={model.id} className="text-xs p-2 bg-muted/50 rounded truncate">
                          {model.name}
                        </div>
                      ))}
                      {modelsInPhase.length > 2 && (
                        <p className="text-xs text-muted-foreground px-2">+{modelsInPhase.length - 2} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="models" className="w-full">
          <TabsList>
            <TabsTrigger value="models">Product Models</TabsTrigger>
            <TabsTrigger value="features">Feature Backlog</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="mt-4">
            {/* Search & Filter */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {modelingPhases.map(phase => (
                    <SelectItem key={phase.id} value={phase.id}>{phase.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Models Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModels.map(model => {
                const phaseInfo = getPhaseInfo(model.phase)
                const teamMembers = mockUsers.filter(u => model.teamIds.includes(u.id))
                const PhaseIcon = phaseInfo?.icon || Layers

                return (
                  <Card key={model.id} className="group hover:border-primary/50 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`${phaseInfo?.bgColor} ${phaseInfo?.color} border-0`}>
                              <PhaseIcon className="h-3 w-3 mr-1" />
                              {phaseInfo?.label}
                            </Badge>
                            <Badge variant="outline" className={priorityColors[model.priority]}>
                              {model.priority}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {model.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completion</span>
                          <span className="font-medium">{model.progress}%</span>
                        </div>
                        <Progress value={model.progress} className="h-2" />
                      </div>

                      {/* Features */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span>{model.completedFeatures}/{model.features} features</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{model.documents} docs</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                          <span>{model.comments}</span>
                        </div>
                      </div>

                      {/* Team & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center -space-x-2">
                          {teamMembers.slice(0, 3).map(member => (
                            <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs">{member.name.slice(0, 2)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {teamMembers.length > 3 && (
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                              +{teamMembers.length - 3}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                          View Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="features" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Backlog</CardTitle>
                <CardDescription>All features across product models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { name: "AI-Powered Recommendations", product: "E-Commerce Platform v2", status: "completed", priority: "high" },
                    { name: "Biometric Authentication", product: "Mobile Banking App", status: "in-progress", priority: "critical" },
                    { name: "Real-time Device Monitoring", product: "IoT Device Manager", status: "completed", priority: "high" },
                    { name: "Patient Analytics Dashboard", product: "Healthcare Dashboard", status: "pending", priority: "medium" },
                    { name: "One-Click Checkout", product: "E-Commerce Platform v2", status: "in-progress", priority: "high" },
                    { name: "Transaction History Export", product: "Mobile Banking App", status: "pending", priority: "low" },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          feature.status === "completed" ? "bg-success" :
                          feature.status === "in-progress" ? "bg-primary" : "bg-muted-foreground"
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{feature.name}</p>
                          <p className="text-xs text-muted-foreground">{feature.product}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={priorityColors[feature.priority]}>
                          {feature.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {feature.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest updates across all product models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback>{activity.user.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user.name}</span>
                          <span className="text-muted-foreground"> {activity.action} </span>
                          <span className="font-medium">{activity.target}</span>
                        </p>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
