import { isoDaysAgo, isoDaysFromNow, todayISO, uid } from "./utils";
import { DEFAULT_DASHBOARD } from "./types";
import type {
  Allergy,
  AppNotification,
  Appointment,
  Condition,
  Goal,
  GroceryItem,
  Habit,
  HealthProfile,
  Household,
  MealPlan,
  Measurement,
  Medication,
  Mood,
  Pet,
  PetFeeding,
  PetVaccination,
  PetWeight,
  Profile,
  ProgressPhoto,
  Recipe,
  Settings,
  SleepLog,
  Subscription,
  Vital,
  WaterLog,
  Weight,
  Workout,
  WorkoutSession,
} from "./types";

export interface DB {
  households: Household[];
  profiles: Profile[];
  healthProfiles: HealthProfile[];
  weights: Weight[];
  measurements: Measurement[];
  vitals: Vital[];
  goals: Goal[];
  workouts: Workout[];
  workoutSessions: WorkoutSession[];
  recipes: Recipe[];
  mealPlans: MealPlan[];
  groceryItems: GroceryItem[];
  waterLogs: WaterLog[];
  sleepLogs: SleepLog[];
  medications: Medication[];
  appointments: Appointment[];
  allergies: Allergy[];
  conditions: Condition[];
  moods: Mood[];
  habits: Habit[];
  pets: Pet[];
  petWeights: PetWeight[];
  petVaccinations: PetVaccination[];
  petFeeding: PetFeeding[];
  notifications: AppNotification[];
  progressPhotos: ProgressPhoto[];
  subscription: Subscription;
  settings: Settings;
}

const HH = "hh_hartfamily";
const P_DAD = "p_dad";
const P_MOM = "p_mom";
const P_KID = "p_kid";
const P_GRAN = "p_gran";
const PET_DOG = "pet_dog";
const PET_CAT = "pet_cat";

function series(days: number, fn: (i: number) => number) {
  return Array.from({ length: days }, (_, i) => {
    const idx = days - 1 - i;
    return { date: isoDaysAgo(idx), value: fn(idx) };
  });
}

