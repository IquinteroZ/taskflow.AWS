"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await authApi.login(form);
      Cookies.set("taskflow_token", token, { expires: 7, secure: true, sameSite: "strict" });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: "radial-gradient(ellipse at 60% 20%, rgba(99,102,241,0.12) 0%, transparent 60%), #0a0a12"
    }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>T</div>
            <span className="text-2xl font-bold tracking-tight">
              Task<span style={{ color: "#6366f1" }}>Flow</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-indigo-500/10 p-8"
          style={{ background: "rgba(15,15,25,0.8)", backdropFilter: "blur(20px)" }}>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-400 border border-red-500/20"
              style={{ background: "rgba(239,68,68,0.08)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm text-slate-200 outline-none transition-all"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full rounded-lg px-4 py-3 text-sm text-slate-200 outline-none transition-all"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-bold text-sm tracking-wide transition-all"
              style={{
                background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: loading ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{" "}
            <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create one free
            </Link>
          </p>
        </div>

        {/* AWS badge */}
        <p className="text-center mt-6 text-xs text-slate-600">
          ⚡ Auth via JWT · Deployed on AWS Lambda + S3/CloudFront
        </p>
      </div>
    </div>
  );
}
