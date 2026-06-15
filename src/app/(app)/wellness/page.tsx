"use client";

import { LineTrend } from "@/components/charts";
import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import { useDailySeries, useDailyQuote, useProfileRows } from "@/lib/hooks";
import { useCurrentProfile, useStore } from "@/lib/store";
import { cn, relativeDay, todayISO } from "@/lib/utils";
import {
  Brain,
  Flame,
  Heart,
  BookHeart,
  Plus,
  Sparkles,
  Wind,
} from "lucide-react";
import { useMemo, useState } from "react";

const MOOD_FACES = [
  { value: 1, emoji: "😢", label: "Awful" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

const STRESS_LEVELS = [
  { value: 1, label: "Calm" },
  { value: 2, label: "Mild" },
  { value: 3, label: "Tense" },
  { value: 4, label: "High" },
  { value: 5, label: "Frazzled" },
];

const EMOJI_CHOICES = ["🧘", "🏃", "📖", "💧", "🥗", "😴", "🙏", "🌿", "✍️", "🎯"];

export default function WellnessPage() {
  const profile = useCurrentProfile();
  const add = useStore((s) => s.add);
  const update = useStore((s) => s.update);
  const pushNotification = useStore((s) => s.pushNotification);

  const moods = useProfileRows("moods");
  const habits = useProfileRows("habits");
  const quote = useDailyQuote();
  const today = todayISO();

  // Check-in form
  const [mood, setMood] = useState(4);
  const [stress, setStress] = useState(2);
  const [note, setNote] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [saved, setSaved] = useState(false);

  // Add habit
  const [habitOpen, setHabitOpen] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [habitIcon, setHabitIcon] = useState("🧘");
  const [habitTarget, setHabitTarget] = useState("Daily");

  const moodSeries = useDailySeries(moods, "mood", 14, "last");
  const stressSeries = useDailySeries(moods, "stress", 14, "last");

  const gratitudeEntries = useMemo(
    () =>
      [...moods]
        .filter((m) => m.gratitude && m.gratitude.trim())
        .sort((a, b) => b.date.localeCompare(a.date)),
    [moods],
  );

  const checkedInToday = useMemo(
    () => moods.some((m) => m.date === today),
    [moods, today],
  );

  const meditationHabit = useMemo(
    () => habits.find((h) => /medit|mindful|breath/i.test(h.name)),
    [habits],
  );

  function saveCheckIn() {
    add("moods", {
      profileId: profile.id,
      date: today,
      mood,
      stress,
      note: note.trim() || undefined,
      gratitude: gratitude.trim() || undefined,
    });
    pushNotification({
      kind: "system",
      title: "Check-in saved",
      body: "Thanks for taking a moment for yourself today.",
      profileId: profile.id,
    });
    setNote("");
    setGratitude("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function doneToday(habit: (typeof habits)[number]) {
    if (habit.doneDates.includes(today)) return;
    update("habits", habit.id, {
      doneDates: [...habit.doneDates, today],
      streak: habit.streak + 1,
    });
  }

  function saveHabit() {
    if (!habitName.trim()) return;
    add("habits", {
      profileId: profile.id,
      name: habitName.trim(),
      icon: habitIcon,
      streak: 0,
      doneDates: [],
      target: habitTarget.trim() || "Daily",
    });
    setHabitName("");
    setHabitIcon("🧘");
    setHabitTarget("Daily");
    setHabitOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mental Wellness"
        subtitle={`A gentle check-in space for ${profile.name}`}
      />

      {/* Affirmation */}
      <CardPad className="bg-gradient-to-br from-mint-50 to-surface-card dark:from-mint-500/10">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-mint-100 text-mint-600 dark:bg-mint-500/15 shrink-0">
            <Sparkles size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-text">Today&apos;s affirmation</h3>
            <p className="text-sm text-text-muted mt-1">{quote}</p>
          </div>
        </div>
      </CardPad>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Daily check-in */}
          <CardPad>
            <SectionTitle
              title="Daily check-in"
              subtitle={
                checkedInToday
                  ? "You've checked in today — feel free to add another."
                  : "How are you feeling right now?"
              }
              icon={<Heart size={18} />}
            />

            <div className="space-y-5">
              <div>
                <label className="label">Mood</label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_FACES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMood(m.value)}
                      className={cn(
                        "flex flex-1 min-w-[60px] flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-colors",
                        mood === m.value
                          ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                          : "border-border bg-surface-muted hover:border-brand-300",
                      )}
                    >
                      <span className="text-2xl leading-none">{m.emoji}</span>
                      <span className="text-[11px] text-text-muted">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Stress level</label>
                <div className="flex flex-wrap gap-2">
                  {STRESS_LEVELS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStress(s.value)}
                      className={cn(
                        "flex-1 min-w-[60px] rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors",
                        stress === s.value
                          ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                          : "border-border bg-surface-muted text-text-muted hover:border-amber-300",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Note (optional)</label>
                <textarea
                  className="input min-h-20"
                  placeholder="What's on your mind today?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Gratitude (optional)</label>
                <input
                  className="input"
                  placeholder="One thing you're grateful for…"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <button className="btn-primary" onClick={saveCheckIn}>
                  <Heart size={16} /> Save check-in
                </button>
                {saved && (
                  <Badge color="mint">
                    <Sparkles size={12} className="mr-1" /> Saved
                  </Badge>
                )}
              </div>
            </div>
          </CardPad>

          {/* Trends */}
          <CardPad>
            <SectionTitle
              title="Mood trend"
              subtitle="Last 14 days, 1–5"
              icon={<Brain size={18} />}
            />
            {moods.length === 0 ? (
              <EmptyState
                icon={<Brain size={20} />}
                title="No mood data yet"
                description="Save a check-in to start tracking how you feel."
              />
            ) : (
              <LineTrend data={moodSeries} height={190} color="var(--color-mint-500)" />
            )}
          </CardPad>

          <CardPad>
            <SectionTitle
              title="Stress trend"
              subtitle="Last 14 days, 1–5"
              icon={<Wind size={18} />}
            />
            {moods.length === 0 ? (
              <EmptyState
                icon={<Wind size={20} />}
                title="No stress data yet"
                description="Your stress trend will appear here after your first check-in."
              />
            ) : (
              <LineTrend data={stressSeries} height={190} color="#f59e0b" />
            )}
          </CardPad>

          {/* Gratitude journal */}
          <CardPad>
            <SectionTitle
              title="Gratitude journal"
              subtitle="Moments worth remembering"
              icon={<BookHeart size={18} />}
            />
            {gratitudeEntries.length === 0 ? (
              <EmptyState
                icon={<BookHeart size={20} />}
                title="Your journal is empty"
                description="Add a gratitude note during a check-in and it will be saved here."
              />
            ) : (
              <div className="space-y-3">
                {gratitudeEntries.map((g) => (
                  <div
                    key={g.id}
                    className="rounded-xl bg-gradient-to-br from-rose-50 to-surface-muted px-4 py-3 dark:from-rose-500/5"
                  >
                    <div className="text-xs font-medium text-text-muted">
                      {relativeDay(g.date)}
                    </div>
                    <p className="mt-1 text-sm text-text">{g.gratitude}</p>
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        </div>

        {/* Right column: habits */}
        <div className="space-y-6">
          {/* Meditation / mindfulness highlight */}
          <CardPad className="bg-gradient-to-br from-violet-50 to-surface-card dark:from-violet-500/10">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 shrink-0">
                <Wind size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-text">
                  {meditationHabit ? meditationHabit.name : "Mindful minutes"}
                </h3>
                {meditationHabit ? (
                  <p className="text-sm text-text-muted mt-1">
                    <span className="font-semibold text-text">
                      {meditationHabit.streak}🔥
                    </span>{" "}
                    day streak — keep the calm going.
                  </p>
                ) : (
                  <p className="text-sm text-text-muted mt-1">
                    Try a minute of slow breathing. Add a meditation habit below to
                    track your streak.
                  </p>
                )}
              </div>
            </div>
          </CardPad>

          {/* Habits & streaks */}
          <CardPad>
            <SectionTitle
              title="Habits & streaks"
              icon={<Flame size={18} />}
              action={
                <button className="btn-ghost" onClick={() => setHabitOpen(true)}>
                  <Plus size={16} /> Add
                </button>
              }
            />
            {habits.length === 0 ? (
              <EmptyState
                icon={<Flame size={20} />}
                title="No habits yet"
                description="Build a calming routine — add your first habit to begin."
                action={
                  <button className="btn-primary" onClick={() => setHabitOpen(true)}>
                    <Plus size={16} /> Add habit
                  </button>
                }
              />
            ) : (
              <div className="space-y-2">
                {habits.map((h) => {
                  const done = h.doneDates.includes(today);
                  return (
                    <div
                      key={h.id}
                      className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-3"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-card text-lg">
                        {h.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-text truncate">{h.name}</div>
                        <div className="text-xs text-text-muted">
                          {h.streak}🔥 · {h.target}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => doneToday(h)}
                        disabled={done}
                        className={cn(
                          "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          done
                            ? "bg-mint-100 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300"
                            : "btn-outline",
                        )}
                      >
                        {done ? "Done ✓" : "Done today"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardPad>
        </div>
      </div>

      {/* Add habit modal */}
      <Modal
        open={habitOpen}
        onClose={() => setHabitOpen(false)}
        title="Add habit"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setHabitOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={saveHabit}
              disabled={!habitName.trim()}
            >
              Save habit
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder="e.g. Meditate, Read, Stretch"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setHabitIcon(e)}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl border text-lg transition-colors",
                    habitIcon === e
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                      : "border-border bg-surface-muted hover:border-brand-300",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Target</label>
            <input
              className="input"
              placeholder="e.g. Daily, 3x/week"
              value={habitTarget}
              onChange={(e) => setHabitTarget(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
