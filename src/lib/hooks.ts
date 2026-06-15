"use client";

import { useMemo, useState } from "react";
import { useCollection, useCurrentProfile, useStore } from "./store";
import type { ArrayKeys, ItemOf } from "./store";
import { isoDaysAgo, sum, todayISO } from "./utils";

/** Rows of a collection that belong to the active profile (via `profileId`). */
export function useProfileRows<K extends ArrayKeys>(key: K): ItemOf<K>[] {
  const rows = useCollection(key);
  const profile = useCurrentProfile();
  return useMemo(
    () =>
      rows.filter(
        (r) => (r as { profileId?: string }).profileId === profile.id,
      ),
    [rows, profile.id],
  );
}

/** A {label,value} series from dated rows over the last `days` days. */
export function useDailySeries<T extends { date: string }>(
  rows: T[],
  field: keyof T & string,
  days = 14,
  agg: "sum" | "last" | "avg" = "last",
) {
  return useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const date = isoDaysAgo(days - 1 - i);
      const dayRows = rows.filter((r) => r.date === date);
      const vals = dayRows.map((r) => Number(r[field]) || 0);
      let value = 0;
      if (vals.length) {
        if (agg === "sum") value = sum(vals);
        else if (agg === "avg") value = sum(vals) / vals.length;
        else value = vals[vals.length - 1];
      }
      const d = new Date(date + "T00:00:00");
      return { label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2), value: Math.round(value * 10) / 10 };
    });
  }, [rows, field, days, agg]);
}

/** High-level numbers for today, used by the dashboard. */
export function useTodayStats() {
  const profile = useCurrentProfile();
  const settings = useStore((s) => s.db.settings);
  const water = useProfileRows("waterLogs");
  const sleep = useProfileRows("sleepLogs");
  const meals = useProfileRows("mealPlans");
  const weights = useProfileRows("weights");
  const sessions = useProfileRows("workoutSessions");
  const moods = useProfileRows("moods");

  return useMemo(() => {
    const t = todayISO();
    const waterToday = sum(water.filter((w) => w.date === t).map((w) => w.oz));
    const sleepLast = [...sleep].sort((a, b) => b.date.localeCompare(a.date))[0];
    const caloriesToday = sum(meals.filter((m) => m.date === t).map((m) => m.calories));
    const proteinToday = sum(meals.filter((m) => m.date === t).map((m) => m.protein));
    const sortedW = [...weights].sort((a, b) => b.date.localeCompare(a.date));
    const latestWeight = sortedW[0]?.lbs;
    const prevWeight = sortedW[7]?.lbs ?? sortedW[sortedW.length - 1]?.lbs;
    const workoutToday = sessions.find((s) => s.date === t);
    const moodLast = [...moods].sort((a, b) => b.date.localeCompare(a.date))[0];

    // Steps are simulated for the demo (no wearable connected).
    const steps = profile.role === "child" ? 9120 : 7820;
    const activeCalories = sum(sessions.filter((s) => s.date === t).map((s) => s.calories)) || 0;

    return {
      steps,
      stepGoal: settings.stepGoal,
      waterToday,
      waterGoal: settings.waterGoalOz,
      sleepLast,
      sleepGoal: settings.sleepGoalHours,
      caloriesToday,
      proteinToday,
      calorieTarget: profile.role === "child" ? 1800 : 2200,
      latestWeight,
      weightDelta: latestWeight != null && prevWeight != null ? Math.round((latestWeight - prevWeight) * 10) / 10 : 0,
      workoutToday,
      activeCalories,
      moodLast,
    };
  }, [water, sleep, meals, weights, sessions, moods, settings, profile.role]);
}

export const MOTIVATION = [
  "Small steps every day add up to big changes.",
  "Your only competition is who you were yesterday.",
  "Take care of your body — it's the only place you have to live.",
  "A little progress each day adds up to big results.",
  "Drink water, move often, sleep well, repeat.",
  "Healthy isn't a goal, it's a way of living.",
  "You don't have to be extreme, just consistent.",
];

export function useDailyQuote() {
  // Intentionally derived from the current date once per mount so the quote is
  // stable for the whole day; the date read is the point of the hook.
  const [quote] = useState(() => {
    const day = Math.floor(Date.now() / 86400000);
    return MOTIVATION[day % MOTIVATION.length];
  });
  return quote;
}
