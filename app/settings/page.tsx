"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/AuthContext";
import { Sun, Moon, Shield, User } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={user?.name || ""} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} readOnly className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={user?.role || ""} readOnly className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Toggle between dark and light mode</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
