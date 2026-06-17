"use client";

import { Badge, CardPad, SectionTitle, Segmented, Toggle } from "@/components/ui";
import { ACCENT_LIST, buildCustomAccent, resolveAccent } from "@/lib/theme/accents";
import {
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  SCALE_OPTIONS,
} from "@/lib/theme/appearance";
import { useAppearanceControls } from "@/lib/theme/resolve";
import { WALLPAPER_PRESETS, wallpaperPresetCss } from "@/lib/theme/wallpaper";
import { CURATED_THEMES, randomTheme } from "@/lib/theme/gallery";
import { decodeTheme, encodeTheme } from "@/lib/theme/share";
import { uploadWallpaper } from "@/lib/images";
import { useCurrentProfile, useSettings, useStore } from "@/lib/store";
import type {
  AccentName,
  CardStyle,
  DayPart,
  ThemeSchedule,
  Wallpaper,
  WallpaperPresetId,
} from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  Contrast,
  Copy,
  Image as ImageIcon,
  Images,
  LayoutTemplate,
  Layers,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Shuffle,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Type,
  Upload,
  Wallpaper as WallpaperIcon,
  Wand2,
  Zap,
} from "lucide-react";

function gradientFor(from: string, to: string) {
  return `linear-gradient(135deg, ${from}, ${to})`;
}

