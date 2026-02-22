import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, ShoppingCart, DollarSign, Star, Package, BookOpen, Target } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

type Period = "today" | "7days" | "30days";

export default function Dashboard() {
  const { store } = useStore();
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

    // Fetch orders for the period
    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .gte("created_at", periodStart);

    // Fetch today's orders
    const { data: todayOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .gte("created_at", todayStart);

    // Fetch pending orders
    const { data: pendingOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .eq("status", "pending");

    // Fetch product count
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id);

    // Fetch menu count
    const { count: menuCount } = await supabase
      .from("menus")
      .select("*", { count: "exact", head: true })
      .eq("store_id", store.id);

    // Fetch order items for top product
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_name, quantity, order_id")
      .in("order_id", (orders || []).map(o => o.id));

    // Calculate stats
    const allOrders = orders || [];
    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = allOrders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const todayRev = (todayOrders || []).reduce((sum, o) => sum + Number(o.total), 0);

    // Top product
    const productCounts: Record<string, number> = {};
    (orderItems || []).forEach(item => {
      productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
    });
    const topEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

    // Monthly revenue
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: monthOrders } = await supabase
      .from("orders")
      .select("total")
      .eq("store_id", store.id)
      .gte("created_at", monthStart);
    const monthlyRevenue = (monthOrders || []).reduce((sum, o) => sum + Number(o.total), 0);

    // Chart data - group by date
    const dateMap: Record<string, number> = {};
    allOrders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      dateMap[date] = (dateMap[date] || 0) + Number(o.total);
    });
    const chart = Object.entries(dateMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Status distribution
    const statusCounts: Record<string, number> = {};
    allOrders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const statusColors: Record<string, string> = {
      completed: "#7c3aed",
      cancelled: "#f97316",
      pending: "#22c55e",
      confirmed: "#3b82f6",
      preparing: "#eab308",
      delivering: "#06b6d4",
    };
    const statusLabels: Record<string, string> = {
      completed: "Concluído",
      cancelled: "Cancelado",
      pending: "Pendente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      delivering: "Entregando",
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
    });

    setChartData(chart);
    setStatusData(
      Object.entries(statusCounts).map(([name, value]) => ({
        name: statusLabels[name] || name,
        value,
        color: statusColors[name] || "#999",
      }))
    );

    setLoading(false);
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const goalProgress = stats.monthlyGoal > 0 ? Math.min((stats.monthlyRevenue / stats.monthlyGoal) * 100, 100) : 0;

  if (!store) {
    return <div className="text-center py-12 text-muted-foreground">Selecione uma loja para continuar.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Atualizado automaticamente a cada 30s</p>
        </div>
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {([["today", "Hoje"], ["7days", "7 dias"], ["30days", "30 dias"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                period === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Hoje</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-24" /> : (
              <>
                <p className="mt-1 text-2xl font-bold">{formatBRL(stats.todayRevenue)}</p>
                <p className="text-xs text-muted-foreground">{stats.todayOrders} pedidos hoje</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <ShoppingCart className="h-4 w-4 text-warning" />
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-16" /> : (
              <>
                <p className="mt-1 text-2xl font-bold">{stats.pendingOrders}</p>
                <p className="text-xs text-warning">● Aguardando</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Faturamento</p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-28" /> : (
              <>
                <p className="mt-1 text-2xl font-bold text-primary">{formatBRL(stats.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground">{period === "7days" ? "7 dias" : period === "30days" ? "30 dias" : "Hoje"}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Ticket médio</p>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            {loading ? <Skeleton className="mt-2 h-8 w-20" /> : (
              <>
                <p className="mt-1 text-2xl font-bold">{formatBRL(stats.avgTicket)}</p>
                <p className="text-xs text-muted-foreground">{stats.totalOrders} pedidos</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product + Menu counts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-4 w-4" />
              <p className="text-sm">Produto mais vendido</p>
            </div>
            {loading ? <Skeleton className="mt-2 h-6 w-40" /> : (
              <p className="mt-1 font-semibold">🏆 {stats.topProduct} ({stats.topProductCount}×)</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <p className="text-sm">Produtos</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.productCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <p className="text-sm">Cardápios</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.menuCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Goal */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <p className="font-medium">Meta mensal</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary font-medium">{Math.round(goalProgress)}%</span>
              <span className="text-xs text-muted-foreground">Editar meta</span>
            </div>
          </div>
          <Progress value={goalProgress} className="mt-3 h-2" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatBRL(stats.monthlyRevenue)} arrecadado</span>
            <span>Meta: {formatBRL(stats.monthlyGoal)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Faturamento por dia</CardTitle>
            <p className="text-xs text-muted-foreground">{period === "7days" ? "7 dias" : period === "30days" ? "30 dias" : "Hoje"}</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
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
          <CardHeader>
            <CardTitle className="text-base">Pedidos por status</CardTitle>
            <p className="text-xs text-muted-foreground">Total: {stats.totalOrders}</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
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
    </div>
  );
}
