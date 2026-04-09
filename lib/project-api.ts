import type { Project, Task, ProjectFile } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const DEMO_USER_ID = "demo-user-id";

const headers = {
  "Content-Type": "application/json",
  "X-User-ID": DEMO_USER_ID,
};

// in-progress ↔ in_progress conversion
function toFrontendStatus(s: string): Task["status"] {
  if (s === "in_progress") return "in-progress";
  return s as Task["status"];
}
function toBackendStatus(s: string): string {
  if (s === "in-progress") return "in_progress";
  return s;
}

function mapTask(t: any, projectId: string): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description || "",
    status: toFrontendStatus(t.status),
    priority: t.priority as Task["priority"],
    projectId: t.projectId || projectId,
    phase: (t.phase || "development") as Task["phase"],
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : "",
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : "",
    tags: [],
  };
}

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
    tasks: (p.tasks || []).map((t: any) => mapTask(t, p.id)),
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

  // ── Tasks ──────────────────────────────────────────────────────────────────

  async getTasks(projectId: string): Promise<Task[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks`, { headers });
    if (!res.ok) throw new Error(`GET tasks failed: ${res.status}`);
    const { data } = await res.json();
    return (data as any[]).map((t) => mapTask(t, projectId));
  },

  async createTask(projectId: string, payload: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    phase?: string;
    dueDate?: string;
  }): Promise<Task> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...payload, status: payload.status ? toBackendStatus(payload.status) : undefined }),
    });
    if (!res.ok) throw new Error(`POST task failed: ${res.status}`);
    const { data } = await res.json();
    return mapTask(data, projectId);
  },

  async updateTask(projectId: string, taskId: string, payload: {
    status?: string;
    title?: string;
    description?: string;
    priority?: string;
    phase?: string;
    dueDate?: string;
  }): Promise<Task> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ ...payload, status: payload.status ? toBackendStatus(payload.status) : undefined }),
    });
    if (!res.ok) throw new Error(`PUT task failed: ${res.status}`);
    const { data } = await res.json();
    return mapTask(data, projectId);
  },

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error(`DELETE task failed: ${res.status}`);
  },

  async syncGithub(projectId: string, githubUrl: string): Promise<void> {
    await fetch(`${BASE_URL}/projects/${projectId}/sync-github`, {
      method: "POST",
      headers,
      body: JSON.stringify({ githubUrl }),
    });
  },

  // ── Files ──────────────────────────────────────────────────────────────────

  async getFiles(projectId: string): Promise<ProjectFile[]> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files`, { headers });
    if (!res.ok) throw new Error(`GET files failed: ${res.status}`);
    const { data } = await res.json();
    return data as ProjectFile[];
  },

  async uploadFile(projectId: string, file: File, opts: { phase?: string } = {}): Promise<ProjectFile> {
    // Step 1: get presigned S3 URL
    const presignRes = await fetch(`${BASE_URL}/projects/${projectId}/files/presign`, {
      method: "POST",
      headers,
      body: JSON.stringify({ filename: file.name, mimetype: file.type, phase: opts.phase }),
    });
    if (!presignRes.ok) throw new Error(`Presign failed: ${presignRes.status}`);
    const { data: { uploadUrl, fileUrl, key, type } } = await presignRes.json();

    // Step 2: upload directly to S3 (no auth headers — presigned URL handles it)
    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!s3Res.ok) throw new Error(`S3 upload failed: ${s3Res.status}`);

    // Step 3: confirm in DB
    const confirmRes = await fetch(`${BASE_URL}/projects/${projectId}/files/confirm`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: file.name,
        type,
        phase: opts.phase || "development",
        url: fileUrl,
        s3Key: key,
        size: file.size < 1024 ? `${file.size} B`
          : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB`
          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      }),
    });
    if (!confirmRes.ok) throw new Error(`Confirm failed: ${confirmRes.status}`);
    const { data } = await confirmRes.json();
    return data as ProjectFile;
  },

  async createFile(projectId: string, payload: {
    name: string;
    type?: string;
    phase?: string;
    url?: string;
    size?: string;
  }): Promise<ProjectFile> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`POST file failed: ${res.status}`);
    const { data } = await res.json();
    return data as ProjectFile;
  },

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/projects/${projectId}/files/${fileId}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error(`DELETE file failed: ${res.status}`);
  },
};
