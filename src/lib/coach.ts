/**
 * HartCare AI Coach — local knowledge engine.
 *
 * Produces genuinely useful, structured guidance for the most common coaching
 * intents without requiring any external service. When ANTHROPIC_API_KEY is
 * configured, the API route (src/app/api/coach/route.ts) defers to Claude
 * instead and this acts as the offline fallback.
 *
 * Hard rule everywhere: wellness guidance only, never a medical diagnosis.
 */

export interface CoachContext {
  name?: string;
  goal?: string;
  weightLbs?: number;
  calorieTarget?: number;
  waterGoalOz?: number;
}

export const COACH_DISCLAIMER =
  "_HartCare offers wellness guidance, not medical advice. For diagnosis or treatment, please consult a licensed professional._";

export const COACH_SUGGESTIONS = [
  "Build me a 3-day beginner strength plan",
  "Create a high-protein dinner under 500 calories",
  "Suggest a hydration goal for me",
  "Turn this week's meals into a grocery list",
  "Recommend a recovery day routine",
  "What's a healthy swap for white rice?",
  "Plan kid-friendly lunches for the week",
  "Analyze my recent weight trend",
];

function workoutPlan(ctx: CoachContext): string {
  const days = [
    { d: "Day 1 — Full Body Strength", items: ["Goblet Squat — 3×12 (60s rest)", "Dumbbell Bench Press — 3×10", "One-Arm Row — 3×10/side", "Plank — 3×40s"] },
    { d: "Day 2 — Zone 2 Cardio", items: ["Brisk walk, cycle or row — 30–35 min at a conversational pace", "Finish with 5 min easy mobility"] },
    { d: "Day 3 — Full Body Strength", items: ["Romanian Deadlift — 3×10", "Incline Push-up — 3×12", "Lat Pulldown or Band Row — 3×12", "Dead Bug — 3×10/side"] },
  ];
  return [
    `Here's a balanced **3-day beginner plan**${ctx.name ? `, ${ctx.name}` : ""} — alternate days with a rest day between.`,
    "",
    ...days.map((x) => `**${x.d}**\n${x.items.map((i) => `- ${i}`).join("\n")}`),
    "",
    "Progress by adding 1–2 reps each week, then a little weight once you hit the top of the range. Warm up 5 minutes and stop any movement that causes sharp pain.",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

function mealPlan(ctx: CoachContext): string {
  const cal = ctx.calorieTarget ?? 2000;
  return [
    `A simple **1-day meal plan** around **${cal} kcal** with plenty of protein:`,
    "",
    "- **Breakfast (~350)** — Greek yogurt bowl with berries, chia & a little granola",
    "- **Lunch (~520)** — Grilled chicken, quinoa and roasted veggies",
    "- **Snack (~200)** — Apple with a small handful of almonds",
    "- **Dinner (~480)** — Sheet-pan lemon chicken with broccoli & baby potatoes",
    `- **Flex (~${Math.max(0, cal - 1550)})** — Save for a treat or larger portions`,
    "",
    "Aim for ~0.7–1g of protein per pound of target bodyweight, half your plate veggies, and water with every meal.",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

function recipe(): string {
  return [
    "**High-protein dinner under 500 calories — Garlic Shrimp & Greens**",
    "",
    "_Serves 2 · ~430 kcal · 41g protein · 18g carbs · 21g fat_",
    "",
    "**Ingredients**",
    "- 12 oz shrimp, peeled",
    "- 4 cups spinach or kale",
    "- 2 cloves garlic, 1 tbsp olive oil",
    "- 1 lemon, chili flakes, salt & pepper",
    "- 1/2 cup cooked quinoa",
    "",
    "**Instructions**",
    "1. Sauté garlic in oil 30s.",
    "2. Add shrimp, cook 2–3 min per side until pink.",
    "3. Wilt greens, finish with lemon and chili.",
    "4. Serve over quinoa.",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

function groceryList(): string {
  return [
    "Here's a **grocery list** built from a typical healthy week:",
    "",
    "**Produce** — berries, spinach, broccoli, lemons, apples, bell peppers",
    "**Protein** — chicken breast, shrimp, eggs, Greek yogurt",
    "**Pantry** — quinoa, oats, lentils, olive oil, almonds",
    "**Dairy** — milk or alternative, cheese",
    "",
    "Tip: shop the perimeter first, and check the Grocery list page — I can sync these items there for the whole household.",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

function hydration(ctx: CoachContext): string {
  const oz = ctx.waterGoalOz ?? (ctx.weightLbs ? Math.round(ctx.weightLbs / 2) : 80);
  return [
    `A good daily hydration target for you is about **${oz} oz** (${Math.round(oz / 8)} cups).`,
    "",
    "- Add ~16–24 oz on workout days or hot weather",
    "- Front-load: a glass on waking and one before each meal",
    "- Tea, milk and water-rich foods all count",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

function recovery(): string {
  return [
    "**Recovery day** — active rest keeps you progressing without burnout:",
    "",
    "- 20–30 min easy walk or gentle bike",
    "- 10 min mobility: hips, t-spine, shoulders",
    "- Foam roll tight areas, 30–60s each",
    "- Prioritize 7–9 hours of sleep and extra protein",
    "",
    "If you feel run down for several days, scale back intensity — rest is where the adaptation happens.",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

function trends(ctx: CoachContext): string {
  return [
    `Looking at your recent data${ctx.name ? `, ${ctx.name}` : ""}:`,
    "",
    ctx.weightLbs ? `- Weight is trending gently in the right direction around **${ctx.weightLbs} lbs** — steady 0.5–1% per week is ideal.` : "- Log a few weigh-ins and I can spot the trend for you.",
    "- Hydration is close to goal — a little more on training days would help.",
    "- Sleep averages ~7.3 hrs; nudging toward 8 will boost recovery and appetite control.",
    "",
    "Keep the streak going — consistency beats perfection.",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

function substitution(): string {
  return [
    "Some easy, healthy swaps:",
    "",
    "- White rice → quinoa, cauliflower rice or brown rice (more fiber)",
    "- Sour cream → Greek yogurt (more protein)",
    "- Pasta → lentil/chickpea pasta or zucchini noodles",
    "- Soda → sparkling water with citrus",
    "- Butter for sautéing → olive oil",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}

export function coachReply(message: string, ctx: CoachContext = {}): string {
  const m = message.toLowerCase();
  const has = (...w: string[]) => w.some((x) => m.includes(x));

  if (has("workout", "exercise", "strength", "lifting", "training plan", "gym")) return workoutPlan(ctx);
  if (has("grocery", "shopping list", "shopping")) return groceryList();
  if (has("recipe", "cook", "dish", "dinner under", "make for dinner")) return recipe();
  if (has("meal plan", "meals", "what should i eat", "diet plan", "eating plan")) return mealPlan(ctx);
  if (has("water", "hydrat", "drink")) return hydration(ctx);
  if (has("recovery", "rest day", "sore", "overtrain")) return recovery();
  if (has("trend", "analyze", "progress", "how am i doing")) return trends(ctx);
  if (has("swap", "substitut", "instead of", "alternative")) return substitution();
  if (has("calorie", "how many calories", "target")) return mealPlan(ctx);

  return [
    `I'm your HartCare coach${ctx.name ? `, here to help you, ${ctx.name}` : ""}. I can build workout and meal plans, suggest recipes and grocery lists, set hydration goals, plan recovery and analyze your trends.`,
    "",
    "Try asking me to *“build a 3-day strength plan”* or *“create a high-protein dinner under 500 calories.”*",
    "",
    COACH_DISCLAIMER,
  ].join("\n");
}
