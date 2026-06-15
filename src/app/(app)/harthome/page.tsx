"use client";

import {
  Badge,
  CardPad,
  PageHeader,
  SectionTitle,
  Toggle,
} from "@/components/ui";
import Link from "next/link";
import { useProfileRows } from "@/lib/hooks";
import { useStore, useSubscription } from "@/lib/store";
import { todayISO } from "@/lib/utils";
import {
  ArrowLeftRight,
  Activity,
  Apple,
  Bell,
  Crown,
  Droplets,
  Dumbbell,
  HeartPulse,
  Link2,
  PawPrint,
  Pill,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const SYNC_ITEMS: { key: string; title: string; desc: string; icon: React.ReactNode }[] = [
  { key: "meals", title: "Meal plans", desc: "Today's menu on your kitchen display", icon: <Apple size={18} /> },
  { key: "grocery", title: "Grocery lists", desc: "Add items by voice, check off in the app", icon: <ShoppingCart size={18} /> },
  { key: "water", title: "Water reminders", desc: "Gentle nudges on smart speakers", icon: <Droplets size={18} /> },
  { key: "workout", title: "Workout reminders", desc: "Scheduled sessions announced at home", icon: <Dumbbell size={18} /> },
  { key: "meds", title: "Medication reminders", desc: "Never miss a dose, hands-free", icon: <Pill size={18} /> },
  { key: "goals", title: "Family goals", desc: "Shared progress on the wall display", icon: <Users size={18} /> },
  { key: "pet", title: "Pet reminders", desc: "Feeding and vet visits for your pets", icon: <PawPrint size={18} /> },
  { key: "weight", title: "Weight progress", desc: "Trends synced from your smart scale", icon: <TrendingUp size={18} /> },
  { key: "health", title: "Health notifications", desc: "Wellness alerts across your devices", icon: <HeartPulse size={18} /> },
];

export default function HartHomePage() {
  const subscription = useSubscription();
  const setTier = useStore((s) => s.setTier);
  const updateSubscription = useStore((s) => s.updateSubscription);
  const pushNotification = useStore((s) => s.pushNotification);

  const meals = useProfileRows("mealPlans");
  const meds = useProfileRows("medications");

  // Per-item two-way sync (local UI state).
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SYNC_ITEMS.map((s) => [s.key, true])),
  );

  const todayMeal = useMemo(() => {
    const t = todayISO();
    const today = meals.filter((m) => m.date === t);
    return today.find((m) => m.meal === "dinner") ?? today[0];
  }, [meals]);

  const nextMed = useMemo(() => meds.find((m) => m.active) ?? meds[0], [meds]);

  const isFree = subscription.tier === "free";
  const connected = subscription.hartHomeConnected;

  function upgrade() {
    setTier("premium");
    updateSubscription({ status: "active" });
    pushNotification({
      kind: "system",
      title: "Welcome to Premium",
      body: "HartHome and the AI coach are now unlocked.",
    });
  }

  function toggleConnection() {
    const next = !connected;
    updateSubscription({ hartHomeConnected: next });
    pushNotification({
      kind: "system",
      title: next ? "HartHome connected" : "HartHome disconnected",
      body: next
        ? "Your health data now syncs to your smart home."
        : "Two-way sync has been turned off.",
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="HartHome"
        subtitle="Bring your family's health into the smart home — two-way sync with displays, speakers and scales."
      />

      {isFree ? (
        <PremiumGate onUpgrade={upgrade} />
      ) : (
        <>
          {/* Connection status */}
          <CardPad>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span
                  className={
                    connected
                      ? "grid place-items-center h-14 w-14 rounded-2xl bg-mint-50 text-mint-600 dark:bg-mint-500/10"
                      : "grid place-items-center h-14 w-14 rounded-2xl bg-surface-muted text-text-muted"
                  }
                >
                  <Link2 size={26} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-text">
                      {connected ? "HartHome connected" : "Connect your HartHome"}
                    </h2>
                    {connected && <Badge color="mint">Live</Badge>}
                  </div>
                  <p className="text-sm text-text-muted mt-0.5">
                    {connected
                      ? "Connected via Single Sign-On · syncing in real time"
                      : "Link your smart home hub to start syncing health data."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Toggle checked={connected} onChange={toggleConnection} />
                <button className={connected ? "btn-outline" : "btn-primary"} onClick={toggleConnection}>
                  {connected ? "Disconnect" : "Connect HartHome"}
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
              <ArrowLeftRight size={14} className="text-brand-600" />
              Changes sync both directions between HartCare and your HartHome devices.
            </div>
          </CardPad>

          {/* What syncs */}
          <CardPad>
            <SectionTitle
              title="What syncs to your HartHome dashboard"
              subtitle="Toggle exactly what flows to your smart home"
              icon={<Sparkles size={18} />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SYNC_ITEMS.map((item) => {
                const on = enabled[item.key];
                return (
                  <div
                    key={item.key}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-surface-card p-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={
                          on && connected
                            ? "grid place-items-center h-10 w-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 shrink-0"
                            : "grid place-items-center h-10 w-10 rounded-xl bg-surface-muted text-text-muted shrink-0"
                        }
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-text">{item.title}</div>
                        <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <Toggle
                      checked={on}
                      onChange={(v) => setEnabled((e) => ({ ...e, [item.key]: v }))}
                    />
                  </div>
                );
              })}
            </div>
            {!connected && (
              <p className="mt-4 text-xs text-text-muted">
                Connect HartHome above to activate these sync channels.
              </p>
            )}
          </CardPad>

          {/* Wall display preview */}
          <CardPad>
            <SectionTitle
              title="HartHome wall display preview"
              subtitle="A glimpse of your family hub panel"
              icon={<Activity size={18} />}
            />
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-sm text-brand-100">Good day, Hart family</div>
                  <div className="text-2xl font-bold">Today&apos;s wellbeing</div>
                </div>
                <span className="grid place-items-center h-11 w-11 rounded-2xl bg-white/15">
                  <HeartPulse size={22} />
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <HubTile icon={<Apple size={18} />} label="Tonight's meal" value={todayMeal?.name ?? "Plan a meal"} />
                <HubTile icon={<Droplets size={18} />} label="Water reminder" value="Time for a glass" />
                <HubTile icon={<Pill size={18} />} label="Next medication" value={nextMed?.name ?? "All caught up"} />
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-brand-100">
                <Bell size={14} />
                {connected ? "Live from your HartHome devices" : "Connect to go live"}
              </div>
            </div>
          </CardPad>
        </>
      )}
    </div>
  );
}

function HubTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <div className="flex items-center gap-2 text-brand-100 text-xs">
        {icon}
        {label}
      </div>
      <div className="mt-2 font-semibold leading-snug">{value}</div>
    </div>
  );
}

