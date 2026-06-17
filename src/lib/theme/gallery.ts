import type { Appearance } from "@/lib/types";
import { DEFAULT_WALLPAPER } from "@/lib/types";
import { ACCENT_LIST } from "./accents";

function appearance(p: Partial<Appearance>): Appearance {
  const base: Appearance = {
    theme: "system",
    accent: "indigo",
    scale: "cozy",
    radius: "soft",
    font: "sans",
    glow: true,
    reduceMotion: false,
    surface: "clean",
    cardStyle: "soft",
    wallpaper: { ...DEFAULT_WALLPAPER },
  };
  return { ...base, ...p, wallpaper: { ...DEFAULT_WALLPAPER, ...(p.wallpaper ?? {}) } };
}

export interface CuratedTheme {
  id: string;
  name: string;
  description: string;
  appearance: Appearance;
}

/**
 * A built-in gallery of designer themes. One-tap apply; users can also share
 * their own via theme codes (see lib/theme/share.ts).
 */
export const CURATED_THEMES: CuratedTheme[] = [
  {
    id: "midnight-aurora",
    name: "Midnight Aurora",
    description: "Indigo glass over a living aurora",
    appearance: appearance({
      theme: "dark", accent: "indigo", cardStyle: "glass", radius: "round", glow: true,
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "aurora-anim", dim: 35, blur: 2 },
    }),
  },
  {
    id: "sunset-boulevard",
    name: "Sunset Boulevard",
    description: "Warm sunset gradient, rounded & soft",
    appearance: appearance({
      theme: "dark", accent: "sunset", cardStyle: "glass", radius: "round",
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "dusk", dim: 30 },
    }),
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    description: "Calm blues with animated waves",
    appearance: appearance({
      theme: "dark", accent: "ocean", cardStyle: "glass",
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "waves", dim: 28, blur: 1 },
    }),
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    description: "Grounded greens, gentle and quiet",
    appearance: appearance({
      theme: "dark", accent: "emerald", cardStyle: "glass", surface: "tinted",
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "forest", dim: 32 },
    }),
  },
  {
    id: "cotton-candy",
    name: "Cotton Candy",
    description: "Soft pastel dawn, light & airy",
    appearance: appearance({
      theme: "light", accent: "rose", radius: "round", font: "rounded",
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "dawn", dim: 18 },
    }),
  },
  {
    id: "nebula",
    name: "Nebula",
    description: "Violet cosmos that slowly drifts",
    appearance: appearance({
      theme: "dark", accent: "violet", cardStyle: "glass", glow: true,
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "nebula", dim: 30, blur: 2 },
    }),
  },
  {
    id: "paper",
    name: "Paper",
    description: "Crisp, flat, distraction-free light",
    appearance: appearance({
      theme: "light", accent: "slate", cardStyle: "outline", radius: "sharp", glow: false, font: "serif",
    }),
  },
  {
    id: "mono-focus",
    name: "Mono Focus",
    description: "Monospace, flat, no motion",
    appearance: appearance({
      theme: "dark", accent: "slate", cardStyle: "flat", radius: "sharp", font: "mono", glow: false, reduceMotion: true,
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "mono", dim: 0 },
    }),
  },
  {
    id: "tropical",
    name: "Tropical",
    description: "Teal & lively, rounded mesh",
    appearance: appearance({
      theme: "dark", accent: "teal", cardStyle: "glass", radius: "round",
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "mesh", dim: 26 },
    }),
  },
  {
    id: "amber-warmth",
    name: "Amber Warmth",
    description: "Cozy amber, comfortable spacing",
    appearance: appearance({
      theme: "light", accent: "amber", scale: "comfortable", radius: "round", surface: "tinted",
    }),
  },
  {
    id: "crimson-night",
    name: "Crimson Night",
    description: "Bold crimson on deep grid",
    appearance: appearance({
      theme: "dark", accent: "crimson", cardStyle: "glass",
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "preset", preset: "grid", dim: 20 },
    }),
  },
  {
    id: "seasonal-auto",
    name: "Seasonal (Auto)",
    description: "Wallpaper follows the time of year",
    appearance: appearance({
      theme: "system", accent: "indigo", cardStyle: "glass",
      wallpaper: { ...DEFAULT_WALLPAPER, mode: "seasonal", dim: 30 },
    }),
  },
];

const SCALES = ["compact", "cozy", "comfortable"] as const;
const RADII = ["sharp", "soft", "round"] as const;
const FONTS = ["sans", "rounded", "serif", "mono"] as const;
const CARDS = ["soft", "flat", "outline", "glass"] as const;
const WPS = ["aurora", "aurora-anim", "mesh", "waves", "nebula", "drift", "dusk", "ocean", "forest"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generates a fun random-but-coherent appearance ("Surprise me"). */
export function randomTheme(): Appearance {
  const accent = pick(ACCENT_LIST).name;
  const useWallpaper = Math.random() > 0.35;
  const card = useWallpaper ? (Math.random() > 0.4 ? "glass" : pick(CARDS)) : pick(CARDS);
  return appearance({
    theme: Math.random() > 0.5 ? "dark" : "light",
    accent,
    scale: pick(SCALES),
    radius: pick(RADII),
    font: pick(FONTS),
    glow: Math.random() > 0.3,
    cardStyle: card,
    surface: Math.random() > 0.6 ? "tinted" : "clean",
    wallpaper: useWallpaper
      ? { ...DEFAULT_WALLPAPER, mode: "preset", preset: pick(WPS), dim: 20 + Math.floor(Math.random() * 30), blur: Math.floor(Math.random() * 3) }
      : { ...DEFAULT_WALLPAPER },
  });
}
