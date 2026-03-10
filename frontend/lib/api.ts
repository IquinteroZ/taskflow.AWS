// ============================================
// TaskFlow — API Client
// Wraps all calls to AWS API Gateway
// ============================================

import Cookies from "js-cookie";
import type { Task, CreateTaskInput, UpdateTaskInput, AuthResponse, LoginInput, RegisterInput } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ── Base fetch wrapper ──────────────────────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = Cookies.get("taskflow_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ────────────────────────────────────────────────────────
export const authApi = {
  login: (body: LoginInput) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  register: (body: RegisterInput) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  logout: () => {
    Cookies.remove("taskflow_token");
  },
};

// ── Tasks ───────────────────────────────────────────────────────
export const tasksApi = {
  getAll: (filters?: { priority?: string; status?: string; label?: string }) => {
    const params = new URLSearchParams();
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.label) params.set("label", filters.label);
    const qs = params.toString();
    return apiFetch<{ data: Task[] }>(`/tasks${qs ? `?${qs}` : ""}`);
  },

  getById: (id: string) =>
    apiFetch<{ data: Task }>(`/tasks/${id}`),

  create: (body: CreateTaskInput) =>
    apiFetch<{ data: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: UpdateTaskInput) =>
    apiFetch<{ data: Task }>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    apiFetch<{ message: string }>(`/tasks/${id}`, {
      method: "DELETE",
    }),
};
