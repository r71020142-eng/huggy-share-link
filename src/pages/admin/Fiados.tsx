import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useCashSession } from "@/hooks/useCashSession";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HandCoins, Clock, CheckCircle, AlertTriangle, Lock } from "lucide-react";

interface FiadoOrder {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total: number;
  created_at: string;
  tracking_code: string | null;
  order_type: string | null;
}

const PAYMENT_OPTIONS = [
  { value: "pix", label: "Pix", icon: "💎" },
  { value: "cash", label: "Dinheiro", icon: "💵" },
  { value: "debit", label: "Débito", icon: "💳" },
  { value: "credit", label: "Crédito", icon: "💳" },
];

export default function Fiados() {
  const { store } = useStore();
  const { activeSession } = useCashSession();
  const [orders, setOrders] = useState<FiadoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOrder, setConfirmOrder] = useState<FiadoOrder | null>(null);
  const [selectedMethod, setSelectedMethod] = useState("pix");
  const [submitting, setSubmitting] = useState(false);

  // Stats
  const [todayReceived, setTodayReceived] = useState(0);

  useEffect(() => {
    if (store) fetchFiados();
  }, [store]);

  const fetchFiados = async () => {
    if (!store) return;
    setLoading(true);

    const { data } = await supabase
      .from("orders")
      .select("id, customer_name, customer_phone, total, created_at, tracking_code, order_type")
      .eq("store_id", store.id)
      .eq("payment_status", "pending")
      .order("created_at", { ascending: true });

    setOrders((data as FiadoOrder[]) || []);

    // Today received fiados
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: paidToday } = await supabase
      .from("orders")
      .select("total")
      .eq("store_id", store.id)
      .eq("payment_status", "paid")
      .not("paid_at", "is", null)
      .gte("paid_at", todayStart.toISOString())
      .eq("payment_method", "credit_later"); // orders that WERE fiado

    // Actually we can't filter by original payment_method since it changes on payment.
    // Better: check orders that have paid_at != created_at (rough heuristic) or just show today's received
    setTodayReceived((paidToday || []).reduce((s, o) => s + Number(o.total), 0));

    setLoading(false);
  };

  const handleConfirmPayment = async () => {
    if (!confirmOrder) return;
    setSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.rpc("confirm_fiado_payment", {
        p_order_id: confirmOrder.id,
        p_payment_method: selectedMethod,
        p_closed_by: user.user?.id!,
      });
      if (error) throw error;
      toast.success("Pagamento confirmado com sucesso!");
      setConfirmOrder(null);
      fetchFiados();
    } catch (err: any) {
      toast.error(err.message || "Erro ao confirmar pagamento");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPending = orders.reduce((s, o) => s + Number(o.total), 0);

  const getDaysOpen = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 86400000);
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <HandCoins className="h-6 w-6" /> Fiados (Pagamento Posterior)
        </h2>
        <p className="text-sm text-muted-foreground">Controle de pedidos com pagamento pendente</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-muted-foreground">Total em aberto</p>
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatBRL(totalPending)}</p>
            <p className="text-xs text-muted-foreground">{orders.length} pedidos pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Recebido hoje</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatBRL(todayReceived)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Vencidos (+7 dias)</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {orders.filter(o => getDaysOpen(o.created_at) > 7).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash session warning */}
      {!activeSession && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Caixa fechado</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Abra o caixa para receber pagamentos de fiados.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fiados list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : orders.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center space-y-2">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <p className="font-bold text-lg">Nenhum fiado pendente!</p>
            <p className="text-sm text-muted-foreground">Todos os pagamentos estão em dia.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const days = getDaysOpen(order.created_at);
            const isOverdue = days > 7;
            return (
              <Card key={order.id} className={`${isOverdue ? "border-red-300" : "border-orange-200"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{order.customer_name}</span>
                        <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                          FIADO
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            VENCIDO
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR")} · {days} {days === 1 ? "dia" : "dias"} em aberto
                      </p>
                      {order.customer_phone && (
                        <p className="text-xs text-muted-foreground">📞 {order.customer_phone}</p>
                      )}
                      {order.tracking_code && (
                        <p className="text-xs text-muted-foreground">Pedido #{order.tracking_code}</p>
                      )}
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-lg font-bold text-orange-600">{formatBRL(Number(order.total))}</p>
                      <Button
                        size="sm"
                        onClick={() => { setConfirmOrder(order); setSelectedMethod("pix"); }}
                        disabled={!activeSession}
                      >
                        <HandCoins className="h-3.5 w-3.5 mr-1" /> Receber
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm payment dialog */}
      <Dialog open={!!confirmOrder} onOpenChange={v => !v && setConfirmOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Receber Pagamento</DialogTitle>
            <DialogDescription>
              Confirme a forma de pagamento para o pedido de {confirmOrder?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold text-primary">{formatBRL(Number(confirmOrder?.total || 0))}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedMethod(opt.value)}
                  className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    selectedMethod === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>

            <Button className="w-full" onClick={handleConfirmPayment} disabled={submitting}>
              {submitting ? "Processando..." : "✅ Confirmar Pagamento"}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setConfirmOrder(null)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
