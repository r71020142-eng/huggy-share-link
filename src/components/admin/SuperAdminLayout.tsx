import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router-dom";
import { Shield, Key, Store, Users, LogOut, LayoutDashboard, Printer, Database } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Visão Geral", url: "/superadmin", icon: LayoutDashboard },
  { title: "Impressão", url: "/superadmin/print-monitoring", icon: Printer },
  { title: "Chaves", url: "/superadmin/keys", icon: Key },
  { title: "Lojas", url: "/superadmin/stores", icon: Store },
  { title: "Usuários", url: "/superadmin/users", icon: Users },
  { title: "Logs", url: "/superadmin/logs", icon: Shield },
  { title: "Exportar Dados", url: "/superadmin/export", icon: Database },
];

export function SuperAdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) checkRole();
  }, [user]);

  const checkRole = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user!.id)
      .eq("role", "superadmin")
      .maybeSingle();
    setIsSuperAdmin(!!data);
  };

  if (authLoading || isSuperAdmin === null) {
    return <div className="flex min-h-screen items-center justify-center">Verificando permissões...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Shield className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Acesso negado</h2>
        <p className="text-muted-foreground">Você não tem permissão de SuperAdmin.</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar className="border-r-0">
          <SidebarHeader className="bg-sidebar p-4">
            <div className="flex items-center gap-2 text-sidebar-foreground">
              <Shield className="h-6 w-6" />
              <span className="text-lg font-bold">SuperAdmin</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="bg-sidebar">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/superadmin"}
                          className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="bg-sidebar p-4 space-y-2">
            <a href="/admin" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <Store className="h-4 w-4" />
              <span>Painel Admin</span>
            </a>
            <button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">SuperAdmin</h1>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