export function buildSeed(): DB {
  const households: Household[] = [
    { id: HH, name: "The Hart Family", ownerId: P_DAD },
  ];

  const profiles: Profile[] = [
    { id: P_DAD, householdId: HH, name: "Daniel", role: "parent", avatar: "🧔", color: "#2a59d6", birthdate: "1986-04-12" },
    { id: P_MOM, householdId: HH, name: "Maya", role: "parent", avatar: "👩", color: "#15ad76", birthdate: "1988-09-03" },
    { id: P_KID, householdId: HH, name: "Ollie", role: "child", avatar: "🧒", color: "#f59e0b", birthdate: "2015-06-21" },
    { id: P_GRAN, householdId: HH, name: "Grandma Rose", role: "adult", avatar: "👵", color: "#a855f7", birthdate: "1952-01-30" },
  ];

  const healthProfiles: HealthProfile[] = [
    { id: uid("hp"), profileId: P_DAD, heightCm: 180, bloodType: "O+", restingHeartRate: 58 },
    { id: uid("hp"), profileId: P_MOM, heightCm: 166, bloodType: "A+", restingHeartRate: 62 },
    { id: uid("hp"), profileId: P_KID, heightCm: 132, restingHeartRate: 80 },
    { id: uid("hp"), profileId: P_GRAN, heightCm: 158, bloodType: "B+", restingHeartRate: 70 },
  ];

  const weights: Weight[] = [
    ...series(60, (i) => 198 - (60 - i) * 0.18 + Math.sin(i / 4) * 0.6).map((d) => ({
      id: uid("w"), profileId: P_DAD, date: d.date, lbs: Math.round(d.value * 10) / 10, bodyFat: Math.round((22 - (60 - 0) * 0.01) * 10) / 10,
    })),
    ...series(60, (i) => 150 - (60 - i) * 0.08 + Math.cos(i / 5) * 0.5).map((d) => ({
      id: uid("w"), profileId: P_MOM, date: d.date, lbs: Math.round(d.value * 10) / 10,
    })),
  ];

  const measurements: Measurement[] = [
    { id: uid("m"), profileId: P_DAD, date: isoDaysAgo(30), part: "Waist", inches: 36 },
    { id: uid("m"), profileId: P_DAD, date: todayISO(), part: "Waist", inches: 34.5 },
    { id: uid("m"), profileId: P_DAD, date: isoDaysAgo(30), part: "Chest", inches: 42 },
    { id: uid("m"), profileId: P_DAD, date: todayISO(), part: "Chest", inches: 43 },
  ];

  const vitals: Vital[] = [
    ...series(30, (i) => 122 - Math.round(Math.sin(i / 6) * 4)).map((d) => ({
      id: uid("v"), profileId: P_DAD, date: d.date, type: "blood_pressure" as const,
      value: d.value, value2: 78 - Math.round(Math.sin(d.value / 30) * 3), unit: "mmHg",
    })),
    ...series(30, (i) => 58 + (i % 5)).map((d) => ({
      id: uid("v"), profileId: P_DAD, date: d.date, type: "heart_rate" as const, value: d.value, unit: "bpm",
    })),
    ...series(14, (i) => 95 + (i % 7) * 2).map((d) => ({
      id: uid("v"), profileId: P_DAD, date: d.date, type: "blood_sugar" as const, value: d.value, unit: "mg/dL",
    })),
    ...series(30, () => 128).map((d) => ({
      id: uid("v"), profileId: P_GRAN, date: d.date, type: "blood_pressure" as const, value: 134, value2: 84, unit: "mmHg",
    })),
    { id: uid("v"), profileId: P_DAD, date: isoDaysAgo(20), type: "cholesterol", value: 182, unit: "mg/dL", label: "Total" },
    { id: uid("v"), profileId: P_DAD, date: isoDaysAgo(20), type: "lab", value: 104, unit: "mg/dL", label: "LDL" },
    { id: uid("v"), profileId: P_DAD, date: isoDaysAgo(20), type: "lab", value: 58, unit: "mg/dL", label: "HDL" },
    { id: uid("v"), profileId: P_GRAN, date: isoDaysAgo(15), type: "cholesterol", value: 205, unit: "mg/dL", label: "Total" },
  ];

  const goals: Goal[] = [
    { id: uid("g"), profileId: P_DAD, title: "Lose 20 pounds", category: "weight", target: 178, current: 187, unit: "lbs", due: isoDaysFromNow(75) },
    { id: uid("g"), profileId: P_DAD, title: "Walk 10,000 steps", category: "steps", target: 10000, current: 7820, unit: "steps" },
    { id: uid("g"), profileId: P_DAD, title: "Drink 100 oz water", category: "water", target: 100, current: 64, unit: "oz" },
    { id: uid("g"), profileId: P_DAD, title: "Sleep 8 hours", category: "sleep", target: 8, current: 7.2, unit: "hrs" },
    { id: uid("g"), profileId: P_MOM, title: "Run a 5K", category: "fitness", target: 5, current: 3.2, unit: "km" },
    { id: uid("g"), profileId: P_MOM, title: "Drink 90 oz water", category: "water", target: 90, current: 72, unit: "oz" },
  ];

  const benchEx = [
    { id: uid("ex"), name: "Goblet Squat", muscle: "Legs", type: "strength", sets: 3, reps: 12, restSec: 60 },
    { id: uid("ex"), name: "Dumbbell Bench Press", muscle: "Chest", type: "strength", sets: 4, reps: 10, restSec: 90 },
    { id: uid("ex"), name: "Bent-over Row", muscle: "Back", type: "strength", sets: 4, reps: 10, restSec: 90 },
    { id: uid("ex"), name: "Plank", muscle: "Core", type: "strength", sets: 3, reps: 45, restSec: 45 },
  ];
  const cardioEx = [
    { id: uid("ex"), name: "Brisk Walk", muscle: "Full body", type: "cardio", sets: 1, reps: 30, restSec: 0 },
    { id: uid("ex"), name: "Cycling intervals", muscle: "Legs", type: "cardio", sets: 6, reps: 60, restSec: 60 },
  ];

  const workouts: Workout[] = [
    { id: uid("wo"), profileId: P_DAD, name: "Full Body Strength A", category: "muscle_gain", level: "intermediate", day: "Mon", exercises: benchEx },
    { id: uid("wo"), profileId: P_DAD, name: "Zone 2 Cardio", category: "weight_loss", level: "beginner", day: "Wed", exercises: cardioEx },
    { id: uid("wo"), profileId: P_DAD, name: "Full Body Strength B", category: "muscle_gain", level: "intermediate", day: "Fri", exercises: benchEx },
    { id: uid("wo"), profileId: P_MOM, name: "Couch to 5K — Week 4", category: "running", level: "beginner", day: "Tue", exercises: cardioEx },
    { id: uid("wo"), profileId: P_GRAN, name: "Gentle Mobility", category: "senior", level: "beginner", day: "Mon", exercises: [
      { id: uid("ex"), name: "Chair Sit-to-Stand", muscle: "Legs", type: "strength", sets: 2, reps: 10, restSec: 60 },
      { id: uid("ex"), name: "Wall Push-up", muscle: "Chest", type: "strength", sets: 2, reps: 10, restSec: 60 },
      { id: uid("ex"), name: "Balance Hold", muscle: "Core", type: "mobility", sets: 3, reps: 20, restSec: 30 },
    ] },
  ];

  const workoutSessions: WorkoutSession[] = [
    { id: uid("ws"), profileId: P_DAD, date: isoDaysAgo(0), name: "Full Body Strength A", durationMin: 52, calories: 410, completed: true },
    { id: uid("ws"), profileId: P_DAD, date: isoDaysAgo(2), name: "Zone 2 Cardio", durationMin: 35, calories: 320, completed: true },
    { id: uid("ws"), profileId: P_DAD, date: isoDaysAgo(4), name: "Full Body Strength B", durationMin: 48, calories: 395, completed: true },
    { id: uid("ws"), profileId: P_MOM, date: isoDaysAgo(1), name: "Couch to 5K", durationMin: 28, calories: 260, completed: true },
  ];

  const recipes: Recipe[] = [
    { id: uid("r"), name: "Greek Yogurt Power Bowl", tags: ["high_protein", "vegetarian", "breakfast"], servings: 1, calories: 320, protein: 28, carbs: 34, fat: 8, ingredients: ["1 cup Greek yogurt", "1/2 cup berries", "1 tbsp honey", "2 tbsp granola", "1 tbsp chia seeds"], instructions: ["Add yogurt to a bowl.", "Top with berries, granola, chia.", "Drizzle honey and serve."], favorite: true },
    { id: uid("r"), name: "Sheet-Pan Lemon Chicken", tags: ["high_protein", "family", "dinner"], servings: 4, calories: 480, protein: 42, carbs: 28, fat: 20, ingredients: ["4 chicken breasts", "2 cups broccoli", "1 lb baby potatoes", "2 lemons", "Olive oil", "Garlic, salt, pepper"], instructions: ["Preheat oven to 425°F.", "Toss everything with oil and seasoning.", "Roast 25–30 min until cooked through."] },
    { id: uid("r"), name: "Keto Avocado Eggs", tags: ["keto", "breakfast"], servings: 2, calories: 360, protein: 18, carbs: 6, fat: 30, ingredients: ["2 avocados", "4 eggs", "Salt, pepper", "Chili flakes"], instructions: ["Halve avocados, scoop a little out.", "Crack an egg into each.", "Bake 15 min at 400°F."] },
    { id: uid("r"), name: "Veggie Quesadillas (Kid-Friendly)", tags: ["vegetarian", "kid_friendly", "family", "lunch"], servings: 4, calories: 380, protein: 16, carbs: 40, fat: 18, ingredients: ["8 tortillas", "2 cups cheese", "1 bell pepper", "1 cup corn", "Salsa"], instructions: ["Fill tortillas with cheese and veggies.", "Cook in a pan until golden.", "Slice and serve with salsa."], favorite: true },
    { id: uid("r"), name: "Lentil & Spinach Soup", tags: ["vegetarian", "family", "dinner"], servings: 6, calories: 240, protein: 14, carbs: 36, fat: 4, ingredients: ["1 cup lentils", "2 carrots", "1 onion", "4 cups broth", "2 cups spinach", "Cumin"], instructions: ["Sauté onion and carrots.", "Add lentils and broth, simmer 25 min.", "Stir in spinach before serving."] },
    { id: uid("r"), name: "Banana Oat Pancakes (Kid-Friendly)", tags: ["kid_friendly", "vegetarian", "breakfast"], servings: 3, calories: 290, protein: 10, carbs: 48, fat: 6, ingredients: ["2 bananas", "2 eggs", "1 cup oats", "1 tsp cinnamon"], instructions: ["Blend everything.", "Cook small pancakes in a pan.", "Top with fruit."] },
  ];

  const today = todayISO();
  const mealPlans: MealPlan[] = [
    { id: uid("mp"), profileId: P_DAD, date: today, meal: "breakfast", name: "Greek Yogurt Power Bowl", calories: 320, protein: 28, carbs: 34, fat: 8, fiber: 6 },
    { id: uid("mp"), profileId: P_DAD, date: today, meal: "lunch", name: "Chicken & rice bowl", calories: 540, protein: 45, carbs: 55, fat: 14, fiber: 7 },
    { id: uid("mp"), profileId: P_DAD, date: today, meal: "dinner", name: "Sheet-Pan Lemon Chicken", calories: 480, protein: 42, carbs: 28, fat: 20, fiber: 8 },
    { id: uid("mp"), profileId: P_DAD, date: today, meal: "snack", name: "Apple + almonds", calories: 210, protein: 6, carbs: 24, fat: 12, fiber: 5 },
  ];

  const groceryItems: GroceryItem[] = [
    { id: uid("gi"), householdId: HH, name: "Chicken breast", qty: "2 lb", category: "Protein", checked: false },
    { id: uid("gi"), householdId: HH, name: "Greek yogurt", qty: "32 oz", category: "Dairy", checked: false },
    { id: uid("gi"), householdId: HH, name: "Broccoli", qty: "2 heads", category: "Produce", checked: true },
    { id: uid("gi"), householdId: HH, name: "Baby potatoes", qty: "2 lb", category: "Produce", checked: false },
    { id: uid("gi"), householdId: HH, name: "Lentils", qty: "1 bag", category: "Pantry", checked: false },
    { id: uid("gi"), householdId: HH, name: "Tortillas", qty: "1 pack", category: "Pantry", checked: true },
    { id: uid("gi"), householdId: HH, name: "Berries", qty: "2 cups", category: "Produce", checked: false },
  ];

  const waterLogs: WaterLog[] = series(14, () => 0).map((d, i) => ({
    id: uid("wl"), profileId: P_DAD, date: d.date, oz: [64, 72, 80, 56, 88, 70, 64, 92, 78, 60, 84, 76, 68, 64][i] ?? 64,
  }));

  const sleepLogs: SleepLog[] = series(14, () => 0).map((d, i) => ({
    id: uid("sl"), profileId: P_DAD, date: d.date, hours: [6.8, 7.2, 8.1, 6.5, 7.6, 7.9, 7.0, 8.3, 6.9, 7.4, 7.7, 6.6, 7.5, 7.2][i] ?? 7,
    quality: [3, 4, 5, 2, 4, 4, 3, 5, 3, 4, 4, 2, 4, 4][i] ?? 3, bedtime: "23:10", wake: "06:40",
  }));

  const medications: Medication[] = [
    { id: uid("med"), profileId: P_DAD, name: "Vitamin D3", dosage: "2000 IU", frequency: "Once daily", nextDose: "08:00", refillDate: isoDaysFromNow(20), active: true },
    { id: uid("med"), profileId: P_GRAN, name: "Lisinopril", dosage: "10 mg", frequency: "Once daily (AM)", nextDose: "08:00", refillDate: isoDaysFromNow(6), active: true },
    { id: uid("med"), profileId: P_GRAN, name: "Atorvastatin", dosage: "20 mg", frequency: "Once nightly", nextDose: "21:00", refillDate: isoDaysFromNow(12), active: true },
    { id: uid("med"), profileId: P_KID, name: "Children's Allergy", dosage: "5 mL", frequency: "As needed", active: true },
    { id: uid("med"), profileId: PET_DOG, forPet: true, name: "Heartgard", dosage: "1 chew", frequency: "Monthly", refillDate: isoDaysFromNow(9), active: true },
  ];

  const appointments: Appointment[] = [
    { id: uid("ap"), profileId: P_GRAN, type: "doctor", title: "Cardiology check-up", provider: "Dr. Patel", date: isoDaysFromNow(3), time: "10:30", location: "Riverside Clinic" },
    { id: uid("ap"), profileId: P_KID, type: "dentist", title: "6-month cleaning", provider: "Bright Smiles", date: isoDaysFromNow(8), time: "15:00" },
    { id: uid("ap"), profileId: P_MOM, type: "eye", title: "Annual eye exam", provider: "ClearView Optometry", date: isoDaysFromNow(14), time: "09:00" },
    { id: uid("ap"), profileId: PET_DOG, forPet: true, type: "vet", title: "Annual vaccines + check-up", provider: "Paws Vet", date: isoDaysFromNow(5), time: "11:15" },
  ];

  const allergies: Allergy[] = [
    { id: uid("al"), profileId: P_KID, name: "Peanuts", severity: "severe", reaction: "Anaphylaxis — carries EpiPen" },
    { id: uid("al"), profileId: P_MOM, name: "Pollen", severity: "mild", reaction: "Seasonal congestion" },
  ];

  const conditions: Condition[] = [
    { id: uid("co"), profileId: P_GRAN, name: "Hypertension", since: "2019", notes: "Well-managed with medication" },
    { id: uid("co"), profileId: P_GRAN, name: "High cholesterol", since: "2020" },
  ];

  const moods: Mood[] = series(14, () => 0).map((d, i) => ({
    id: uid("mo"), profileId: P_DAD, date: d.date,
    mood: [3, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 3, 5, 4][i] ?? 4,
    stress: [3, 2, 2, 4, 1, 2, 3, 1, 4, 2, 2, 3, 1, 2][i] ?? 2,
    gratitude: i % 4 === 0 ? "Grateful for a good night's sleep" : undefined,
  }));

  const habits: Habit[] = [
    { id: uid("h"), profileId: P_DAD, name: "Meditate", icon: "🧘", streak: 6, doneDates: [isoDaysAgo(0), isoDaysAgo(1), isoDaysAgo(2)], target: "Daily" },
    { id: uid("h"), profileId: P_DAD, name: "10k steps", icon: "👟", streak: 3, doneDates: [isoDaysAgo(1), isoDaysAgo(2)], target: "Daily" },
    { id: uid("h"), profileId: P_DAD, name: "No late snacks", icon: "🍎", streak: 9, doneDates: [isoDaysAgo(0)], target: "Daily" },
    { id: uid("h"), profileId: P_MOM, name: "Stretch", icon: "🤸", streak: 4, doneDates: [isoDaysAgo(0)], target: "Daily" },
  ];

  const pets: Pet[] = [
    { id: PET_DOG, householdId: HH, name: "Biscuit", species: "dog", breed: "Golden Retriever", birthdate: "2020-03-15", weightLbs: 68, avatar: "🐕", isPet: true },
    { id: PET_CAT, householdId: HH, name: "Mochi", species: "cat", breed: "Tabby", birthdate: "2022-07-01", weightLbs: 11, avatar: "🐈", isPet: true },
  ];

  const petWeights: PetWeight[] = [
    ...series(30, (i) => 66 + (30 - i) * 0.06).map((d) => ({ id: uid("pw"), petId: PET_DOG, date: d.date, lbs: Math.round(d.value * 10) / 10 })),
    ...series(30, () => 11).map((d) => ({ id: uid("pw"), petId: PET_CAT, date: d.date, lbs: 11 })),
  ];

  const petVaccinations: PetVaccination[] = [
    { id: uid("pv"), petId: PET_DOG, name: "Rabies", date: isoDaysAgo(300), nextDue: isoDaysFromNow(65) },
    { id: uid("pv"), petId: PET_DOG, name: "DHPP", date: isoDaysAgo(120), nextDue: isoDaysFromNow(245) },
    { id: uid("pv"), petId: PET_CAT, name: "FVRCP", date: isoDaysAgo(90), nextDue: isoDaysFromNow(275) },
  ];

  const petFeeding: PetFeeding[] = [
    { id: uid("pf"), petId: PET_DOG, food: "Kibble (large breed)", amount: "2 cups", schedule: "Morning & evening" },
    { id: uid("pf"), petId: PET_CAT, food: "Wet + dry mix", amount: "1/2 cup", schedule: "Twice daily" },
  ];

  const notifications: AppNotification[] = [
    { id: uid("n"), kind: "medication", title: "Time for Vitamin D3", body: "2000 IU — once daily", date: todayISO(), read: false, profileId: P_DAD },
    { id: uid("n"), kind: "appointment", title: "Grandma Rose — Cardiology in 3 days", body: "Dr. Patel, 10:30 AM", date: todayISO(), read: false, profileId: P_GRAN },
    { id: uid("n"), kind: "pet", title: "Biscuit's vet visit on Friday", body: "Annual vaccines + check-up", date: todayISO(), read: false, profileId: PET_DOG },
    { id: uid("n"), kind: "water", title: "You're 36 oz from your water goal", date: todayISO(), read: true, profileId: P_DAD },
    { id: uid("n"), kind: "family", title: "Maya completed her run! 🎉", body: "Couch to 5K — Week 4", date: isoDaysAgo(1), read: true, profileId: P_MOM },
  ];

  const subscription: Subscription = {
    tier: "premium",
    status: "active",
    hartHomeConnected: true,
    renewsOn: isoDaysFromNow(22),
    seats: 4,
  };

  const settings: Settings = {
    theme: "system",
    units: "imperial",
    notificationsEnabled: true,
    waterGoalOz: 100,
    stepGoal: 10000,
    sleepGoalHours: 8,
    accent: "indigo",
    scale: "cozy",
    radius: "soft",
    font: "sans",
    glow: true,
    reduceMotion: false,
    surface: "clean",
    dashboard: DEFAULT_DASHBOARD.map((w) => ({ ...w })),
  };

  return {
    households, profiles, healthProfiles, weights, measurements, vitals, goals, workouts,
    workoutSessions, recipes, mealPlans, groceryItems, waterLogs, sleepLogs,
    medications, appointments, allergies, conditions, moods, habits, pets,
    petWeights, petVaccinations, petFeeding, notifications, progressPhotos: [], subscription, settings,
  };
}

export const SEED_IDS = { HH, P_DAD, P_MOM, P_KID, P_GRAN, PET_DOG, PET_CAT };
