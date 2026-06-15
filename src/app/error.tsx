"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production this is where we'd report to an error service.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center bg-surface text-text p-6">
      <div className="card card-pad max-w-md text-center">
        <span className="mx-auto mb-3 grid place-items-center h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10">
          <AlertTriangle size={24} />
        </span>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-text-muted mt-1 text-sm">
          We hit an unexpected snag. Your data is safe — please try again.
        </p>
        <button onClick={reset} className="btn-primary mt-5">
          Try again
        </button>
      </div>
    </div>
  );
}