function PremiumGate({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <CardPad>
      <div className="text-center py-8 px-4 max-w-xl mx-auto">
        <span className="mx-auto mb-4 grid place-items-center h-16 w-16 rounded-3xl bg-amber-50 text-amber-600 dark:bg-amber-500/10">
          <Crown size={30} />
        </span>
        <h2 className="text-xl font-bold text-text">HartHome is a premium feature</h2>
        <p className="text-text-muted mt-2">
          Sync meal plans, reminders, goals and health notifications to your smart home displays and
          speakers — with secure, two-way Single Sign-On. Upgrade to unlock the full HartHome
          integration.
        </p>
        <ul className="mt-5 space-y-2 text-left max-w-sm mx-auto text-sm">
          {[
            "Two-way sync with displays and speakers",
            "Hands-free reminders for the whole family",
            "Smart-scale weight tracking",
            "Family goals on your wall hub",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-text">
              <span className="grid place-items-center h-5 w-5 rounded-full bg-mint-50 text-mint-600 dark:bg-mint-500/10">
                <Sparkles size={12} />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button className="btn-primary px-6" onClick={onUpgrade}>
            <Crown size={16} /> Upgrade to Premium
          </button>
          <Link href="/billing" className="btn-outline px-6">
            Compare plans
          </Link>
        </div>
      </div>
    </CardPad>
  );
}
