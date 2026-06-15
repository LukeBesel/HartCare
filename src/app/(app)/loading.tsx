import { HeartPulse } from "lucide-react";

export default function Loading() {
  return (
    <div className="grid place-items-center py-24">
      <div className="flex items-center gap-2 text-text-muted">
        <HeartPulse className="text-brand-600 animate-pulse" />
        <span>Loading…</span>
      </div>
    </div>
  );
}
