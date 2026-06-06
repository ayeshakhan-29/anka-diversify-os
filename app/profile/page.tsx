"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg">{user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{user?.role || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
