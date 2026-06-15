import type { ArrayKeys } from "@/lib/store";

/**
 * Maps the local-first store collection keys to their Supabase tables, and
 * converts between the store's camelCase records and Postgres snake_case rows.
 * Used by the sync layer (src/lib/db/sync.ts) when a live backend is configured.
 */
export const TABLE_FOR: Record<ArrayKeys, string> = {
  households: "households",
  profiles: "profiles",
  healthProfiles: "health_profiles",
  weights: "weights",
  measurements: "measurements",
  vitals: "vitals",
  goals: "goals",
  workouts: "workouts",
  workoutSessions: "workout_sessions",
  recipes: "recipes",
  mealPlans: "meal_plans",
  groceryItems: "grocery_items",
  waterLogs: "water_logs",
  sleepLogs: "sleep_logs",
  medications: "medications",
  appointments: "appointments",
  allergies: "allergies",
  conditions: "conditions",
  moods: "moods",
  habits: "habits",
  pets: "pets",
  petWeights: "pet_weights",
  petVaccinations: "pet_vaccinations",
  petFeeding: "pet_feeding",
  notifications: "notifications",
  progressPhotos: "progress_photos",
};

export const ALL_COLLECTIONS = Object.keys(TABLE_FOR) as ArrayKeys[];

const toSnake = (s: string) => s.replace(/[A-Z0-9]+/g, (m) => "_" + m.toLowerCase());
const toCamel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

export function rowToColumns(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[toSnake(k)] = v;
  return out;
}

export function columnsToRow(cols: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cols)) out[toCamel(k)] = v;
  return out;
}
