import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useStore } from "@/hooks/useStore";
import { Badge } from "@/components/ui/badge";
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  const { isPro } = useStore();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">Painel Admin</h1>
            {isPro && (
              <Badge className="bg-primary text-primary-foreground">
                ✦ PRO ATIVO ✓
              </Badge>
            )}
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
