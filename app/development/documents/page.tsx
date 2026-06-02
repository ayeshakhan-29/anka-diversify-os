"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  Presentation,
  Palette,
  Code,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Edit,
  Eye,
  Grid3X3,
  List,
  Filter,
  Upload,
  File as FileIcon,
  Image as ImageIcon,
  Loader2,
} from "lucide-react"
import { projectApi } from "@/lib/project-api"
import type { ProjectFile, Project } from "@/lib/types"
import { cn } from "@/lib/utils"

const typeIcons = {
  doc: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  design: Palette,
  code: Code,
  image: ImageIcon,
  other: FileIcon,
}

const typeColors = {
  doc: "bg-[#D9EAFD] text-primary dark:bg-primary/20",
  spreadsheet: "bg-success/20 text-success",
  presentation: "bg-warning/20 text-warning",
  design: "bg-[#D9EAFD] text-chart-4 dark:bg-chart-4/20",
  code: "bg-[#D9EAFD] text-primary dark:bg-accent/20",
  image: "bg-purple-100 text-purple-600 dark:bg-purple-900/20",
  other: "bg-gray-100 text-gray-600 dark:bg-gray-800/20",
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

type DocumentWithProject = ProjectFile & { projectName: string }

function DocumentCard({ document, view, onDelete }: { document: DocumentWithProject; view: "grid" | "list"; onDelete: () => void }) {
  const Icon = typeIcons[document.type as keyof typeof typeIcons] || FileIcon
  const colorClass = typeColors[document.type as keyof typeof typeColors] || typeColors.other
  const [opening, setOpening] = useState(false)

  const handleOpen = async () => {
    if (opening) return
    setOpening(true)
    try {
      const url = await projectApi.getFileDownloadUrl(document.projectId, document.id)
      window.open(url, "_blank")
    } catch (error) {
      console.error("Failed to open document:", error)
      alert("Failed to open document")
    } finally {
      setOpening(false)
    }
  }

  if (view === "list") {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{document.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="capitalize">{document.type}</span>
            <span>/</span>
            <span>{document.projectName}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground hidden md:block">
          {formatDate(document.updatedAt)}
        </div>
        <div className="text-sm text-muted-foreground hidden lg:block">
          {document.size || "—"}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {document.url && (
              <DropdownMenuItem onClick={handleOpen} disabled={opening}>
                <Eye className="h-4 w-4 mr-2" />
                {opening ? "Opening..." : "View"}
              </DropdownMenuItem>
            )}
            {document.url && (
              <DropdownMenuItem onClick={handleOpen} disabled={opening}>
                <Download className="h-4 w-4 mr-2" />
                {opening ? "Opening..." : "Download"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", colorClass)}>
            <Icon className="h-6 w-6" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {document.url && (
                <DropdownMenuItem onClick={handleOpen} disabled={opening}>
                  <Eye className="h-4 w-4 mr-2" />
                  {opening ? "Opening..." : "View"}
                </DropdownMenuItem>
              )}
              {document.url && (
                <DropdownMenuItem onClick={handleOpen} disabled={opening}>
                  <Download className="h-4 w-4 mr-2" />
                  {opening ? "Opening..." : "Download"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-medium text-foreground truncate mb-1">{document.name}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <Badge variant="outline" className="capitalize text-xs">
            {document.type}
          </Badge>
          <span className="truncate">{document.projectName}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{document.size || "—"}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Modified {formatDate(document.updatedAt)}
        </p>
      </CardContent>
    </Card>
  )
}

export default function DocumentsPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [documents, setDocuments] = useState<DocumentWithProject[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [docs, projs] = await Promise.all([
        projectApi.getAllDocuments(),
        projectApi.getAll(),
      ])
      setDocuments(docs)
      setProjects(projs)
    } catch (error) {
      console.error("Failed to load documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedProjectId) return

    setUploading(true)
    try {
      await projectApi.uploadFile(selectedProjectId, selectedFile, {})
      await loadData()
      setIsUploadOpen(false)
      setSelectedFile(null)
      setSelectedProjectId("")
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: DocumentWithProject) => {
    if (!confirm(`Delete ${doc.name}?`)) return
    try {
      await projectApi.deleteFile(doc.projectId, doc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (error) {
      console.error("Delete failed:", error)
      alert("Failed to delete file")
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || doc.type === typeFilter
    return matchesSearch && matchesType
  })

  const stats = {
    total: documents.length,
    docs: documents.filter((d) => d.type === "doc").length,
    spreadsheets: documents.filter((d) => d.type === "spreadsheet").length,
    designs: documents.filter((d) => d.type === "design").length,
  }

  if (loading) {
    return (
      <MainLayout breadcrumb={["Development", "Documents"]}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout breadcrumb={["Development", "Documents"]}>
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Documents</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.docs}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Spreadsheets</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.spreadsheets}</p>
                </div>
                <FileSpreadsheet className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Designs</p>
                  <p className="text-2xl font-semibold text-foreground">{stats.designs}</p>
                </div>
                <Palette className="h-8 w-8 text-chart-4 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Documents</h2>
            <p className="text-sm text-muted-foreground">
              Manage project documentation and files
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload a new document to a project.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project (required)</Label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>File</Label>
                    <Input
                      type="file"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={uploading}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !selectedProjectId || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="doc">Documents</SelectItem>
                <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                <SelectItem value="presentation">Presentations</SelectItem>
                <SelectItem value="design">Designs</SelectItem>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center rounded-lg border border-border p-1">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Documents */}
        {view === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} view="grid" onDelete={() => handleDelete(doc)} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} view="list" onDelete={() => handleDelete(doc)} />
            ))}
          </div>
        )}

        {filteredDocuments.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No documents found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
