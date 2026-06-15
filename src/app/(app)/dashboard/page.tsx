"use client";

import { AreaTrend } from "@/components/charts";
import { Avatar, Badge, Card, CardPad, ProgressBar, ProgressRing, SectionTitle } from "@/components/ui";
import { useDailyQuote, useProfileRows, useTodayStats } from "@/lib/hooks";
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
  TrendingDown,
  TrendingUp,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function DashboardPage() {
  const profile = useCurrentProfile();
  const profiles = useProfiles();
  const pets = usePets();
  const stats = useTodayStats();
  const quote = useDailyQuote();
  const add = useStore((s) => s.add);

  const meals = useProfileRows("mealPlans");
  const weights = useProfileRows("weights");
  const habits = useProfileRows("habits");
  const medications = useCollection("medications");
  const appointments = useCollection("appointments");
  const notifications = useCollection("notifications");

  const t = todayISO();
  const todaysMeals = useMemo(() => meals.filter((m) => m.date === t), [meals, t]);

  const weightSeries = useMemo(
    () =>
      [...weights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-21)
        .map((w) => ({ label: w.date.slice(5), value: w.lbs })),
    [weights],
  );

  const upcomingMeds = medications.filter((m) => m.active && m.nextDose).slice(0, 3);
  const upcomingAppts = useMemo(
    () => [...appointments].filter((a) => a.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3),
    [appointments, t],
  );
  const familyNotifs = notifications.filter((n) => n.kind === "family").slice(0, 2);
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stepPct = Math.round((stats.steps / stats.stepGoal) * 100);
  const waterPct = Math.round((stats.waterToday / stats.waterGoal) * 100);
  const sleepHrs = stats.sleepLast?.hours ?? 0;
  const sleepPct = Math.round((sleepHrs / stats.sleepGoal) * 100);
  const calPct = Math.round((stats.caloriesToday / stats.calorieTarget) * 100);

  function addWater(oz: number) {
    add("waterLogs", { profileId: profile.id, date: t, oz });
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
        <Link href="/coach" className="btn-primary">
          Ask your coach
        </Link>
      </div>

      {/* Activity rings */}
      <Card className="card-pad animate-in">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <RingStat ring={stepPct} color="var(--color-brand-500)" icon={<Footprints size={18} />} label="Steps" value={stats.steps.toLocaleString()} sub={`of ${stats.stepGoal.toLocaleString()}`} />
          <RingStat ring={waterPct} color="#38bdf8" icon={<Droplets size={18} />} label="Water" value={`${stats.waterToday} oz`} sub={`of ${stats.waterGoal} oz`} />
          <RingStat ring={sleepPct} color="#a855f7" icon={<Moon size={18} />} label="Sleep" value={`${sleepHrs} h`} sub={`of ${stats.sleepGoal} h`} />
          <RingStat ring={calPct} color="var(--color-mint-500)" icon={<Flame size={18} />} label="Calories" value={stats.caloriesToday.toLocaleString()} sub={`of ${stats.calorieTarget.toLocaleString()}`} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's workout */}
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

          {/* Meals */}
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

          {/* Weight trend */}
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
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Water quick add */}
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

          {/* Medication reminders */}
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

          {/* Appointments */}
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

          {/* Streaks / habits */}
          <CardPad>
            <SectionTitle title="Streaks" icon={<Flame size={18} />} action={<Link href="/wellness" className="text-sm text-brand-600 hover:underline">All</Link>} />
            <div className="space-y-3">
              {habits.slice(0, 3).map((h) => (
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

          {/* Pet reminders */}
          {petReminders.length > 0 && (
            <CardPad>
              <SectionTitle title="Pet care" icon={<PawPrint size={18} />} action={<Link href="/pets" className="text-sm text-brand-600 hover:underline">All</Link>} />
              <div className="space-y-2 text-sm">
                {petReminders.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="truncate">{p.text}</span>
                    <Badge color="violet">{p.pet}</Badge>
                  </div>
                ))}
              </div>
            </CardPad>
          )}

          {/* Family notifications */}
          {familyNotifs.length > 0 && (
            <CardPad>
              <SectionTitle title="Family" icon={<TrendingUp size={18} />} action={<Link href="/family" className="text-sm text-brand-600 hover:underline">View</Link>} />
              <div className="space-y-2 text-sm">
                {familyNotifs.map((n) => (
                  <div key={n.id} className="flex items-center gap-2">
                    {(() => {
                      const p = profiles.find((x) => x.id === n.profileId);
                      return p ? <Avatar name={p.name} emoji={p.avatar} color={p.color} size={24} /> : null;
                    })()}
                    <span className="truncate">{n.title}</span>
                  </div>
                ))}
              </div>
            </CardPad>
          )}

          {/* Quote */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-600 to-brand-700 text-white animate-in">
            <Quote size={20} className="text-brand-200" />
            <p className="mt-2 font-medium leading-snug">{quote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <ProgressRing value={ring} color={color} size={68} label={<span style={{ color }}>{Math.min(999, ring)}%</span>} />
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
