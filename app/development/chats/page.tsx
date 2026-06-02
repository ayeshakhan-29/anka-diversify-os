"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, Users, MessageSquare, Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { projectApi } from "@/lib/project-api"
import type { Project, ProjectChatMessage } from "@/lib/types"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

function getHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return { "Content-Type": "application/json", "X-User-ID": "demo-user-id" }
  }
  const token = localStorage.getItem("authToken")
  const userStr = localStorage.getItem("user")
  const user = userStr ? JSON.parse(userStr) : null
  return {
    "Content-Type": "application/json",
    "X-User-ID": user?.id || "demo-user-id",
    "X-User-Name": user?.name || "Demo User",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

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
  const [aiResponding, setAiResponding] = useState(false)
  const [search, setSearch] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const shouldAutoScrollRef = useRef(true)

  useEffect(() => {
    projectApi.getAll()
      .then((p) => { 
        setProjects(p)
        if (p.length > 0) setActiveProject(p[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  const refreshMessages = useCallback(() => {
    if (!activeProject) return
    projectApi.getChatMessages(activeProject.id).then((msgs) => {
      const hadNewMessages = msgs.length > prevMessageCountRef.current
      setMessages(msgs)
      prevMessageCountRef.current = msgs.length
      
      // Only auto-scroll if we had new messages
      if (hadNewMessages) {
        setTimeout(scrollToBottom, 100)
      }
    }).catch(() => {})
  }, [activeProject, scrollToBottom])

  useEffect(() => {
    if (!activeProject) return
    setMessages([])
    prevMessageCountRef.current = 0
    shouldAutoScrollRef.current = true
    refreshMessages()
    pollRef.current = setInterval(refreshMessages, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [activeProject, refreshMessages])

  // Detect if user is scrolling up (disable auto-scroll)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50
    shouldAutoScrollRef.current = isAtBottom
  }

  const handleSend = async () => {
    if (!input.trim() || !activeProject || sending) return
    const content = input.trim()
    setInput("")
    setSending(true)
    shouldAutoScrollRef.current = true // Enable auto-scroll when sending
    
    try {
      // Send user message
      const msg = await projectApi.sendChatMessage(activeProject.id, content)
      setMessages((prev) => [...prev, msg])
      prevMessageCountRef.current += 1
      setTimeout(scrollToBottom, 50)
      
      // Check if message is asking AI (starts with @ai or contains question words)
      const isAiQuestion = content.toLowerCase().startsWith("@ai") || 
                          content.includes("?") ||
                          /\b(what|how|why|when|where|who|can|could|should|would|is|are|does|do)\b/i.test(content)
      
      if (isAiQuestion) {
        setAiResponding(true)
        try {
          // Call AI endpoint
          const aiRes = await fetch(`${BASE_URL}/ai/projects/${activeProject.id}/chat`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ 
              message: content.replace(/^@ai\s*/i, "").trim() 
            }),
          })
          
          if (aiRes.ok) {
            const aiData = await aiRes.json()
            
            // Create a special AI user message
            const aiUserMessage = {
              projectId: activeProject.id,
              userId: "ai-assistant",
              userName: "AI Assistant",
              content: aiData.message,
              createdAt: new Date().toISOString(),
            }
            
            // Optimistically add AI message
            setMessages((prev) => [...prev, { id: `temp-ai-${Date.now()}`, ...aiUserMessage } as ProjectChatMessage])
            prevMessageCountRef.current += 1
            setTimeout(scrollToBottom, 50)
            
            // Save to backend (but the backend will use the actual user, so we show it as AI in UI)
            try {
              await projectApi.sendChatMessage(
                activeProject.id, 
                `[AI Assistant]: ${aiData.message}`
              )
            } catch (error) {
              console.error("Failed to save AI message:", error)
            }
          }
        } catch (error) {
          console.error("AI response error:", error)
        } finally {
          setAiResponding(false)
        }
      }
    } catch { 
      setInput(content) 
    } finally { 
      setSending(false) 
    }
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const currentUser = getCurrentUser()

  return (
    <MainLayout breadcrumb={["Development", "Project Chats"]}>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)]">

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-72 shrink-0">
          <Card className="h-full flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto p-2">
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D9EAFD] dark:bg-primary/20 shrink-0">
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
            </div>
          </Card>
        </div>

        {/* ── Main Chat ── */}
        <div className="flex-1 min-w-0">
          <Card className="h-full flex flex-col overflow-hidden">
            {activeProject ? (
              <>
                {/* Header */}
                <CardHeader className="border-b shrink-0 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D9EAFD] dark:bg-primary/20">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{activeProject.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{activeProject.phase} · {activeProject.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bot className="h-4 w-4" />
                      <span className="hidden sm:inline">AI Assistant Active</span>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                        <p className="text-sm">No messages yet. Start the conversation!</p>
                        <p className="text-xs mt-2">Tip: Ask questions to get AI assistance</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.userId === currentUser?.id
                        // Check if message is from AI or contains AI prefix
                        const isAI = msg.userId === "ai-assistant" || 
                                    msg.userName.toLowerCase() === "ai assistant" ||
                                    msg.content.startsWith("[AI Assistant]:")
                        
                        // Clean AI content if it has the prefix
                        const displayContent = msg.content.replace(/^\[AI Assistant\]:\s*/, "")
                        
                        return (
                          <div key={msg.id} className={`flex gap-3 ${isMe && !isAI ? "flex-row-reverse" : ""}`}>
                            <Avatar className="h-8 w-8 shrink-0">
                              {isAI ? (
                                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                                  <Bot className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {msg.userName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className={`max-w-[75%] flex flex-col ${isMe && !isAI ? "items-end" : "items-start"}`}>
                              {(!isMe || isAI) && (
                                <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                                  {isAI && <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />}
                                  {isAI ? "AI Assistant" : msg.userName}
                                </span>
                              )}
                              <div className={cn(
                                "px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm",
                                isMe && !isAI
                                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                                  : isAI
                                  ? "bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200/50 dark:border-purple-800/50 rounded-tl-sm text-foreground"
                                  : "bg-muted rounded-tl-sm"
                              )}>
                                {displayContent}
                              </div>
                              <span className="text-xs text-muted-foreground mt-1.5">
                                {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                                  hour: "numeric", minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                    
                    {aiResponding && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        </Avatar>
                        <div className="max-w-[75%] flex flex-col items-start">
                          <span className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                            AI Assistant
                          </span>
                          <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200/50 dark:border-purple-800/50 flex items-center gap-2 shadow-sm">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600 dark:text-purple-400" />
                            <span className="text-muted-foreground">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input */}
                <div className="border-t p-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Ask about ${activeProject.name} or chat with team...`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      className="flex-1"
                      disabled={sending || aiResponding}
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={sending || aiResponding || !input.trim()} 
                      size="icon" 
                      className="h-9 w-9 shrink-0"
                    >
                      {sending || aiResponding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Start with @ai or ask questions to get AI assistance about the project
                  </p>
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
