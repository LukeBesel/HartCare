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

export interface WidgetMeta {
  title: string;
  icon: LucideIcon;
  render: () => ReactNode;
}

export const WIDGETS: Record<DashboardWidgetId, WidgetMeta> = {
  rings: { title: "Activity rings", icon: Flame, render: () => <RingsWidget /> },
  water: { title: "Water intake", icon: Droplets, render: () => <WaterWidget /> },
  workout: { title: "Today's workout", icon: Dumbbell, render: () => <WorkoutWidget /> },
  meals: { title: "Meals today", icon: Utensils, render: () => <MealsWidget /> },
  macros: { title: "Macros today", icon: Flame, render: () => <MacrosWidget /> },
  weight: { title: "Weight trend", icon: Weight, render: () => <WeightWidget /> },
  steps: { title: "Steps", icon: Footprints, render: () => <StepsWidget /> },
  sleep: { title: "Sleep", icon: Moon, render: () => <SleepWidget /> },
  mood: { title: "Mood", icon: Smile, render: () => <MoodWidget /> },
  medications: { title: "Medications", icon: Pill, render: () => <MedicationsWidget /> },
  appointments: { title: "Upcoming appointments", icon: CalendarDays, render: () => <AppointmentsWidget /> },
  goals: { title: "Goals", icon: Target, render: () => <GoalsWidget /> },
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
