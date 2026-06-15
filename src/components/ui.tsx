"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

/* ------------------------------- Card ------------------------------------ */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardPad({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card card-pad animate-in", className)}>{children}</div>;
}

/* --------------------------- Section heading ----------------------------- */
export function SectionTitle({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-brand-600 shrink-0">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text truncate">{title}</h2>
          {subtitle && <p className="text-sm text-text-muted truncate">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Page header ------------------------------ */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
        {subtitle && <p className="text-text-muted mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------ Stat card -------------------------------- */
export function StatCard({
  label,
  value,
  unit,
  icon,
  accent = "brand",
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  accent?: "brand" | "mint" | "amber" | "violet" | "rose";
  hint?: string;
}) {
  const accents: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/10",
    mint: "bg-mint-50 text-mint-600 dark:bg-mint-500/10",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  };
  return (
    <Card className="card-pad animate-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        {icon && (
          <span className={cn("grid place-items-center h-9 w-9 rounded-xl", accents[accent])}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text">{value}</span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
      </div>
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </Card>
  );
}

/* ----------------------------- Progress ring ----------------------------- */
export function ProgressRing({
  value,
  size = 76,
  stroke = 8,
  color = "var(--color-brand-500)",
  track = "var(--color-surface-muted)",
  label,
  sublabel,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: ReactNode;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center leading-none">
        {label && <div className="text-sm font-bold text-text">{label}</div>}
        {sublabel && <div className="text-[10px] text-text-muted mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
}

/* ----------------------------- Progress bar ------------------------------ */
export function ProgressBar({
  value,
  color = "bg-brand-500",
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={cn("h-2.5 w-full rounded-full bg-surface-muted overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* -------------------------------- Badge ---------------------------------- */
export function Badge({
  children,
  color = "brand",
  className,
}: {
  children: ReactNode;
  color?: "brand" | "mint" | "amber" | "rose" | "violet" | "gray";
  className?: string;
}) {
  const colors: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
    mint: "bg-mint-50 text-mint-700 dark:bg-mint-500/15 dark:text-mint-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    gray: "bg-surface-muted text-text-muted",
  };
  return <span className={cn("chip", colors[color], className)}>{children}</span>;
}

/* ------------------------------- Avatar ---------------------------------- */
export function Avatar({
  name,
  emoji,
  color = "#2a59d6",
  size = 36,
}: {
  name: string;
  emoji?: string;
  color?: string;
  size?: number;
}) {
  return (
    <span
      className="grid place-items-center rounded-full font-semibold text-white shrink-0 select-none"
      style={{ width: size, height: size, background: color, fontSize: size * 0.45 }}
      title={name}
    >
      {emoji ?? name.charAt(0).toUpperCase()}
    </span>
  );
}

/* ------------------------------ Empty state ------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-12 px-6">
      {icon && (
        <div className="mx-auto mb-3 grid place-items-center h-12 w-12 rounded-2xl bg-surface-muted text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-text">{title}</h3>
      {description && <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------- Skeleton -------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-surface-muted", className)} />;
}

/* --------------------------------- Modal --------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus management: move focus into the dialog on open, restore it on close,
  // and trap Tab/Shift+Tab within the dialog. Refs only — no setState here.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();

    function focusables(): HTMLElement[] {
      const node = dialogRef.current;
      if (!node) return [];
      return Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !dialogRef.current?.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const node = dialogRef.current;
    node?.addEventListener("keydown", onKeyDown);
    return () => {
      node?.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative card w-full max-w-lg max-h-[90vh] overflow-auto animate-in"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 sticky top-0 bg-surface-card rounded-t-2xl">
          <h3 id={titleId} className="font-semibold text-text">{title}</h3>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="text-text-muted hover:text-text rounded-lg p-1"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="border-t border-border px-5 py-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------- Toggle --------------------------------- */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
      aria-pressed={checked}
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-brand-600" : "bg-ink-300 dark:bg-ink-700",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </span>
      {label && <span className="text-sm text-text">{label}</span>}
    </button>
  );
}

/* ------------------------------ Segmented -------------------------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-surface-muted p-1 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 font-medium transition-colors",
            value === o.value ? "bg-surface-card text-text shadow-sm" : "text-text-muted hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
