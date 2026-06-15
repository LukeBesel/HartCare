"use client";

import { AreaTrend, BarTrend, LineTrend, MiniSpark } from "@/components/charts";
import {
  Avatar,
  Badge,
  CardPad,
  ProgressBar,
  ProgressRing,
  SectionTitle,
} from "@/components/ui";
import { useDailyQuote, useDailySeries, useProfileRows, useTodayStats } from "@/lib/hooks";
import {
  useCollection,
  useCurrentProfile,
  usePets,
  useProfiles,
  useStore,
} from "@/lib/store";
import { relativeDay, todayISO } from "@/lib/utils";
import {
  CalendarDays,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Moon,
  PawPrint,
  Pill,
  Plus,
  Quote,
  Smile,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";

const MOOD_EMOJI = ["😞", "😕", "😐", "🙂", "😄"];

/* ------------------------------ Ring helper ------------------------------ */
function RingStat({
  ring,
  color,
  icon,
  label,
  value,
  sub,
}: {
  ring: number;
  color: string;
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <ProgressRing
        value={ring}
        color={color}
        size={68}
        label={<span style={{ color }}>{Math.min(999, ring)}%</span>}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-text-muted text-sm">
          <span style={{ color }}>{icon}</span> {label}
        </div>
        <div className="font-bold truncate">{value}</div>
        <div className="text-xs text-text-muted">{sub}</div>
      </div>
    </div>
  );
}

/* ------------------------------- rings ----------------------------------- */
export function RingsWidget() {
  const stats = useTodayStats();
  const stepPct = Math.round((stats.steps / stats.stepGoal) * 100);
  const waterPct = Math.round((stats.waterToday / stats.waterGoal) * 100);
  const sleepHrs = stats.sleepLast?.hours ?? 0;
  const sleepPct = Math.round((sleepHrs / stats.sleepGoal) * 100);
  const calPct = Math.round((stats.caloriesToday / stats.calorieTarget) * 100);
  return (
    <CardPad>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <RingStat ring={stepPct} color="var(--color-brand-500)" icon={<Footprints size={18} />} label="Steps" value={stats.steps.toLocaleString()} sub={`of ${stats.stepGoal.toLocaleString()}`} />
        <RingStat ring={waterPct} color="#38bdf8" icon={<Droplets size={18} />} label="Water" value={`${stats.waterToday} oz`} sub={`of ${stats.waterGoal} oz`} />
        <RingStat ring={sleepPct} color="#a855f7" icon={<Moon size={18} />} label="Sleep" value={`${sleepHrs} h`} sub={`of ${stats.sleepGoal} h`} />
        <RingStat ring={calPct} color="var(--color-mint-500)" icon={<Flame size={18} />} label="Calories" value={stats.caloriesToday.toLocaleString()} sub={`of ${stats.calorieTarget.toLocaleString()}`} />
      </div>
    </CardPad>
  );
}

/* ------------------------------- water ----------------------------------- */
export function WaterWidget() {
  const profile = useCurrentProfile();
  const stats = useTodayStats();
  const add = useStore((s) => s.add);
  const waterPct = Math.round((stats.waterToday / stats.waterGoal) * 100);
  function addWater(oz: number) {
    add("waterLogs", { profileId: profile.id, date: todayISO(), oz });
  }
  return (
    <CardPad>
      <SectionTitle title="Water intake" icon={<Droplets size={18} />} />
      <div className="flex items-center gap-4">
        <ProgressRing value={waterPct} color="#38bdf8" label={`${stats.waterToday}`} sublabel={`/ ${stats.waterGoal} oz`} />
        <div className="flex-1 space-y-2">
          {[8, 16, 24].map((oz) => (
            <button key={oz} onClick={() => addWater(oz)} className="btn-outline w-full justify-start py-2">
              <Plus size={16} /> {oz} oz
            </button>
          ))}
        </div>
      </div>
    </CardPad>
  );
}

/* ------------------------------ workout ---------------------------------- */
export function WorkoutWidget() {
  const stats = useTodayStats();
  return (
    <CardPad>
      <SectionTitle
        title="Today's workout"
        icon={<Dumbbell size={18} />}
        action={<Link href="/fitness" className="text-sm text-brand-600 hover:underline">View plan</Link>}
      />
      {stats.workoutToday ? (
        <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3">
          <div>
            <div className="font-medium">{stats.workoutToday.name}</div>
            <div className="text-sm text-text-muted">
              {stats.workoutToday.durationMin} min · {stats.workoutToday.calories} kcal
            </div>
          </div>
          <Badge color="mint">Completed ✓</Badge>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-3">
          <div>
            <div className="font-medium">Full Body Strength A</div>
            <div className="text-sm text-text-muted">4 exercises · ~50 min</div>
          </div>
          <Link href="/fitness" className="btn-primary py-2">Start</Link>
        </div>
      )}
    </CardPad>
  );
}

/* ------------------------------- meals ----------------------------------- */
export function MealsWidget() {
  const stats = useTodayStats();
  const meals = useProfileRows("mealPlans");
  const t = todayISO();
  const todaysMeals = useMemo(() => meals.filter((m) => m.date === t), [meals, t]);
  return (
    <CardPad>
      <SectionTitle
        title="Meals today"
        icon={<Utensils size={18} />}
        action={<Link href="/nutrition" className="text-sm text-brand-600 hover:underline">Log meal</Link>}
      />
      <div className="space-y-2">
        {todaysMeals.length === 0 && <p className="text-sm text-text-muted">No meals logged yet today.</p>}
        {todaysMeals.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-xl bg-surface-muted px-4 py-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <Badge color="amber" className="capitalize w-20 justify-center">{m.meal}</Badge>
              <span className="truncate">{m.name}</span>
            </div>
            <span className="text-sm text-text-muted shrink-0">{m.calories} kcal</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-text-muted">Protein today</span>
        <span className="font-medium">{stats.proteinToday} g</span>
      </div>
    </CardPad>
  );
}

/* ------------------------------- macros ---------------------------------- */
export function MacrosWidget() {
  const meals = useProfileRows("mealPlans");
  const t = todayISO();
  const macros = useMemo(() => {
    const today = meals.filter((m) => m.date === t);
    return {
      protein: today.reduce((a, m) => a + (m.protein || 0), 0),
      carbs: today.reduce((a, m) => a + (m.carbs || 0), 0),
      fat: today.reduce((a, m) => a + (m.fat || 0), 0),
    };
  }, [meals, t]);
  const targets = { protein: 140, carbs: 220, fat: 70 };
  const rows: { label: string; value: number; target: number; color: string }[] = [
    { label: "Protein", value: macros.protein, target: targets.protein, color: "bg-brand-500" },
    { label: "Carbs", value: macros.carbs, target: targets.carbs, color: "bg-amber-500" },
    { label: "Fat", value: macros.fat, target: targets.fat, color: "bg-violet-500" },
  ];
  return (
    <CardPad>
      <SectionTitle
        title="Macros today"
        icon={<Flame size={18} />}
        action={<Link href="/nutrition" className="text-sm text-brand-600 hover:underline">Details</Link>}
      />
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{r.label}</span>
              <span className="text-text-muted">{r.value} / {r.target} g</span>
            </div>
            <ProgressBar value={(r.value / r.target) * 100} color={r.color} />
          </div>
        ))}
      </div>
    </CardPad>
  );
}

