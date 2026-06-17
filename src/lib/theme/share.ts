import type { Appearance } from "@/lib/types";
import { DEFAULT_WALLPAPER } from "@/lib/types";

/**
 * Encode/decode a theme as a compact, shareable code (e.g. "HC1-eyJ...").
 * Custom wallpaper images are intentionally excluded (too large to share);
 * preset wallpapers and all color/typography settings are included.
 */
const PREFIX = "HC1-";

function toBase64Url(s: string): string {
  const b64 = typeof btoa !== "undefined" ? btoa(s) : Buffer.from(s, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("utf8");
}

export function encodeTheme(a: Appearance): string {
  const shareable: Appearance = {
    ...a,
    wallpaper: {
      ...a.wallpaper,
      // Drop heavy custom images; keep preset wallpapers shareable.
      images: [],
      mode: a.wallpaper.mode === "image" || a.wallpaper.mode === "slideshow"
        ? "preset"
        : a.wallpaper.mode,
    },
  };
  return PREFIX + toBase64Url(JSON.stringify(shareable));
}

export function decodeTheme(code: string): Appearance | null {
  try {
    const raw = code.trim();
    if (!raw.startsWith(PREFIX)) return null;
    const parsed = JSON.parse(fromBase64Url(raw.slice(PREFIX.length))) as Partial<Appearance>;
    if (!parsed || typeof parsed !== "object" || !parsed.accent) return null;
    return {
      theme: parsed.theme ?? "system",
      accent: parsed.accent,
      customAccent: parsed.customAccent,
      scale: parsed.scale ?? "cozy",
      radius: parsed.radius ?? "soft",
      font: parsed.font ?? "sans",
      glow: parsed.glow ?? true,
      reduceMotion: parsed.reduceMotion ?? false,
      surface: parsed.surface ?? "clean",
      cardStyle: parsed.cardStyle ?? "soft",
      wallpaper: { ...DEFAULT_WALLPAPER, ...parsed.wallpaper, images: [] },
    };
  } catch {
    return null;
  }
}
