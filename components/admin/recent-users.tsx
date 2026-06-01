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
  createdAt: string;
}

interface RecentUsersProps {
  users: UserRow[];
}

const roleColors: Record<string, string> = {
  admin: "bg-destructive/20 text-destructive",
  manager: "bg-primary/20 text-primary",
  developer: "bg-accent/20 text-accent-foreground",
  designer: "bg-chart-4/20 text-chart-4",
  tester: "bg-warning/20 text-warning",
  user: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "border-success text-success",
  invited: "border-warning text-warning",
  inactive: "border-muted-foreground text-muted-foreground",
};

export function RecentUsers({ users }: RecentUsersProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Recent Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Member</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Role</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map((user) => {
                const initials = (user.name ?? user.email)
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <tr key={user.id} className="border-b border-border/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary text-foreground text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{user.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={`text-xs ${roleColors[user.role] ?? ""}`}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline" className={`text-xs ${statusColors[user.status] ?? ""}`}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
