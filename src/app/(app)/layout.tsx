import { AppShell } from "@/components/app-shell";
import { SupabaseSync } from "@/components/supabase-sync";
import { ThemeManager } from "@/components/theme";
import { WallpaperLayer } from "@/components/wallpaper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeManager />
      <WallpaperLayer />
      <SupabaseSync />
      <AppShell>{children}</AppShell>
    </>
  );
}
