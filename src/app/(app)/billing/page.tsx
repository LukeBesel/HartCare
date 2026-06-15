"use client";

import {
  Badge,
  Card,
  CardPad,
  Modal,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import { useHousehold, useStore, useSubscription } from "@/lib/store";
import { formatDate, isoDaysAgo, isoDaysFromNow, relativeDay } from "@/lib/utils";
import type { PlanTier } from "@/lib/types";
import {
  Check,
  CreditCard,
  Crown,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type Plan = {
  tier: PlanTier;
  name: string;
  price: string;
  tagline: string;
  feats: string[];
  icon: React.ReactNode;
};

const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Free",
    price: "$0",
    tagline: "For getting started",
    feats: ["1 profile", "Activity, water & sleep", "Basic goals"],
    icon: <Sparkles size={18} />,
  },
  {
    tier: "premium",
    name: "Premium",
    price: "$9",
    tagline: "For health-conscious adults",
    feats: ["AI Health Coach", "Full nutrition & fitness", "Health records & analytics"],
    icon: <Crown size={18} />,
  },
  {
    tier: "family",
    name: "Family",
    price: "$15",
    tagline: "For the whole household",
    feats: ["Up to 6 profiles + pets", "Family mode & sharing", "HartHome integration"],
    icon: <Users size={18} />,
  },
];

