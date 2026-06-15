"use client";

import { AreaTrend, BarTrend, LineTrend, MiniSpark, type Point } from "@/components/charts";
import {
  Card,
  CardPad,
  EmptyState,
  PageHeader,
  SectionTitle,
  Segmented,
} from "@/components/ui";
import { useDailySeries, useProfileRows } from "@/lib/hooks";
import { useCollection, useCurrentProfile, usePets, useSettings } from "@/lib/store";
import { isoDaysAgo, round, sum } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Droplets,
  Dumbbell,
  HeartPulse,
  Moon,
  PawPrint,
  Smile,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

type Range = "7" | "14" | "30";
type Metric =
  | "weight"
  | "calories"
  | "water"
  | "sleep"
  | "exercise"
  | "steps"
  | "bp"
  | "mood"
  | "pet";

const RANGE_OPTIONS: { label: string; value: Range }[] = [
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
];

const METRICS: { label: string; value: Metric; icon: React.ReactNode }[] = [
  { label: "Weight", value: "weight", icon: <TrendingUp size={15} /> },
  { label: "Calories", value: "calories", icon: <Activity size={15} /> },
  { label: "Water", value: "water", icon: <Droplets size={15} /> },
  { label: "Sleep", value: "sleep", icon: <Moon size={15} /> },
  { label: "Exercise", value: "exercise", icon: <Dumbbell size={15} /> },
  { label: "Steps", value: "steps", icon: <Activity size={15} /> },
  { label: "Blood pressure", value: "bp", icon: <HeartPulse size={15} /> },
  { label: "Mood", value: "mood", icon: <Smile size={15} /> },
  { label: "Pet weight", value: "pet", icon: <PawPrint size={15} /> },
];

/** Deterministic pseudo-step series so the demo always renders the same shape. */
function useStepSeries(days: number): Point[] {
  return useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const idx = days - 1 - i;
      const date = isoDaysAgo(idx);
      const d = new Date(date + "T00:00:00");
      // Smooth pseudo-random variation around 8000.
      const wobble = Math.sin(idx * 1.3) * 1800 + Math.cos(idx * 0.7) * 900;
      const value = Math.max(2500, Math.round(8000 + wobble));
      return {
        label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
        value,
      };
    });
  }, [days]);
}

