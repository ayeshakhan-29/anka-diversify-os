"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { AdminStats } from "@/components/admin/admin-stats";
import { ActiveProjects } from "@/components/admin/active-projects";
import { UserInvitation } from "@/components/admin/user-invitation";
import { TeamOverview } from "@/components/admin/team-overview";
import { RecentTasks } from "@/components/admin/recent-tasks";
import {
  Users,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { users } from "@/lib/mock-data";

const stats = [
  {
    title: "Total Users",
    value: users.length.toString(),
    change: "+12%",
    trend: "up" as const,
    icon: Users,
    color: "text-primary",
  },
  {
    title: "Active Projects",
    value: "3",
    change: "+3",
    trend: "up" as const,
    icon: FolderKanban,
    color: "text-accent",
  },
  {
    title: "Completed Tasks",
    value: "24",
    change: "+18",
    trend: "up" as const,
    icon: CheckCircle2,
    color: "text-success",
  },
  {
    title: "Team Productivity",
    value: "94%",
    change: "+5%",
    trend: "up" as const,
    icon: TrendingUp,
    color: "text-warning",
  },
];

export default function AdminPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your projects, team, and system settings
          </p>
        </div>

        {/* Stats Overview */}
        <AdminStats stats={stats} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Active Projects */}
          <ActiveProjects />

          {/* Right Column */}
          <div className="space-y-6">
            {/* User Invitation */}
            <UserInvitation />

            {/* Team Overview */}
            <TeamOverview />
          </div>
        </div>

        {/* Recent Tasks */}
        <RecentTasks />
      </div>
    </MainLayout>
  );
}
