"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Plus,
  Send,
  Hash,
  Users,
  Settings,
  Bell,
  Pin,
  MoreHorizontal,
  Paperclip,
  Smile,
  AtSign,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { projects, teamMembers } from "@/lib/mock-data"

interface ChatRoom {
  id: string
  name: string
  projectId: string
  type: "project" | "general" | "direct"
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  members: typeof teamMembers
  isPinned: boolean
}

interface ChatMessage {
  id: string
  sender: (typeof teamMembers)[0]
  content: string
  timestamp: string
  reactions?: { emoji: string; count: number }[]
}

const chatRooms: ChatRoom[] = [
  {
    id: "ch1",
    name: "general",
    projectId: "",
    type: "general",
    lastMessage: "Great work on the latest release!",
    lastMessageTime: "10:45 AM",
    unreadCount: 3,
    members: teamMembers.slice(0, 4),
    isPinned: true,
  },
  {
    id: "ch2",
    name: "Anka Platform v2.0",
    projectId: "p1",
    type: "project",
    lastMessage: "The auth module is ready for review",
    lastMessageTime: "9:30 AM",
    unreadCount: 5,
    members: teamMembers.slice(0, 3),
    isPinned: true,
  },
  {
    id: "ch3",
    name: "Marketing Campaign Q2",
    projectId: "p2",
    type: "project",
    lastMessage: "Design assets uploaded",
    lastMessageTime: "Yesterday",
    unreadCount: 0,
    members: teamMembers.slice(3, 5),
    isPinned: false,
  },
  {
    id: "ch4",
    name: "Mobile App Redesign",
    projectId: "p3",
    type: "project",
    lastMessage: "User research findings shared",
    lastMessageTime: "Yesterday",
    unreadCount: 2,
    members: teamMembers.slice(1, 4),
    isPinned: false,
  },
]

const mockMessages: ChatMessage[] = [
  {
    id: "m1",
    sender: teamMembers[1],
    content: "Hey team, I've finished the initial designs for the dashboard. Can everyone take a look?",
    timestamp: "9:15 AM",
    reactions: [{ emoji: "thumbs-up", count: 3 }],
  },
  {
    id: "m2",
    sender: teamMembers[0],
    content: "Looks great! I especially like the navigation layout. A few thoughts:\n\n1. The sidebar could be collapsible\n2. Maybe add quick actions to the header\n3. Consider dark mode from the start",
    timestamp: "9:22 AM",
  },
  {
    id: "m3",
    sender: teamMembers[3],
    content: "Agreed with Alex's points. I'll start implementing the backend APIs today. Should have the auth endpoints ready by EOD.",
    timestamp: "9:28 AM",
    reactions: [{ emoji: "fire", count: 2 }],
  },
  {
    id: "m4",
    sender: teamMembers[2],
    content: "Perfect! I'll update the designs to include the collapsible sidebar. @alex can you share the icon set you mentioned?",
    timestamp: "9:30 AM",
  },
]

function ChatRoomItem({
  room,
  isActive,
  onClick,
}: {
  room: ChatRoom
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
        isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/50"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
          room.type === "general"
            ? "bg-accent/20"
            : room.type === "project"
            ? "bg-primary/20"
            : "bg-secondary"
        )}
      >
        {room.type === "general" ? (
          <Hash className="h-5 w-5 text-accent" />
        ) : room.type === "project" ? (
          <Users className="h-5 w-5 text-primary" />
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-foreground text-xs">
              {room.name[0]}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground truncate">{room.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {room.lastMessageTime}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{room.lastMessage}</p>
      </div>
      {room.unreadCount > 0 && (
        <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
          {room.unreadCount}
        </Badge>
      )}
    </button>
  )
}

export default function ChatsPage() {
  const [activeRoom, setActiveRoom] = useState<ChatRoom>(chatRooms[0])
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedRooms = filteredRooms.filter((room) => room.isPinned)
  const otherRooms = filteredRooms.filter((room) => !room.isPinned)

  return (
    <MainLayout breadcrumb={["Development", "Project Chats"]}>
      <div className="flex gap-6 h-[calc(100vh-10rem)]">
        {/* Sidebar - Chat Rooms */}
        <div className="w-80 shrink-0 flex flex-col">
          <Card className="flex-1 flex flex-col bg-card border-border overflow-hidden">
            <CardHeader className="border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Chats
                </CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-3">
              {/* Pinned */}
              {pinnedRooms.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <Pin className="h-3 w-3" />
                    PINNED
                  </div>
                  <div className="space-y-1">
                    {pinnedRooms.map((room) => (
                      <ChatRoomItem
                        key={room.id}
                        room={room}
                        isActive={activeRoom.id === room.id}
                        onClick={() => setActiveRoom(room)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Project Chats */}
              {otherRooms.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    PROJECT CHATS
                  </div>
                  <div className="space-y-1">
                    {otherRooms.map((room) => (
                      <ChatRoomItem
                        key={room.id}
                        room={room}
                        isActive={activeRoom.id === room.id}
                        onClick={() => setActiveRoom(room)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col bg-card border-border overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      activeRoom.type === "general"
                        ? "bg-accent/20"
                        : "bg-primary/20"
                    )}
                  >
                    {activeRoom.type === "general" ? (
                      <Hash className="h-5 w-5 text-accent" />
                    ) : (
                      <Users className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{activeRoom.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeRoom.members.length} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {mockMessages.map((message) => (
                  <div key={message.id} className="flex gap-3 group">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-secondary text-foreground text-sm">
                        {message.sender.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">
                          {message.sender.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {message.reactions.map((reaction, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-secondary"
                            >
                              {reaction.emoji === "thumbs-up" ? "👍" : "🔥"}{" "}
                              {reaction.count}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-4 shrink-0">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
                <div className="relative flex-1">
                  <Input
                    placeholder={`Message #${activeRoom.name}`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="pr-24"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button className="shrink-0" disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Members */}
        <div className="w-64 shrink-0 hidden xl:block">
          <Card className="h-full bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-foreground">
                Members ({activeRoom.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeRoom.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-foreground text-xs">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
                        member.status === "online"
                          ? "bg-success"
                          : member.status === "away"
                          ? "bg-warning"
                          : "bg-muted-foreground"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