/* ------------------------------- weight ---------------------------------- */
export function WeightWidget() {
  const stats = useTodayStats();
  const weights = useProfileRows("weights");
  const weightSeries = useMemo(
    () =>
      [...weights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-21)
        .map((w) => ({ label: w.date.slice(5), value: w.lbs })),
    [weights],
  );
  return (
    <CardPad>
      <SectionTitle
        title="Weight trend"
        icon={stats.weightDelta <= 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
        subtitle={
          stats.latestWeight
            ? `${stats.latestWeight} lbs · ${stats.weightDelta <= 0 ? "" : "+"}${stats.weightDelta} lbs this week`
            : undefined
        }
        action={<Link href="/health" className="text-sm text-brand-600 hover:underline">Details</Link>}
      />
      {weightSeries.length > 1 ? (
        <AreaTrend data={weightSeries} unit="lbs" height={180} color="var(--color-mint-500)" />
      ) : (
        <p className="text-sm text-text-muted">Log a weigh-in to see your trend.</p>
      )}
    </CardPad>
  );
}

/* -------------------------------- steps ---------------------------------- */
export function StepsWidget() {
  const stats = useTodayStats();
  const stepPct = Math.round((stats.steps / stats.stepGoal) * 100);
  // Steps are synthetic for the demo; derive a stable 7-day series from today's value.
  const series = useMemo(() => {
    const factors = [0.82, 1.1, 0.94, 1.18, 0.76, 1.04, 1.0];
    const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
    return factors.map((f, i) => ({ label: days[i], value: Math.round(stats.steps * f) }));
  }, [stats.steps]);
  return (
    <CardPad>
      <SectionTitle
        title="Steps"
        icon={<Footprints size={18} />}
        subtitle={`${stats.steps.toLocaleString()} of ${stats.stepGoal.toLocaleString()}`}
      />
      <div className="flex items-center gap-4">
        <ProgressRing value={stepPct} color="var(--color-brand-500)" label={<span className="text-brand-600">{Math.min(999, stepPct)}%</span>} />
        <div className="flex-1 min-w-0">
          <MiniSpark data={series} color="var(--color-brand-500)" />
        </div>
      </div>
    </CardPad>
  );
}

/* -------------------------------- sleep ---------------------------------- */
export function SleepWidget() {
  const stats = useTodayStats();
  const sleepLogs = useProfileRows("sleepLogs");
  const series = useDailySeries(sleepLogs, "hours", 7, "last");
  const sleepHrs = stats.sleepLast?.hours ?? 0;
  return (
    <CardPad>
      <SectionTitle
        title="Sleep"
        icon={<Moon size={18} />}
        subtitle={stats.sleepLast ? `Last night ${sleepHrs} h · goal ${stats.sleepGoal} h` : undefined}
        action={<Link href="/wellness" className="text-sm text-brand-600 hover:underline">Details</Link>}
      />
      <BarTrend data={series} unit="h" height={160} color="#a855f7" goal={stats.sleepGoal} />
    </CardPad>
  );
}

/* --------------------------------- mood ---------------------------------- */
export function MoodWidget() {
  const stats = useTodayStats();
  const moods = useProfileRows("moods");
  const series = useDailySeries(moods, "mood", 14, "last");
  const last = stats.moodLast;
  const emoji = last ? MOOD_EMOJI[Math.max(0, Math.min(4, Math.round(last.mood) - 1))] : "🙂";
  return (
    <CardPad>
      <SectionTitle
        title="Mood"
        icon={<Smile size={18} />}
        subtitle={last ? `Feeling ${emoji} on ${relativeDay(last.date)}` : "No check-ins yet"}
        action={<Link href="/wellness" className="text-sm text-brand-600 hover:underline">Check in</Link>}
      />
      <div className="flex items-center gap-4">
        <span className="text-4xl shrink-0">{emoji}</span>
        <div className="flex-1 min-w-0">
          <LineTrend data={series} height={140} color="#f59e0b" />
        </div>
      </div>
    </CardPad>
  );
}

/* ----------------------------- medications ------------------------------- */
export function MedicationsWidget() {
  const medications = useCollection("medications");
  const upcomingMeds = useMemo(
    () => medications.filter((m) => m.active && m.nextDose).slice(0, 3),
    [medications],
  );
  return (
    <CardPad>
      <SectionTitle title="Medications" icon={<Pill size={18} />} action={<Link href="/medications" className="text-sm text-brand-600 hover:underline">All</Link>} />
      <div className="space-y-2">
        {upcomingMeds.length === 0 && <p className="text-sm text-text-muted">No reminders.</p>}
        {upcomingMeds.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-sm">
            <span className="truncate">{m.name} · {m.dosage}</span>
            <Badge color="gray">{m.nextDose}</Badge>
          </div>
        ))}
      </div>
    </CardPad>
  );
}

