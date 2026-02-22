import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Phone, CreditCard } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  delivering: "Entregando",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-yellow-100 text-yellow-700",
  delivering: "bg-cyan-100 text-cyan-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusFilters: (OrderStatus | "all")[] = ["all", "pending", "confirmed", "preparing", "delivering", "completed", "cancelled"];

export default function Orders() {
  const { store } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!store) return;
    fetchOrders();

    // Realtime subscription
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `store_id=eq.${store.id}` }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store]);

  const fetchOrders = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    fetchOrders();
  };

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.customer_name.toLowerCase().includes(search.toLowerCase()) && !o.customer_phone?.includes(search) && !o.id.includes(search)) return false;
    return true;
  });

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pedidos</h2>
        <p className="text-sm text-muted-foreground">✦ Painel Premium — atualização automática</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pendentes", value: pendingCount, className: "text-orange-600" },
          { label: "Pedidos hoje", value: todayOrders.length },
          { label: "Faturamento hoje", value: formatBRL(todayRevenue), className: "text-primary" },
          { label: "Total pedidos", value: orders.length },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.className || ""}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou ID..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "all" ? "Todos" : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : filtered.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{order.customer_name}</span>
                        <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("pt-BR")} • 🚚 {order.order_type === "delivery" ? "Entrega" : "Retirada"}
                      </p>
                      {order.customer_address && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {order.customer_address}
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary">{formatBRL(Number(order.total))}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Button size="sm" variant="outline">⊕ Detalhes</Button>
                    {order.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => updateStatus(order.id, "confirmed")} className="bg-green-600 hover:bg-green-700 text-white">
                          ✓ Confirmado
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "cancelled")}>
                          ✕ Cancelar
                        </Button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <Button size="sm" onClick={() => updateStatus(order.id, "preparing")}>Preparando</Button>
                    )}
                    {order.status === "preparing" && (
                      <Button size="sm" onClick={() => updateStatus(order.id, "delivering")}>Entregando</Button>
                    )}
                    {order.status === "delivering" && (
                      <Button size="sm" onClick={() => updateStatus(order.id, "completed")}>Concluído</Button>
                    )}
                    <Button size="sm" variant="outline" className="text-red-500 border-red-200">📍 Link rastreio</Button>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    {order.customer_phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.customer_phone}</span>
                    )}
                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />{order.payment_method || "Dinheiro"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">Nenhum pedido encontrado.</div>
        )}
      </div>
    </div>
  );
}
