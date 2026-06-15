import type { FontChoice, RadiusStyle, Settings, UIScale } from "@/lib/types";
import { accentCssVars, resolveAccent } from "./accents";

/** Root font-size per density — Tailwind's rem spacing scales the whole UI. */
export const SCALE_PX: Record<UIScale, string> = {
  compact: "14.5px",
  cozy: "16px",
  comfortable: "18px",
};

/** Radius multipliers applied to Tailwind's --radius-* tokens. */
export const RADIUS_MULT: Record<RadiusStyle, number> = {
  sharp: 0.35,
  soft: 1,
  round: 1.7,
};

const RADIUS_BASE: Record<string, number> = {
  sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75, "2xl": 1, "3xl": 1.5,
};

export const FONT_STACK: Record<FontChoice, string> = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  rounded: "'SF Pro Rounded', 'ui-rounded', 'Nunito', var(--font-geist-sans), sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace",
  serif: "'Iowan Old Style', Georgia, 'Times New Roman', ui-serif, serif",
};

export const SCALE_OPTIONS: { value: UIScale; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "cozy", label: "Cozy" },
  { value: "comfortable", label: "Comfortable" },
];
export const RADIUS_OPTIONS: { value: RadiusStyle; label: string }[] = [
  { value: "sharp", label: "Sharp" },
  { value: "soft", label: "Soft" },
  { value: "round", label: "Round" },
];
export const FONT_OPTIONS: { value: FontChoice; label: string }[] = [
  { value: "sans", label: "Sans" },
  { value: "rounded", label: "Rounded" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
];

/** Computes every CSS variable for the appearance (accent + radius + font). */
export function appearanceVars(s: Pick<Settings, "accent" | "customAccent" | "radius" | "font">) {
  const vars: Record<string, string> = {
    ...accentCssVars(resolveAccent(s.accent, s.customAccent)),
    "--app-font": FONT_STACK[s.font] ?? FONT_STACK.sans,
  };
  const mult = RADIUS_MULT[s.radius] ?? 1;
  for (const [k, base] of Object.entries(RADIUS_BASE)) {
    vars[`--radius-${k}`] = `${(base * mult).toFixed(3)}rem`;
  }
  return vars;
}

/** Applies the full appearance to <html> at runtime. */
export function applyAppearance(root: HTMLElement, s: Settings) {
  const vars = appearanceVars(s);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.fontSize = SCALE_PX[s.scale] ?? SCALE_PX.cozy;
  root.classList.toggle("fx-glow", !!s.glow);
  root.classList.toggle("reduce-motion", !!s.reduceMotion);
  root.dataset.surface = s.surface ?? "clean";
}
