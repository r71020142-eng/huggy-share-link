import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/utils";
import { ShoppingBag, Calendar, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";

interface Props {
  customerId: string;
  storeId: string;
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  payment_status: string;
}

const statusLabels: Record<string, string> = {
  novo: "Novo",
  ativo: "Ativo",
  morno: "Morno",
  inativo: "Inativo",
  perdido: "Perdido",
};

const statusColors: Record<string, string> = {
  novo: "text-blue-600 bg-blue-50",
  ativo: "text-green-600 bg-green-50",
  morno: "text-yellow-600 bg-yellow-50",
  inativo: "text-orange-600 bg-orange-50",
  perdido: "text-red-600 bg-red-50",
};

export default function CustomerHistoryPanel({ customerId, storeId }: Props) {
  const [stats, setStats] = useState<{
    total_orders: number;
    total_spent: number;
    last_order_at: string | null;
    crm_status: string;
    pending_fiado: number;
  } | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId || !storeId) return;
    setLoading(true);

    const fetchData = async () => {
      // Get customer stats
      const { data: cust } = await supabase
        .from("customers")
        .select("total_orders, total_spent, last_order_at, crm_status")
        .eq("id", customerId)
        .eq("store_id", storeId)
        .single();

      // Get pending fiado total
      const { data: fiadoOrders } = await supabase
        .from("orders")
        .select("total")
        .eq("store_id", storeId)
        .eq("customer_id", customerId)
        .eq("payment_status", "pending");

      const pendingFiado = (fiadoOrders || []).reduce((s, o) => s + Number(o.total), 0);

      setStats(cust ? {
        total_orders: cust.total_orders,
        total_spent: cust.total_spent,
        last_order_at: cust.last_order_at,
        crm_status: cust.crm_status,
        pending_fiado: pendingFiado,
      } : null);

      // Get last 5 orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total, status, created_at, payment_status")
        .eq("store_id", storeId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentOrders((orders as RecentOrder[]) || []);
      setLoading(false);
    };

    fetchData();
  }, [customerId, storeId]);

  if (loading) {
    return (
      <div className="rounded-lg border p-3 animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-24" />
        <div className="h-3 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-20" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="rounded-lg border p-3 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" /> Histórico do Cliente
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[stats.crm_status] || "bg-muted"}`}>
          {statusLabels[stats.crm_status] || stats.crm_status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 text-sm">
          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
          <span><strong>{stats.total_orders}</strong> pedidos</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          <span><strong>{formatBRL(stats.total_spent)}</strong> gasto</span>
        </div>
        {stats.last_order_at && (
          <div className="flex items-center gap-2 text-sm col-span-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Último: {new Date(stats.last_order_at).toLocaleDateString("pt-BR")}</span>
          </div>
        )}
        {stats.pending_fiado > 0 && (
          <div className="flex items-center gap-2 text-sm col-span-2 text-orange-600 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Fiado pendente: {formatBRL(stats.pending_fiado)}</span>
          </div>
        )}
      </div>

      {recentOrders.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Últimos pedidos</p>
          {recentOrders.map(o => (
            <div key={o.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
              <span className="text-muted-foreground">
                {new Date(o.created_at).toLocaleDateString("pt-BR")}
              </span>
              <div className="flex items-center gap-2">
                {o.payment_status === "pending" && (
                  <span className="text-[10px] font-bold text-orange-500">FIADO</span>
                )}
                <span className="font-medium">{formatBRL(Number(o.total))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {recentOrders.length === 0 && stats.total_orders === 0 && (
        <p className="text-xs text-muted-foreground text-center py-1">Nenhum pedido anterior</p>
      )}
    </div>
  );
}
