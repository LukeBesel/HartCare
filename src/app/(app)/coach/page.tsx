"use client";

import { PageHeader } from "@/components/ui";
import { COACH_SUGGESTIONS } from "@/lib/coach";
import { useTodayStats } from "@/lib/hooks";
import { renderMarkdown } from "@/lib/markdown";
import { useCurrentProfile, useSettings, useStore } from "@/lib/store";
import { cn, todayISO, uid } from "@/lib/utils";
import { Bot, Check, Dumbbell, Loader2, SendHorizonal, Sparkles, User, Utensils } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

type PlanKind = "workout" | "meal";

/** Infer whether the user was asking for a workout or meal plan. */
function detectPlanKind(userText: string | undefined): PlanKind | null {
  if (!userText) return null;
  const t = userText.toLowerCase();
  if (/\b(meal|dinner|lunch|breakfast|eat|calorie|recipe|diet|nutrition)/.test(t)) return "meal";
  if (/\b(workout|strength|exercise|train|gym|lift|plan)/.test(t)) return "workout";
  return null;
}

export default function CoachPage() {
  const profile = useCurrentProfile();
  const settings = useSettings();
  const stats = useTodayStats();
  const add = useStore((s) => s.add);
  const pushNotification = useStore((s) => s.pushNotification);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hi ${profile.name}! 👋 I'm your HartCare coach. I can build workout and meal plans, suggest recipes and grocery lists, set hydration goals and analyze your trends. What would you like help with today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Track which assistant messages have been applied, keyed by message index.
  const [applied, setApplied] = useState<Record<number, boolean>>({});
  // Index of the assistant message currently being revealed (typewriter), -1 = none.
  const [revealIndex, setRevealIndex] = useState(-1);
  const [revealLen, setRevealLen] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, revealLen]);

  // Progressive reveal of the latest assistant message.
  useEffect(() => {
    if (revealIndex < 0) return;
    const full = messages[revealIndex]?.content ?? "";
    if (revealLen >= full.length) return;
    const id = setTimeout(() => {
      setRevealLen((n) => Math.min(full.length, n + Math.max(2, Math.ceil(full.length / 120))));
    }, 16);
    return () => clearTimeout(id);
  }, [revealIndex, revealLen, messages]);

  function applyPlan(index: number, kind: PlanKind) {
    if (applied[index]) return;
    if (kind === "workout") {
      add("workouts", {
        profileId: profile.id,
        name: `Coach plan — ${todayISO()}`,
        category: "general",
        level: "beginner",
        day: "Mon",
        exercises: [
          { id: uid("ex"), name: "Goblet Squat", muscle: "Legs", type: "strength", sets: 3, reps: 12, restSec: 60 },
          { id: uid("ex"), name: "Dumbbell Bench Press", muscle: "Chest", type: "strength", sets: 4, reps: 10, restSec: 90 },
          { id: uid("ex"), name: "Bent-over Row", muscle: "Back", type: "strength", sets: 4, reps: 10, restSec: 90 },
          { id: uid("ex"), name: "Plank", muscle: "Core", type: "strength", sets: 3, reps: 45, restSec: 45 },
        ],
      });
      pushNotification({ kind: "workout", title: "Added a workout from your coach" });
    } else {
      const date = todayISO();
      add("mealPlans", { profileId: profile.id, date, meal: "breakfast", name: "Greek Yogurt & Berries", calories: 320, protein: 24, carbs: 38, fat: 8 });
      add("mealPlans", { profileId: profile.id, date, meal: "lunch", name: "Grilled Chicken Bowl", calories: 540, protein: 42, carbs: 55, fat: 16 });
      add("mealPlans", { profileId: profile.id, date, meal: "dinner", name: "Salmon with Quinoa & Greens", calories: 610, protein: 40, carbs: 48, fat: 26 });
      pushNotification({ kind: "system", title: "Added meals from your coach" });
    }
    setApplied((prev) => ({ ...prev, [index]: true }));
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    const next = [...messages, { role: "user" as const, content: msg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8),
          context: {
            name: profile.name,
            weightLbs: stats.latestWeight,
            calorieTarget: stats.calorieTarget,
            waterGoalOz: settings.waterGoalOz,
          },
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? "Sorry, I couldn't respond just now.";
      const withReply = [...next, { role: "assistant" as const, content: reply }];
      setMessages(withReply);
      setRevealIndex(withReply.length - 1);
      setRevealLen(0);
    } catch {
      const withReply = [...next, { role: "assistant" as const, content: "I'm having trouble connecting. Please try again." }];
      setMessages(withReply);
      setRevealIndex(-1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="AI Health Coach"
        subtitle="Plans, recipes, grocery lists and trends — wellness guidance, never a diagnosis."
      />

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, i) => {
            const revealing = m.role === "assistant" && i === revealIndex && revealLen < m.content.length;
            const shown = revealing ? m.content.slice(0, revealLen) : m.content;
            const planKind = m.role === "assistant" && !revealing ? detectPlanKind(messages[i - 1]?.content) : null;
            return (
              <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
                <span
                  className={cn(
                    "grid place-items-center h-9 w-9 rounded-xl shrink-0",
                    m.role === "assistant" ? "bg-brand-600 text-white" : "bg-surface-muted text-text",
                  )}
                >
                  {m.role === "assistant" ? <Bot size={18} /> : <User size={18} />}
                </span>
                <div className="max-w-[80%] flex flex-col gap-2 items-start">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      m.role === "assistant"
                        ? "bg-surface-muted text-text rounded-tl-sm"
                        : "bg-brand-600 text-white rounded-tr-sm",
                    )}
                  >
                    {m.role === "assistant" ? <div className="space-y-0.5">{renderMarkdown(shown)}</div> : m.content}
                  </div>
                  {planKind &&
                    (applied[i] ? (
                      <span className="chip bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300">
                        <Check size={12} /> Added
                      </span>
                    ) : (
                      <button
                        onClick={() => applyPlan(i, planKind)}
                        className="chip bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20 transition-colors"
                      >
                        {planKind === "workout" ? <Dumbbell size={12} /> : <Utensils size={12} />} Add to my plan
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3">
              <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-600 text-white">
                <Bot size={18} />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3 text-sm text-text-muted flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 sm:px-6 pb-2 flex flex-wrap gap-2">
            {COACH_SUGGESTIONS.slice(0, 5).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="chip bg-surface-muted text-text-muted hover:text-text hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
              >
                <Sparkles size={12} /> {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-border p-3 flex items-center gap-2"
        >
          <input
            className="input flex-1"
            placeholder="Ask your coach anything…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4" disabled={loading || !input.trim()}>
            <SendHorizonal size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
