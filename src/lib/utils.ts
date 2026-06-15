import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function isoDaysFromNow(days: number): string {
  return isoDaysAgo(-days);
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString(undefined, opts ?? { month: "short", day: "numeric" });
}

export function relativeDay(iso: string): string {
  const t = todayISO();
  if (iso === t) return "Today";
  if (iso === isoDaysFromNow(1)) return "Tomorrow";
  if (iso === isoDaysAgo(1)) return "Yesterday";
  return formatDate(iso, { weekday: "short", month: "short", day: "numeric" });
}

export function ageFrom(birthdate?: string): number | undefined {
  if (!birthdate) return undefined;
  const b = new Date(birthdate);
  const diff = Date.now() - b.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

export function round(n: number, dp = 0): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
