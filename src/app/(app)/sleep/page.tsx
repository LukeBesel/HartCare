"use client";

import { BarTrend, LineTrend } from "@/components/charts";
import {
  Badge,
  CardPad,
  EmptyState,
  Modal,
  PageHeader,
  Segmented,
  StatCard,
  Toggle,
} from "@/components/ui";
import { useDailySeries, useProfileRows } from "@/lib/hooks";
import { useCurrentProfile, useSettings, useStore } from "@/lib/store";
import { relativeDay, round, todayISO } from "@/lib/utils";
import { Bed, Clock, Moon, Plus, Sunrise } from "lucide-react";
import { useMemo, useState } from "react";

const QUALITY_OPTIONS: { label: string; value: string }[] = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
];

const QUALITY_LABEL: Record<number, string> = {
  1: "Restless",
  2: "Poor",
  3: "Okay",
  4: "Good",
  5: "Great",
};

const QUALITY_COLOR: Record<number, Parameters<typeof Badge>[0]["color"]> = {
  1: "rose",
  2: "rose",
  3: "amber",
  4: "mint",
  5: "mint",
};

function stars(quality: number) {
  const q = Math.round(quality);
  return "★★★★★".slice(0, q) + "☆☆☆☆☆".slice(0, 5 - q);
}

