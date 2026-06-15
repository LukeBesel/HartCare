"use client";

import { useSettings, useStore } from "@/lib/store";
import { useEffect } from "react";

const STORAGE_KEY = "hartcare-store-v1";

/** Inline script that applies the saved theme before hydration (no flash). */
export function ThemeScript() {
  const code = `(function(){try{var raw=localStorage.getItem('${STORAGE_KEY}');var t='system';if(raw){t=(JSON.parse(raw).state&&JSON.parse(raw).state.db&&JSON.parse(raw).state.db.settings&&JSON.parse(raw).state.db.settings.theme)||'system';}var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

/** Keeps the <html> class in sync with the chosen theme at runtime. */
export function ThemeManager() {
  const settings = useSettings();
  const theme = settings.theme;

  useEffect(() => {
    function apply() {
      const dark =
        theme === "dark" ||
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    }
    apply();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  return null;
}

/** Cycles light → dark → system. */
export function useThemeToggle() {
  const theme = useSettings().theme;
  const update = useStore((s) => s.updateSettings);
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  return { theme, setNext: () => update({ theme: next }) };
}
