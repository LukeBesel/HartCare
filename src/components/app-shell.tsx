"use client";

import { NAV, NAV_GROUPS } from "@/lib/nav";
import {
  useCurrentProfile,
  useProfiles,
  useStore,
  useSubscription,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Bell,
  Check,
  ChevronDown,
  Crown,
  HeartPulse,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { createClient, SUPABASE_ENABLED } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Avatar, Badge } from "./ui";
import { useThemeToggle } from "./theme";

const emptySubscribe = () => () => {};
/** True only after client mount — avoids SSR/localStorage hydration mismatch. */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1">
      <span className="grid place-items-center h-9 w-9 rounded-xl bg-brand-gradient text-white shadow-sm glow-brand">
        <HeartPulse size={20} strokeWidth={2.4} />
      </span>
      <div className="leading-tight">
        <div className="font-semibold tracking-tight text-text">HartCare</div>
        <div className="text-[11px] text-text-muted">Healthy living, together.</div>
      </div>
    </Link>
  );
}

function ProfileSwitcher() {
  const profiles = useProfiles();
  const current = useCurrentProfile();
  const setCurrent = useStore((s) => s.setCurrentProfile);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-surface-muted transition-colors"
      >
        <Avatar name={current.name} emoji={current.avatar} color={current.color} size={32} />
        <span className="hidden sm:block text-sm font-medium text-text">{current.name}</span>
        <ChevronDown size={16} className="text-text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 card p-1.5 z-50 animate-in">
          <div className="px-2 py-1.5 text-xs font-medium text-text-muted">Switch profile</div>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setCurrent(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-surface-muted text-left"
            >
              <Avatar name={p.name} emoji={p.avatar} color={p.color} size={28} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-text truncate">{p.name}</div>
                <div className="text-xs text-text-muted capitalize">{p.role}</div>
              </div>
              {p.id === current.id && <Check size={16} className="text-brand-600" />}
            </button>
          ))}
          <Link
            href="/family"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-2 py-2 text-sm text-brand-600 hover:bg-surface-muted mt-1"
          >
            Manage household →
          </Link>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setNext } = useThemeToggle();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  return (
    <button
      onClick={setNext}
      title={`Theme: ${theme}`}
      className="grid place-items-center h-9 w-9 rounded-xl hover:bg-surface-muted text-text-muted hover:text-text transition-colors"
    >
      <Icon size={18} />
    </button>
  );
}

function NotificationsBell() {
  const notifications = useStore((s) => s.db.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid place-items-center h-9 w-9 rounded-xl hover:bg-surface-muted text-text-muted hover:text-text transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface-card" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 card z-50 animate-in overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-text">Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs text-brand-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-text-muted">You&apos;re all caught up 🎉</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-muted border-b border-border last:border-0",
                  !n.read && "bg-brand-50/40 dark:bg-brand-500/5",
                )}
              >
                {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                <div className={cn("min-w-0", n.read && "pl-5")}>
                  <div className="text-sm font-medium text-text">{n.title}</div>
                  {n.body && <div className="text-xs text-text-muted mt-0.5">{n.body}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const sub = useSubscription();
  const premiumActive = sub.tier !== "free";
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
      {NAV_GROUPS.map((group) => (
        <div key={group}>
          <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {group}
          </div>
          <div className="space-y-0.5">
            {NAV.filter((n) => n.group === group).map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-text-muted hover:bg-surface-muted hover:text-text",
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.premium && !premiumActive && (
                    <Crown size={14} className={active ? "text-amber-200" : "text-amber-500"} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UpgradeCard() {
  const sub = useSubscription();
  if (sub.tier !== "free") {
    return (
      <Link href="/billing" className="mx-3 mb-3 block card card-pad hover:bg-surface-muted transition-colors">
        <div className="flex items-center gap-2">
          <Crown size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-text capitalize">{sub.tier} plan</span>
        </div>
        <p className="text-xs text-text-muted mt-1">
          {sub.hartHomeConnected ? "HartHome connected" : "Connect HartHome"}
        </p>
      </Link>
    );
  }
  return (
    <Link
      href="/billing"
      className="mx-3 mb-3 block rounded-2xl p-4 bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-sm hover:from-brand-700 transition-colors"
    >
      <div className="flex items-center gap-2 font-semibold">
        <Crown size={16} /> Go Premium
      </div>
      <p className="text-xs text-brand-100 mt-1">Unlock the AI coach, family mode & HartHome sync.</p>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-2 text-text-muted">
          <HeartPulse className="text-brand-600 animate-pulse" />
          <span>Loading HartCare…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface-card">
        <div className="px-3 py-4">
          <Brand />
        </div>
        <SidebarNav />
        <UpgradeCard />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[80%] flex flex-col bg-surface-card border-r border-border animate-in">
            <div className="flex items-center justify-between px-3 py-4">
              <Brand />
              <button onClick={() => setMobileOpen(false)} className="p-2 text-text-muted">
                <X size={20} />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <UpgradeCard />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-surface/80 backdrop-blur px-4 py-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden grid place-items-center h-9 w-9 rounded-xl hover:bg-surface-muted text-text"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden">
            <span className="font-bold text-text">HartCare</span>
          </div>
          <div className="flex-1" />
          <Badge color="mint" className="hidden sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-500" /> Synced
          </Badge>
          <ThemeToggle />
          <NotificationsBell />
          <button
            onClick={async () => {
              if (SUPABASE_ENABLED) {
                try {
                  await createClient().auth.signOut();
                } catch {
                  /* ignore */
                }
              }
              router.push("/login");
            }}
            title="Sign out"
            className="hidden sm:grid place-items-center h-9 w-9 rounded-xl hover:bg-surface-muted text-text-muted hover:text-text"
          >
            <LogOut size={18} />
          </button>
          <ProfileSwitcher />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
