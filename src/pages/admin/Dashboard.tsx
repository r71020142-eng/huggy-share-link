import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingCart, DollarSign, ClipboardList, Star, Package, BookOpen, Target, Settings, Tag } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { OnboardingChecklist } from "@/components/admin/OnboardingChecklist";
import { DashboardPinGate } from "@/components/admin/DashboardPinGate";
import { useNavigate } from "react-router-dom";

type Period = "today" | "7days" | "30days";

interface TopProduct {
  name: string;
  count: number;
}

export default function Dashboard() {
  const { store } = useStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("7days");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalOrders: 0,
    avgTicket: 0,
    topProduct: "",
    topProductCount: 0,
    productCount: 0,
    menuCount: 0,
    monthlyGoal: 5000,
    monthlyRevenue: 0,
    digitalOrders: 0,
    digitalRevenue: 0,
    manualOrders: 0,
    manualRevenue: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [ordersChartData, setOrdersChartData] = useState<{ date: string; pedidos: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!store) return;
    setInitialLoad(true);
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), 60000);
    return () => clearInterval(interval);
  }, [store, period]);

  const fetchDashboardData = async (showLoading = false) => {
    if (!store) return;
    if (showLoading) setLoading(true);

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const periodDays = period === "today" ? 0 : period === "7days" ? 7 : 30;
      const periodStart = period === "today" ? todayStart : new Date(now.getTime() - periodDays * 86400000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        { data: orders },
        { data: pendingOrders },
        { count: productCount },
        { count: menuCount },
        { data: monthOrders },
      ] = await Promise.all([
        supabase.from("orders").select("*").eq("store_id", store.id).gte("created_at", periodStart),
        supabase.from("orders").select("id").eq("store_id", store.id).eq("status", "pending"),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("menus").select("*", { count: "exact", head: true }).eq("store_id", store.id),
        supabase.from("orders").select("total").eq("store_id", store.id).gte("created_at", monthStart),
      ]);

      const allOrders = orders || [];
      
      // Derive today orders from period orders (avoid extra query)
      const todayOrders = allOrders.filter(o => o.created_at >= todayStart);

      // Only fetch order items if we have orders
      let orderItems: any[] = [];
      if (allOrders.length > 0) {
        const { data } = await supabase
          .from("order_items")
          .select("product_name, quantity, order_id")
          .in("order_id", allOrders.slice(0, 200).map(o => o.id));
        orderItems = data || [];
      }
      const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = allOrders.length;
      const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const todayRev = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

      // Top products
      const productCounts: Record<string, number> = {};
      orderItems.forEach(item => {
        productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
      });
      const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
      const topEntry = sortedProducts[0];
      setTopProducts(sortedProducts.slice(0, 5).map(([name, count]) => ({ name, count })));

      const monthlyRevenue = (monthOrders || []).reduce((sum, o) => sum + Number(o.total), 0);

      // Revenue chart data
      const dateMap: Record<string, number> = {};
      const ordersDateMap: Record<string, number> = {};
      allOrders.forEach(o => {
        const date = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
        dateMap[date] = (dateMap[date] || 0) + Number(o.total);
        ordersDateMap[date] = (ordersDateMap[date] || 0) + 1;
      });
      const chart = Object.entries(dateMap).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date));
      const ordersChart = Object.entries(ordersDateMap).map(([date, pedidos]) => ({ date, pedidos })).sort((a, b) => a.date.localeCompare(b.date));

      // Status distribution
      const statusCounts: Record<string, number> = {};
      allOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
      const statusColors: Record<string, string> = {
        completed: "#7c3aed", cancelled: "#f97316", pending: "#22c55e", confirmed: "#3b82f6", preparing: "#eab308", delivering: "#06b6d4",
      };
      const statusLabels: Record<string, string> = {
        completed: "Concluído", cancelled: "Cancelado", pending: "Pendente", confirmed: "Confirmado", preparing: "Preparando", delivering: "Entregando",
      };

      // Order source breakdown
      const digitalOrders = allOrders.filter(o => !o.is_manual);
      const manualOrdersList = allOrders.filter(o => o.is_manual);

      setStats({
        todayRevenue: todayRev,
        todayOrders: todayOrders.length,
        pendingOrders: (pendingOrders || []).length,
        totalRevenue,
        totalOrders,
        avgTicket,
        topProduct: topEntry ? topEntry[0] : "—",
        topProductCount: topEntry ? topEntry[1] : 0,
        productCount: productCount || 0,
        menuCount: menuCount || 0,
        monthlyGoal: store.monthly_goal || 5000,
        monthlyRevenue,
        digitalOrders: digitalOrders.length,
        digitalRevenue: digitalOrders.reduce((s, o) => s + Number(o.total), 0),
        manualOrders: manualOrdersList.length,
        manualRevenue: manualOrdersList.reduce((s, o) => s + Number(o.total), 0),
      });
      setChartData(chart);
      setOrdersChartData(ordersChart);
      setStatusData(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: statusLabels[name] || name, value, color: statusColors[name] || "#999",
        }))
      );
    } catch (err) {
      console.warn("[Dashboard] Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const goalProgress = stats.monthlyGoal > 0 ? Math.min((stats.monthlyRevenue / stats.monthlyGoal) * 100, 100) : 0;
  const periodLabel = period === "today" ? "Hoje" : period === "7days" ? "7 dias" : "30 dias";

  if (!store) {
    return <div className="text-center py-12 text-muted-foreground">Selecione uma loja para continuar.</div>;
  }

  return (
    <DashboardPinGate>
    <div className="space-y-6">
      <OnboardingChecklist />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Atualizado automaticamente a cada 60s</p>
        </div>
        <div className="flex gap-1 rounded-xl border bg-muted/50 p-1">
          {([["today", "Hoje"], ["7days", "7 dias"], ["30days", "30 dias"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                period === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 KPI Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-20 mb-3" /><Skeleton className="h-8 w-28 mb-1" /><Skeleton className="h-3 w-16" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Hoje */}
          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Hoje</p>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{formatBRL(stats.todayRevenue)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stats.todayOrders} pedidos hoje</p>
            </CardContent>
          </Card>

          {/* Pendentes */}
          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <ShoppingCart className="h-5 w-5 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight">{stats.pendingOrders}</p>
              <p className={`mt-1 text-xs font-medium ${stats.pendingOrders > 0 ? "text-orange-500" : "text-muted-foreground"}`}>
                {stats.pendingOrders > 0 ? "⚡ Aguardando" : "Nenhum pendente"}
              </p>
            </CardContent>
          </Card>

          {/* Faturamento */}
          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Faturamento</p>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-primary">{formatBRL(stats.totalRevenue)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{periodLabel}</p>
            </CardContent>
          </Card>

          {/* Ticket médio */}
          <Card className="border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Ticket médio</p>
                <ClipboardList className="h-5 w-5 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-primary">{formatBRL(stats.avgTicket)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stats.totalOrders} pedidos</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick stats: Mais vendido + Produtos + Cardápios */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-purple-200 md:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produto mais vendido</p>
                {loading ? <Skeleton className="h-5 w-32" /> : (
                  <p className="font-bold text-sm">🏆 {stats.topProduct} <span className="font-normal text-muted-foreground">({stats.topProductCount}×)</span></p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produtos</p>
                <p className="font-bold text-lg">{stats.productCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cardápios</p>
                <p className="font-bold text-lg">{stats.menuCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta mensal */}
      <Card className="border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">Meta mensal</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{Math.round(goalProgress)}%</span>
              <button className="text-xs text-primary hover:underline">Editar meta</button>
            </div>
          </div>
          <Progress value={goalProgress} className="h-2.5" />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">{formatBRL(stats.monthlyRevenue)} arrecadado</p>
            <p className="text-xs text-muted-foreground">Meta: {formatBRL(stats.monthlyGoal)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Charts: Faturamento por dia + Pedidos por status */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Faturamento por dia</CardTitle>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(270,70%,50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(270,70%,50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `R$${v}`} />
                  <Tooltip formatter={(v: number) => [formatBRL(v), "Faturamento"]} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(270,70%,50%)" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pedidos por status</CardTitle>
            <p className="text-xs text-muted-foreground">Total: {stats.totalOrders}</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Sem pedidos no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produtos mais pedidos + Pedidos por dia */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Produtos mais pedidos</CardTitle>
                <p className="text-xs text-muted-foreground">Por quantidade — {periodLabel}</p>
              </div>
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => {
                  const maxCount = topProducts[0].count;
                  const barWidth = maxCount > 0 ? (product.count / maxCount) * 100 : 0;
                  const barColors = ["bg-purple-500", "bg-orange-400", "bg-blue-800", "bg-purple-400", "bg-purple-400"];
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${index === 0 ? "bg-green-500" : "bg-gray-400"}`}>
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium">{product.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{product.count}×</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${barColors[index] || "bg-purple-400"}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Pedidos por dia</CardTitle>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : ordersChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ordersChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" allowDecimals={false} />
                  <Tooltip formatter={(v: number) => [v, "Pedidos"]} />
                  <Bar dataKey="pedidos" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sem pedidos no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Source Breakdown */}
      {!loading && stats.totalOrders > 0 && (
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Origem dos Pedidos</CardTitle>
            <p className="text-xs text-muted-foreground">{periodLabel} — {stats.totalOrders} pedidos</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-lg">📱</span>
                  <p className="text-sm font-semibold">Cardápio Digital / PWA</p>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.digitalOrders}</p>
                <p className="text-xs text-muted-foreground">{formatBRL(stats.digitalRevenue)}</p>
              </div>
              <div className="rounded-xl border p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950 text-lg">🏪</span>
                  <p className="text-sm font-semibold">Manual / Balcão / Tele</p>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.manualOrders}</p>
                <p className="text-xs text-muted-foreground">{formatBRL(stats.manualRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-purple-200 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin/orders")}>
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Ver pedidos</span>
          </CardContent>
        </Card>
        <Card className="border-purple-200 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin/categories")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Categorias</span>
          </CardContent>
        </Card>
        <Card className="border-purple-200 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/admin/settings")}>
          <CardContent className="p-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Configurações</span>
          </CardContent>
        </Card>
      </div>
    </div>
    </DashboardPinGate>
  );
}
