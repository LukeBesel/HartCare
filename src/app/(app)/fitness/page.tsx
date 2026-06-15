"use client";

import { AreaTrend } from "@/components/charts";
import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import { useProfileRows } from "@/lib/hooks";
import { useCurrentProfile, useStore } from "@/lib/store";
import type { Exercise, Workout } from "@/lib/types";
import { relativeDay, round, todayISO, uid } from "@/lib/utils";
import {
  Camera,
  Dumbbell,
  Flame,
  Plus,
  Ruler,
  Timer,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const CATEGORIES: { label: string; value: Workout["category"] }[] = [
  { label: "Weight loss", value: "weight_loss" },
  { label: "Muscle gain", value: "muscle_gain" },
  { label: "General", value: "general" },
  { label: "Strength", value: "strength" },
  { label: "Running", value: "running" },
  { label: "Walking", value: "walking" },
  { label: "Cycling", value: "cycling" },
  { label: "Home", value: "home" },
  { label: "Senior", value: "senior" },
];

const LEVELS: { label: string; value: Workout["level"] }[] = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const CATEGORY_LABEL: Record<Workout["category"], string> = {
  weight_loss: "Weight loss",
  muscle_gain: "Muscle gain",
  general: "General",
  strength: "Strength",
  running: "Running",
  walking: "Walking",
  cycling: "Cycling",
  home: "Home",
  senior: "Senior",
};

// Sensible defaults for a logged session.
const EST_DURATION = 45;
const EST_CALORIES = 350;

type ExerciseDraft = {
  id: string;
  name: string;
  sets: string;
  reps: string;
  restSec: string;
};

function newExerciseRow(): ExerciseDraft {
  return { id: uid("ex"), name: "", sets: "3", reps: "10", restSec: "60" };
}

export default function FitnessPage() {
  const profile = useCurrentProfile();
  const add = useStore((s) => s.add);
  const pushNotification = useStore((s) => s.pushNotification);

  const workouts = useProfileRows("workouts");
  const sessions = useProfileRows("workoutSessions");
  const weights = useProfileRows("weights");
  const measurements = useProfileRows("measurements");
  const photos = useProfileRows("progressPhotos");

  const [builderOpen, setBuilderOpen] = useState(false);
  const [measureOpen, setMeasureOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ---- Weekly summary (last 7 days) ------------------------------------
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  }, []);

  const weekStats = useMemo(() => {
    const week = sessions.filter((s) => s.date >= weekAgo);
    return {
      count: week.length,
      minutes: week.reduce((a, s) => a + (s.durationMin || 0), 0),
      calories: week.reduce((a, s) => a + (s.calories || 0), 0),
    };
  }, [sessions, weekAgo]);

  const latestWeight = useMemo(
    () => [...weights].sort((a, b) => b.date.localeCompare(a.date))[0],
    [weights],
  );

  const weightSeries = useMemo(
    () =>
      [...weights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-21)
        .map((w) => ({ label: w.date.slice(5), value: w.lbs })),
    [weights],
  );

  const latestBodyFat = useMemo(() => {
    const withBf = [...weights]
      .filter((w) => w.bodyFat != null)
      .sort((a, b) => b.date.localeCompare(a.date));
    return withBf[0]?.bodyFat;
  }, [weights]);

  // ---- Weekly schedule grouped by day ----------------------------------
  const byDay = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    for (const d of DAYS) map[d] = [];
    for (const w of workouts) {
      if (map[w.day]) map[w.day].push(w);
      else (map[w.day] = map[w.day] || []).push(w);
    }
    return map;
  }, [workouts]);

  // ---- Recent sessions --------------------------------------------------
  const recentSessions = useMemo(
    () => [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [sessions],
  );

  // ---- Latest measurement per part -------------------------------------
  const latestMeasurements = useMemo(() => {
    const map = new Map<string, (typeof measurements)[number]>();
    for (const m of [...measurements].sort((a, b) => a.date.localeCompare(b.date))) {
      map.set(m.part, m); // later dates overwrite -> latest wins
    }
    return [...map.values()].sort((a, b) => a.part.localeCompare(b.part));
  }, [measurements]);

  const photoGrid = useMemo(
    () => [...photos].sort((a, b) => b.date.localeCompare(a.date)),
    [photos],
  );

  // ---- Actions ----------------------------------------------------------
  function logSession(w: Workout) {
    add("workoutSessions", {
      profileId: profile.id,
      date: todayISO(),
      workoutId: w.id,
      name: w.name,
      durationMin: EST_DURATION,
      calories: EST_CALORIES,
      completed: true,
    });
    pushNotification({
      kind: "workout",
      title: `Logged "${w.name}"`,
      body: `${EST_DURATION} min · ${EST_CALORIES} kcal`,
      profileId: profile.id,
    });
  }

  function addPhotoFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      add("progressPhotos", {
        profileId: profile.id,
        date: todayISO(),
        dataUrl: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fitness"
        subtitle={`Training hub for ${profile.name}`}
        action={
          <button className="btn-primary" onClick={() => setBuilderOpen(true)}>
            <Plus size={16} /> New workout
          </button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Sessions this week"
          value={weekStats.count}
          icon={<Dumbbell size={18} />}
          accent="brand"
        />
        <StatCard
          label="Active minutes"
          value={weekStats.minutes}
          unit="min"
          icon={<Timer size={18} />}
          accent="mint"
        />
        <StatCard
          label="Calories burned"
          value={weekStats.calories.toLocaleString()}
          unit="kcal"
          icon={<Flame size={18} />}
          accent="amber"
        />
        <StatCard
          label="Current weight"
          value={latestWeight ? latestWeight.lbs : "—"}
          unit={latestWeight ? "lbs" : undefined}
          icon={<TrendingUp size={18} />}
          accent="violet"
          hint={latestBodyFat != null ? `${latestBodyFat}% body fat` : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: schedule + sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly schedule */}
          <CardPad>
            <SectionTitle
              title="Weekly schedule"
              subtitle="Your plan, grouped by day"
              icon={<Dumbbell size={18} />}
            />
            {workouts.length === 0 ? (
              <EmptyState
                icon={<Dumbbell size={20} />}
                title="No workouts yet"
                description="Build your first workout to start a weekly routine."
                action={
                  <button className="btn-primary" onClick={() => setBuilderOpen(true)}>
                    <Plus size={16} /> New workout
                  </button>
                }
              />
            ) : (
              <div className="space-y-5">
                {DAYS.map((day) => {
                  const items = byDay[day] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <div key={day}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                        {day}
                      </div>
                      <div className="space-y-2">
                        {items.map((w) => (
                          <div
                            key={w.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-text truncate">{w.name}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <Badge color="brand">{CATEGORY_LABEL[w.category]}</Badge>
                                <Badge color="gray" className="capitalize">
                                  {w.level}
                                </Badge>
                                <span className="text-xs text-text-muted">
                                  {w.exercises.length} exercise
                                  {w.exercises.length === 1 ? "" : "s"}
                                </span>
                              </div>
                            </div>
                            <button
                              className="btn-primary py-2 shrink-0"
                              onClick={() => logSession(w)}
                            >
                              Log session
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardPad>

          {/* Recent sessions */}
          <CardPad>
            <SectionTitle
              title="Recent sessions"
              subtitle="Your last logged workouts"
              icon={<Timer size={18} />}
            />
            {recentSessions.length === 0 ? (
              <EmptyState
                icon={<Timer size={20} />}
                title="No sessions logged"
                description="Log a workout from your schedule and it will show up here."
              />
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-text truncate">{s.name}</div>
                      <div className="text-xs text-text-muted">{relativeDay(s.date)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm text-text">{s.durationMin} min</div>
                      <div className="text-xs text-text-muted">{s.calories} kcal</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        </div>

        {/* Right: progress */}
        <div className="space-y-6">
          {/* Weight trend */}
          <CardPad>
            <SectionTitle title="Weight trend" icon={<TrendingUp size={18} />} />
            {weightSeries.length > 1 ? (
              <AreaTrend
                data={weightSeries}
                unit="lbs"
                height={160}
                color="var(--color-mint-500)"
              />
            ) : (
              <p className="text-sm text-text-muted">Log a weigh-in to see your trend.</p>
            )}
          </CardPad>

          {/* Measurements */}
          <CardPad>
            <SectionTitle
              title="Body measurements"
              icon={<Ruler size={18} />}
              action={
                <button
                  className="text-sm text-brand-600 hover:underline"
                  onClick={() => setMeasureOpen(true)}
                >
                  Add
                </button>
              }
            />
            {latestMeasurements.length === 0 ? (
              <p className="text-sm text-text-muted">
                No measurements yet. Track your waist, chest, arms and more.
              </p>
            ) : (
              <div className="space-y-2">
                {latestMeasurements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize text-text">{m.part}</span>
                    <span className="text-text-muted">
                      {m.inches}&quot; · {relativeDay(m.date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardPad>

          {/* Progress photos */}
          <CardPad>
            <SectionTitle
              title="Progress photos"
              icon={<Camera size={18} />}
              action={
                <button
                  className="text-sm text-brand-600 hover:underline"
                  onClick={() => photoInputRef.current?.click()}
                >
                  Add photo
                </button>
              }
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) addPhotoFile(file);
                e.target.value = "";
              }}
            />
            {photoGrid.length === 0 ? (
              <EmptyState
                icon={<Camera size={20} />}
                title="No photos yet"
                description="Add a progress photo to track visual changes over time."
                action={
                  <button
                    className="btn-outline"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Camera size={16} /> Add photo
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photoGrid.map((p) => (
                  <div key={p.id} className="space-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.dataUrl}
                      alt={p.note ?? `Progress photo ${p.date}`}
                      className="aspect-square w-full rounded-xl object-cover border border-border"
                    />
                    <div className="text-[10px] text-text-muted text-center">
                      {relativeDay(p.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        </div>
      </div>

      {builderOpen && (
        <WorkoutBuilder
          onClose={() => setBuilderOpen(false)}
          onSave={(payload) => {
            add("workouts", { profileId: profile.id, ...payload });
            setBuilderOpen(false);
          }}
        />
      )}

      {measureOpen && (
        <MeasurementModal
          onClose={() => setMeasureOpen(false)}
          onSave={(part, inches) => {
            add("measurements", {
              profileId: profile.id,
              date: todayISO(),
              part,
              inches,
            });
            setMeasureOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* --------------------------- Workout builder ----------------------------- */
function WorkoutBuilder({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: Omit<Workout, "id" | "profileId">) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Workout["category"]>("strength");
  const [level, setLevel] = useState<Workout["level"]>("beginner");
  const [day, setDay] = useState<string>("Mon");
  const [rows, setRows] = useState<ExerciseDraft[]>([newExerciseRow()]);

  const canSave = name.trim().length > 0;

  function updateRow(id: string, patch: Partial<ExerciseDraft>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function save() {
    if (!canSave) return;
    const exercises: Exercise[] = rows
      .filter((r) => r.name.trim().length > 0)
      .map((r) => ({
        id: uid("ex"),
        name: r.name.trim(),
        muscle: "",
        type: "strength",
        sets: r.sets ? Number(r.sets) : undefined,
        reps: r.reps ? Number(r.reps) : undefined,
        restSec: r.restSec ? Number(r.restSec) : undefined,
      }));
    onSave({ name: name.trim(), category, level, day, exercises });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="New workout"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={save} disabled={!canSave}>
            Save workout
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            placeholder="e.g. Full Body Strength A"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as Workout["category"])}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select
              className="input"
              value={level}
              onChange={(e) => setLevel(e.target.value as Workout["level"])}
            >
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Day</label>
          <select
            className="input"
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Exercises</label>
            <button
              type="button"
              className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1"
              onClick={() => setRows((rs) => [...rs, newExerciseRow()])}
            >
              <Plus size={14} /> Add exercise
            </button>
          </div>
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-surface-muted p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    className="input"
                    placeholder="Exercise name"
                    value={r.name}
                    onChange={(e) => updateRow(r.id, { name: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-ghost px-2 py-2 text-text-muted shrink-0"
                    aria-label="Remove exercise"
                    onClick={() =>
                      setRows((rs) =>
                        rs.length === 1
                          ? [newExerciseRow()]
                          : rs.filter((x) => x.id !== r.id),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label text-xs">Sets</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={r.sets}
                      onChange={(e) => updateRow(r.id, { sets: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Reps</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={r.reps}
                      onChange={(e) => updateRow(r.id, { reps: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Rest (s)</label>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={r.restSec}
                      onChange={(e) => updateRow(r.id, { restSec: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------- Measurement modal ---------------------------- */
function MeasurementModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (part: string, inches: number) => void;
}) {
  const [part, setPart] = useState("");
  const [inches, setInches] = useState("");

  const canSave = part.trim().length > 0 && inches.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add measurement"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!canSave}
            onClick={() => canSave && onSave(part.trim(), round(Number(inches), 1))}
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Body part</label>
          <input
            className="input"
            placeholder="e.g. Waist, Chest, Arms"
            value={part}
            onChange={(e) => setPart(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["Waist", "Chest", "Arms", "Hips", "Thighs"].map((p) => (
              <button
                key={p}
                type="button"
                className="chip bg-surface-muted text-text-muted hover:text-text"
                onClick={() => setPart(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Inches</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.1"
            placeholder="e.g. 32"
            value={inches}
            onChange={(e) => setInches(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
