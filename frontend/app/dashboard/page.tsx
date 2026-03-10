"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { tasksApi, authApi } from "@/lib/api";
import type { Task, Priority, TaskStatus, FilterState, CreateTaskInput } from "@/types";
import { LogOut, Plus, Filter, Search, Tag, AlertCircle, Clock, CheckCircle2, Loader2 } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────
const PRIORITY_META: Record<Priority, { label: string; color: string; bg: string; dot: string }> = {
  HIGH:   { label: "High",   color: "#ef4444", bg: "rgba(239,68,68,0.1)",   dot: "#ef4444" },
  MEDIUM: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  dot: "#f59e0b" },
  LOW:    { label: "Low",    color: "#10b981", bg: "rgba(16,185,129,0.1)",  dot: "#10b981" },
};

const STATUS_META: Record<TaskStatus, { label: string; icon: React.ReactNode; color: string }> = {
  TODO:        { label: "To Do",       icon: <Clock size={12} />,         color: "#64748b" },
  IN_PROGRESS: { label: "In Progress", icon: <Loader2 size={12} />,       color: "#f59e0b" },
  DONE:        { label: "Done",        icon: <CheckCircle2 size={12} />,  color: "#10b981" },
};

const LABEL_COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6"];

const DEMO_TASKS: Task[] = [
  { id: "1", userId: "u1", title: "Set up AWS Lambda functions", description: "Create auth, tasks, and users handlers with proper IAM roles", status: "DONE", priority: "HIGH", labels: [{ id: "l1", name: "AWS", color: "#ff9900" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", userId: "u1", title: "Configure API Gateway routes", description: "REST API with CORS, auth middleware and rate limiting", status: "IN_PROGRESS", priority: "HIGH", labels: [{ id: "l2", name: "Backend", color: "#6366f1" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "3", userId: "u1", title: "Deploy to S3 + CloudFront", description: "Static export pipeline with cache invalidation on deploy", status: "IN_PROGRESS", priority: "MEDIUM", labels: [{ id: "l3", name: "DevOps", color: "#10b981" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "4", userId: "u1", title: "Write Terraform modules", description: "IaC for Lambda, API Gateway, DynamoDB and CloudFront", status: "TODO", priority: "MEDIUM", labels: [{ id: "l4", name: "IaC", color: "#8b5cf6" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "5", userId: "u1", title: "Add GitHub Actions CI/CD", description: "Auto-deploy pipeline on push to main branch", status: "TODO", priority: "LOW", labels: [{ id: "l5", name: "DevOps", color: "#10b981" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ── Task Card Component ───────────────────────────────────────
function TaskCard({ task, onUpdate, onDelete }: {
  task: Task;
  onUpdate: (id: string, data: { status: TaskStatus }) => void;
  onDelete: (id: string) => void;
}) {
  const p = PRIORITY_META[task.priority];
  const s = STATUS_META[task.status];
  const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

  return (
    <div className="rounded-xl p-4 border transition-all group"
      style={{ background: "rgba(15,15,28,0.9)", borderColor: "rgba(99,102,241,0.12)" }}>
      {/* Labels */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {task.labels.map(l => (
          <span key={l.id} className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{ background: `${l.color}22`, color: l.color }}>
            {l.name}
          </span>
        ))}
      </div>

      <h3 className="text-sm font-semibold mb-1.5 leading-snug">{task.title}</h3>
      {task.description && (
        <p className="text-xs text-slate-500 mb-3 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        {/* Priority badge */}
        <span className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"
          style={{ background: p.bg, color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: p.dot }} />
          {p.label}
        </span>

        {/* Status selector */}
        <select
          value={task.status}
          onChange={e => onUpdate(task.id, { status: e.target.value as TaskStatus })}
          className="text-[10px] font-semibold px-2 py-1 rounded-lg outline-none cursor-pointer"
          style={{ background: "rgba(99,102,241,0.12)", color: s.color, border: "none" }}>
          {statuses.map(st => (
            <option key={st} value={st}>{STATUS_META[st].label}</option>
          ))}
        </select>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="mt-3 text-[10px] text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
        Delete task
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [filters, setFilters] = useState<FilterState>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskInput>({ title: "", priority: "MEDIUM", labels: [] });
  const [labelInput, setLabelInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = Cookies.get("taskflow_token");
    if (!token) router.push("/auth/login");
    // In production: fetch tasks from API
    // tasksApi.getAll(filters).then(r => setTasks(r.data));
  }, [router]);

  const handleLogout = () => { authApi.logout(); router.push("/auth/login"); };

  const addLabel = () => {
    if (!labelInput.trim()) return;
    const color = LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)];
    setNewTask(t => ({ ...t, labels: [...(t.labels || []), { id: Date.now().toString(), name: labelInput.trim(), color }] }));
    setLabelInput("");
  };

  const handleCreate = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(), userId: "u1",
      title: newTask.title, description: newTask.description,
      status: "TODO", priority: newTask.priority,
      labels: newTask.labels || [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setTasks(t => [task, ...t]);
    setNewTask({ title: "", priority: "MEDIUM", labels: [] });
    setShowCreate(false);
    // In production: tasksApi.create(newTask)
  };

  const handleUpdate = (id: string, data: { status: TaskStatus }) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
    // In production: tasksApi.update(id, data)
  };

  const handleDelete = (id: string) => {
    setTasks(ts => ts.filter(t => t.id !== id));
    // In production: tasksApi.delete(id)
  };

  const filtered = tasks.filter(t => {
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
  const stats = { total: tasks.length, done: tasks.filter(t => t.col === "DONE").length, high: tasks.filter(t => t.priority === "HIGH").length };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a12" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b flex items-center justify-between px-6 h-14"
        style={{ background: "rgba(10,10,18,0.95)", backdropFilter: "blur(20px)", borderColor: "rgba(99,102,241,0.15)" }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>T</div>
          <span className="font-bold text-sm tracking-tight">
            Task<span style={{ color: "#6366f1" }}>Flow</span>
          </span>
          <span className="text-xs text-slate-600 font-mono hidden md:block">· AWS Serverless</span>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
            <Plus size={12} /> New Task
          </button>
          <button onClick={handleLogout} className="text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Tasks", value: tasks.length, color: "#6366f1", icon: "📋" },
            { label: "High Priority", value: tasks.filter(t => t.priority === "HIGH").length, color: "#ef4444", icon: "🔥" },
            { label: "Completed", value: tasks.filter(t => t.status === "DONE").length, color: "#10b981", icon: "✅" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl p-4 border"
              style={{ background: "rgba(15,15,28,0.8)", borderColor: "rgba(99,102,241,0.12)" }}>
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.icon} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs"
            style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.15)" }}>
            <Search size={12} className="text-slate-500" />
            <input
              placeholder="Search tasks..."
              value={filters.search || ""}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="bg-transparent outline-none text-slate-300 placeholder-slate-600 w-32"
            />
          </div>

          {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map(p => (
            <button key={p} onClick={() => setFilters({ ...filters, priority: filters.priority === p ? undefined : p })}
              className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
              style={{
                background: filters.priority === p ? `${PRIORITY_META[p].bg}` : "rgba(99,102,241,0.06)",
                color: filters.priority === p ? PRIORITY_META[p].color : "#64748b",
                borderColor: filters.priority === p ? `${PRIORITY_META[p].color}40` : "rgba(99,102,241,0.15)",
              }}>
              {p}
            </button>
          ))}

          {filters.priority || filters.search ? (
            <button onClick={() => setFilters({})} className="px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Clear filters
            </button>
          ) : null}
        </div>

        {/* Kanban columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {statuses.map(status => {
            const col = STATUS_META[status];
            const colTasks = filtered.filter(t => t.status === status);
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ color: col.color }}>{col.icon}</span>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: col.color }}>
                    {col.label}
                  </span>
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${col.color}18`, color: col.color }}>
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {colTasks.map(t => (
                    <TaskCard key={t.id} task={t} onUpdate={handleUpdate} onDelete={handleDelete} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-700 border border-dashed rounded-xl"
                      style={{ borderColor: "rgba(99,102,241,0.1)" }}>
                      No tasks here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* AWS Footer */}
        <div className="mt-10 rounded-xl p-4 border flex flex-wrap gap-2 items-center"
          style={{ background: "rgba(255,153,0,0.04)", borderColor: "rgba(255,153,0,0.15)" }}>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">☁️ AWS Stack</span>
          {["Lambda (auth + tasks + users)", "API Gateway REST", "DynamoDB (on-demand)", "S3 + CloudFront CDN"].map(s => (
            <span key={s} className="text-xs px-2 py-1 rounded font-medium"
              style={{ background: "rgba(255,153,0,0.1)", color: "#f59e0b" }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6"
            style={{ background: "#0f0f1c", borderColor: "rgba(99,102,241,0.25)", boxShadow: "0 24px 60px rgba(99,102,241,0.15)" }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold mb-5">⚡ New Task</h2>

            <div className="space-y-4">
              <input
                placeholder="Task title..."
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#e2e8f0" }}
              />
              <textarea
                placeholder="Description (optional)..."
                value={newTask.description || ""}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#e2e8f0" }}
              />

              <select
                value={newTask.priority}
                onChange={e => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#e2e8f0" }}>
                <option value="HIGH">🔴 High Priority</option>
                <option value="MEDIUM">🟡 Medium Priority</option>
                <option value="LOW">🟢 Low Priority</option>
              </select>

              {/* Labels */}
              <div>
                <div className="flex gap-2 mb-2">
                  <input
                    placeholder="Add label..."
                    value={labelInput}
                    onChange={e => setLabelInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLabel())}
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#e2e8f0" }}
                  />
                  <button onClick={addLabel} className="px-3 py-2 rounded-lg text-xs font-bold text-white"
                    style={{ background: "rgba(99,102,241,0.3)" }}>
                    <Tag size={12} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(newTask.labels || []).map(l => (
                    <span key={l.id} className="text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                      style={{ background: `${l.color}22`, color: l.color }}
                      onClick={() => setNewTask(t => ({ ...t, labels: t.labels?.filter(x => x.id !== l.id) }))}>
                      {l.name} ×
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm text-slate-500 border transition-colors"
                  style={{ borderColor: "rgba(99,102,241,0.15)" }}>
                  Cancel
                </button>
                <button onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  Create Task →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
