"use client";

import { useSettings, useStore } from "@/lib/store";
import { ACCENTS, accentCssVars } from "@/lib/theme/accents";
import { applyAppearance, FONT_STACK, RADIUS_MULT, SCALE_PX } from "@/lib/theme/appearance";
import { useEffectiveAppearance } from "@/lib/theme/resolve";
import { useEffect } from "react";

const STORAGE_KEY = "hartcare-store-v1";

/**
 * Inline script that applies the saved theme + appearance before hydration, so
 * there's no flash of the default look. Resolves the per-profile override when
 * enabled. Accent presets are embedded so the brand color is correct on first
 * paint (custom accents settle on mount).
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
var st=raw?(JSON.parse(raw).state||{}):{};
var db=st.db||{};var base=db.settings||{};
var a=base;
if(base.themePerProfile&&base.profileAppearance&&st.currentProfileId&&base.profileAppearance[st.currentProfileId]){
  a=Object.assign({},base,base.profileAppearance[st.currentProfileId]);
}
var root=document.documentElement;
var mode=a.theme||'system';
var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
root.classList.toggle('dark',dark);
var av=D.accentVars[a.accent]||D.accentVars.indigo;
if(av){for(var k in av)root.style.setProperty(k,av[k]);}
var mult=D.radiusMult[a.radius]||1;
for(var r in D.radiusBase){root.style.setProperty('--radius-'+r,(D.radiusBase[r]*mult).toFixed(3)+'rem');}
root.style.fontSize=D.scale[a.scale]||D.scale.cozy;
root.style.setProperty('--app-font',D.fonts[a.font]||D.fonts.sans);
root.classList.toggle('fx-glow',a.glow!==false);
root.classList.toggle('reduce-motion',!!a.reduceMotion);
root.dataset.surface=a.surface||'clean';
root.dataset.cards=a.cardStyle||'soft';
if(a.wallpaper&&a.wallpaper.mode&&a.wallpaper.mode!=='none')root.classList.add('has-wallpaper');
}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

/** Keeps <html> in sync with the chosen theme + appearance at runtime. */
export function ThemeManager() {
  const appearance = useEffectiveAppearance();

  // Dark mode (incl. system preference changes).
  useEffect(() => {
    const root = document.documentElement;
    function applyMode() {
      const dark =
        appearance.theme === "dark" ||
        (appearance.theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      root.classList.toggle("dark", dark);
    }
    applyMode();
    if (appearance.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", applyMode);
      return () => mq.removeEventListener("change", applyMode);
    }
  }, [appearance.theme]);

  // Accent, scale, radius, font, glow, motion, surface.
  useEffect(() => {
    applyAppearance(document.documentElement, appearance);
    document.documentElement.classList.toggle(
      "has-wallpaper",
      !!appearance.wallpaper && appearance.wallpaper.mode !== "none",
    );
  }, [appearance]);

  return null;
}

/** Cycles light → dark → system. */
export function useThemeToggle() {
  const theme = useSettings().theme;
  const update = useStore((s) => s.updateSettings);
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  return { theme, setNext: () => update({ theme: next }) };
}