const PRICE_OF: Record<PlanTier, string> = { free: "$0.00", premium: "$9.00", family: "$15.00" };

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function BillingPage() {
  const subscription = useSubscription();
  const household = useHousehold();
  const setTier = useStore((s) => s.setTier);
  const updateSubscription = useStore((s) => s.updateSubscription);
  const pushNotification = useStore((s) => s.pushNotification);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);

  const statusColor =
    subscription.status === "active"
      ? "mint"
      : subscription.status === "trialing"
        ? "brand"
        : "rose";

  const invoices = useMemo(
    () => [
      { id: "inv1", date: isoDaysAgo(2), amount: PRICE_OF[subscription.tier] },
      { id: "inv2", date: isoDaysAgo(32), amount: PRICE_OF[subscription.tier] },
      { id: "inv3", date: isoDaysAgo(62), amount: PRICE_OF[subscription.tier] },
    ],
    [subscription.tier],
  );

  function mockSwitch(tier: PlanTier) {
    setTier(tier);
    updateSubscription({ renewsOn: isoDaysFromNow(30), status: "active" });
    pushNotification({
      kind: "system",
      title: `Switched to ${cap(tier)}`,
      body:
        tier === "free"
          ? "You're now on the Free plan."
          : `Your ${cap(tier)} plan is active and renews in 30 days.`,
    });
  }

  async function switchTo(tier: PlanTier) {
    if (tier === subscription.tier || loadingTier) return;

    // The Free plan never goes through Stripe Checkout — keep the mock flow.
    if (tier === "free") {
      mockSwitch(tier);
      return;
    }

    setLoadingTier(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data: { url?: string; demo?: boolean } = await res.json();
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      // Demo mode or any non-redirect response → existing mock behavior.
      mockSwitch(tier);
    } catch {
      // Network/parse failure → fall back to the mock upgrade.
      mockSwitch(tier);
    } finally {
      setLoadingTier(null);
    }
  }

  function cancelPlan() {
    updateSubscription({ status: "canceled" });
    pushNotification({
      kind: "system",
      title: "Subscription canceled",
      body: "You'll keep access until the end of the current period.",
    });
    setCancelOpen(false);
  }

  function reactivate() {
    updateSubscription({ status: "active", renewsOn: isoDaysFromNow(30) });
    pushNotification({
      kind: "system",
      title: "Subscription reactivated",
      body: "Welcome back — your plan is active again.",
    });
  }

  function setSeats(n: number) {
    updateSubscription({ seats: Math.max(1, Math.min(6, n)) });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        subtitle="Manage your HartCare plan, billing and invoices."
      />

      {/* Current plan */}
      <CardPad>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="grid place-items-center h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 shrink-0">
              <Crown size={26} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold text-text">{cap(subscription.tier)} plan</h2>
                <Badge color={statusColor}>{cap(subscription.status)}</Badge>
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                {subscription.status === "canceled"
                  ? "Access continues until the end of your billing period."
                  : subscription.renewsOn
                    ? `Renews ${relativeDay(subscription.renewsOn)} · ${formatDate(subscription.renewsOn)}`
                    : "No upcoming renewal."}
              </p>
              <p className="text-xs text-text-muted mt-1">
                {subscription.seats} {subscription.seats === 1 ? "seat" : "seats"} ·{" "}
                {PRICE_OF[subscription.tier]}/mo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {subscription.status === "canceled" ? (
              <button className="btn-primary" onClick={reactivate}>
                <RefreshCw size={16} /> Reactivate
              </button>
            ) : (
              <button className="btn-outline" onClick={() => setCancelOpen(true)}>
                Cancel plan
              </button>
            )}
          </div>
        </div>
      </CardPad>

      {/* Plans */}
      <div>
        <SectionTitle
          title="Choose your plan"
          subtitle="Upgrade or change at any time"
          icon={<Sparkles size={18} />}
        />
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const current = p.tier === subscription.tier;
            return (
              <Card
                key={p.tier}
                className={
                  current
                    ? "card-pad relative ring-2 ring-brand-500 animate-in"
                    : "card-pad relative animate-in"
                }
              >
                {current && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-brand-600 text-white">
                    Current plan
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                    {p.icon}
                  </span>
                  <h3 className="font-semibold text-text">{p.name}</h3>
                </div>
                <p className="text-sm text-text-muted mt-2">{p.tagline}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-text">{p.price}</span>
                  <span className="text-text-muted text-sm">/mo</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-text">
                      <span className="grid place-items-center h-5 w-5 rounded-full bg-mint-50 text-mint-600 dark:bg-mint-500/10 shrink-0">
                        <Check size={12} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={current ? "mt-6 w-full btn-ghost" : "mt-6 w-full btn-primary"}
                  disabled={current || loadingTier !== null}
                  onClick={() => switchTo(p.tier)}
                >
                  {current
                    ? "Your current plan"
                    : loadingTier === p.tier
                      ? "Redirecting…"
                      : `Switch to ${p.name}`}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing details */}
      <CardPad>
        <SectionTitle
          title="Billing details"
          subtitle="Payment method and account"
          icon={<CreditCard size={18} />}
        />
        <div className="space-y-3">
          <p className="text-xs text-text-muted">
            Demo mode — connect Stripe keys to enable real checkout.
          </p>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-surface-card text-text-muted shrink-0">
                <CreditCard size={18} />
              </span>
              <div className="min-w-0">
                <div className="font-medium text-text">Visa •••• 4242</div>
                <p className="text-xs text-text-muted">Expires 08 / 2028</p>
              </div>
            </div>
            <button className="btn-ghost shrink-0">Update</button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3">
            <div className="min-w-0">
              <div className="font-medium text-text">Billing account</div>
              <p className="text-xs text-text-muted truncate">{household?.name ?? "Your household"}</p>
            </div>
          </div>

          {subscription.tier === "family" && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3">
              <div className="min-w-0">
                <div className="font-medium text-text">Family seats</div>
                <p className="text-xs text-text-muted">Up to 6 profiles in your household</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  className="btn-outline px-3"
                  onClick={() => setSeats(subscription.seats - 1)}
                  disabled={subscription.seats <= 1}
                  aria-label="Remove seat"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold text-text">{subscription.seats}</span>
                <button
                  className="btn-outline px-3"
                  onClick={() => setSeats(subscription.seats + 1)}
                  disabled={subscription.seats >= 6}
                  aria-label="Add seat"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </CardPad>

      {/* Invoices */}
      <CardPad>
        <SectionTitle title="Invoices" subtitle="Your recent payments" icon={<CreditCard size={18} />} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="font-medium py-2 pr-4">Date</th>
                <th className="font-medium py-2 pr-4">Amount</th>
                <th className="font-medium py-2 pr-4">Status</th>
                <th className="font-medium py-2 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="py-3 pr-4 text-text">{formatDate(inv.date, { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="py-3 pr-4 text-text">{inv.amount}</td>
                  <td className="py-3 pr-4">
                    <Badge color="mint">Paid</Badge>
                  </td>
                  <td className="py-3 text-right">
                    <button className="btn-ghost text-brand-600">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardPad>

      {/* Trust note */}
      <CardPad className="bg-gradient-to-br from-mint-50 to-surface-card dark:from-mint-500/10">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-xl bg-mint-100 text-mint-600 dark:bg-mint-500/15 shrink-0">
            <Shield size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-text">Secure & cancel anytime</h3>
            <p className="text-sm text-text-muted mt-1">
              Payments are encrypted and you can change or cancel your plan at any time. Your
              family&apos;s health data stays private to your household.
            </p>
          </div>
        </div>
      </CardPad>

      {/* Cancel modal */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel subscription?"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setCancelOpen(false)}>
              Keep plan
            </button>
            <button className="btn-primary" onClick={cancelPlan}>
              Cancel subscription
            </button>
          </>
        }
      >
        <p className="text-sm text-text">
          You&apos;ll keep full access to your {cap(subscription.tier)} plan until the end of your
          current billing period, then move to the Free plan. You can reactivate anytime.
        </p>
      </Modal>
    </div>
  );
}