export default function AnalyticsPage() {
  const profile = useCurrentProfile();
  const pets = usePets();
  const settings = useSettings();

  const [range, setRange] = useState<Range>("14");
  const [metric, setMetric] = useState<Metric>("weight");
  const days = Number(range);

  // ---- Collections (stable arrays; filter via hooks/useMemo) -------------
  const weights = useProfileRows("weights");
  const meals = useProfileRows("mealPlans");
  const water = useProfileRows("waterLogs");
  const sleep = useProfileRows("sleepLogs");
  const sessions = useProfileRows("workoutSessions");
  const vitals = useProfileRows("vitals");
  const moods = useProfileRows("moods");
  const petWeightsAll = useCollection("petWeights");

  const firstPet = pets[0];
  const petWeights = useMemo(
    () => (firstPet ? petWeightsAll.filter((w) => w.petId === firstPet.id) : []),
    [petWeightsAll, firstPet],
  );

  const bpRows = useMemo(
    () => vitals.filter((v) => v.type === "blood_pressure"),
    [vitals],
  );

  // ---- Series for the big chart ------------------------------------------
  const weightSeries = useDailySeries(weights, "lbs", days, "last");
  const caloriesSeries = useDailySeries(meals, "calories", days, "sum");
  const waterSeries = useDailySeries(water, "oz", days, "sum");
  const sleepSeries = useDailySeries(sleep, "hours", days, "last");
  const exerciseSeries = useDailySeries(sessions, "calories", days, "sum");
  const stepsSeries = useStepSeries(days);
  const bpSeries = useDailySeries(bpRows, "value", days, "last");
  const moodSeries = useDailySeries(moods, "mood", days, "last");
  const petSeries = useDailySeries(petWeights, "lbs", days, "last");

  function hasData(s: Point[]) {
    return s.some((p) => p.value > 0);
  }

  function renderBigChart() {
    switch (metric) {
      case "weight":
        return hasData(weightSeries) ? (
          <AreaTrend data={weightSeries} unit="lbs" color="var(--color-mint-500)" height={260} />
        ) : (
          <ChartEmpty label="weight" />
        );
      case "calories":
        return hasData(caloriesSeries) ? (
          <BarTrend data={caloriesSeries} unit="kcal" height={260} />
        ) : (
          <ChartEmpty label="meals" />
        );
      case "water":
        return hasData(waterSeries) ? (
          <BarTrend data={waterSeries} unit="oz" color="#38bdf8" goal={settings.waterGoalOz} height={260} />
        ) : (
          <ChartEmpty label="water" />
        );
      case "sleep":
        return hasData(sleepSeries) ? (
          <BarTrend data={sleepSeries} unit="hrs" color="#a855f7" goal={settings.sleepGoalHours} height={260} />
        ) : (
          <ChartEmpty label="sleep" />
        );
      case "exercise":
        return hasData(exerciseSeries) ? (
          <BarTrend data={exerciseSeries} unit="kcal" height={260} />
        ) : (
          <ChartEmpty label="workouts" />
        );
      case "steps":
        return <LineTrend data={stepsSeries} unit="steps" height={260} />;
      case "bp":
        return hasData(bpSeries) ? (
          <LineTrend data={bpSeries} unit="mmHg" color="#f43f5e" height={260} />
        ) : (
          <ChartEmpty label="blood pressure" />
        );
      case "mood":
        return hasData(moodSeries) ? (
          <LineTrend data={moodSeries} unit="/ 5" color="#a855f7" height={260} />
        ) : (
          <ChartEmpty label="mood" />
        );
      case "pet":
        if (!firstPet) return <ChartEmpty label="pet weight" />;
        return hasData(petSeries) ? (
          <LineTrend data={petSeries} unit="lbs" color="#38bdf8" height={260} />
        ) : (
          <ChartEmpty label="pet weight" />
        );
    }
  }

  // ---- Insights ----------------------------------------------------------
  const insights = useMemo(() => {
    const out: string[] = [];

    const sleptDays = sleepSeries.filter((p) => p.value > 0);
    if (sleptDays.length) {
      const avg = round(sum(sleptDays.map((p) => p.value)) / sleptDays.length, 1);
      const vsGoal = round(avg - settings.sleepGoalHours, 1);
      out.push(
        vsGoal >= 0
          ? `You're averaging ${avg} hrs of sleep — right on track with your ${settings.sleepGoalHours} hr goal. Lovely.`
          : `You're averaging ${avg} hrs of sleep, about ${Math.abs(vsGoal)} hr below your ${settings.sleepGoalHours} hr goal. A little earlier to bed could help.`,
      );
    }

    const wateredDays = waterSeries.filter((p) => p.value > 0);
    if (wateredDays.length) {
      const avg = Math.round(sum(wateredDays.map((p) => p.value)) / wateredDays.length);
      const metGoal = waterSeries.filter((p) => p.value >= settings.waterGoalOz).length;
      out.push(
        `Hydration is averaging ${avg} oz/day, and you met your ${settings.waterGoalOz} oz goal on ${metGoal} of the last ${days} days.`,
      );
    }

    const exDays = exerciseSeries.filter((p) => p.value > 0).length;
    if (exDays) {
      out.push(`You moved your body on ${exDays} of the last ${days} days — consistency is the win here.`);
    }

    const w = weightSeries.filter((p) => p.value > 0);
    if (w.length >= 2) {
      const delta = round(w[w.length - 1].value - w[0].value, 1);
      out.push(
        delta === 0
          ? "Your weight has held steady across this window — nice and stable."
          : `Your weight shifted ${delta > 0 ? "+" : ""}${delta} lbs over this window. Gentle, steady changes tend to last.`,
      );
    }

    return out.slice(0, 3);
  }, [sleepSeries, waterSeries, exerciseSeries, weightSeries, settings, days]);

  // ---- Summary cards -----------------------------------------------------
  const latestWeight = useMemo(
    () => [...weights].sort((a, b) => b.date.localeCompare(a.date))[0],
    [weights],
  );

  const summaryCards = [
    {
      label: "Weight",
      value: latestWeight ? latestWeight.lbs : "—",
      unit: latestWeight ? "lbs" : undefined,
      accent: "mint" as const,
      icon: <TrendingUp size={18} />,
      data: weightSeries,
      color: "var(--color-mint-500)",
    },
    {
      label: "Avg calories",
      value: avgOf(caloriesSeries),
      unit: "kcal",
      accent: "brand" as const,
      icon: <Activity size={18} />,
      data: caloriesSeries,
      color: "var(--color-brand-500)",
    },
    {
      label: "Avg water",
      value: avgOf(waterSeries),
      unit: "oz",
      accent: "brand" as const,
      icon: <Droplets size={18} />,
      data: waterSeries,
      color: "#38bdf8",
    },
    {
      label: "Avg sleep",
      value: avgOf(sleepSeries, 1),
      unit: "hrs",
      accent: "violet" as const,
      icon: <Moon size={18} />,
      data: sleepSeries,
      color: "#a855f7",
    },
    {
      label: "Avg steps",
      value: avgOf(stepsSeries).toLocaleString(),
      accent: "amber" as const,
      icon: <Activity size={18} />,
      data: stepsSeries,
      color: "#f59e0b",
    },
    {
      label: "Avg mood",
      value: avgOf(moodSeries, 1) || "—",
      unit: "/ 5",
      accent: "rose" as const,
      icon: <Smile size={18} />,
      data: moodSeries,
      color: "#f43f5e",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle={`Trends and insights for ${profile.name}`}
        action={<Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} />}
      />

      {/* Metric selector */}
      <div className="flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMetric(m.value)}
            className={
              metric === m.value
                ? "chip bg-brand-600 text-white"
                : "chip bg-surface-muted text-text-muted hover:text-text"
            }
          >
            <span className="shrink-0">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Big chart */}
      <CardPad>
        <SectionTitle
          title={METRICS.find((m) => m.value === metric)?.label ?? "Trend"}
          subtitle={`Last ${days} days`}
          icon={<BarChart3 size={18} />}
        />
        {renderBigChart()}
      </CardPad>

      {/* Summary cards */}
      <div>
        <SectionTitle title="At a glance" subtitle={`Averages over the last ${days} days`} icon={<TrendingUp size={18} />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryCards.map((c) => (
            <Card key={c.label} className="card-pad animate-in">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-muted">{c.label}</span>
                <span className="grid place-items-center h-9 w-9 rounded-xl bg-surface-muted text-text-muted">
                  {c.icon}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-text">{c.value}</span>
                {c.unit && <span className="text-sm text-text-muted">{c.unit}</span>}
              </div>
              <div className="mt-2 -mx-1">
                <MiniSpark data={c.data} color={c.color} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Insights */}
      <CardPad>
        <SectionTitle
          title="Trends & insights"
          subtitle="Plain-language observations — wellness guidance, not medical advice"
          icon={<Smile size={18} />}
        />
        {insights.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={20} />}
            title="Not enough data yet"
            description="Log a few days of water, sleep, meals or weight and your personal insights will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {insights.map((text, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface-muted px-4 py-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-mint-500" />
                <p className="text-sm text-text">{text}</p>
              </li>
            ))}
          </ul>
        )}
      </CardPad>
    </div>
  );
}

function avgOf(series: Point[], dp = 0): number {
  const filled = series.filter((p) => p.value > 0);
  if (!filled.length) return 0;
  return round(sum(filled.map((p) => p.value)) / filled.length, dp);
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <EmptyState
      icon={<BarChart3 size={20} />}
      title={`No ${label} data yet`}
      description={`Log some ${label} to see this trend over time.`}
    />
  );
}
