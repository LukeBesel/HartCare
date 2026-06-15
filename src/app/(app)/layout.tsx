import { AppShell } from "@/components/app-shell";
import { SupabaseSync } from "@/components/supabase-sync";
import { ThemeManager } from "@/components/theme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeManager />
      <SupabaseSync />
      <AppShell>{children}</AppShell>
    </>
  );
}