/* ----------------------------- appointments ------------------------------ */
export function AppointmentsWidget() {
  const appointments = useCollection("appointments");
  const t = todayISO();
  const upcomingAppts = useMemo(
    () => [...appointments].filter((a) => a.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3),
    [appointments, t],
  );
  return (
    <CardPad>
      <SectionTitle title="Upcoming" icon={<CalendarDays size={18} />} action={<Link href="/appointments" className="text-sm text-brand-600 hover:underline">All</Link>} />
      <div className="space-y-2">
        {upcomingAppts.length === 0 && <p className="text-sm text-text-muted">Nothing scheduled.</p>}
        {upcomingAppts.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-sm">
            <span className="truncate">{a.title}</span>
            <Badge color="brand">{relativeDay(a.date)}</Badge>
          </div>
        ))}
      </div>
    </CardPad>
  );
}

/* --------------------------------- goals --------------------------------- */
export function GoalsWidget() {
  const goals = useProfileRows("goals");
  const topGoals = useMemo(() => goals.slice(0, 4), [goals]);
  return (
    <CardPad>
      <SectionTitle title="Goals" icon={<Target size={18} />} action={<Link href="/health" className="text-sm text-brand-600 hover:underline">All</Link>} />
      <div className="space-y-3">
        {topGoals.length === 0 && <p className="text-sm text-text-muted">No goals set yet.</p>}
        {topGoals.map((g) => {
          const pct = g.target ? (g.current / g.target) * 100 : 0;
          return (
            <div key={g.id}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate">{g.title}</span>
                <span className="text-text-muted shrink-0">{g.current}/{g.target} {g.unit}</span>
              </div>
              <ProgressBar value={pct} color="bg-brand-500" />
            </div>
          );
        })}
      </div>
    </CardPad>
  );
}

