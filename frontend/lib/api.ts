import {
  AIStatus,
  DashboardData,
  DocumentItem,
  DocumentAnalysisResult,
  TaskItem,
  StudyPlan,
  StudyPlanItem,
  RevisionItem,
  ExtractedTaskCandidate,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // Fallback to text
      const errText = await res.text();
      if (errText) errorDetail = errText;
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Health & AI Status
  getHealth: () => request<{ status: string; app: string; version: string }>("/health"),
  getAIStatus: () => request<AIStatus>("/ai/status"),

  // Dashboard
  getDashboard: () => request<DashboardData>("/dashboard"),

  // Documents
  getDocuments: () => request<DocumentItem[]>("/documents"),
  getDocument: (id: number) => request<DocumentItem>(`/documents/${id}`),
  deleteDocument: (id: number) => request<void>(`/documents/${id}`, { method: "DELETE" }),
  uploadDocument: async (file: File): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append("file", file);
    const url = `${API_BASE}/api/documents/upload`;
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },
  analyzeDocument: (id: number) => request<DocumentAnalysisResult>(`/documents/${id}/analyze`, { method: "POST" }),
  confirmDocumentTasks: (id: number, tasks: ExtractedTaskCandidate[]) =>
    request<TaskItem[]>(`/documents/${id}/confirm-tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks }),
    }),

  // Tasks
  getTasks: (params?: {
    status?: string;
    priority?: string;
    subject?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.priority) query.append("priority", params.priority);
    if (params?.subject) query.append("subject", params.subject);
    if (params?.search) query.append("search", params.search);
    if (params?.sort_by) query.append("sort_by", params.sort_by);
    if (params?.sort_order) query.append("sort_order", params.sort_order);
    const qs = query.toString();
    return request<TaskItem[]>(`/tasks${qs ? `?${qs}` : ""}`);
  },
  getTask: (id: number) => request<TaskItem>(`/tasks/${id}`),
  createTask: (payload: {
    title: string;
    description?: string | null;
    subject?: string | null;
    due_date?: string | null;
    priority: string;
    estimated_effort_minutes: number;
    status?: string;
    subtasks?: { title: string; estimated_minutes: number }[];
  }) =>
    request<TaskItem>("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateTask: (id: number, payload: Partial<TaskItem>) =>
    request<TaskItem>(`/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteTask: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
  addSubtask: (taskId: number, payload: { title: string; estimated_minutes: number }) =>
    request(`/tasks/${taskId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  toggleSubtask: (taskId: number, subtaskId: number) =>
    request(`/tasks/${taskId}/subtasks/${subtaskId}`, { method: "PATCH" }),

  // Study Plans
  getCurrentPlan: () => request<StudyPlan | null>("/plans/current"),
  generatePlan: (payload: {
    week_start_date: string;
    available_daily_minutes: number;
    session_duration_minutes: number;
    available_days: string[];
  }) =>
    request<StudyPlan>("/plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updatePlanItem: (itemId: number, payload: Partial<StudyPlanItem>) =>
    request<StudyPlanItem>(`/plans/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deletePlanItem: (itemId: number) =>
    request<void>(`/plans/items/${itemId}`, { method: "DELETE" }),

  // Revision
  getRevisionItems: (params?: { subject?: string; document_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.subject) query.append("subject", params.subject);
    if (params?.document_id) query.append("document_id", params.document_id.toString());
    const qs = query.toString();
    return request<RevisionItem[]>(`/revision${qs ? `?${qs}` : ""}`);
  },
  generateRevision: (payload: { document_id?: number | null; subject?: string | null }) =>
    request<RevisionItem[]>("/revision/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateRevisionItem: (id: number, payload: { is_completed: boolean }) =>
    request<RevisionItem>(`/revision/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteRevisionItem: (id: number) =>
    request<void>(`/revision/${id}`, { method: "DELETE" }),

  // Demo Mode
  loadDemoData: () => request<{ status: string; message: string }>("/demo/load", { method: "POST" }),
  resetDemoData: () => request<{ status: string; message: string }>("/demo/reset", { method: "POST" }),
};
