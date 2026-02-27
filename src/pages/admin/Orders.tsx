import { useEffect, useState, useRef } from "react";
import { formatBRL } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, CheckCircle, XCircle, MapPin, Phone, CreditCard, Clock, Truck, Store as StoreIcon, Plus, Bell, BellOff } from "lucide-react";
import ManualOrderDialog from "@/components/admin/ManualOrderDialog";
import OrderDetailDialog from "@/components/admin/OrderDetailDialog";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  delivering: "Entregando",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const filterLabels: Record<string, string> = {
  all: "Todos",
  pending: "Pendentes",
  confirmed: "Confirmados",
  preparing: "Preparando",
  delivering: "Entregando",
  completed: "Concluídos",
  cancelled: "Cancelados",
};

const statusBadgeStyles: Record<OrderStatus, string> = {
  pending: "text-orange-600 bg-orange-50 border-orange-200",
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  preparing: "text-yellow-600 bg-yellow-50 border-yellow-200",
  delivering: "text-cyan-600 bg-cyan-50 border-cyan-200",
  completed: "text-green-600 bg-green-50 border-green-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

const statusFilters: (OrderStatus | "all")[] = ["all", "pending", "confirmed", "preparing", "delivering", "completed", "cancelled"];

const paymentIcons: Record<string, string> = {
  pix: "💎 Pix",
  cash: "💵 Dinheiro",
  credit: "💳 Crédito",
  debit: "💳 Débito",
};

// Notification sound using Web Audio API
function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First beep
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 880;
    osc1.type = "sine";
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    // Second beep
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 1100;
    osc2.type = "sine";
    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.65);
    osc2.start(audioCtx.currentTime + 0.35);
    osc2.stop(audioCtx.currentTime + 0.65);
  } catch (e) {
    console.warn("Could not play notification sound", e);
  }
}

export default function Orders() {
  const { store } = useStore();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [manualOrderOpen, setManualOrderOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const soundEnabledRef = useRef(true);
  const { toast } = useToast();
  const isFirstLoad = useRef(true);
  const knownOrderIds = useRef<Set<string>>(new Set());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
  };

  useEffect(() => {
    if (!store) return;
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `store_id=eq.${store.id}` }, (payload) => {
        const newOrder = payload.new as Order;
        
        // Only notify for truly new orders (not already known)
        if (!isFirstLoad.current && !knownOrderIds.current.has(newOrder.id)) {
          knownOrderIds.current.add(newOrder.id);
          
          if (soundEnabledRef.current) {
            playNotificationSound();
          }
          
          toast({
            title: "🔔 Novo pedido!",
            description: `${newOrder.customer_name} — R$ ${Number(newOrder.total).toFixed(2).replace(".", ",")}`,
          });
        }
        
        fetchOrders();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `store_id=eq.${store.id}` }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store]);

  const fetchOrders = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    
    const fetched = (data as OrderWithItems[]) || [];
    
    // Track known IDs on first load
    if (isFirstLoad.current) {
      fetched.forEach(o => knownOrderIds.current.add(o.id));
      isFirstLoad.current = false;
    }
    
    setOrders(fetched);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    fetchOrders();
  };

  const openDetail = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const copyTrackingLink = (order: Order) => {
    if (!order.tracking_code || !store) {
      toast({ title: "Sem código de rastreio", description: "Este pedido não possui código de rastreio.", variant: "destructive" });
      return;
    }
    const url = `${window.location.origin}/${store.slug}?tracking=${order.tracking_code}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "✅ Link copiado!", description: "Link de rastreio copiado para a área de transferência." });
    }).catch(() => {
      toast({ title: "Erro", description: "Não foi possível copiar o link.", variant: "destructive" });
    });
  };

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (search && !o.customer_name.toLowerCase().includes(search.toLowerCase()) && !o.customer_phone?.includes(search) && !o.id.includes(search)) return false;
    return true;
  });

  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString());
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.total), 0);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR") + ", " + d.toLocaleTimeString("pt-BR");
  };

  const getItemsSummary = (items: OrderItem[]) => {
    if (!items || items.length === 0) return "";
    return items.map(item => `${item.quantity}x ${item.product_name}`).join(", ");
  };

  const getPaymentDisplay = (method: string | null) => {
    if (!method) return paymentIcons["cash"];
    return paymentIcons[method] || method;
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pedidos</h2>
          <p className="text-sm text-muted-foreground">✨ Painel Premium — atualização automática</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSound}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
          <Button onClick={() => setManualOrderOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Pedido Manual
          </Button>
        </div>
      </div>

      <ManualOrderDialog open={manualOrderOpen} onOpenChange={setManualOrderOpen} onOrderCreated={fetchOrders} />
      <OrderDetailDialog order={selectedOrder} open={detailOpen} onOpenChange={setDetailOpen} />

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pedidos hoje</p>
            <p className="text-2xl font-bold">{todayOrders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Faturamento hoje</p>
            <p className="text-2xl font-bold text-green-600">{formatBRL(todayRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total pedidos</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </CardContent>
        </Card>
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
            {filterLabels[s]}
          </button>
        ))}
      </div>

      {/* Order list */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
          : filtered.map((order) => (
              <Card key={order.id} className="border-purple-100 rounded-xl">
                <CardContent className="p-5">
                  {/* Header row: name + status + total */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold">{order.customer_name}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeStyles[order.status]}`}>
                          <Clock className="h-3 w-3" />
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      {/* Date + order type */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {formatDate(order.created_at)} •{" "}
                        {order.order_type === "delivery" ? (
                          <><Truck className="h-3.5 w-3.5 inline text-purple-500" /> Entrega</>
                        ) : (
                          <><StoreIcon className="h-3.5 w-3.5 inline text-purple-500" /> Retirada</>
                        )}
                      </p>
                      {/* Address for delivery */}
                      {order.order_type === "delivery" && order.customer_address && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {order.customer_address}
                        </p>
                      )}
                      {/* Items summary */}
                      <p className="text-sm text-foreground/80">{getItemsSummary(order.order_items)}</p>
                    </div>
                    <p className="text-lg font-bold text-green-600 whitespace-nowrap">{formatBRL(Number(order.total))}</p>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <button onClick={() => openDetail(order)} className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      <Eye className="h-3.5 w-3.5" /> Detalhes
                    </button>
                    {order.status === "pending" && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, "confirmed")}
                          className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Confirmado
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, "cancelled")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-500 hover:bg-orange-50"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancelar
                        </button>
                      </>
                    )}
                    {order.status === "confirmed" && (
                      <button
                        onClick={() => updateStatus(order.id, "preparing")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-600"
                      >
                        Preparando
                      </button>
                    )}
                    {order.status === "preparing" && (
                      <button
                        onClick={() => updateStatus(order.id, "delivering")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-600"
                      >
                        Entregando
                      </button>
                    )}
                    {order.status === "delivering" && (
                      <button
                        onClick={() => updateStatus(order.id, "completed")}
                        className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Concluído
                      </button>
                    )}
                    <button onClick={() => copyTrackingLink(order)} className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                      <MapPin className="h-3.5 w-3.5" /> Link rastreio
                    </button>
                  </div>

                  {/* Phone + Payment */}
                  <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {order.customer_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {order.customer_phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-3 w-3" /> {getPaymentDisplay(order.payment_method)}
                    </span>
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
