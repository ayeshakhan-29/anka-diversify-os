import type { Project, Task } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const DEMO_USER_ID = "demo-user-id";

const headers = {
  "Content-Type": "application/json",
  "X-User-ID": DEMO_USER_ID,
};

// Map backend project row → frontend Project shape
function mapProject(p: any): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description || "",
    phase: p.phase || "product-modeling",
    progress: p.progress ?? 0,
    priority: p.priority || "medium",
    status: p.status || "active",
    githubUrl: p.githubUrl || undefined,
    startDate: p.startDate ? new Date(p.startDate).toISOString() : new Date().toISOString(),
    dueDate: p.dueDate ? new Date(p.dueDate).toISOString() : new Date().toISOString(),
    team: [],   // populated from mock-data elsewhere if needed
    tasks: (p.tasks || []).map((t: any): Task => ({
      id: t.id,
      title: t.title,
      description: t.description || "",
      status: t.status === "in_progress" ? "in-progress" : t.status,
      priority: t.priority,
      projectId: t.projectId,
      phase: p.phase || "development",
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : "",
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : "",
      tags: [],
    })),
  };
}

export const projectApi = {
  async getAll(): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/projects`, { headers });
    if (!res.ok) throw new Error(`GET /projects failed: ${res.status}`);
    const { data } = await res.json();
    return (data as any[]).map(mapProject);
  },

  async create(payload: {
    name: string;
    description?: string;
    phase?: string;
    priority?: string;
    githubUrl?: string;
  }): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`POST /projects failed: ${res.status}`);
    const { data } = await res.json();
    return mapProject(data);
  },

  async getById(id: string): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, { headers });
    if (!res.ok) throw new Error(`GET /projects/${id} failed: ${res.status}`);
    const { data } = await res.json();
    return mapProject(data);
  },

  async update(
    id: string,
    payload: {
      name?: string;
      description?: string;
      phase?: string;
      priority?: string;
      githubUrl?: string;
      status?: string;
      dueDate?: string;
    },
  ): Promise<Project> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`PUT /projects/${id} failed: ${res.status}`);
    const { data } = await res.json();
    return mapProject(data);
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error(`DELETE /projects/${id} failed: ${res.status}`);
  },

  async syncGithub(projectId: string, githubUrl: string): Promise<void> {
    await fetch(`${BASE_URL}/projects/${projectId}/sync-github`, {
      method: "POST",
      headers,
      body: JSON.stringify({ githubUrl }),
    });
  },
};
