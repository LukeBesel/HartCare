"use client";

import { Customizer } from "@/components/dashboard/Customizer";
import { SPAN_CLASS, WIDGETS, isWidgetId } from "@/components/dashboard/registry";
import { Avatar } from "@/components/ui";
import { useCurrentProfile, useSettings, useStore } from "@/lib/store";
import type { WidgetConfig } from "@/lib/types";
import { Check, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function DashboardPage() {
  const profile = useCurrentProfile();
  const layout = useSettings().dashboard;
  const updateSettings = useStore((s) => s.updateSettings);
  const [customizing, setCustomizing] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  /**
   * Reconcile the persisted layout with the registry:
   *  - keep only ids that exist in the registry (skip unknown/stale ids)
   *  - append any registry ids missing from the layout as disabled at the end
   */
  const fullLayout = useMemo<WidgetConfig[]>(() => {
    const known = (layout ?? []).filter((w) => isWidgetId(w.id));
    const seen = new Set(known.map((w) => w.id));
    const missing = (Object.keys(WIDGETS) as (keyof typeof WIDGETS)[])
      .filter((id) => !seen.has(id))
      .map((id) => ({ id, enabled: false, w: 1 as const }));
    return [...known, ...missing];
  }, [layout]);

  const visibleWidgets = useMemo(() => fullLayout.filter((w) => w.enabled), [fullLayout]);

  function persist(next: WidgetConfig[]) {
    updateSettings({ dashboard: next });
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={profile.name} emoji={profile.avatar} color={profile.color} size={48} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting}, {profile.name}
            </h1>
            <p className="text-text-muted text-sm">Here&apos;s your day at a glance.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCustomizing((v) => !v)}
            className={customizing ? "btn-primary" : "btn-outline"}
            aria-pressed={customizing}
            title={customizing ? "Finish customizing" : "Customize dashboard"}
          >
            {customizing ? <Check size={16} /> : <LayoutGrid size={16} />}
            {customizing ? "Done" : "Customize"}
          </button>
          <Link href="/coach" className="btn-primary">
            Ask your coach
          </Link>
        </div>
      </div>

      {customizing ? (
        <Customizer layout={fullLayout} onChange={persist} />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {visibleWidgets.map((w) => (
            <div key={w.id} className={SPAN_CLASS[w.w]}>
              {WIDGETS[w.id].render()}
            </div>
          ))}
          {visibleWidgets.length === 0 && (
            <div className="lg:col-span-3 card card-pad text-center text-text-muted">
              All widgets are hidden. Tap <span className="font-medium text-text">Customize</span> to add some back.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
