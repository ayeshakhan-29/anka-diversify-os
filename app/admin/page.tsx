"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminStats } from "@/components/admin/admin-stats";
import { ActiveProjects } from "@/components/admin/active-projects";
import { UserInvitation } from "@/components/admin/user-invitation";
import { TeamOverview } from "@/components/admin/team-overview";
import { RecentTasks } from "@/components/admin/recent-tasks";
import { RecentUsers } from "@/components/admin/recent-users";
import { Users, FolderKanban, CheckCircle2, TrendingUp } from "lucide-react";

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

interface DashboardStats {
  totalUsers: number;
  activeProjects: number;
  completedTasks: number;
  projects: {
    id: string;
    name: string;
    phase: string | null;
    status: string;
    progress: number | null;
    githubUrl: string | null;
    memberCount: number;
  }[];
  recentTasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    projectId: string;
    projectName: string | null;
  }[];
  users: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    status: string;
  }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/admin/stats`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((json) => setStats(json.data))
      .catch(console.error);
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats ? stats.totalUsers.toString() : "—",
      change: "",
      trend: "up" as const,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Projects",
      value: stats ? stats.activeProjects.toString() : "—",
      change: "",
      trend: "up" as const,
      icon: FolderKanban,
      color: "text-accent",
    },
    {
      title: "Completed Tasks",
      value: stats ? stats.completedTasks.toString() : "—",
      change: "",
      trend: "up" as const,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      title: "Team Members",
      value: stats ? stats.users.length.toString() : "—",
      change: "",
      trend: "up" as const,
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your projects, team, and system settings
          </p>
        </div>

        <AdminStats stats={statCards} />

        <div className="grid gap-6 md:grid-cols-3">
          <ActiveProjects projects={stats?.projects ?? []} />

          <div className="space-y-6">
            <UserInvitation recentUsers={stats?.users ?? []} />
            <TeamOverview users={stats?.users ?? []} />
          </div>
        </div>

        <RecentTasks tasks={stats?.recentTasks ?? []} />
      </div>
    </MainLayout>
  );
}
