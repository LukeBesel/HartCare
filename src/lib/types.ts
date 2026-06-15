/**
 * HartCare domain model.
 * These types mirror the Supabase tables defined in supabase/schema.sql.
 * The local-first store (src/lib/store.ts) keeps collections of these
 * so the app is fully functional without a live backend, while the
 * Supabase client (src/lib/supabase) is ready to take over when configured.
 */

export type Role = "parent" | "adult" | "child" | "guest";
export type Species = "dog" | "cat";
export type PlanTier = "free" | "premium" | "family";

export interface Profile {
  id: string;
  householdId: string;
  name: string;
  role: Role;
  avatar?: string; // emoji or data URL
  color: string; // accent for the profile
  birthdate?: string;
  isPet?: false;
}

export interface Household {
  id: string;
  name: string;
  ownerId: string;
}

export interface HealthProfile {
  id: string;
  profileId: string;
  heightCm?: number;
  bloodType?: string;
  restingHeartRate?: number;
  notes?: string;
}

/** Generic dated metric used by weights, water, sleep, moods, etc. */
export interface Weight {
  id: string;
  profileId: string;
  date: string;
  lbs: number;
  bodyFat?: number;
}

export interface Measurement {
  id: string;
  profileId: string;
  date: string;
  part: string; // waist, chest, arms...
  inches: number;
}

export interface Goal {
  id: string;
  profileId: string;
  title: string;
  category: "weight" | "steps" | "water" | "sleep" | "fitness" | "habit";
  target: number;
  current: number;
  unit: string;
  due?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  type: string; // strength, cardio, mobility
  sets?: number;
  reps?: number;
  restSec?: number;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  profileId: string;
  name: string;
  category:
    | "weight_loss"
    | "muscle_gain"
    | "general"
    | "strength"
    | "running"
    | "walking"
    | "cycling"
    | "home"
    | "senior";
  level: "beginner" | "intermediate" | "advanced";
  day: string; // Mon..Sun
  exercises: Exercise[];
}

export interface WorkoutSession {
  id: string;
  profileId: string;
  workoutId?: string;
  date: string;
  name: string;
  durationMin: number;
  calories: number;
  completed: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  tags: string[]; // keto, high_protein, vegetarian, kid_friendly...
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  favorite?: boolean;
  aiGenerated?: boolean;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealPlan {
  id: string;
  profileId: string;
  date: string;
  meal: MealType;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  recipeId?: string;
}

export interface GroceryItem {
  id: string;
  householdId: string;
  name: string;
  qty?: string;
  category: string;
  checked: boolean;
}

export interface WaterLog {
  id: string;
  profileId: string;
  date: string;
  oz: number;
}

export interface SleepLog {
  id: string;
  profileId: string;
  date: string;
  hours: number;
  quality: number; // 1-5
  bedtime?: string;
  wake?: string;
}

export interface Medication {
  id: string;
  profileId: string; // may reference a pet id too
  forPet?: boolean;
  name: string;
  dosage: string;
  frequency: string;
  nextDose?: string;
  refillDate?: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  profileId: string;
  forPet?: boolean;
  type: "doctor" | "dentist" | "eye" | "therapy" | "vet" | "other";
  title: string;
  provider?: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
}

export interface Allergy {
  id: string;
  profileId: string;
  name: string;
  severity: "mild" | "moderate" | "severe";
  reaction?: string;
}

export interface Condition {
  id: string;
  profileId: string;
  name: string;
  since?: string;
  notes?: string;
}

/** Generic clinical reading: blood pressure, heart rate, glucose, labs, etc. */
export interface Vital {
  id: string;
  profileId: string;
  date: string;
  type:
    | "blood_pressure"
    | "heart_rate"
    | "blood_sugar"
    | "cholesterol"
    | "temperature"
    | "oxygen"
    | "lab";
  value: number; // primary value (e.g. systolic, bpm, mg/dL)
  value2?: number; // optional secondary (e.g. diastolic)
  unit: string;
  label?: string; // for labs, e.g. "LDL", "HbA1c"
  note?: string;
}

export interface Mood {
  id: string;
  profileId: string;
  date: string;
  mood: number; // 1-5
  stress: number; // 1-5
  note?: string;
  gratitude?: string;
}

export interface Habit {
  id: string;
  profileId: string;
  name: string;
  icon: string;
  streak: number;
  doneDates: string[];
  target: string; // daily, 3x/week...
}

export interface Pet {
  id: string;
  householdId: string;
  name: string;
  species: Species;
  breed?: string;
  birthdate?: string;
  weightLbs?: number;
  avatar?: string;
  notes?: string;
  isPet: true;
}

export interface PetWeight {
  id: string;
  petId: string;
  date: string;
  lbs: number;
}

export interface PetVaccination {
  id: string;
  petId: string;
  name: string;
  date: string;
  nextDue?: string;
}

export interface PetFeeding {
  id: string;
  petId: string;
  food: string;
  amount: string;
  schedule: string;
}

export type NotificationKind =
  | "medication"
  | "appointment"
  | "water"
  | "workout"
  | "family"
  | "pet"
  | "goal"
  | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  date: string;
  read: boolean;
  profileId?: string;
}

export interface ProgressPhoto {
  id: string;
  profileId: string;
  date: string;
  dataUrl: string;
  note?: string;
}

export interface Subscription {
  tier: PlanTier;
  status: "active" | "trialing" | "canceled";
  hartHomeConnected: boolean;
  renewsOn?: string;
  seats: number;
}

export interface Settings {
  theme: "light" | "dark" | "system";
  units: "imperial" | "metric";
  notificationsEnabled: boolean;
  waterGoalOz: number;
  stepGoal: number;
  sleepGoalHours: number;
}
