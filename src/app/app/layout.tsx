import { redirect } from "next/navigation";
import { getSession, loadWorkspace } from "@/lib/data/load";
import { isSupabaseConfigured } from "@/lib/data/config";
import { WorkspaceProvider } from "@/lib/store/provider";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!isSupabaseConfigured()) {
    return (
      <WorkspaceProvider demoNow={new Date().toISOString()}>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    );
  }
  const ws = await loadWorkspace(session);
  return (
    <WorkspaceProvider initial={ws}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
