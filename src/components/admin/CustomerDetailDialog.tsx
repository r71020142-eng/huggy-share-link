import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, MapPin, ShoppingBag, Calendar, MessageCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderRow {
  id: string;
  created_at: string;
  status: string;
  total: number;
  payment_method: string | null;
  order_type: string | null;
  items: { product_name: string; quantity: number; subtotal: number }[];
}

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    bairro: string | null;
    total_orders: number;
    total_spent: number;
    first_order_at: string | null;
    last_order_at: string | null;
    crm_status: string;
  } | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-blue-500" },
  ativo: { label: "Ativo", color: "bg-green-500" },
  morno: { label: "Morno", color: "bg-yellow-500" },
  inativo: { label: "Inativo", color: "bg-orange-500" },
  perdido: { label: "Perdido", color: "bg-red-500" },
};

const ORDER_STATUS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  delivering: "Entregando",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function CustomerDetailDialog({ open, onOpenChange, customer }: CustomerDetailDialogProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && customer) {
      fetchOrders(customer.id);
    }
  }, [open, customer]);

  const fetchOrders = async (customerId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, created_at, status, total, payment_method, order_type, order_items(product_name, quantity, subtotal)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setOrders(
        data.map((o: any) => ({
          id: o.id,
          created_at: o.created_at,
          status: o.status,
          total: o.total,
          payment_method: o.payment_method,
          order_type: o.order_type,
          items: o.order_items || [],
        }))
      );
    }
    setLoading(false);
  };

  const sendWhatsApp = () => {
    if (!customer?.phone) return;
    const phone = customer.phone.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}`, "_blank");
  };

  if (!customer) return null;

  const cfg = STATUS_LABELS[customer.crm_status] || STATUS_LABELS.novo;
  const avgTicket = customer.total_orders > 0 ? customer.total_spent / customer.total_orders : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span>{customer.name}</span>
              <Badge className={`${cfg.color} text-white text-[10px] ml-2`}>{cfg.label}</Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {customer.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" /> {customer.phone}
            </div>
          )}
          {(customer.address || customer.bairro) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {[customer.address, customer.bairro].filter(Boolean).join(", ")}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Pedidos</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1"><ShoppingBag className="h-4 w-4" />{customer.total_orders}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Total gasto</p>
            <p className="text-lg font-bold text-primary">{formatBRL(customer.total_spent)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="text-lg font-bold"><TrendingUp className="h-4 w-4 inline mr-1" />{formatBRL(avgTicket)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">Último pedido</p>
            <p className="text-sm font-medium">
              {customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
        </div>

        {/* Actions */}
        {customer.phone && (
          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50 w-fit" onClick={sendWhatsApp}>
            <MessageCircle className="mr-1 h-4 w-4" /> Abrir WhatsApp
          </Button>
        )}

        {/* Orders */}
        <div>
          <h3 className="font-semibold mb-2">Histórico de pedidos</h3>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {o.items.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{ORDER_STATUS[o.status] || o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm">{formatBRL(o.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
