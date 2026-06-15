"use client";

import { BarTrend } from "@/components/charts";
import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  ProgressBar,
  ProgressRing,
  SectionTitle,
  StatCard,
} from "@/components/ui";
import { useDailySeries, useProfileRows, useTodayStats } from "@/lib/hooks";
import { useCurrentProfile, useSettings, useStore } from "@/lib/store";
import type { MealPlan, MealType } from "@/lib/types";
import { round, sum, todayISO } from "@/lib/utils";
import {
  Apple,
  Beef,
  Droplets,
  Flame,
  Leaf,
  Plus,
  Trash2,
  Utensils,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const MEAL_TYPES: { label: string; value: MealType }[] = [
  { label: "Breakfast", value: "breakfast" },
  { label: "Lunch", value: "lunch" },
  { label: "Dinner", value: "dinner" },
  { label: "Snack", value: "snack" },
];

const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

// Sensible daily macro targets (calorie target comes from useTodayStats).
const PROTEIN_TARGET = 140;
const CARBS_TARGET = 220;
const FAT_TARGET = 70;
const FIBER_TARGET = 30;

const WATER_QUICK_ADD = [8, 16, 24];

const DIET_STYLES: { label: string; tag: string; color: Parameters<typeof Badge>[0]["color"] }[] = [
  { label: "Weight loss", tag: "weight_loss", color: "mint" },
  { label: "Keto", tag: "keto", color: "violet" },
  { label: "High protein", tag: "high_protein", color: "brand" },
  { label: "Vegetarian", tag: "vegetarian", color: "mint" },
  { label: "Family", tag: "family", color: "amber" },
  { label: "Kid-friendly", tag: "kid_friendly", color: "rose" },
];

type MealDraft = {
  name: string;
  meal: MealType;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
};

function emptyDraft(meal: MealType = "breakfast"): MealDraft {
  return { name: "", meal, calories: "", protein: "", carbs: "", fat: "", fiber: "" };
}

export default function NutritionPage() {
  const profile = useCurrentProfile();
  const settings = useSettings();
  const stats = useTodayStats();
  const add = useStore((s) => s.add);
  const remove = useStore((s) => s.remove);

  const meals = useProfileRows("mealPlans");
  const water = useProfileRows("waterLogs");

  const [logOpen, setLogOpen] = useState(false);
  const [draft, setDraft] = useState<MealDraft>(() => emptyDraft());

  const today = todayISO();

  // ---- Today's meals + macro totals ------------------------------------
  const todaysMeals = useMemo(
    () => meals.filter((m) => m.date === today),
    [meals, today],
  );

  const macros = useMemo(
    () => ({
      calories: sum(todaysMeals.map((m) => m.calories)),
      protein: sum(todaysMeals.map((m) => m.protein)),
      carbs: sum(todaysMeals.map((m) => m.carbs)),
      fat: sum(todaysMeals.map((m) => m.fat)),
      fiber: sum(todaysMeals.map((m) => m.fiber ?? 0)),
    }),
    [todaysMeals],
  );

  const mealsByType = useMemo(() => {
    const map: Record<MealType, MealPlan[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const m of todaysMeals) map[m.meal]?.push(m);
    return map;
  }, [todaysMeals]);

  // ---- Water today ------------------------------------------------------
  const waterToday = useMemo(
    () => sum(water.filter((w) => w.date === today).map((w) => w.oz)),
    [water, today],
  );

  // ---- Weekly calories --------------------------------------------------
  const calorieSeries = useDailyCalories(meals);

  const caloriePct = stats.calorieTarget ? (macros.calories / stats.calorieTarget) * 100 : 0;
  const waterPct = settings.waterGoalOz ? (waterToday / settings.waterGoalOz) * 100 : 0;

  // ---- Actions ----------------------------------------------------------
  function openLog(meal: MealType = "breakfast") {
    setDraft(emptyDraft(meal));
    setLogOpen(true);
  }

  function saveMeal() {
    if (!draft.name.trim()) return;
    add("mealPlans", {
      profileId: profile.id,
      date: today,
      meal: draft.meal,
      name: draft.name.trim(),
      calories: Number(draft.calories) || 0,
      protein: Number(draft.protein) || 0,
      carbs: Number(draft.carbs) || 0,
      fat: Number(draft.fat) || 0,
      fiber: draft.fiber ? Number(draft.fiber) : undefined,
    });
    setLogOpen(false);
  }

  function addWater(oz: number) {
    add("waterLogs", { profileId: profile.id, date: today, oz });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        subtitle={`Today's fuel for ${profile.name}`}
        action={
          <button className="btn-primary" onClick={() => openLog()}>
            <Plus size={16} /> Log meal
          </button>
        }
      />

      {/* Macro overview */}
      <div className="grid lg:grid-cols-4 gap-4">
        <CardPad className="flex flex-col items-center justify-center text-center">
          <ProgressRing
            value={caloriePct}
            size={132}
            stroke={12}
            color="var(--color-brand-500)"
            label={<span className="text-lg">{macros.calories}</span>}
            sublabel={`/ ${stats.calorieTarget} kcal`}
          />
          <p className="mt-3 text-sm font-medium text-text">Calories today</p>
          <p className="text-xs text-text-muted">
            {Math.max(0, stats.calorieTarget - macros.calories)} kcal remaining
          </p>
        </CardPad>

        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Protein"
            value={round(macros.protein)}
            unit="g"
            icon={<Beef size={18} />}
            accent="rose"
            hint={`Target ${PROTEIN_TARGET}g`}
          />
          <StatCard
            label="Carbs"
            value={round(macros.carbs)}
            unit="g"
            icon={<Wheat size={18} />}
            accent="amber"
            hint={`Target ${CARBS_TARGET}g`}
          />
          <StatCard
            label="Fat"
            value={round(macros.fat)}
            unit="g"
            icon={<Flame size={18} />}
            accent="violet"
            hint={`Target ${FAT_TARGET}g`}
          />
          <StatCard
            label="Fiber"
            value={round(macros.fiber)}
            unit="g"
            icon={<Leaf size={18} />}
            accent="mint"
            hint={`Target ${FIBER_TARGET}g`}
          />
          <div className="col-span-2 lg:col-span-4">
            <CardPad className="space-y-3">
              <MacroBar label="Protein" value={macros.protein} target={PROTEIN_TARGET} color="bg-rose-500" />
              <MacroBar label="Carbs" value={macros.carbs} target={CARBS_TARGET} color="bg-amber-500" />
              <MacroBar label="Fat" value={macros.fat} target={FAT_TARGET} color="bg-violet-500" />
              <MacroBar label="Fiber" value={macros.fiber} target={FIBER_TARGET} color="bg-mint-500" />
            </CardPad>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's meals */}
        <div className="lg:col-span-2 space-y-6">
          <CardPad>
            <SectionTitle
              title="Today's meals"
              subtitle="Logged for today, grouped by meal"
              icon={<Utensils size={18} />}
            />
            {todaysMeals.length === 0 ? (
              <EmptyState
                icon={<Apple size={20} />}
                title="No meals logged yet"
                description="Log what you eat to keep your macros on track."
                action={
                  <button className="btn-primary" onClick={() => openLog()}>
                    <Plus size={16} /> Log meal
                  </button>
                }
              />
            ) : (
              <div className="space-y-5">
                {MEAL_TYPES.map(({ value }) => {
                  const items = mealsByType[value];
                  const groupCals = sum(items.map((m) => m.calories));
                  return (
                    <div key={value}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                            {MEAL_LABEL[value]}
                          </span>
                          {items.length > 0 && (
                            <span className="text-xs text-text-muted">{groupCals} kcal</span>
                          )}
                        </div>
                        <button
                          className="text-sm text-brand-600 hover:underline inline-flex items-center gap-1"
                          onClick={() => openLog(value)}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-sm text-text-muted px-1 pb-1">Nothing logged.</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((m) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3"
                            >
                              <div className="min-w-0">
                                <div className="font-medium text-text truncate">{m.name}</div>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                                  <span>{m.calories} kcal</span>
                                  <span>P {round(m.protein)}g</span>
                                  <span>C {round(m.carbs)}g</span>
                                  <span>F {round(m.fat)}g</span>
                                  {m.fiber != null && <span>Fib {round(m.fiber)}g</span>}
                                </div>
                              </div>
                              <button
                                className="btn-ghost px-2 py-2 text-text-muted shrink-0"
                                aria-label="Delete meal"
                                onClick={() => remove("mealPlans", m.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardPad>

          {/* Weekly calories */}
          <CardPad>
            <SectionTitle
              title="Weekly calories"
              subtitle="Last 7 days vs your target"
              icon={<Flame size={18} />}
            />
            <BarTrend
              data={calorieSeries}
              unit="kcal"
              height={200}
              goal={stats.calorieTarget}
              color="var(--color-brand-500)"
            />
          </CardPad>
        </div>

        {/* Right column: water + diet styles */}
        <div className="space-y-6">
          <CardPad>
            <SectionTitle title="Water intake" icon={<Droplets size={18} />} />
            <div className="flex items-center justify-center py-2">
              <ProgressRing
                value={waterPct}
                size={120}
                stroke={11}
                color="var(--color-mint-500)"
                label={<span className="text-lg">{waterToday}</span>}
                sublabel={`/ ${settings.waterGoalOz} oz`}
              />
            </div>
            <ProgressBar value={waterPct} color="bg-mint-500" className="mt-2" />
            <p className="mt-2 text-center text-xs text-text-muted">
              {waterToday >= settings.waterGoalOz
                ? "Goal reached. Nicely hydrated!"
                : `${settings.waterGoalOz - waterToday} oz to go`}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {WATER_QUICK_ADD.map((oz) => (
                <button
                  key={oz}
                  className="btn-outline justify-center"
                  onClick={() => addWater(oz)}
                >
                  +{oz} oz
                </button>
              ))}
            </div>
          </CardPad>

          <CardPad>
            <SectionTitle
              title="Diet styles"
              subtitle="Explore matching recipes"
              icon={<Leaf size={18} />}
            />
            <div className="flex flex-wrap gap-2">
              {DIET_STYLES.map((d) => (
                <Link key={d.tag} href={`/recipes?tag=${d.tag}`}>
                  <Badge color={d.color}>{d.label}</Badge>
                </Link>
              ))}
            </div>
          </CardPad>
        </div>
      </div>

      {/* Log meal modal */}
      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log meal"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setLogOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={saveMeal} disabled={!draft.name.trim()}>
              Save meal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="e.g. Greek yogurt & berries"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Meal</label>
            <select
              className="input"
              value={draft.meal}
              onChange={(e) => setDraft((d) => ({ ...d, meal: e.target.value as MealType }))}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Calories"
              value={draft.calories}
              onChange={(v) => setDraft((d) => ({ ...d, calories: v }))}
            />
            <NumField
              label="Protein (g)"
              value={draft.protein}
              onChange={(v) => setDraft((d) => ({ ...d, protein: v }))}
            />
            <NumField
              label="Carbs (g)"
              value={draft.carbs}
              onChange={(v) => setDraft((d) => ({ ...d, carbs: v }))}
            />
            <NumField
              label="Fat (g)"
              value={draft.fat}
              onChange={(v) => setDraft((d) => ({ ...d, fat: v }))}
            />
            <NumField
              label="Fiber (g)"
              value={draft.fiber}
              onChange={(v) => setDraft((d) => ({ ...d, fiber: v }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* --------------------------- helper components --------------------------- */
function MacroBar({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  const pct = target ? (value / target) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-muted">
          {round(value)} / {target} g
        </span>
      </div>
      <ProgressBar value={pct} color={color} />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        type="number"
        min={0}
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function useDailyCalories(meals: MealPlan[]) {
  return useDailySeries(meals, "calories", 7, "sum");
}
