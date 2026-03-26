"use client"

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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { departments, projects } from "@/lib/mock-data"
import Link from "next/link"

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

export default function DepartmentsPage() {
  const totalMembers = departments.reduce((sum, d) => sum + d.members.length, 0)
  const totalProjects = projects.filter((p) => p.status === "active").length

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Departments Overview</h2>
            <p className="text-sm text-muted-foreground">
              Manage organizational structure and team assignments
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>
                  Add a new department to your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="deptName">Department Name</Label>
                  <Input id="deptName" placeholder="e.g., Engineering" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deptDesc">Description</Label>
                  <Textarea id="deptDesc" placeholder="Department description" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Create Department</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Departments Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {departments.map((dept) => {
            const Icon = departmentIcons[dept.name] || FolderKanban
            const colorClass = departmentColors[dept.name] || "bg-muted text-muted-foreground"
            const activeProjects = dept.projects.filter((p) => p.status === "active").length

            return (
              <Card key={dept.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {dept.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{dept.description}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Department Head */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {dept.head.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{dept.head.name}</p>
                        <p className="text-xs text-muted-foreground">Department Head</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {dept.head.role}
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-xs">Members</span>
                      </div>
                      <p className="text-xl font-semibold text-foreground mt-1">
                        {dept.members.length}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FolderKanban className="h-4 w-4" />
                        <span className="text-xs">Projects</span>
                      </div>
                      <p className="text-xl font-semibold text-foreground mt-1">
                        {activeProjects}
                      </p>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Team Members</p>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {dept.members.slice(0, 4).map((member) => (
                          <Avatar key={member.id} className="h-8 w-8 border-2 border-card">
                            <AvatarFallback className="bg-secondary text-foreground text-xs">
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {dept.members.length > 4 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-xs font-medium text-muted-foreground">
                            +{dept.members.length - 4}
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="ml-auto text-xs">
                        View All <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Recent Projects */}
                  {dept.projects.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recent Projects</p>
                      <div className="space-y-2">
                        {dept.projects.slice(0, 2).map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {project.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={project.progress} className="h-1 flex-1" />
                                <span className="text-xs text-muted-foreground">
                                  {project.progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    <Link href={`/${dept.name.toLowerCase().replace(" ", "-")}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        View Dashboard
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}
