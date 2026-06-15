"use client";

import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  ProgressRing,
} from "@/components/ui";
import { useDailyQuote, useProfileRows } from "@/lib/hooks";
import { useCurrentProfile, useStore } from "@/lib/store";
import type { Goal } from "@/lib/types";
import { clamp, relativeDay, round } from "@/lib/utils";
import { Minus, Plus, Quote, Target, Trash2, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

const CATEGORIES: { label: string; value: Goal["category"] }[] = [
  { label: "Weight", value: "weight" },
  { label: "Steps", value: "steps" },
  { label: "Water", value: "water" },
  { label: "Sleep", value: "sleep" },
  { label: "Fitness", value: "fitness" },
  { label: "Habit", value: "habit" },
];

const CATEGORY_COLOR: Record<Goal["category"], "brand" | "mint" | "amber" | "rose" | "violet" | "gray"> = {
  weight: "violet",
  steps: "brand",
  water: "brand",
  sleep: "violet",
  fitness: "mint",
  habit: "amber",
};

const CATEGORY_RING: Record<Goal["category"], string> = {
  weight: "#a855f7",
  steps: "var(--color-brand-500)",
  water: "#38bdf8",
  sleep: "#a855f7",
  fitness: "var(--color-mint-500)",
  habit: "#f59e0b",
};

type Suggestion = {
  title: string;
  category: Goal["category"];
  target: number;
  unit: string;
};

const SUGGESTIONS: Suggestion[] = [
  { title: "Walk 10,000 steps", category: "steps", target: 10000, unit: "steps" },
  { title: "Drink 100 oz water", category: "water", target: 100, unit: "oz" },
  { title: "Sleep 8 hours", category: "sleep", target: 8, unit: "hours" },
  { title: "Lose 10 lbs", category: "weight", target: 10, unit: "lbs" },
];

/**
 * Percent complete for a goal, 0..100. For weight goals where lower is
 * better, `current` is treated as how much has been lost toward `target`.
 */
function goalPercent(g: Goal): number {
  if (g.target <= 0) return 0;
  return clamp(round((g.current / g.target) * 100), 0, 100);
}

type Draft = {
  title: string;
  category: Goal["category"];
  target: string;
  unit: string;
  due: string;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  category: "fitness",
  target: "",
  unit: "",
  due: "",
};

export default function GoalsPage() {
  const profile = useCurrentProfile();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const remove = useStore((s) => s.remove);
  const pushNotification = useStore((s) => s.pushNotification);
  const quote = useDailyQuote();

  const goals = useProfileRows("goals");

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => goalPercent(a) - goalPercent(b)),
    [goals],
  );

  const completedCount = useMemo(
    () => goals.filter((g) => goalPercent(g) >= 100).length,
    [goals],
  );

  function openAdd(seed?: Suggestion) {
    setDraft(
      seed
        ? { title: seed.title, category: seed.category, target: String(seed.target), unit: seed.unit, due: "" }
        : EMPTY_DRAFT,
    );
    setOpen(true);
  }

  function saveGoal() {
    const target = Number(draft.target);
    if (!draft.title.trim() || !target) return;
    add("goals", {
      profileId: profile.id,
      title: draft.title.trim(),
      category: draft.category,
      target,
      current: 0,
      unit: draft.unit.trim() || "units",
      due: draft.due || undefined,
    });
    pushNotification({
      kind: "goal",
      title: `New goal: ${draft.title.trim()}`,
      body: `Target ${target} ${draft.unit.trim() || "units"}`,
      profileId: profile.id,
    });
    setOpen(false);
    setDraft(EMPTY_DRAFT);
  }

  function bump(g: Goal, delta: number) {
    const step = g.target >= 1000 ? 500 : g.target >= 50 ? 5 : 1;
    const next = clamp(round(g.current + delta * step, 1), 0, g.target);
    update("goals", g.id, { current: next });
  }

  function setCurrent(g: Goal, value: string) {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    update("goals", g.id, { current: clamp(round(num, 1), 0, g.target) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        subtitle={`What ${profile.name} is working toward`}
        action={
          <button className="btn-primary" onClick={() => openAdd()}>
            <Plus size={16} /> Add goal
          </button>
        }
      />

      {/* Motivational strip */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white animate-in">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Quote size={20} className="text-brand-200" />
            <p className="mt-2 font-medium leading-snug">{quote}</p>
          </div>
          {goals.length > 0 && (
            <div className="text-center shrink-0">
              <div className="text-3xl font-bold leading-none">{completedCount}</div>
              <div className="text-xs text-brand-100 mt-1">
                of {goals.length} reached
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested goals */}
      <CardPad>
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-brand-600">
            <Trophy size={18} />
          </span>
          <h2 className="text-base font-semibold text-text">Suggested goals</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.title}
              type="button"
              className="chip bg-surface-muted text-text-muted hover:text-text"
              onClick={() => openAdd(s)}
            >
              <Plus size={14} /> {s.title}
            </button>
          ))}
        </div>
      </CardPad>

      {/* Goals grid */}
      {sortedGoals.length === 0 ? (
        <CardPad>
          <EmptyState
            icon={<Target size={20} />}
            title="No goals yet"
            description="Set a goal to start tracking your progress. Pick a suggestion above or add your own."
            action={
              <button className="btn-primary" onClick={() => openAdd()}>
                <Plus size={16} /> Add goal
              </button>
            }
          />
        </CardPad>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedGoals.map((g) => {
            const pct = goalPercent(g);
            const done = pct >= 100;
            return (
              <CardPad key={g.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-text truncate">{g.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge color={CATEGORY_COLOR[g.category]} className="capitalize">
                        {g.category}
                      </Badge>
                      {done && <Badge color="mint">Reached ✓</Badge>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1.5 text-text-muted shrink-0"
                    aria-label="Delete goal"
                    onClick={() => remove("goals", g.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <ProgressRing
                    value={pct}
                    color={CATEGORY_RING[g.category]}
                    label={<span style={{ color: CATEGORY_RING[g.category] }}>{pct}%</span>}
                  />
                  <div className="min-w-0">
                    <div className="text-sm text-text">
                      <span className="font-semibold">{round(g.current, 1)}</span>
                      <span className="text-text-muted"> / {g.target} {g.unit}</span>
                    </div>
                    {g.due && (
                      <div className="text-xs text-text-muted mt-1">
                        Due {relativeDay(g.due)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Update control */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-outline px-2.5 py-2 shrink-0"
                    aria-label="Decrease progress"
                    onClick={() => bump(g, -1)}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    className="input text-center"
                    type="number"
                    min={0}
                    max={g.target}
                    value={g.current}
                    onChange={(e) => setCurrent(g, e.target.value)}
                    aria-label={`${g.title} progress`}
                  />
                  <button
                    type="button"
                    className="btn-outline px-2.5 py-2 shrink-0"
                    aria-label="Increase progress"
                    onClick={() => bump(g, 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </CardPad>
            );
          })}
        </div>
      )}

      {/* Add goal modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add goal"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={saveGoal}
              disabled={!draft.title.trim() || !Number(draft.target)}
            >
              Save goal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="e.g. Run a 5K"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={draft.category}
              onChange={(e) =>
                setDraft((d) => ({ ...d, category: e.target.value as Goal["category"] }))
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Target</label>
              <input
                className="input"
                type="number"
                min={0}
                placeholder="e.g. 10000"
                value={draft.target}
                onChange={(e) => setDraft((d) => ({ ...d, target: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <input
                className="input"
                placeholder="e.g. steps, lbs, oz"
                value={draft.unit}
                onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">Due date (optional)</label>
            <input
              className="input"
              type="date"
              value={draft.due}
              onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
