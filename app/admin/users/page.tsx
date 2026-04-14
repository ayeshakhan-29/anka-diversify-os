"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Plus, MoreHorizontal, Trash2, Link2, Copy, Check, UserPlus, Clock } from "lucide-react";
import { inviteApi, type TeamUser, type InviteRecord } from "@/lib/invite-api";

const roleColors: Record<string, string> = {
  admin: "bg-destructive/20 text-destructive",
  manager: "bg-primary/20 text-primary",
  developer: "bg-accent/20 text-accent-foreground",
  designer: "bg-chart-4/20 text-chart-4",
  tester: "bg-warning/20 text-warning",
  user: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success",
  invited: "bg-warning/20 text-warning",
  inactive: "bg-muted text-muted-foreground",
};

const ROLES = ["developer", "designer", "tester", "manager", "admin"];
const DEPARTMENTS = ["development", "testing", "design", "management", "marketing"];

export default function UsersPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Invite dialog
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "developer", department: "development" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Remove user dialog
  const [userToRemove, setUserToRemove] = useState<TeamUser | null>(null);

  useEffect(() => {
    Promise.all([inviteApi.listUsers(), inviteApi.listInvites()])
      .then(([u, i]) => { setUsers(u); setInvites(i); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleInvite = async () => {
    if (!inviteForm.email) return;
    setInviting(true);
    setInviteError(null);
    try {
      const result = await inviteApi.createInvite(inviteForm);
      setCreatedLink(result.inviteLink);
      setInvites((prev) => [result as any, ...prev]);
    } catch (e: any) {
      setInviteError(e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevokeInvite = async (id: string) => {
    await inviteApi.revokeInvite(id).catch(() => {});
    setInvites((prev) => prev.filter((i) => i.id !== id));
  };

  const handleRemoveUser = async () => {
    if (!userToRemove) return;
    await inviteApi.removeUser(userToRemove.id).catch(() => {});
    setUsers((prev) => prev.filter((u) => u.id !== userToRemove.id));
    setUserToRemove(null);
  };

  const filtered = users.filter((u) =>
    search === "" ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const pendingInvites = invites.filter((i) => !i.acceptedAt);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Members</h1>
            <p className="text-muted-foreground text-sm">Manage your team and send invitations</p>
          </div>
          <Button className="gap-2" onClick={() => { setIsInviteOpen(true); setCreatedLink(null); setInviteError(null); }}>
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>

        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Members ({users.length})</TabsTrigger>
            <TabsTrigger value="invites">
              Pending Invites
              {pendingInvites.length > 0 && (
                <span className="ml-2 bg-warning text-warning-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {pendingInvites.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Members tab ── */}
          <TabsContent value="members" className="mt-4">
            <div className="mb-4 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No members yet. Invite your first team member.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">Member</th>
                        <th className="text-left py-3 px-4 font-medium">Role</th>
                        <th className="text-left py-3 px-4 font-medium">Department</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Joined</th>
                        <th className="py-3 px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {(user.name || user.email).slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{user.name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={roleColors[user.role] || ""}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm capitalize">{user.department || "—"}</span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={statusColors[user.status] || ""}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setUserToRemove(user)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Pending invites tab ── */}
          <TabsContent value="invites" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {pendingInvites.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No pending invites.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-3 px-4 font-medium">Email</th>
                        <th className="text-left py-3 px-4 font-medium">Role</th>
                        <th className="text-left py-3 px-4 font-medium">Department</th>
                        <th className="text-left py-3 px-4 font-medium">Expires</th>
                        <th className="py-3 px-4" />
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInvites.map((invite) => (
                        <tr key={invite.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-warning" />
                              <span className="text-sm">{invite.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={roleColors[invite.role] || ""}>
                              {invite.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm capitalize">{invite.department || "—"}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {new Date(invite.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title="Copy invite link"
                                onClick={() => handleCopyLink(`${window.location.origin}/invite/${invite.token}`)}
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                title="Revoke invite"
                                onClick={() => handleRevokeInvite(invite.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Invite Dialog ── */}
      <Dialog open={isInviteOpen} onOpenChange={(o) => { if (!o) { setIsInviteOpen(false); setCreatedLink(null); } }}>
        <DialogContent className="sm:max-w-125">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Generate an invite link to share with your team member.</DialogDescription>
          </DialogHeader>

          {!createdLink ? (
            <>
              <div className="flex flex-col gap-4 py-2">
                {inviteError && (
                  <Alert variant="destructive">
                    <AlertDescription>{inviteError}</AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Department</label>
                    <Select value={inviteForm.department} onValueChange={(v) => setInviteForm((f) => ({ ...f, department: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteForm.email}>
                  {inviting ? "Generating…" : "Generate Invite Link"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-lg">
                <Check className="h-4 w-4 text-success shrink-0" />
                <p className="text-sm text-success">Invite link generated! Share it with your team member.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Invite Link</label>
                <div className="flex gap-2">
                  <Input value={createdLink} readOnly className="text-xs text-muted-foreground" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleCopyLink(createdLink)}
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Link expires in 7 days. Share via Slack, email, or any messenger.</p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setIsInviteOpen(false); setCreatedLink(null); }}>Done</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Remove user confirm ── */}
      <Dialog open={!!userToRemove} onOpenChange={(o) => { if (!o) setUserToRemove(null); }}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Remove <strong>{userToRemove?.name || userToRemove?.email}</strong> from the team? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToRemove(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRemoveUser}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
