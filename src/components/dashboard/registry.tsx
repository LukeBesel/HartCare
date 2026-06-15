"use client";

import type { DashboardWidgetId } from "@/lib/types";
import {
  CalendarDays,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  type LucideIcon,
  Moon,
  PawPrint,
  Pill,
  Quote,
  Smile,
  Target,
  TrendingUp,
  Users,
  Utensils,
  Weight,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  AppointmentsWidget,
  FamilyWidget,
  GoalsWidget,
  MacrosWidget,
  MealsWidget,
  MedicationsWidget,
  MoodWidget,
  PetsWidget,
  QuoteWidget,
  RingsWidget,
  SleepWidget,
  StepsWidget,
  StreaksWidget,
  WaterWidget,
  WeightWidget,
  WorkoutWidget,
} from "./widgets";

/** A single configurable option exposed by a widget. */
export type WidgetOption =
  | { key: string; label: string; type: "select"; choices: { label: string; value: string }[]; default: string }
  | { key: string; label: string; type: "number"; min: number; max: number; step?: number; default: number }
  | { key: string; label: string; type: "toggle"; default: boolean };

export interface WidgetMeta {
  title: string;
  icon: LucideIcon;
  options?: WidgetOption[];
  render: (options?: Record<string, string | number | boolean>) => ReactNode;
}

/** Read an option value with a fallback to its spec default. */
export function widgetOption<T extends string | number | boolean>(
  options: Record<string, string | number | boolean> | undefined,
  spec: { key: string; default: T },
): T {
  const v = options?.[spec.key];
  return (v === undefined ? spec.default : (v as T));
}

/** Reusable range-select spec for time-series widgets. */
const RANGE_OPTION: WidgetOption = {
  key: "range",
  label: "Chart range",
  type: "select",
  choices: [
    { label: "7 days", value: "7" },
    { label: "30 days", value: "30" },
    { label: "90 days", value: "90" },
  ],
  default: "30",
};

export const WIDGETS: Record<DashboardWidgetId, WidgetMeta> = {
  rings: { title: "Activity rings", icon: Flame, render: () => <RingsWidget /> },
  water: {
    title: "Water intake",
    icon: Droplets,
    options: [{ key: "goalOverride", label: "Goal override (oz, 0 = profile)", type: "number", min: 0, max: 200, step: 8, default: 0 }],
    render: (o) => <WaterWidget options={o} />,
  },
  workout: { title: "Today's workout", icon: Dumbbell, render: () => <WorkoutWidget /> },
  meals: {
    title: "Meals today",
    icon: Utensils,
    options: [{ key: "showMacros", label: "Show protein total", type: "toggle", default: true }],
    render: (o) => <MealsWidget options={o} />,
  },
  macros: { title: "Macros today", icon: Flame, render: () => <MacrosWidget /> },
  weight: { title: "Weight trend", icon: Weight, options: [RANGE_OPTION], render: (o) => <WeightWidget options={o} /> },
  steps: { title: "Steps", icon: Footprints, options: [RANGE_OPTION], render: (o) => <StepsWidget options={o} /> },
  sleep: { title: "Sleep", icon: Moon, options: [RANGE_OPTION], render: (o) => <SleepWidget options={o} /> },
  mood: { title: "Mood", icon: Smile, options: [RANGE_OPTION], render: (o) => <MoodWidget options={o} /> },
  medications: { title: "Medications", icon: Pill, render: () => <MedicationsWidget /> },
  appointments: { title: "Upcoming appointments", icon: CalendarDays, render: () => <AppointmentsWidget /> },
  goals: {
    title: "Goals",
    icon: Target,
    options: [{ key: "limit", label: "Goals shown", type: "number", min: 1, max: 8, default: 3 }],
    render: (o) => <GoalsWidget options={o} />,
  },
  streaks: { title: "Streaks", icon: Flame, render: () => <StreaksWidget /> },
  pets: { title: "Pet care", icon: PawPrint, render: () => <PetsWidget /> },
  family: { title: "Family", icon: Users, render: () => <FamilyWidget /> },
  quote: { title: "Motivational quote", icon: Quote, render: () => <QuoteWidget /> },
};

/** Width-span -> static Tailwind class. Static map: never build class names dynamically. */
export const SPAN_CLASS: Record<1 | 2 | 3, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
};

export function isWidgetId(id: string): id is DashboardWidgetId {
  return id in WIDGETS;
}

/** Re-export so consumers can show a generic icon when needed. */
export { TrendingUp };
