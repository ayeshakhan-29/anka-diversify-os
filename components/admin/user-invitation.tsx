"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, CheckCircle2, AlertTriangle } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function getHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  return {
    "Content-Type": "application/json",
    "X-User-ID": user?.id || "demo-user-id",
    "X-User-Name": user?.name || "Demo User",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface UserInvitationProps {
  recentUsers?: UserRow[];
}

export function UserInvitation({ recentUsers = [] }: UserInvitationProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("developer");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInvite = async () => {
    if (!email || !name) return;
    setIsLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${BASE_URL}/admin/invite-user`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, name, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to invite user");
      setIsSuccess(true);
      setMessage(`User ${email} invited successfully`);
      setEmail("");
      setName("");
      setRole("developer");
    } catch (error: any) {
      setIsSuccess(false);
      setMessage(error.message || "Failed to send invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite Team Member
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={isSuccess ? "default" : "destructive"}>
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="email" className="mb-2">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="name" className="mb-2">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="role" className="mb-2">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="developer">Developer</option>
              <option value="designer">Designer</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <Button
            onClick={handleInvite}
            disabled={!email || !name || isLoading}
            className="w-full"
          >
            {isLoading ? "Inviting..." : "Invite User"}
          </Button>
        </div>

        {/* Recent Users */}
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-3">Recent Users</h4>
          <div className="space-y-2">
            {recentUsers.slice(0, 3).map((user) => {
              const initials = (user.name ?? user.email)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-foreground text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              );
            })}
            {recentUsers.length === 0 && (
              <p className="text-xs text-muted-foreground">No users yet.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
