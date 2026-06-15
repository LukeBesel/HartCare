import type { AccentName } from "@/lib/types";

export interface AccentPreset {
  name: AccentName;
  label: string;
  /** A representative swatch color for pickers. */
  swatch: string;
  /** The two stops of the brand gradient. */
  gradient: [string, string];
  /** Tailwind brand scale 50–900 (drives every `brand-*` utility at runtime). */
  scale: Record<number, string>;
}

/**
 * Each preset overrides the `--color-brand-*` CSS variables (and the brand
 * gradient) at runtime, so every `bg-brand-*`, `text-brand-*`, ring, chart and
 * the logo update live — the same technique HartMonitor uses for its accents.
 */
export const ACCENTS: Record<Exclude<AccentName, "custom">, AccentPreset> = {
  indigo: preset("indigo", "Indigo", ["#6366f1", "#ec4899"], {
    50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8",
    500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81",
  }),
  blue: preset("blue", "Ocean Blue", ["#3b82f6", "#06b6d4"], {
    50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
    500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a",
  }),
  violet: preset("violet", "Violet", ["#8b5cf6", "#d946ef"], {
    50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa",
    500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95",
  }),
  teal: preset("teal", "Teal", ["#14b8a6", "#22d3ee"], {
    50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf",
    500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a",
  }),
  emerald: preset("emerald", "Emerald", ["#10b981", "#84cc16"], {
    50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399",
    500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b",
  }),
  amber: preset("amber", "Amber", ["#f59e0b", "#f43f5e"], {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24",
    500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f",
  }),
  rose: preset("rose", "Rose", ["#f43f5e", "#fb923c"], {
    50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185",
    500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337",
  }),
  crimson: preset("crimson", "Crimson", ["#e11d48", "#7c3aed"], {
    50: "#fef2f3", 100: "#fde6e8", 200: "#fbd0d5", 300: "#f7aab3", 400: "#f1788a",
    500: "#e11d48", 600: "#c81e4a", 700: "#a81842", 800: "#8d183d", 900: "#771838",
  }),
  slate: preset("slate", "Graphite", ["#475569", "#0ea5e9"], {
    50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
    500: "#64748b", 600: "#475569", 700: "#334155", 800: "#1e293b", 900: "#0f172a",
  }),
  sunset: preset("sunset", "Sunset", ["#f97316", "#ec4899"], {
    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
    500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12",
  }),
  ocean: preset("ocean", "Deep Ocean", ["#0ea5e9", "#6366f1"], {
    50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8",
    500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e",
  }),
};

export const ACCENT_LIST = Object.values(ACCENTS);

function preset(
  name: AccentName,
  label: string,
  gradient: [string, string],
  scale: Record<number, string>,
): AccentPreset {
  return { name, label, swatch: scale[500], gradient, scale };
}

/* ----------------------- custom accent generation ------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function mix([r, g, b]: [number, number, number], [r2, g2, b2]: [number, number, number], t: number) {
  return rgbToHex(r + (r2 - r) * t, g + (g2 - g) * t, b + (b2 - b) * t);
}

/** Build a full 50–900 scale + gradient from a single base hex. */
export function buildCustomAccent(hex: string): AccentPreset {
  const base = hexToRgb(hex);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [15, 18, 30];
  const scale: Record<number, string> = {
    50: mix(base, white, 0.92),
    100: mix(base, white, 0.84),
    200: mix(base, white, 0.7),
    300: mix(base, white, 0.5),
    400: mix(base, white, 0.25),
    500: rgbToHex(...base),
    600: mix(base, black, 0.18),
    700: mix(base, black, 0.34),
    800: mix(base, black, 0.5),
    900: mix(base, black, 0.64),
  };
  return {
    name: "custom",
    label: "Custom",
    swatch: scale[500],
    gradient: [scale[500], scale[300]],
    scale,
  };
}

export function resolveAccent(accent: AccentName, customHex?: string): AccentPreset {
  if (accent === "custom") return buildCustomAccent(customHex || "#6366f1");
  return ACCENTS[accent] ?? ACCENTS.indigo;
}

/** CSS variable map to apply on <html> for a given accent. */
export function accentCssVars(p: AccentPreset): Record<string, string> {
  const vars: Record<string, string> = {
    "--brand-gradient": `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
  };
  for (const [k, v] of Object.entries(p.scale)) vars[`--color-brand-${k}`] = v;
  return vars;
}
