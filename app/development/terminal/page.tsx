"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { TerminalPanel } from "@/components/project/terminal-panel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Terminal, Loader2 } from "lucide-react"
import { projectApi } from "@/lib/project-api"
import type { Project } from "@/lib/types"

const LAST_TERMINAL_PROJECT_KEY = "last-terminal-project-id"

export default function TerminalPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  useEffect(() => {
    projectApi
      .getAll()
      .then((all) => {
        setProjects(all)
        const remembered = sessionStorage.getItem(LAST_TERMINAL_PROJECT_KEY)
        const initial = all.find((p) => p.id === remembered)?.id || all[0]?.id || null
        setSelectedProjectId(initial)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    sessionStorage.setItem(LAST_TERMINAL_PROJECT_KEY, projectId)
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Terminal</h1>
          </div>
          {!loading && projects.length > 0 && (
            <Select value={selectedProjectId || undefined} onValueChange={handleSelect}>
              <SelectTrigger className="w-56 h-8 text-sm">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex-1 min-h-0 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : !selectedProjectId ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Terminal className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm">No projects yet. Create a project to open a terminal session.</p>
            </div>
          ) : (
            <div className="h-full rounded-lg overflow-hidden border">
              <TerminalPanel projectId={selectedProjectId} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
