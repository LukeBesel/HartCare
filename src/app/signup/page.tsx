"use client";

import { SUPABASE_ENABLED, createClient } from "@/lib/supabase/client";
import { HeartPulse, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [household, setHousehold] = useState("");
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, household_name: household || `${name}'s Household` } },
        });
        if (error) throw error;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 order-2 lg:order-1">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-gradient text-white glow-brand"><HeartPulse size={20} strokeWidth={2.4} /></span>
            <span className="font-bold text-lg">HartCare</span>
          </div>
          <h1 className="text-2xl font-bold">Create your household</h1>
          <p className="text-text-muted mt-1 text-sm">Start free — add family members and pets anytime.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Your name</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Daniel" />
            </div>
            <div>
              <label className="label">Household name</label>
              <input className="input" value={household} onChange={(e) => setHousehold(e.target.value)} placeholder="The Hart Family" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />} Create account
            </button>
          </form>

          {!SUPABASE_ENABLED && (
            <p className="text-xs text-text-muted mt-4 text-center">
              Demo mode — your data stays in this browser. Add Supabase keys to go live.
            </p>
          )}

          <p className="text-sm text-text-muted mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-between p-12 bg-brand-gradient text-white order-1 lg:order-2">
        <div />
        <div>
          <h2 className="text-3xl font-bold leading-tight">A healthier home starts here.</h2>
          <ul className="mt-5 space-y-3 text-mint-50">
            {["Profiles for parents, kids, grandparents & pets", "AI coach for workouts, meals & grocery lists", "Medications, appointments & reminders in sync", "Private by design — never a medical diagnosis"].map((t) => (
              <li key={t} className="flex items-center gap-2.5"><ShieldCheck size={18} /> {t}</li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-mint-100">Healthy living, together.</p>
      </div>
    </div>
  );
}
