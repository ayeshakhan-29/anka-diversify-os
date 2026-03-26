"use client"

import { useState, useRef, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Terminal,
  Plus,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TerminalLine {
  id: string
  type: "input" | "output" | "error" | "success"
  content: string
  timestamp: Date
}

interface TerminalTab {
  id: string
  name: string
  lines: TerminalLine[]
  currentInput: string
}

const initialLines: TerminalLine[] = [
  {
    id: "1",
    type: "output",
    content: "Welcome to Anka Terminal v1.0.0",
    timestamp: new Date(),
  },
  {
    id: "2",
    type: "output",
    content: "Type 'help' for available commands",
    timestamp: new Date(),
  },
  {
    id: "3",
    type: "input",
    content: "npm run dev",
    timestamp: new Date(),
  },
  {
    id: "4",
    type: "success",
    content: "   VITE v5.0.12  ready in 342 ms",
    timestamp: new Date(),
  },
  {
    id: "5",
    type: "output",
    content: "   -> Local:   http://localhost:3000/",
    timestamp: new Date(),
  },
  {
    id: "6",
    type: "output",
    content: "   -> Network: http://192.168.1.100:3000/",
    timestamp: new Date(),
  },
]

const commands: Record<string, (args: string[]) => TerminalLine[]> = {
  help: () => [
    {
      id: Date.now().toString(),
      type: "output",
      content: `Available commands:
  help          Show this help message
  clear         Clear terminal output
  ls            List files in current directory
  pwd           Print working directory
  git status    Show git status
  npm run       Run npm scripts
  echo          Print text`,
      timestamp: new Date(),
    },
  ],
  clear: () => [],
  ls: () => [
    {
      id: Date.now().toString(),
      type: "output",
      content: `app/           components/    lib/           node_modules/
package.json   tailwind.config.ts   tsconfig.json  README.md`,
      timestamp: new Date(),
    },
  ],
  pwd: () => [
    {
      id: Date.now().toString(),
      type: "output",
      content: "/home/user/anka-diversify-os",
      timestamp: new Date(),
    },
  ],
  "git status": () => [
    {
      id: Date.now().toString(),
      type: "output",
      content: `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   app/development/page.tsx
  modified:   components/layout/sidebar.tsx

Untracked files:
  app/admin/users/`,
      timestamp: new Date(),
    },
  ],
  echo: (args) => [
    {
      id: Date.now().toString(),
      type: "output",
      content: args.join(" "),
      timestamp: new Date(),
    },
  ],
}

export default function TerminalPage() {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: "1", name: "Terminal 1", lines: initialLines, currentInput: "" },
  ])
  const [activeTab, setActiveTab] = useState("1")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const currentTab = tabs.find((t) => t.id === activeTab)!

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentTab?.lines])

  const handleCommand = (input: string) => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    const inputLine: TerminalLine = {
      id: Date.now().toString(),
      type: "input",
      content: trimmedInput,
      timestamp: new Date(),
    }

    const parts = trimmedInput.split(" ")
    const cmd = parts[0]
    const args = parts.slice(1)

    let outputLines: TerminalLine[] = []

    if (cmd === "clear") {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTab ? { ...tab, lines: [], currentInput: "" } : tab
        )
      )
      return
    }

    // Check for full command match first (like "git status")
    const fullCmd = trimmedInput.toLowerCase()
    if (commands[fullCmd]) {
      outputLines = commands[fullCmd](args)
    } else if (commands[cmd]) {
      outputLines = commands[cmd](args)
    } else if (trimmedInput.startsWith("npm")) {
      outputLines = [
        {
          id: Date.now().toString(),
          type: "output",
          content: `> anka-diversify-os@1.0.0 ${args.join(" ")}
> next dev

Ready in 1.2s`,
          timestamp: new Date(),
        },
        {
          id: (Date.now() + 1).toString(),
          type: "success",
          content: "Started development server",
          timestamp: new Date(),
        },
      ]
    } else {
      outputLines = [
        {
          id: Date.now().toString(),
          type: "error",
          content: `bash: ${cmd}: command not found`,
          timestamp: new Date(),
        },
      ]
    }

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTab
          ? { ...tab, lines: [...tab.lines, inputLine, ...outputLines], currentInput: "" }
          : tab
      )
    )
  }

  const addTab = () => {
    const newId = (tabs.length + 1).toString()
    setTabs((prev) => [
      ...prev,
      {
        id: newId,
        name: `Terminal ${newId}`,
        lines: [
          {
            id: Date.now().toString(),
            type: "output",
            content: "New terminal session",
            timestamp: new Date(),
          },
        ],
        currentInput: "",
      },
    ])
    setActiveTab(newId)
  }

  const closeTab = (id: string) => {
    if (tabs.length === 1) return
    const newTabs = tabs.filter((t) => t.id !== id)
    setTabs(newTabs)
    if (activeTab === id) {
      setActiveTab(newTabs[0].id)
    }
  }

  const clearTerminal = () => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === activeTab ? { ...tab, lines: [] } : tab))
    )
  }

  return (
    <MainLayout breadcrumb={["Development", "Terminal"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Terminal</h2>
            <p className="text-sm text-muted-foreground">
              Execute commands and scripts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="bash">
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bash">Bash</SelectItem>
                <SelectItem value="zsh">Zsh</SelectItem>
                <SelectItem value="powershell">PowerShell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Terminal */}
        <Card
          className={cn(
            "bg-[#0d1117] border-border overflow-hidden",
            isFullscreen && "fixed inset-4 z-50"
          )}
        >
          {/* Terminal Tabs */}
          <div className="flex items-center justify-between border-b border-border bg-[#161b22] px-2">
            <div className="flex items-center gap-1 py-1">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-t text-sm cursor-pointer transition-colors",
                    activeTab === tab.id
                      ? "bg-[#0d1117] text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Terminal className="h-3 w-3" />
                  <span>{tab.name}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        closeTab(tab.id)
                      }}
                      className="opacity-0 hover:opacity-100 group-hover:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={addTab}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={clearTerminal}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Terminal Content */}
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              className={cn(
                "font-mono text-sm p-4 overflow-y-auto",
                isFullscreen ? "h-[calc(100vh-8rem)]" : "h-[500px]"
              )}
            >
              {currentTab.lines.map((line) => (
                <div key={line.id} className="flex items-start gap-2 mb-1">
                  {line.type === "input" && (
                    <span className="text-success shrink-0">$</span>
                  )}
                  <span
                    className={cn(
                      "whitespace-pre-wrap",
                      line.type === "input" && "text-foreground",
                      line.type === "output" && "text-muted-foreground",
                      line.type === "error" && "text-destructive",
                      line.type === "success" && "text-success"
                    )}
                  >
                    {line.content}
                  </span>
                </div>
              ))}

              {/* Input Line */}
              <div className="flex items-center gap-2">
                <span className="text-success shrink-0">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={currentTab.currentInput}
                  onChange={(e) =>
                    setTabs((prev) =>
                      prev.map((tab) =>
                        tab.id === activeTab
                          ? { ...tab, currentInput: e.target.value }
                          : tab
                      )
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCommand(currentTab.currentInput)
                    }
                  }}
                  className="flex-1 bg-transparent text-foreground outline-none"
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Commands */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-foreground">
              Quick Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["npm run dev", "npm run build", "git status", "git pull", "npm test", "ls -la"].map(
                (cmd) => (
                  <Button
                    key={cmd}
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => {
                      setTabs((prev) =>
                        prev.map((tab) =>
                          tab.id === activeTab ? { ...tab, currentInput: cmd } : tab
                        )
                      )
                      inputRef.current?.focus()
                    }}
                  >
                    <ChevronRight className="h-3 w-3 mr-1" />
                    {cmd}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
