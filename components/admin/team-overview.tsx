"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { teamMembers } from "@/lib/mock-data";

export function TeamOverview() {
  const onlineMembers = teamMembers.filter((m) => m.status === "online").length;

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
              {onlineMembers}/{teamMembers.length}
            </p>
            <p className="text-sm text-muted-foreground">Members online</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
            <div className="h-3 w-3 rounded-full bg-success animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary/50"
            >
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-secondary text-foreground text-xs">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
                    member.status === "online"
                      ? "bg-success"
                      : member.status === "away"
                      ? "bg-warning"
                      : "bg-muted-foreground"
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${
                  member.status === "online"
                    ? "border-success text-success"
                    : member.status === "away"
                    ? "border-warning text-warning"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {member.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
