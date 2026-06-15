"use client";

import { Badge, CardPad, SectionTitle, Segmented, Toggle } from "@/components/ui";
import { ACCENT_LIST, buildCustomAccent } from "@/lib/theme/accents";
import {
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  SCALE_OPTIONS,
} from "@/lib/theme/appearance";
import { useSettings, useStore } from "@/lib/store";
import type { AccentName } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  Contrast,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Square,
  Sun,
  Type,
  Wand2,
  Zap,
} from "lucide-react";

function gradientFor(from: string, to: string) {
  return `linear-gradient(135deg, ${from}, ${to})`;
}

export function AppearanceStudio({ inSheet }: { inSheet?: boolean }) {
  const settings = useSettings();
  const updateSettings = useStore((s) => s.updateSettings);

  const customHex =
    settings.accent === "custom" ? settings.customAccent || "#6366f1" : "#6366f1";
  const customPreset = buildCustomAccent(customHex);

  function setAccent(name: AccentName) {
    updateSettings({ accent: name });
  }

  function setCustom(hex: string) {
    updateSettings({ accent: "custom", customAccent: hex });
  }

  function resetDefaults() {
    updateSettings({
      accent: "indigo",
      customAccent: undefined,
      scale: "cozy",
      radius: "soft",
      font: "sans",
      glow: true,
      reduceMotion: false,
      surface: "clean",
      theme: "system",
    });
  }

  const swatchGridCols = inSheet
    ? "grid-cols-3"
    : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";

  return (
    <div className={cn("space-y-5", inSheet && "space-y-4")}>
      {/* Theme mode */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Theme mode"
          subtitle="Switch between light, dark, or your system preference"
          icon={<Sun size={18} />}
        />
        <Segmented
          options={[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "System", value: "system" },
          ]}
          value={settings.theme}
          onChange={(theme) => updateSettings({ theme })}
        />
        <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Sun size={14} /> Light
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Moon size={14} /> Dark
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Monitor size={14} /> System
          </span>
        </div>
      </CardPad>

      {/* Accent color */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Accent color"
          subtitle="Recolor the entire app instantly"
          icon={<Palette size={18} />}
        />
        <div className={cn("grid gap-3", swatchGridCols)}>
          {ACCENT_LIST.map((preset) => {
            const selected = settings.accent === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => setAccent(preset.name)}
                aria-pressed={selected}
                aria-label={preset.label}
                className="group flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "relative grid h-12 w-full place-items-center rounded-xl shadow-sm transition-transform",
                    "ring-offset-2 ring-offset-surface-card group-hover:scale-[1.03]",
                    selected ? "ring-2 ring-text" : "ring-1 ring-black/5",
                  )}
                  style={{ background: gradientFor(preset.gradient[0], preset.gradient[1]) }}
                >
                  {selected && (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-white/90 text-text shadow">
                      <Check size={15} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-tight text-center",
                    selected ? "text-text" : "text-text-muted",
                  )}
                >
                  {preset.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom accent */}
        <div className="mt-5 rounded-xl border border-border bg-surface-muted/50 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={15} className="text-brand-600" />
            <span className="text-sm font-medium text-text">Custom color</span>
            {settings.accent === "custom" && (
              <Badge color="brand" className="ml-auto">
                Active
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "h-11 w-11 shrink-0 rounded-xl shadow-sm ring-offset-2 ring-offset-surface-card",
                settings.accent === "custom" ? "ring-2 ring-text" : "ring-1 ring-black/5",
              )}
              style={{
                background: gradientFor(customPreset.gradient[0], customPreset.gradient[1]),
              }}
              aria-hidden
            />
            <label className="relative cursor-pointer">
              <span className="sr-only">Pick a custom color</span>
              <input
                type="color"
                value={customHex}
                onChange={(e) => setCustom(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-surface-card p-1"
              />
            </label>
            <input
              type="text"
              value={customHex}
              onChange={(e) => {
                const v = e.target.value.trim();
                if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) {
                  setCustom(v.startsWith("#") ? v : `#${v}`);
                }
              }}
              className="input w-28 font-mono"
              placeholder="#6366f1"
              aria-label="Custom hex color"
            />
          </div>
        </div>
      </CardPad>

      {/* Appearance */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Appearance"
          subtitle="Density, corners, and typeface"
          icon={<Type size={18} />}
        />
        <div className="space-y-4">
          <div
            className={cn(
              "flex gap-3",
              inSheet ? "flex-col" : "flex-wrap items-center justify-between",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-text">
              <Contrast size={15} className="text-text-muted" /> Density
            </span>
            <Segmented
              options={SCALE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              value={settings.scale}
              onChange={(scale) => updateSettings({ scale })}
            />
          </div>
          <div
            className={cn(
              "flex gap-3",
              inSheet ? "flex-col" : "flex-wrap items-center justify-between",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-text">
              <Square size={15} className="text-text-muted" /> Corners
            </span>
            <Segmented
              options={RADIUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              value={settings.radius}
              onChange={(radius) => updateSettings({ radius })}
            />
          </div>
          <div
            className={cn(
              "flex gap-3",
              inSheet ? "flex-col" : "flex-wrap items-center justify-between",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-text">
              <Type size={15} className="text-text-muted" /> Typeface
            </span>
            <Segmented
              options={FONT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              value={settings.font}
              onChange={(font) => updateSettings({ font })}
            />
          </div>
        </div>
      </CardPad>

      {/* Effects */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Effects"
          subtitle="Fine-tune the finishing touches"
          icon={<Zap size={18} />}
        />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-text">
                <Sparkles size={15} className="text-text-muted" /> Accent glow
              </div>
              <p className="text-xs text-text-muted">Add a soft glow to accent elements.</p>
            </div>
            <Toggle checked={settings.glow} onChange={(glow) => updateSettings({ glow })} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-text">
                <Palette size={15} className="text-text-muted" /> Tinted background
              </div>
              <p className="text-xs text-text-muted">Tint surfaces with the accent color.</p>
            </div>
            <Toggle
              checked={settings.surface === "tinted"}
              onChange={(v) => updateSettings({ surface: v ? "tinted" : "clean" })}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-text">
                <Zap size={15} className="text-text-muted" /> Reduce motion
              </div>
              <p className="text-xs text-text-muted">Minimize animations and transitions.</p>
            </div>
            <Toggle
              checked={settings.reduceMotion}
              onChange={(reduceMotion) => updateSettings({ reduceMotion })}
            />
          </div>
        </div>
      </CardPad>

      {/* Live preview */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Live preview"
          subtitle="A taste of your current look"
          icon={<Sparkles size={18} />}
        />
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="bg-brand-gradient glow-brand px-4 py-5 text-white">
            <div className="text-sm font-medium text-white/80">Today</div>
            <div className="text-xl font-bold">Welcome back, Hart family</div>
          </div>
          <div className="space-y-3 bg-surface-card p-4">
            <h3 className="text-gradient-brand text-lg font-bold">Healthy living, together</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn-primary">
                Log activity
              </button>
              <Badge color="brand">Streak 7</Badge>
              <Badge color="mint">On track</Badge>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {[300, 400, 500, 600, 700].map((shade) => (
                <span
                  key={shade}
                  className="h-7 w-7 rounded-lg shadow-sm ring-1 ring-black/5"
                  style={{ background: `var(--color-brand-${shade})` }}
                  title={`brand-${shade}`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardPad>

      {/* Reset */}
      <div className="flex justify-end">
        <button type="button" className="btn-outline" onClick={resetDefaults}>
          <RotateCcw size={16} /> Reset to defaults
        </button>
      </div>
    </div>
  );
}
