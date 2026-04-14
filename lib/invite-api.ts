const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

function authHeaders() {
  const token = localStorage.getItem("authToken");
  const userStr = localStorage.getItem("user");
  const userId = userStr ? JSON.parse(userStr).id : "demo-user-id";
  return {
    "Content-Type": "application/json",
    "X-User-ID": userId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface InviteRecord {
  id: string;
  email: string;
  role: string;
  department?: string;
  token: string;
  inviteLink: string;
  acceptedAt?: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string };
}

export interface TeamUser {
  id: string;
  name?: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  createdAt: string;
}

export const inviteApi = {
  async createInvite(payload: { email: string; role: string; department?: string }): Promise<InviteRecord & { inviteLink: string }> {
    const res = await fetch(`${BASE_URL}/invites`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create invite");
    return json.data;
  },

  async listInvites(): Promise<InviteRecord[]> {
    const res = await fetch(`${BASE_URL}/invites`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json.data;
  },

  async revokeInvite(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/invites/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to revoke invite");
  },

  async validateToken(token: string) {
    const res = await fetch(`${BASE_URL}/invites/validate/${token}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json.data as { email: string; role: string; department?: string; invitedBy: string; expiresAt: string };
  },

  async acceptInvite(token: string, payload: { name: string; password: string }) {
    const res = await fetch(`${BASE_URL}/invites/accept/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json.data as { token: string; user: TeamUser };
  },

  async listUsers(): Promise<TeamUser[]> {
    const res = await fetch(`${BASE_URL}/invites/users`, { headers: authHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json.data;
  },

  async updateUser(id: string, data: { role?: string; department?: string; status?: string }): Promise<TeamUser> {
    const res = await fetch(`${BASE_URL}/invites/users/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    return json.data;
  },

  async removeUser(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/invites/users/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to remove user");
  },
};