/** Auto-cycling preview of a slideshow's images (timer-driven, no setState-in-effect on data). */
function SlideshowPreview({
  images,
  intervalSec,
  fit,
}: {
  images: string[];
  intervalSec: number;
  fit: "cover" | "contain";
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const ms = Math.max(3, intervalSec) * 1000;
    const len = images.length;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % Math.max(1, len));
    }, ms);
    return () => clearInterval(t);
  }, [images.length, intervalSec]);

  const safeIndex = images.length ? index % images.length : 0;
  const src = images[safeIndex];
  if (!src) return null;
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Slideshow preview"
        className="h-full w-full"
        style={{ objectFit: fit }}
      />
      {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
          {images.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i === safeIndex ? "bg-white" : "bg-white/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppearanceStudio({ inSheet }: { inSheet?: boolean }) {
  const { appearance, perProfile, setAppearance, setPerProfile } =
    useAppearanceControls();
  const currentProfile = useCurrentProfile();
  const presets = useSettings().presets;
  const schedule = useSettings().schedule;
  const updateSettings = useStore((s) => s.updateSettings);

  function setSchedule(patch: Partial<ThemeSchedule>) {
    updateSettings({ schedule: { ...schedule, ...patch } });
  }

  const scheduleOptions = [...presets, ...CURATED_THEMES];
  const dayParts: { part: DayPart; label: string }[] = [
    { part: "morning", label: "Morning" },
    { part: "afternoon", label: "Afternoon" },
    { part: "evening", label: "Evening" },
    { part: "night", label: "Night" },
  ];

  const [presetName, setPresetName] = useState("");
  const [copied, setCopied] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState(false);

  const wp = appearance.wallpaper;

  const customHex =
    appearance.accent === "custom" ? appearance.customAccent || "#6366f1" : "#6366f1";
  const customPreset = buildCustomAccent(customHex);

  function setAccent(name: AccentName) {
    setAppearance({ accent: name });
  }

  function setCustom(hex: string) {
    setAppearance({ accent: "custom", customAccent: hex });
  }

  function patchWallpaper(patch: Partial<Wallpaper>) {
    setAppearance({ wallpaper: { ...wp, ...patch } });
  }

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const url = await uploadWallpaper(file);
    patchWallpaper({ mode: "image", images: [url] });
  }

  async function handleSlideAppend(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    const urls = await Promise.all(files.map((f) => uploadWallpaper(f)));
    patchWallpaper({ mode: "slideshow", images: [...wp.images, ...urls] });
  }

  function savePreset() {
    updateSettings({
      presets: [
        ...presets,
        { id: uid("tp"), name: presetName.trim() || "My theme", appearance },
      ],
    });
    setPresetName("");
  }

  function deletePreset(id: string) {
    updateSettings({ presets: presets.filter((p) => p.id !== id) });
  }

  function copyCode() {
    navigator.clipboard.writeText(encodeTheme(appearance));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function importTheme() {
    const a = decodeTheme(importCode);
    if (a) {
      setAppearance(a);
      setImportError(false);
      setImportCode("");
    } else {
      setImportError(true);
    }
  }

  function resetDefaults() {
    setAppearance({
      theme: "system",
      accent: "indigo",
      customAccent: undefined,
      scale: "cozy",
      radius: "soft",
      font: "sans",
      glow: true,
      reduceMotion: false,
      surface: "clean",
      wallpaper: {
        mode: "none",
        preset: "aurora",
        images: [],
        intervalSec: 30,
        blur: 0,
        dim: 30,
        fit: "cover",
      },
    });
  }

  const swatchGridCols = inSheet
    ? "grid-cols-3"
    : "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";
  const wallpaperGridCols = inSheet
    ? "grid-cols-2"
    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  const galleryGridCols = inSheet
    ? "grid-cols-2"
    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={cn("space-y-5", inSheet && "space-y-4")}>
      {/* Per-profile theme */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Per-profile theme"
          subtitle="Give each profile its own look"
          icon={<Sparkles size={18} />}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-text">
              Custom theme for {currentProfile.name}
            </div>
            <p className="text-xs text-text-muted">
              {perProfile
                ? "Changes apply to this profile only."
                : "Changes apply household-wide."}
            </p>
          </div>
          <Toggle checked={perProfile} onChange={(v) => setPerProfile(v)} />
        </div>
      </CardPad>

      {/* Theme gallery */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <div className="flex items-start justify-between gap-3">
          <SectionTitle
            title="Theme gallery"
            subtitle="Curated looks &mdash; tap to apply"
            icon={<LayoutTemplate size={18} />}
          />
          <button
            type="button"
            className="btn-outline shrink-0"
            onClick={() => setAppearance(randomTheme())}
          >
            <Shuffle size={16} /> Surprise me
          </button>
        </div>
        <div className={cn("grid gap-3", galleryGridCols)}>
          {CURATED_THEMES.map((theme) => {
            const ta = theme.appearance;
            const acc = resolveAccent(ta.accent, ta.customAccent);
            const swatchBg =
              ta.wallpaper.mode === "preset" && ta.wallpaper.preset
                ? wallpaperPresetCss(ta.wallpaper.preset)
                : gradientFor(acc.gradient[0], acc.gradient[1]);
            const selected =
              appearance.accent === ta.accent &&
              appearance.wallpaper.mode === ta.wallpaper.mode &&
              appearance.wallpaper.preset === ta.wallpaper.preset;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setAppearance(ta)}
                aria-pressed={selected}
                aria-label={`Apply ${theme.name}`}
                className={cn(
                  "group flex flex-col gap-2 rounded-2xl border p-2 text-left transition-transform",
                  "hover:-translate-y-0.5 hover:shadow-md",
                  selected ? "border-text ring-1 ring-text" : "border-border",
                )}
              >
                <span
                  className="relative block h-20 w-full overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5"
                  style={{ background: swatchBg }}
                  aria-hidden
                >
                  <span
                    className="absolute bottom-2 left-2 h-5 w-5 rounded-full ring-2 ring-white/80 shadow"
                    style={{ background: gradientFor(acc.gradient[0], acc.gradient[1]) }}
                  />
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-text shadow">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text">
                    {theme.name}
                  </span>
                  <span className="block truncate text-[11px] leading-tight text-text-muted">
                    {theme.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </CardPad>

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
          value={appearance.theme}
          onChange={(theme) => setAppearance({ theme })}
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
            const selected = appearance.accent === preset.name;
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
            {appearance.accent === "custom" && (
              <Badge color="brand" className="ml-auto">
                Active
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "h-11 w-11 shrink-0 rounded-xl shadow-sm ring-offset-2 ring-offset-surface-card",
                appearance.accent === "custom" ? "ring-2 ring-text" : "ring-1 ring-black/5",
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
              value={appearance.scale}
              onChange={(scale) => setAppearance({ scale })}
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
              value={appearance.radius}
              onChange={(radius) => setAppearance({ radius })}
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
              value={appearance.font}
              onChange={(font) => setAppearance({ font })}
            />
          </div>
          <div
            className={cn(
              "flex gap-3",
              inSheet ? "flex-col" : "flex-wrap items-center justify-between",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-text">
              <Layers size={15} className="text-text-muted" /> Card style
            </span>
            <Segmented
              options={[
                { label: "Soft", value: "soft" },
                { label: "Flat", value: "flat" },
                { label: "Outline", value: "outline" },
                { label: "Glass", value: "glass" },
              ]}
              value={appearance.cardStyle}
              onChange={(cardStyle) =>
                setAppearance({ cardStyle: cardStyle as CardStyle })
              }
            />
          </div>
          {appearance.cardStyle === "glass" && (
            <p className="text-xs text-text-muted">
              Glass cards look best over a wallpaper.
            </p>
          )}
        </div>
      </CardPad>

      {/* Wallpaper */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Wallpaper"
          subtitle="Set a background, photo, or auto-cycling slideshow"
          icon={<WallpaperIcon size={18} />}
        />
        <Segmented
          options={[
            { label: "None", value: "none" },
            { label: "Preset", value: "preset" },
            { label: "Seasonal", value: "seasonal" },
            { label: "Image", value: "image" },
            { label: "Slideshow", value: "slideshow" },
          ]}
          value={wp.mode}
          onChange={(mode) =>
            patchWallpaper({ mode: mode as Wallpaper["mode"] })
          }
        />

        {/* Seasonal */}
        {wp.mode === "seasonal" && (
          <p className="mt-4 text-xs text-text-muted">
            Changes with the season &mdash; the wallpaper is auto-picked by month.
          </p>
        )}

        {/* Preset grid */}
        {wp.mode === "preset" && (
          <div className={cn("mt-4 grid gap-3", wallpaperGridCols)}>
            {WALLPAPER_PRESETS.map((p) => {
              const selected = wp.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    patchWallpaper({ mode: "preset", preset: p.id as WallpaperPresetId })
                  }
                  aria-pressed={selected}
                  aria-label={p.label}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "relative grid h-16 w-full place-items-center rounded-xl shadow-sm transition-transform",
                      "ring-offset-2 ring-offset-surface-card group-hover:scale-[1.02]",
                      selected ? "ring-2 ring-text" : "ring-1 ring-black/5",
                    )}
                    style={{ background: wallpaperPresetCss(p.id) }}
                  >
                    {p.animated && (
                      <Badge color="mint" className="absolute left-1.5 top-1.5">
                        Live
                      </Badge>
                    )}
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
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Single image */}
        {wp.mode === "image" && (
          <div className="mt-4 space-y-3">
            {wp.images[0] ? (
              <div className="flex items-center gap-3">
                <span
                  className="h-20 w-32 shrink-0 rounded-xl border border-border bg-surface-muted bg-cover bg-center shadow-sm"
                  style={{ backgroundImage: `url(${wp.images[0]})` }}
                  aria-hidden
                />
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => patchWallpaper({ images: [] })}
                >
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No image selected yet.</p>
            )}
            <label className="btn-outline inline-flex cursor-pointer">
              <ImageIcon size={16} /> {wp.images[0] ? "Replace image" : "Choose image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
            </label>
          </div>
        )}

        {/* Slideshow */}
        {wp.mode === "slideshow" && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-text-muted">
              Images auto-cycle in the background.
            </p>
            {wp.images.length > 0 && (
              <div className={cn("grid gap-3", wallpaperGridCols)}>
                {wp.images.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative">
                    <span
                      className="block h-20 w-full rounded-xl border border-border bg-surface-muted bg-cover bg-center shadow-sm"
                      style={{ backgroundImage: `url(${src})` }}
                      aria-hidden
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      onClick={() =>
                        patchWallpaper({
                          images: wp.images.filter((_, idx) => idx !== i),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {wp.images.length > 1 && (
              <SlideshowPreview
                images={wp.images}
                intervalSec={wp.intervalSec}
                fit={wp.fit}
              />
            )}
            <div className="flex flex-wrap items-center gap-3">
              <label className="btn-outline inline-flex cursor-pointer">
                <Images size={16} /> Add images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleSlideAppend}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-text">
                <span className="label">Interval (s)</span>
                <input
                  type="number"
                  min={3}
                  value={wp.intervalSec}
                  onChange={(e) =>
                    patchWallpaper({
                      intervalSec: Math.max(3, Number(e.target.value) || 3),
                    })
                  }
                  className="input w-20"
                  aria-label="Seconds between slides"
                />
              </label>
            </div>
          </div>
        )}

        {/* Shared controls */}
        {wp.mode !== "none" && (
          <div className="mt-5 space-y-4 rounded-xl border border-border bg-surface-muted/50 p-3">
            <div>
              <label className="label flex items-center justify-between">
                <span>Dim</span>
                <span className="text-text-muted">{wp.dim}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={80}
                value={wp.dim}
                onChange={(e) => patchWallpaper({ dim: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>
            <div>
              <label className="label flex items-center justify-between">
                <span>Blur</span>
                <span className="text-text-muted">{wp.blur}px</span>
              </label>
              <input
                type="range"
                min={0}
                max={40}
                value={wp.blur}
                onChange={(e) => patchWallpaper({ blur: Number(e.target.value) })}
                className="w-full accent-brand-600"
              />
            </div>
            <div
              className={cn(
                "flex gap-3",
                inSheet ? "flex-col" : "flex-wrap items-center justify-between",
              )}
            >
              <span className="text-sm font-medium text-text">Fit</span>
              <Segmented
                options={[
                  { label: "Cover", value: "cover" },
                  { label: "Contain", value: "contain" },
                ]}
                value={wp.fit}
                onChange={(fit) => patchWallpaper({ fit: fit as Wallpaper["fit"] })}
              />
            </div>
          </div>
        )}
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
            <Toggle checked={appearance.glow} onChange={(glow) => setAppearance({ glow })} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-text">
                <Palette size={15} className="text-text-muted" /> Tinted background
              </div>
              <p className="text-xs text-text-muted">Tint surfaces with the accent color.</p>
            </div>
            <Toggle
              checked={appearance.surface === "tinted"}
              onChange={(v) => setAppearance({ surface: v ? "tinted" : "clean" })}
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
              checked={appearance.reduceMotion}
              onChange={(reduceMotion) => setAppearance({ reduceMotion })}
            />
          </div>
        </div>
      </CardPad>

      {/* Presets & sharing */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Presets &amp; sharing"
          subtitle="Save, apply, and share your themes"
          icon={<Save size={18} />}
        />

        {/* Save current */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Name this theme"
            className="input min-w-0 flex-1"
            aria-label="Preset name"
          />
          <button type="button" className="btn-primary" onClick={savePreset}>
            <Save size={16} /> Save
          </button>
        </div>

        {/* List */}
        {presets.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {presets.map((preset) => {
              const swatch = resolveAccent(
                preset.appearance.accent,
                preset.appearance.customAccent,
              ).gradient;
              return (
                <li
                  key={preset.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/40 p-2.5"
                >
                  <span
                    className="h-9 w-9 shrink-0 rounded-lg shadow-sm ring-1 ring-black/5"
                    style={{ background: gradientFor(swatch[0], swatch[1]) }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                    {preset.name}
                  </span>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setAppearance(preset.appearance)}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-rose-600"
                    aria-label={`Delete ${preset.name}`}
                    onClick={() => deletePreset(preset.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-muted">
            No saved themes yet &mdash; save your current look above.
          </p>
        )}

        {/* Share code */}
        <div className="mt-5 space-y-3 rounded-xl border border-border bg-surface-muted/50 p-3">
          <div className="flex items-center gap-2">
            <button type="button" className="btn-outline" onClick={copyCode}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy theme code"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={importCode}
              onChange={(e) => {
                setImportCode(e.target.value);
                if (importError) setImportError(false);
              }}
              placeholder="Paste a theme code"
              className="input min-w-0 flex-1 font-mono"
              aria-label="Theme code to import"
            />
            <button type="button" className="btn-primary" onClick={importTheme}>
              <Upload size={16} /> Apply
            </button>
          </div>
          {importError && (
            <p className="text-sm text-rose-600">Invalid code</p>
          )}
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

      {/* Theme schedule */}
      <CardPad className={inSheet ? "p-4" : undefined}>
        <SectionTitle
          title="Theme schedule"
          subtitle="Let the look change with the time of day"
          icon={<Clock size={18} />}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-medium text-text">Automatic theme</div>
            <p className="text-xs text-text-muted">
              Applies on top of your chosen theme and re-checks every minute.
            </p>
          </div>
          <Toggle
            checked={schedule.enabled}
            onChange={(enabled) => setSchedule({ enabled })}
          />
        </div>

        {schedule.enabled && (
          <div className="mt-4 space-y-4">
            {/* Auto dark */}
            <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium text-text">
                  <Moon size={15} className="text-text-muted" /> Auto dark
                </div>
                <Toggle
                  checked={schedule.autoDark}
                  onChange={(autoDark) => setSchedule({ autoDark })}
                />
              </div>
              {schedule.autoDark && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-text">
                  <span className="label">Dark from</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={schedule.darkFrom}
                    onChange={(e) =>
                      setSchedule({
                        darkFrom: Math.min(23, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                    className="input w-20"
                    aria-label="Dark mode start hour"
                  />
                  <span className="label">to</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={schedule.darkTo}
                    onChange={(e) =>
                      setSchedule({
                        darkTo: Math.min(23, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                    className="input w-20"
                    aria-label="Dark mode end hour"
                  />
                </div>
              )}
            </div>

            {/* By time of day */}
            <div className="rounded-xl border border-border bg-surface-muted/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium text-text">
                  <Sun size={15} className="text-text-muted" /> By time of day
                </div>
                <Toggle
                  checked={schedule.byTime}
                  onChange={(byTime) => setSchedule({ byTime })}
                />
              </div>
              {schedule.byTime && (
                <div className="mt-3 space-y-2.5">
                  {dayParts.map(({ part, label }) => (
                    <label
                      key={part}
                      className={cn(
                        "flex gap-2",
                        inSheet
                          ? "flex-col"
                          : "flex-wrap items-center justify-between",
                      )}
                    >
                      <span className="text-sm font-medium text-text">{label}</span>
                      <select
                        className="input"
                        value={schedule.slots[part] ?? ""}
                        onChange={(e) =>
                          setSchedule({
                            slots: {
                              ...schedule.slots,
                              [part]: e.target.value || undefined,
                            },
                          })
                        }
                        aria-label={`${label} theme`}
                      >
                        <option value="">&mdash; none &mdash;</option>
                        {scheduleOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardPad>

      {/* Reset */}
      <div className="flex justify-end">
        <button type="button" className="btn-outline" onClick={resetDefaults}>
          <RotateCcw size={16} /> Reset appearance
        </button>
      </div>
    </div>
  );
}
