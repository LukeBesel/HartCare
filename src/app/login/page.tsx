"use client";

import { SUPABASE_ENABLED, createClient } from "@/lib/supabase/client";
import { Activity, HeartPulse, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (SUPABASE_ENABLED) {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-brand-gradient text-white">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-white/15"><HeartPulse size={20} /></span>
          <span className="font-bold text-lg">HartCare</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Welcome back to a calmer way to stay well.</h2>
          <p className="mt-3 text-brand-100 max-w-md">
            Your whole family&apos;s fitness, nutrition, sleep and care — gently in sync.
          </p>
        </div>
        <p className="text-sm text-brand-200">Healthy living, together.</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-gradient text-white glow-brand"><HeartPulse size={20} strokeWidth={2.4} /></span>
            <span className="font-bold text-lg">HartCare</span>
          </div>
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-text-muted mt-1 text-sm">Welcome back. Let&apos;s pick up where you left off.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />} Sign in
            </button>
          </form>

          <button
            onClick={() => router.push("/dashboard")}
            className="btn-outline w-full mt-3"
          >
            <Activity size={16} /> Continue with HartHome (SSO)
          </button>

          {!SUPABASE_ENABLED && (
            <p className="text-xs text-text-muted mt-4 text-center">
              Demo mode — any details work, or just continue to explore.
            </p>
          )}

          <p className="text-sm text-text-muted mt-6 text-center">
            New to HartCare?{" "}
            <Link href="/signup" className="text-brand-600 font-medium hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
