"use client";

import { useSettings, useStore } from "@/lib/store";
import { ACCENTS, accentCssVars } from "@/lib/theme/accents";
import { applyAppearance, SCALE_PX, RADIUS_MULT, FONT_STACK } from "@/lib/theme/appearance";
import { useEffect } from "react";

const STORAGE_KEY = "hartcare-store-v1";

/**
 * Inline script that applies the saved theme + appearance before hydration, so
 * there's no flash of the default look. Accent presets are embedded so the
 * brand color is correct on first paint (custom accents settle on mount).
 */
export function ThemeScript() {
  const accentVars: Record<string, Record<string, string>> = {};
  for (const [name, preset] of Object.entries(ACCENTS)) accentVars[name] = accentCssVars(preset);

  const data = JSON.stringify({
    accentVars,
    scale: SCALE_PX,
    radiusMult: RADIUS_MULT,
    fonts: FONT_STACK,
    radiusBase: { sm: 0.25, md: 0.375, lg: 0.5, xl: 0.75, "2xl": 1, "3xl": 1.5 },
  });

  const code = `(function(){try{
var D=${data};
var raw=localStorage.getItem('${STORAGE_KEY}');
var s=raw?(JSON.parse(raw).state||{}).db&&JSON.parse(raw).state.db.settings:null;
s=s||{};
var root=document.documentElement;
var mode=s.theme||'system';
var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
root.classList.toggle('dark',dark);
var av=D.accentVars[s.accent]||D.accentVars.indigo;
if(av){for(var k in av)root.style.setProperty(k,av[k]);}
var mult=D.radiusMult[s.radius]||1;
for(var r in D.radiusBase){root.style.setProperty('--radius-'+r,(D.radiusBase[r]*mult).toFixed(3)+'rem');}
root.style.fontSize=D.scale[s.scale]||D.scale.cozy;
root.style.setProperty('--app-font',D.fonts[s.font]||D.fonts.sans);
root.classList.toggle('fx-glow',s.glow!==false);
root.classList.toggle('reduce-motion',!!s.reduceMotion);
root.dataset.surface=s.surface||'clean';
}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

/** Keeps <html> in sync with the chosen theme + appearance at runtime. */
export function ThemeManager() {
  const settings = useSettings();

  // Dark mode (incl. system preference changes).
  useEffect(() => {
    const root = document.documentElement;
    function applyMode() {
      const dark =
        settings.theme === "dark" ||
        (settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
    }
    applyMode();
    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", applyMode);
      return () => mq.removeEventListener("change", applyMode);
    }
  }, [settings.theme]);

  // Accent, scale, radius, font, glow, motion, surface.
  useEffect(() => {
    applyAppearance(document.documentElement, settings);
  }, [settings]);

  return null;
}

/** Cycles light → dark → system. */
export function useThemeToggle() {
  const theme = useSettings().theme;
  const update = useStore((s) => s.updateSettings);
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  return { theme, setNext: () => update({ theme: next }) };
}
