"use client";

import { useStore } from "@/lib/store";
import type { Appearance, Settings } from "@/lib/types";
import { DEFAULT_WALLPAPER } from "@/lib/types";
import { useMemo } from "react";

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

/** Reactive effective appearance for the current profile (stable via useMemo). */
export function useEffectiveAppearance(): Appearance {
  const settings = useStore((s) => s.db.settings);
  const pid = useStore((s) => s.currentProfileId);
  return useMemo(() => effectiveAppearance(settings, pid), [settings, pid]);
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
