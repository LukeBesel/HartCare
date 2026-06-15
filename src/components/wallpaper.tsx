"use client";

import { useEffectiveAppearance } from "@/lib/theme/resolve";
import { wallpaperPresetCss } from "@/lib/theme/wallpaper";
import { useEffect, useState } from "react";

/**
 * Full-viewport wallpaper layer behind the app. Supports a built-in preset
 * gradient, a single custom image, or a slideshow that auto-cycles through the
 * selected images at a chosen interval (with a crossfade). Sits at z-index -10;
 * `html.has-wallpaper body` is transparent so it shows through.
 */
export function WallpaperLayer() {
  const wp = useEffectiveAppearance().wallpaper;
  const [index, setIndex] = useState(0);

  const images = wp?.images ?? [];
  const isSlideshow = wp?.mode === "slideshow" && images.length > 1;

  // Auto-cycle the slideshow.
  useEffect(() => {
    if (!isSlideshow) return;
    const ms = Math.max(3, wp.intervalSec || 30) * 1000;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), ms);
    return () => clearInterval(t);
  }, [isSlideshow, wp?.intervalSec, images.length]);

  if (!wp || wp.mode === "none") return null;

  // Clamp during render (no effect needed) so the list can change safely.
  const current = images.length ? index % images.length : 0;

  const blur = wp.blur ? `blur(${wp.blur}px)` : undefined;
  const transform = wp.blur ? "scale(1.06)" : undefined;

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {wp.mode === "preset" && (
        <div className="absolute inset-0" style={{ background: wallpaperPresetCss(wp.preset), filter: blur, transform }} />
      )}

      {wp.mode === "image" && images[0] && (
        <div
          className="absolute inset-0 bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${images[0]})`,
            backgroundSize: wp.fit === "contain" ? "contain" : "cover",
            filter: blur,
            transform,
          }}
        />
      )}

      {wp.mode === "slideshow" &&
        images.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 bg-center bg-no-repeat transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: wp.fit === "contain" ? "contain" : "cover",
              opacity: i === current ? 1 : 0,
              filter: blur,
              transform,
            }}
          />
        ))}

      {/* Readability dim — tinted with the page surface so cards stay legible. */}
      <div
        className="absolute inset-0"
        style={{ background: "var(--surface)", opacity: Math.max(0, Math.min(80, wp.dim ?? 30)) / 100 }}
      />
    </div>
  );
}