/* -------------------------------- streaks -------------------------------- */
export function StreaksWidget() {
  const habits = useProfileRows("habits");
  const topHabits = useMemo(() => habits.slice(0, 3), [habits]);
  return (
    <CardPad>
      <SectionTitle title="Streaks" icon={<Flame size={18} />} action={<Link href="/wellness" className="text-sm text-brand-600 hover:underline">All</Link>} />
      <div className="space-y-3">
        {topHabits.length === 0 && <p className="text-sm text-text-muted">No habits yet.</p>}
        {topHabits.map((h) => (
          <div key={h.id}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{h.icon} {h.name}</span>
              <span className="font-medium text-mint-600">{h.streak} day{h.streak === 1 ? "" : "s"} 🔥</span>
            </div>
            <ProgressBar value={Math.min(100, h.streak * 10)} color="bg-mint-500" />
          </div>
        ))}
      </div>
    </CardPad>
  );
}

/* --------------------------------- pets ---------------------------------- */
export function PetsWidget() {
  const pets = usePets();
  const appointments = useCollection("appointments");
  const medications = useCollection("medications");
  const t = todayISO();
  const petReminders = useMemo(() => {
    const items: { pet: string; text: string }[] = [];
    appointments.filter((a) => a.forPet && a.date >= t).forEach((a) => {
      const pet = pets.find((p) => p.id === a.profileId);
      items.push({ pet: pet?.name ?? "Pet", text: `${a.title} — ${relativeDay(a.date)}` });
    });
    medications.filter((m) => m.forPet && m.refillDate).forEach((m) => {
      const pet = pets.find((p) => p.id === m.profileId);
      items.push({ pet: pet?.name ?? "Pet", text: `${m.name} refill — ${relativeDay(m.refillDate!)}` });
    });
    return items.slice(0, 3);
  }, [appointments, medications, pets, t]);
  return (
    <CardPad>
      <SectionTitle title="Pet care" icon={<PawPrint size={18} />} action={<Link href="/pets" className="text-sm text-brand-600 hover:underline">All</Link>} />
      <div className="space-y-2 text-sm">
        {petReminders.length === 0 && <p className="text-text-muted">No pet reminders.</p>}
        {petReminders.map((p, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="truncate">{p.text}</span>
            <Badge color="violet">{p.pet}</Badge>
          </div>
        ))}
      </div>
    </CardPad>
  );
}

/* -------------------------------- family --------------------------------- */
export function FamilyWidget() {
  const profiles = useProfiles();
  const notifications = useCollection("notifications");
  const familyNotifs = useMemo(
    () => notifications.filter((n) => n.kind === "family").slice(0, 4),
    [notifications],
  );
  return (
    <CardPad>
      <SectionTitle title="Family" icon={<Users size={18} />} action={<Link href="/family" className="text-sm text-brand-600 hover:underline">View</Link>} />
      <div className="space-y-2 text-sm">
        {familyNotifs.length === 0 && <p className="text-text-muted">No family updates.</p>}
        {familyNotifs.map((n) => {
          const p = profiles.find((x) => x.id === n.profileId);
          return (
            <div key={n.id} className="flex items-center gap-2">
              {p && <Avatar name={p.name} emoji={p.avatar} color={p.color} size={24} />}
              <span className="truncate">{n.title}</span>
            </div>
          );
        })}
      </div>
    </CardPad>
  );
}

/* --------------------------------- quote --------------------------------- */
export function QuoteWidget() {
  const quote = useDailyQuote();
  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white animate-in h-full">
      <Quote size={20} className="text-brand-200" />
      <p className="mt-2 font-medium leading-snug">{quote}</p>
    </div>
  );
}