export default function SleepPage() {
  const profile = useCurrentProfile();
  const settings = useSettings();
  const add = useStore((s) => s.add);
  const pushNotification = useStore((s) => s.pushNotification);

  const sleepLogs = useProfileRows("sleepLogs");

  const [logOpen, setLogOpen] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderTime, setReminderTime] = useState("22:30");

  // Log form state
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState("7.5");
  const [quality, setQuality] = useState("4");
  const [bedtime, setBedtime] = useState("23:00");
  const [wake, setWake] = useState("06:45");

  // ---- Derived stats ----------------------------------------------------
  const sorted = useMemo(
    () => [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date)),
    [sleepLogs],
  );

  const lastNight = sorted[0];

  const weekly = useMemo(() => {
    const recent = sorted.slice(0, 7);
    if (recent.length === 0) return { avgHours: 0, avgQuality: 0 };
    const avgHours = recent.reduce((a, s) => a + s.hours, 0) / recent.length;
    const avgQuality = recent.reduce((a, s) => a + s.quality, 0) / recent.length;
    return { avgHours, avgQuality };
  }, [sorted]);

  const hoursSeries = useDailySeries(sleepLogs, "hours", 14, "last");
  const qualitySeries = useDailySeries(sleepLogs, "quality", 14, "last");

  const typical = useMemo(() => {
    const withTimes = sorted.filter((s) => s.bedtime && s.wake).slice(0, 7);
    return {
      bedtime: withTimes[0]?.bedtime,
      wake: withTimes[0]?.wake,
    };
  }, [sorted]);

  const recent = useMemo(() => sorted.slice(0, 10), [sorted]);

  function saveLog() {
    const h = Number(hours);
    if (!h || h <= 0) return;
    add("sleepLogs", {
      profileId: profile.id,
      date,
      hours: round(h, 1),
      quality: Number(quality),
      bedtime: bedtime || undefined,
      wake: wake || undefined,
    });
    setLogOpen(false);
  }

  function toggleReminder(v: boolean) {
    setReminderOn(v);
    if (v) {
      pushNotification({
        kind: "system",
        title: "Bedtime reminder set",
        body: `We'll nudge you to wind down at ${reminderTime}.`,
        profileId: profile.id,
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sleep"
        subtitle={`Restful nights for ${profile.name}`}
        action={
          <button className="btn-primary" onClick={() => setLogOpen(true)}>
            <Plus size={16} /> Log sleep
          </button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Last night"
          value={lastNight ? round(lastNight.hours, 1) : "—"}
          unit={lastNight ? "hrs" : undefined}
          icon={<Moon size={18} />}
          accent="violet"
          hint={lastNight ? relativeDay(lastNight.date) : undefined}
        />
        <StatCard
          label="Weekly average"
          value={weekly.avgHours ? round(weekly.avgHours, 1) : "—"}
          unit={weekly.avgHours ? "hrs" : undefined}
          icon={<Bed size={18} />}
          accent="brand"
          hint="Last 7 nights"
        />
        <StatCard
          label="Avg quality"
          value={weekly.avgQuality ? stars(weekly.avgQuality) : "—"}
          icon={<Sunrise size={18} />}
          accent="amber"
          hint={weekly.avgQuality ? `${round(weekly.avgQuality, 1)} / 5` : undefined}
        />
        <StatCard
          label="Sleep goal"
          value={settings.sleepGoalHours}
          unit="hrs"
          icon={<Clock size={18} />}
          accent="mint"
          hint="Nightly target"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Duration trend */}
          <CardPad>
            <SectionDuration goal={settings.sleepGoalHours} />
            {sleepLogs.length === 0 ? (
              <EmptyState
                icon={<Moon size={20} />}
                title="No sleep logged yet"
                description="Log a night's sleep to see your duration trend."
              />
            ) : (
              <BarTrend
                data={hoursSeries}
                unit="hrs"
                height={200}
                goal={settings.sleepGoalHours}
                color="#a855f7"
              />
            )}
          </CardPad>

          {/* Quality trend */}
          <CardPad>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-brand-600">
                <Sunrise size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-text">Sleep quality</h2>
                <p className="text-sm text-text-muted">How rested you felt, 1–5</p>
              </div>
            </div>
            {sleepLogs.length === 0 ? (
              <EmptyState
                icon={<Sunrise size={20} />}
                title="No quality data yet"
                description="Rate your sleep when you log a night."
              />
            ) : (
              <LineTrend data={qualitySeries} height={200} color="#a855f7" />
            )}
          </CardPad>

          {/* Recent nights */}
          <CardPad>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-brand-600">
                <Bed size={18} />
              </span>
              <h2 className="text-base font-semibold text-text">Recent nights</h2>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={<Bed size={20} />}
                title="Nothing logged"
                description="Your recent nights will appear here once you start logging."
              />
            ) : (
              <div className="space-y-2">
                {recent.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-text">{relativeDay(s.date)}</div>
                      <div className="text-xs text-text-muted">
                        {s.bedtime && s.wake ? `${s.bedtime} → ${s.wake}` : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-text">
                        {round(s.hours, 1)} hrs
                      </span>
                      <Badge color={QUALITY_COLOR[s.quality] ?? "gray"}>
                        {QUALITY_LABEL[s.quality] ?? `Q${s.quality}`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardPad>
        </div>

        {/* Right: schedule */}
        <div className="space-y-6">
          <CardPad>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-brand-600">
                <Clock size={18} />
              </span>
              <h2 className="text-base font-semibold text-text">Sleep schedule</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-muted px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-text-muted">
                  <Bed size={15} />
                  <span className="text-xs font-medium">Typical bedtime</span>
                </div>
                <div className="mt-2 text-xl font-bold text-text">
                  {typical.bedtime ?? "—"}
                </div>
              </div>
              <div className="rounded-xl bg-surface-muted px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-text-muted">
                  <Sunrise size={15} />
                  <span className="text-xs font-medium">Typical wake</span>
                </div>
                <div className="mt-2 text-xl font-bold text-text">
                  {typical.wake ?? "—"}
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-text">Bedtime reminder</div>
                  <p className="text-xs text-text-muted">Wind down on time, every night.</p>
                </div>
                <Toggle checked={reminderOn} onChange={toggleReminder} />
              </div>
              <div className="mt-3">
                <label className="label">Remind me at</label>
                <input
                  className="input"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>
            </div>
          </CardPad>

          <CardPad className="bg-gradient-to-br from-violet-50 to-surface-card dark:from-violet-500/10">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 shrink-0">
                <Moon size={18} />
              </span>
              <div>
                <h3 className="font-semibold text-text">Tonight&apos;s wind-down</h3>
                <p className="text-sm text-text-muted mt-1">
                  Dim the lights an hour before bed and keep screens away for calmer,
                  deeper rest.
                </p>
              </div>
            </div>
          </CardPad>
        </div>
      </div>

      {/* Log sleep modal */}
      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Log sleep"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setLogOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={saveLog}
              disabled={!Number(hours) || Number(hours) <= 0}
            >
              Save night
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Hours slept</label>
              <input
                className="input"
                type="number"
                min={0}
                step="0.1"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Quality</label>
            <div>
              <Segmented options={QUALITY_OPTIONS} value={quality} onChange={setQuality} />
              <p className="text-xs text-text-muted mt-1.5">
                {QUALITY_LABEL[Number(quality)]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Bedtime</label>
              <input
                className="input"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Wake time</label>
              <input
                className="input"
                type="time"
                value={wake}
                onChange={(e) => setWake(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SectionDuration({ goal }: { goal: number }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <span className="text-brand-600">
          <Moon size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-text">Sleep duration</h2>
          <p className="text-sm text-text-muted">Last 14 nights</p>
        </div>
      </div>
      <Badge color="mint">Goal {goal} hrs</Badge>
    </div>
  );
}
