import {
  LayoutDashboard,
  ShoppingBag,
  BookOpen,
  Tag,
  Package,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  ChevronDown,
  Store,
  MapPin,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
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
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ProBadge } from "./ProGate";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, proOnly: false },
  { title: "Pedidos", url: "/admin/orders", icon: ShoppingBag, proOnly: false },
  { title: "Cardápios", url: "/admin/menus", icon: BookOpen, proOnly: false },
  { title: "Categorias", url: "/admin/categories", icon: Tag, proOnly: false },
  { title: "Produtos", url: "/admin/products", icon: Package, proOnly: false },
  { title: "Bairros", url: "/admin/neighborhoods", icon: MapPin, proOnly: false },
  { title: "CRM", url: "/admin/crm", icon: Users, proOnly: true },
  { title: "Relatórios", url: "/admin/reports", icon: BarChart3, proOnly: true },
  { title: "Configurações", url: "/admin/settings", icon: Settings, proOnly: false },
  { title: "Planos", url: "/admin/plans", icon: Sparkles, proOnly: false },
];

export function AdminSidebar() {
  const { store, stores, switchStore, isPro } = useStore();
  const { signOut } = useAuth();

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="bg-sidebar p-4">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <Store className="h-6 w-6" />
          <span className="text-lg font-bold">Açaí Lab</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-3 flex w-full items-center justify-between rounded-lg bg-sidebar-accent px-3 py-2.5 text-sm text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-colors">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span className="truncate">{store?.name || "Selecionar loja"}</span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {stores.map((s) => (
              <DropdownMenuItem key={s.id} onClick={() => switchStore(s.id)}>
                <div className="flex items-center gap-2 w-full">
                  <span className="flex-1">{s.name}</span>
                  {s.plan_type === "pro" && (
                    <Badge className="bg-primary/20 text-primary text-[9px] px-1 py-0 border-0">PRO</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
                      end={item.url === "/admin"}
                      className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.proOnly && <ProBadge />}
                      {item.title === "Planos" && isPro && (
                        <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                          PRO ✓
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar p-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
