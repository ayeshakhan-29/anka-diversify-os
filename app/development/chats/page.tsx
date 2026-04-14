"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Users, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { projectApi } from "@/lib/project-api"
import type { Project, ProjectChatMessage } from "@/lib/types"

function getCurrentUser() {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem("user") || "{}") } catch { return null }
}

export default function ChatsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [messages, setMessages] = useState<ProjectChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    projectApi.getAll()
      .then((p) => { setProjects(p); if (p.length > 0) setActiveProject(p[0]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const refreshMessages = useCallback(() => {
    if (!activeProject) return
    projectApi.getChatMessages(activeProject.id).then((msgs) => {
      setMessages(msgs)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }).catch(() => {})
  }, [activeProject])

  useEffect(() => {
    if (!activeProject) return
    setMessages([])
    refreshMessages()
    pollRef.current = setInterval(refreshMessages, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeProject, refreshMessages])

  const handleSend = async () => {
    if (!input.trim() || !activeProject || sending) return
    const content = input.trim()
    setInput("")
    setSending(true)
    try {
      const msg = await projectApi.sendChatMessage(activeProject.id, content)
      setMessages((prev) => [...prev, msg])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    } catch { setInput(content) }
    finally { setSending(false) }
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const currentUser = getCurrentUser()

  return (
    <MainLayout breadcrumb={["Development", "Project Chats"]}>
      <div className="flex gap-4 h-[calc(100vh-10rem)]">

        {/* ── Sidebar ── */}
        <div className="w-72 shrink-0 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b shrink-0 pb-3">
              <CardTitle className="text-base">Project Chats</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-2">
              {loading ? (
                <p className="text-sm text-muted-foreground p-3">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3">No projects found.</p>
              ) : (
                <div className="space-y-1">
                  {filtered.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => setActiveProject(project)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                        activeProject?.id === project.id
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{project.phase}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* ── Main Chat ── */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col overflow-hidden">
            {activeProject ? (
              <>
                {/* Header */}
                <CardHeader className="border-b shrink-0 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{activeProject.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{activeProject.phase} · {activeProject.status}</p>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.userId === currentUser?.id
                        return (
                          <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-xs">
                                {msg.userName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                              {!isMe && (
                                <span className="text-xs text-muted-foreground mb-1">{msg.userName}</span>
                              )}
                              <div className={cn(
                                "px-3 py-2 rounded-2xl text-sm",
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : "bg-muted rounded-tl-sm"
                              )}>
                                {msg.content}
                              </div>
                              <span className="text-xs text-muted-foreground mt-1">
                                {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                                  hour: "numeric", minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="border-t p-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Message ${activeProject.name}…`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon" className="h-9 w-9">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                {loading ? "Loading projects…" : "Select a project to start chatting"}
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
