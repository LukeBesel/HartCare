import { AppShell } from "@/components/app-shell";
import { ThemeManager } from "@/components/theme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeManager />
      <AppShell>{children}</AppShell>
    </>
  );
}
