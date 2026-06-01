"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
}

interface TeamOverviewProps {
  users: UserRow[];
}

export function TeamOverview({ users }: TeamOverviewProps) {
  const onlineCount = users.filter((u) => u.status === "active").length;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Team Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {onlineCount}/{users.length}
            </p>
            <p className="text-sm text-muted-foreground">Active members</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          {users.map((user) => {
            const initials = (user.name ?? user.email)
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
              >
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-secondary text-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                      user.status === "active" ? "bg-success" : "bg-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{user.name ?? user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${
                    user.status === "active"
                      ? "border-success text-success"
                      : "border-muted-foreground text-muted-foreground"
                  }`}
                >
                  {user.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
