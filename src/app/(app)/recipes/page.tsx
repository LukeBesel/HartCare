"use client";

import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  Segmented,
} from "@/components/ui";
import { useCollection, useHousehold, useStore } from "@/lib/store";
import type { Recipe } from "@/lib/types";
import { cn, round } from "@/lib/utils";
import {
  Beef,
  Check,
  ChefHat,
  Flame,
  Heart,
  Plus,
  ShoppingCart,
  Sparkles,
  Star,
  Utensils,
  Wheat,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/* ----------------------------- tag metadata ------------------------------ */
type Filter =
  | "all"
  | "favorites"
  | "keto"
  | "high_protein"
  | "vegetarian"
  | "family"
  | "kid_friendly"
  | "weight_loss";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Favorites", value: "favorites" },
  { label: "Keto", value: "keto" },
  { label: "High protein", value: "high_protein" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Family", value: "family" },
  { label: "Kid-friendly", value: "kid_friendly" },
  { label: "Weight loss", value: "weight_loss" },
];

const TAG_LABEL: Record<string, string> = {
  keto: "Keto",
  high_protein: "High protein",
  vegetarian: "Vegetarian",
  family: "Family",
  kid_friendly: "Kid-friendly",
  weight_loss: "Weight loss",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const TAG_COLOR: Record<string, Parameters<typeof Badge>[0]["color"]> = {
  keto: "violet",
  high_protein: "brand",
  vegetarian: "mint",
  family: "amber",
  kid_friendly: "rose",
  weight_loss: "mint",
  breakfast: "amber",
  lunch: "brand",
  dinner: "violet",
  snack: "gray",
};

function tagLabel(tag: string) {
  return TAG_LABEL[tag] ?? tag.replace(/_/g, " ");
}

/* --------------------------- AI recipe templates -------------------------- */
type AiTemplate = Omit<Recipe, "id" | "aiGenerated" | "favorite">;

const AI_TEMPLATES: AiTemplate[] = [
  {
    name: "Garlic Butter Salmon & Greens",
    tags: ["high_protein", "keto", "dinner"],
    servings: 2,
    calories: 460,
    protein: 38,
    carbs: 8,
    fat: 31,
    ingredients: [
      "2 salmon fillets",
      "2 tbsp butter",
      "3 cloves garlic, minced",
      "4 cups baby spinach",
      "1 lemon",
      "Salt & pepper",
    ],
    instructions: [
      "Season salmon and sear skin-side down 4 minutes.",
      "Flip, add butter and garlic, baste 3 minutes.",
      "Wilt spinach in the pan and finish with lemon.",
    ],
  },
  {
    name: "Rainbow Veggie Stir-Fry",
    tags: ["vegetarian", "weight_loss", "dinner"],
    servings: 3,
    calories: 320,
    protein: 14,
    carbs: 42,
    fat: 10,
    ingredients: [
      "2 cups mixed bell peppers",
      "1 cup broccoli florets",
      "1 cup snap peas",
      "1 block firm tofu, cubed",
      "2 tbsp soy sauce",
      "1 tbsp sesame oil",
    ],
    instructions: [
      "Pan-fry tofu until golden, set aside.",
      "Stir-fry veggies on high heat 5 minutes.",
      "Return tofu, add sauce, toss 1 minute.",
    ],
  },
  {
    name: "Cheesy Mini Egg Muffins",
    tags: ["kid_friendly", "high_protein", "breakfast"],
    servings: 6,
    calories: 180,
    protein: 13,
    carbs: 4,
    fat: 12,
    ingredients: [
      "6 eggs",
      "1/2 cup shredded cheese",
      "1/4 cup diced ham",
      "1/4 cup diced peppers",
      "Salt & pepper",
    ],
    instructions: [
      "Whisk eggs with salt and pepper.",
      "Divide cheese, ham and peppers into a muffin tin.",
      "Pour egg over and bake 18 min at 375°F.",
    ],
  },
  {
    name: "Hearty Turkey Chili",
    tags: ["high_protein", "family", "dinner"],
    servings: 6,
    calories: 410,
    protein: 34,
    carbs: 38,
    fat: 13,
    ingredients: [
      "1 lb ground turkey",
      "1 can kidney beans",
      "1 can diced tomatoes",
      "1 onion, diced",
      "2 tbsp chili powder",
      "1 cup broth",
    ],
    instructions: [
      "Brown turkey with onion.",
      "Add beans, tomatoes, broth and spices.",
      "Simmer 25 minutes, stirring occasionally.",
    ],
  },
  {
    name: "Avocado Berry Smoothie",
    tags: ["vegetarian", "weight_loss", "breakfast"],
    servings: 1,
    calories: 280,
    protein: 12,
    carbs: 30,
    fat: 14,
    ingredients: [
      "1/2 avocado",
      "1 cup mixed berries",
      "1 scoop vanilla protein",
      "1 cup almond milk",
      "Handful of ice",
    ],
    instructions: [
      "Add everything to a blender.",
      "Blend until smooth and creamy.",
      "Pour and enjoy cold.",
    ],
  },
];

/* ------------------------------ new-recipe draft -------------------------- */
type RecipeDraft = {
  name: string;
  tags: string;
  servings: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  ingredients: string;
  instructions: string;
};

function emptyDraft(): RecipeDraft {
  return {
    name: "",
    tags: "",
    servings: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    ingredients: "",
    instructions: "",
  };
}

const TAG_CHOICES = ["keto", "high_protein", "vegetarian", "family", "kid_friendly", "weight_loss"];

export default function RecipesPage() {
  const recipes = useCollection("recipes");
  const household = useHousehold();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const pushNotification = useStore((s) => s.pushNotification);

  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<Recipe | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [draft, setDraft] = useState<RecipeDraft>(() => emptyDraft());
  const [draftTags, setDraftTags] = useState<string[]>([]);
  const [addedFor, setAddedFor] = useState<string | null>(null);

  // Honour ?tag= from the nutrition page deep links (no Next hook needed).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tag = new URLSearchParams(window.location.search).get("tag");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading deep-link param on mount (SSR-safe)
    if (tag && FILTERS.some((f) => f.value === tag)) setFilter(tag as Filter);
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return recipes;
    if (filter === "favorites") return recipes.filter((r) => r.favorite);
    return recipes.filter((r) => r.tags.includes(filter));
  }, [recipes, filter]);

  function toggleFavorite(r: Recipe) {
    update("recipes", r.id, { favorite: !r.favorite });
  }

  function toggleDraftTag(tag: string) {
    setDraftTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function openNew() {
    setDraft(emptyDraft());
    setDraftTags([]);
    setNewOpen(true);
  }

  function splitLines(text: string) {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  function saveRecipe() {
    if (!draft.name.trim()) return;
    const typed = draft.tags
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, "_"))
      .filter(Boolean);
    const tags = Array.from(new Set([...draftTags, ...typed]));
    add("recipes", {
      name: draft.name.trim(),
      tags,
      servings: Number(draft.servings) || 1,
      calories: Number(draft.calories) || 0,
      protein: Number(draft.protein) || 0,
      carbs: Number(draft.carbs) || 0,
      fat: Number(draft.fat) || 0,
      ingredients: splitLines(draft.ingredients),
      instructions: splitLines(draft.instructions),
    });
    setNewOpen(false);
  }

  function generateAi() {
    // Bias the template toward the current filter when it's a real tag.
    const pool =
      filter !== "all" && filter !== "favorites"
        ? AI_TEMPLATES.filter((t) => t.tags.includes(filter))
        : AI_TEMPLATES;
    const source = (pool.length ? pool : AI_TEMPLATES)[
      Math.floor(Math.random() * (pool.length ? pool.length : AI_TEMPLATES.length))
    ];
    const jitter = () => 1 + (Math.random() * 0.16 - 0.08); // ±8%
    add("recipes", {
      ...source,
      name: source.name,
      calories: round(source.calories * jitter()),
      protein: round(source.protein * jitter()),
      carbs: round(source.carbs * jitter()),
      fat: round(source.fat * jitter()),
      aiGenerated: true,
    });
    pushNotification({
      kind: "system",
      title: "New AI recipe added",
      body: `${source.name} is ready in your recipe book.`,
    });
  }

  function addIngredientsToGrocery(r: Recipe) {
    for (const ingredient of r.ingredients) {
      add("groceryItems", {
        householdId: household.id,
        name: ingredient,
        category: "Recipe",
        checked: false,
      });
    }
    pushNotification({
      kind: "family",
      title: "Added to grocery list",
      body: `${r.ingredients.length} ingredients from ${r.name}.`,
    });
    setAddedFor(r.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recipes"
        subtitle="Healthy meals the whole family will love"
        action={
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={generateAi}>
              <Sparkles size={16} /> AI generate
            </button>
            <button className="btn-primary" onClick={openNew}>
              <Plus size={16} /> New recipe
            </button>
          </div>
        }
      />

      {/* Filter bar */}
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {/* Recipe grid */}
      {filtered.length === 0 ? (
        <CardPad>
          <EmptyState
            icon={<ChefHat size={20} />}
            title="No recipes here yet"
            description="Try another filter, generate one with AI, or add your own."
            action={
              <div className="flex justify-center gap-2">
                <button className="btn-outline" onClick={generateAi}>
                  <Sparkles size={16} /> AI generate
                </button>
                <button className="btn-primary" onClick={openNew}>
                  <Plus size={16} /> New recipe
                </button>
              </div>
            }
          />
        </CardPad>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setActive(r)}
              className="card card-pad animate-in text-left transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-text truncate">{r.name}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {r.servings} {r.servings === 1 ? "serving" : "servings"}
                  </p>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={r.favorite ? "Remove favorite" : "Add favorite"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(r);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(r);
                    }
                  }}
                  className={cn(
                    "shrink-0 rounded-lg p-1.5 transition-colors",
                    r.favorite ? "text-amber-500" : "text-text-muted hover:text-amber-500",
                  )}
                >
                  <Star size={18} fill={r.favorite ? "currentColor" : "none"} />
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {r.aiGenerated && (
                  <Badge color="violet">
                    <Sparkles size={11} className="mr-1" /> AI
                  </Badge>
                )}
                {r.tags.slice(0, 3).map((t) => (
                  <Badge key={t} color={TAG_COLOR[t] ?? "gray"}>
                    {tagLabel(t)}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <Flame size={13} className="text-brand-600" /> {r.calories} kcal
                </span>
                <span className="inline-flex items-center gap-1">
                  <Beef size={13} className="text-rose-500" /> {round(r.protein)}g
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wheat size={13} className="text-amber-500" /> {round(r.carbs)}g
                </span>
                <span className="inline-flex items-center gap-1">
                  <Flame size={13} className="text-violet-500" /> {round(r.fat)}g
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active?.name ?? "Recipe"}
        footer={
          active ? (
            <div className="flex w-full items-center justify-between gap-3">
              {addedFor === active.id ? (
                <Badge color="mint">
                  <Check size={12} className="mr-1" /> Added to grocery list
                </Badge>
              ) : (
                <span className="text-xs text-text-muted">
                  {active.ingredients.length} ingredients
                </span>
              )}
              <button className="btn-primary" onClick={() => addIngredientsToGrocery(active)}>
                <ShoppingCart size={16} /> Add to grocery list
              </button>
            </div>
          ) : undefined
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-1.5">
              {active.aiGenerated && (
                <Badge color="violet">
                  <Sparkles size={11} className="mr-1" /> AI generated
                </Badge>
              )}
              {active.favorite && (
                <Badge color="amber">
                  <Heart size={11} className="mr-1" /> Favorite
                </Badge>
              )}
              {active.tags.map((t) => (
                <Badge key={t} color={TAG_COLOR[t] ?? "gray"}>
                  {tagLabel(t)}
                </Badge>
              ))}
            </div>

            {/* Nutrition facts */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <NutriCell label="Calories" value={`${active.calories}`} unit="kcal" />
              <NutriCell label="Protein" value={`${round(active.protein)}`} unit="g" />
              <NutriCell label="Carbs" value={`${round(active.carbs)}`} unit="g" />
              <NutriCell label="Fat" value={`${round(active.fat)}`} unit="g" />
            </div>
            <p className="text-xs text-text-muted">
              Per serving · makes {active.servings}{" "}
              {active.servings === 1 ? "serving" : "servings"}
            </p>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-text mb-2">
                <Utensils size={15} className="text-brand-600" /> Ingredients
              </h4>
              <ul className="space-y-1.5">
                {active.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-text mb-2">
                <ChefHat size={15} className="text-brand-600" /> Instructions
              </h4>
              <ol className="space-y-2.5">
                {active.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-text">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      {/* New recipe modal */}
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="New recipe"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setNewOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={saveRecipe} disabled={!draft.name.trim()}>
              Save recipe
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="e.g. Honey garlic chicken bowls"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAG_CHOICES.map((tag) => {
                const on = draftTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDraftTag(tag)}
                    className={cn(
                      "chip transition-colors",
                      on
                        ? "bg-brand-600 text-white"
                        : "bg-surface-muted text-text-muted hover:text-text",
                    )}
                  >
                    {tagLabel(tag)}
                  </button>
                );
              })}
            </div>
            <input
              className="input mt-2"
              placeholder="More tags, comma separated"
              value={draft.tags}
              onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Servings"
              value={draft.servings}
              onChange={(v) => setDraft((d) => ({ ...d, servings: v }))}
            />
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
          </div>

          <div>
            <label className="label">Ingredients</label>
            <textarea
              className="input min-h-24"
              placeholder="One ingredient per line"
              value={draft.ingredients}
              onChange={(e) => setDraft((d) => ({ ...d, ingredients: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Instructions</label>
            <textarea
              className="input min-h-24"
              placeholder="One step per line"
              value={draft.instructions}
              onChange={(e) => setDraft((d) => ({ ...d, instructions: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* --------------------------- helper components --------------------------- */
function NutriCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-2 py-3">
      <div className="text-base font-bold text-text">
        {value}
        <span className="ml-0.5 text-xs font-normal text-text-muted">{unit}</span>
      </div>
      <div className="text-[11px] text-text-muted">{label}</div>
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
