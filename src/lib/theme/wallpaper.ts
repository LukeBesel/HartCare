import type { WallpaperPresetId } from "@/lib/types";

export interface WallpaperPreset {
  id: WallpaperPresetId;
  label: string;
  /** CSS background value. May reference --color-brand-* so it follows accent. */
  css: string;
}

/**
 * Built-in wallpapers. Several reference the live accent variables so they
 * recolor automatically when the user changes accent.
 */
export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "aurora",
    label: "Aurora",
    css: "radial-gradient(60% 60% at 20% 20%, color-mix(in srgb, var(--color-brand-400) 55%, transparent), transparent 70%), radial-gradient(55% 55% at 85% 15%, color-mix(in srgb, var(--color-brand-600) 50%, transparent), transparent 70%), radial-gradient(60% 60% at 60% 90%, color-mix(in srgb, var(--color-brand-300) 45%, transparent), transparent 70%), linear-gradient(135deg, var(--color-brand-700), var(--color-brand-900))",
  },
  {
    id: "mesh",
    label: "Mesh",
    css: "radial-gradient(40% 40% at 15% 25%, #f472b6aa, transparent 70%), radial-gradient(45% 45% at 80% 20%, color-mix(in srgb, var(--color-brand-400) 70%, transparent), transparent 70%), radial-gradient(50% 50% at 50% 85%, #22d3eeaa, transparent 70%), linear-gradient(135deg, var(--color-brand-800), #0f172a)",
  },
  {
    id: "dawn",
    label: "Dawn",
    css: "linear-gradient(160deg, #fbc2eb 0%, #a6c1ee 55%, color-mix(in srgb, var(--color-brand-300) 70%, #a6c1ee) 100%)",
  },
  {
    id: "dusk",
    label: "Dusk",
    css: "linear-gradient(160deg, #2b1055 0%, color-mix(in srgb, var(--color-brand-700) 80%, #2b1055) 55%, #7597de 100%)",
  },
  {
    id: "ocean",
    label: "Ocean",
    css: "linear-gradient(160deg, #0f2027 0%, #203a43 45%, color-mix(in srgb, var(--color-brand-600) 70%, #2c5364) 100%)",
  },
  {
    id: "forest",
    label: "Forest",
    css: "linear-gradient(160deg, #0b3d2e 0%, #134e4a 50%, color-mix(in srgb, var(--color-brand-700) 60%, #1a5e48) 100%)",
  },
  {
    id: "mono",
    label: "Mono",
    css: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)",
  },
  {
    id: "grid",
    label: "Grid",
    css: "linear-gradient(var(--color-brand-900), #0f172a), repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(255,255,255,0.05) 39px), repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(255,255,255,0.05) 39px)",
  },
];

export function wallpaperPresetCss(id: WallpaperPresetId | undefined): string {
  return (WALLPAPER_PRESETS.find((p) => p.id === id) ?? WALLPAPER_PRESETS[0]).css;
}
