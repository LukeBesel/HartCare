import Link from "next/link";
import { HeartPulse } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center bg-surface text-text p-6">
      <div className="text-center">
        <span className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-2xl bg-brand-gradient text-white glow-brand">
          <HeartPulse size={28} />
        </span>
        <h1 className="text-3xl font-bold">Page not found</h1>
        <p className="text-text-muted mt-2">The page you&apos;re looking for took a rest day.</p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  );
}
