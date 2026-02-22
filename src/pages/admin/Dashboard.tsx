import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, ShoppingCart, DollarSign, Star, Package, BookOpen, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { OnboardingChecklist } from "@/components/admin/OnboardingChecklist";
import { ProGate } from "@/components/admin/ProGate";
import { motion } from "framer-motion";

type Period = "today" | "7days" | "30days";

export default function Dashboard() {
  const { store, isPro } = useStore();
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
    prevPeriodRevenue: 0,
    prevPeriodOrders: 0,
  });
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    if (!store) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [store, period]);

  const fetchDashboardData = async () => {
    if (!store) return;
    setLoading(true);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const periodDays = period === "today" ? 0 : period === "7days" ? 7 : 30;
    const periodStart = new Date(now.getTime() - periodDays * 86400000).toISOString();
    const prevPeriodStart = new Date(now.getTime() - periodDays * 2 * 86400000).toISOString();

    const [{ data: orders }, { data: todayOrders }, { data: pendingOrders }, { count: productCount }, { count: menuCount }, { data: prevOrders }] = await Promise.all([
      supabase.from("orders").select("*").eq("store_id", store.id).gte("created_at", periodStart),
      supabase.from("orders").select("*").eq("store_id", store.id).gte("created_at", todayStart),
      supabase.from("orders").select("*").eq("store_id", store.id).eq("status", "pending"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
      supabase.from("menus").select("*", { count: "exact", head: true }).eq("store_id", store.id),
      supabase.from("orders").select("total").eq("store_id", store.id).gte("created_at", prevPeriodStart).lt("created_at", periodStart),
    ]);

    // Fetch order items for top product
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, quantity, order_id")
      .in("order_id", (orders || []).map(o => o.id));

    const allOrders = orders || [];
    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = allOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const todayRev = (todayOrders || []).reduce((sum, o) => sum + Number(o.total), 0);

    const prevPeriodRevenue = (prevOrders || []).reduce((sum, o) => sum + Number(o.total), 0);
    const prevPeriodOrders = (prevOrders || []).length;

    // Top product
    const productCounts: Record<string, number> = {};
    (orderItems || []).forEach(item => {
      productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
    });
    const topEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

    // Monthly revenue
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: monthOrders } = await supabase
      .from("orders").select("total").eq("store_id", store.id).gte("created_at", monthStart);
    const monthlyRevenue = (monthOrders || []).reduce((sum, o) => sum + Number(o.total), 0);

    // Chart data
    const dateMap: Record<string, number> = {};
    allOrders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      dateMap[date] = (dateMap[date] || 0) + Number(o.total);
    });
    const chart = Object.entries(dateMap).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date));

    // Status distribution
    const statusCounts: Record<string, number> = {};
    allOrders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const statusColors: Record<string, string> = {
      completed: "#7c3aed", cancelled: "#f97316", pending: "#22c55e", confirmed: "#3b82f6", preparing: "#eab308", delivering: "#06b6d4",
    };
    const statusLabels: Record<string, string> = {
      completed: "Concluído", cancelled: "Cancelado", pending: "Pendente", confirmed: "Confirmado", preparing: "Preparando", delivering: "Entregando",
    };

    setStats({
      todayRevenue: todayRev,
      todayOrders: (todayOrders || []).length,
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
      prevPeriodRevenue,
      prevPeriodOrders,
    });
    setChartData(chart);
    setStatusData(
      Object.entries(statusCounts).map(([name, value]) => ({
        name: statusLabels[name] || name, value, color: statusColors[name] || "#999",
      }))
    );
    setLoading(false);
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const goalProgress = stats.monthlyGoal > 0 ? Math.min((stats.monthlyRevenue / stats.monthlyGoal) * 100, 100) : 0;

  const getGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueGrowth = getGrowth(stats.totalRevenue, stats.prevPeriodRevenue);
  const ordersGrowth = getGrowth(stats.totalOrders, stats.prevPeriodOrders);

  if (!store) {
    return <div className="text-center py-12 text-muted-foreground">Selecione uma loja para continuar.</div>;
  }

  const GrowthIndicator = ({ value }: { value: number }) => {
    const positive = value >= 0;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {positive ? "+" : ""}{value.toFixed(0)}%
      </span>
    );
  };

  const SkeletonCard = () => (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-3 w-16" />
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Atualizado automaticamente a cada 30s</p>
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Faturamento</p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-primary">{formatBRL(stats.totalRevenue)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <GrowthIndicator value={revenueGrowth} />
                    <span className="text-xs text-muted-foreground">vs período anterior</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Pedidos</p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{stats.totalOrders}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <GrowthIndicator value={ordersGrowth} />
                    <span className="text-xs text-muted-foreground">vs período anterior</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Ticket médio</p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{formatBRL(stats.avgTicket)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stats.totalOrders} pedidos no período</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className={stats.pendingOrders > 0 ? "border-warning/40" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${stats.pendingOrders > 0 ? "bg-warning/10" : "bg-accent"}`}>
                      <ShoppingCart className={`h-4 w-4 ${stats.pendingOrders > 0 ? "text-warning" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight">{stats.pendingOrders}</p>
                  <p className={`mt-1 text-xs ${stats.pendingOrders > 0 ? "text-warning font-medium" : "text-muted-foreground"}`}>
                    {stats.pendingOrders > 0 ? "⚡ Aguardando ação" : "Nenhum pendente"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mais vendido</p>
                  {loading ? <Skeleton className="h-5 w-32" /> : (
                    <p className="font-semibold text-sm">🏆 {stats.topProduct} ({stats.topProductCount}×)</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                  <p className="font-bold text-lg">{stats.productCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cardápios</p>
                  <p className="font-bold text-lg">{stats.menuCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Monthly Goal */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Meta mensal</p>
                <p className="text-xs text-muted-foreground">{formatBRL(stats.monthlyRevenue)} de {formatBRL(stats.monthlyGoal)}</p>
              </div>
            </div>
            <span className="text-lg font-bold text-primary">{Math.round(goalProgress)}%</span>
          </div>
          <Progress value={goalProgress} className="mt-3 h-2.5" />
        </CardContent>
      </Card>

      {/* Charts - Pro gated for detailed analytics */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Faturamento por dia</CardTitle>
            <p className="text-xs text-muted-foreground">{period === "7days" ? "Últimos 7 dias" : period === "30days" ? "Últimos 30 dias" : "Hoje"}</p>
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

        <Card>
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
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
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

      {/* Today summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-semibold">Hoje:</span>
            </div>
            <span className="text-sm"><strong>{formatBRL(stats.todayRevenue)}</strong> em vendas</span>
            <span className="text-sm"><strong>{stats.todayOrders}</strong> pedidos</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
