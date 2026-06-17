"use client";

import { useStore } from "@/lib/store";
import type { Appearance, DayPart, Settings } from "@/lib/types";
import { DEFAULT_WALLPAPER } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { CURATED_THEMES } from "./gallery";

/** The household-wide default appearance, pulled from the flat Settings fields. */
export function globalAppearance(s: Settings): Appearance {
  return {
    theme: s.theme,
    accent: s.accent,
    customAccent: s.customAccent,
    scale: s.scale,
    radius: s.radius,
    font: s.font,
    glow: s.glow,
    reduceMotion: s.reduceMotion,
    surface: s.surface,
    cardStyle: s.cardStyle ?? "soft",
    wallpaper: s.wallpaper ?? DEFAULT_WALLPAPER,
  };
}

/** The appearance that should actually be applied for a given profile. */
export function effectiveAppearance(s: Settings, profileId: string): Appearance {
  const base = globalAppearance(s);
  if (s.themePerProfile && s.profileAppearance?.[profileId]) {
    return { ...base, ...s.profileAppearance[profileId] };
  }
  return base;
}

function dayPart(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

/** Applies the theme schedule (time-of-day preset + auto-dark) on top of a base. */
export function scheduledAppearance(base: Appearance, s: Settings, now = new Date()): Appearance {
  const sch = s.schedule;
  if (!sch?.enabled) return base;
  let out = base;

  if (sch.byTime) {
    const pid = sch.slots?.[dayPart(now.getHours())];
    if (pid) {
      const preset = [...(s.presets ?? []), ...CURATED_THEMES].find((p) => p.id === pid);
      if (preset) out = { ...preset.appearance };
    }
  }

  if (sch.autoDark) {
    const h = now.getHours();
    const { darkFrom, darkTo } = sch;
    const dark = darkFrom <= darkTo ? h >= darkFrom && h < darkTo : h >= darkFrom || h < darkTo;
    out = { ...out, theme: dark ? "dark" : "light" };
  }
  return out;
}

/**
 * Reactive effective appearance for the current profile (stable via useMemo),
 * with theme scheduling applied and re-evaluated every minute.
 */
export function useEffectiveAppearance(): Appearance {
  const settings = useStore((s) => s.db.settings);
  const pid = useStore((s) => s.currentProfileId);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!settings.schedule?.enabled) return;
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, [settings.schedule?.enabled]);

  // Re-derive "now" each minute tick so schedule transitions apply on time.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `tick` intentionally drives the refresh
  const now = useMemo(() => new Date(), [tick]);
  return useMemo(
    () => scheduledAppearance(effectiveAppearance(settings, pid), settings, now),
    [settings, pid, now],
  );
}

/**
 * Controls for the Appearance Studio. Reads/writes the right place depending on
 * whether per-profile theming is on (the current profile's override) or off
 * (the household-wide default).
 */
export function useAppearanceControls() {
  const settings = useStore((s) => s.db.settings);
  const pid = useStore((s) => s.currentProfileId);
  const updateSettings = useStore((s) => s.updateSettings);

  const appearance = useMemo(() => effectiveAppearance(settings, pid), [settings, pid]);
  const perProfile = !!settings.themePerProfile;

  function setAppearance(patch: Partial<Appearance>) {
    if (perProfile) {
      const merged: Appearance = { ...effectiveAppearance(settings, pid), ...patch };
      updateSettings({ profileAppearance: { ...settings.profileAppearance, [pid]: merged } });
    } else {
      const { wallpaper, ...flat } = patch;
      const upd: Partial<Settings> = { ...flat };
      if (wallpaper) upd.wallpaper = wallpaper;
      updateSettings(upd);
    }
  }

  function setPerProfile(on: boolean) {
    if (on) {
      const next = { ...settings.profileAppearance };
      if (!next[pid]) next[pid] = globalAppearance(settings);
      updateSettings({ themePerProfile: true, profileAppearance: next });
    } else {
      updateSettings({ themePerProfile: false });
    }
  }

  return { appearance, perProfile, setAppearance, setPerProfile, profileId: pid };
}
