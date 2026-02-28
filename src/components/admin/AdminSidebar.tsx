import { useState } from "react";
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
  ChevronRight,
  Store,
  MapPin,
  Wallet,
  Clock,
  ArrowUpDown,
  Lock,
  History,
  Printer,
  HandCoins,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useStore } from "@/hooks/useStore";
import { useCashSession } from "@/hooks/useCashSession";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ProBadge } from "./ProGate";

const navItems = [
  { title: "Pedidos", url: "/admin/orders", icon: ShoppingBag, proOnly: false },
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, proOnly: false },
  { title: "Cardápios", url: "/admin/menus", icon: BookOpen, proOnly: false },
  { title: "Categorias", url: "/admin/categories", icon: Tag, proOnly: false },
  { title: "Produtos", url: "/admin/products", icon: Package, proOnly: false },
  { title: "Bairros", url: "/admin/neighborhoods", icon: MapPin, proOnly: false },
  { title: "Fiados", url: "/admin/fiados", icon: HandCoins, proOnly: false },
  { title: "CRM", url: "/admin/crm", icon: Users, proOnly: true },
  { title: "Relatórios", url: "/admin/reports", icon: BarChart3, proOnly: true },
  { title: "Impressão", url: "/admin/printing", icon: Printer, proOnly: false },
  { title: "Configurações", url: "/admin/settings", icon: Settings, proOnly: false },
  { title: "Planos", url: "/admin/plans", icon: Sparkles, proOnly: false },
];

const cashSubItems = [
  { title: "Sessão Atual", url: "/admin/cash/session", icon: Clock },
  { title: "Sangria / Suprimento", url: "/admin/cash/movements", icon: ArrowUpDown },
  { title: "Fechamento", url: "/admin/cash/close", icon: Lock },
  { title: "Histórico", url: "/admin/cash/history", icon: History },
];

export function AdminSidebar() {
  const { store, stores, switchStore, isPro } = useStore();
  const { activeSession } = useCashSession();
  const { signOut } = useAuth();
  const location = useLocation();
  const isCashActive = location.pathname.startsWith("/admin/cash");
  const [cashOpen, setCashOpen] = useState(isCashActive);

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="bg-sidebar p-4">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <img src="/favicon.png" alt="Atende Já" className="h-7 w-7 rounded" />
          <span className="text-lg font-bold">Atende Já</span>
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
              {/* Caixa collapsible no topo */}
              <SidebarMenuItem>
                <Collapsible open={cashOpen} onOpenChange={setCashOpen}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`w-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${isCashActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : ""}`}>
                      <Wallet className="h-4 w-4" />
                      <span className="flex-1 text-left">Caixa</span>
                      <span className={`h-2 w-2 rounded-full ${activeSession ? "bg-green-500" : "bg-red-500"}`} title={activeSession ? "Caixa aberto" : "Caixa fechado"} />
                      <ChevronRight className={`h-3 w-3 transition-transform ${cashOpen ? "rotate-90" : ""}`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 border-l border-sidebar-accent pl-2 mt-1 space-y-0.5">
                      {cashSubItems.map((sub) => (
                        <SidebarMenuButton key={sub.url} asChild className="h-8">
                          <NavLink
                            to={sub.url}
                            className="text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-xs"
                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          >
                            <sub.icon className="h-3.5 w-3.5" />
                            <span>{sub.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>

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
