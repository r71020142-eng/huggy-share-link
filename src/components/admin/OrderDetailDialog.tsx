import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Phone, CreditCard, Truck, Store as StoreIcon, User, FileText, Package, Printer } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { formatBRL } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

interface OrderDetailDialogProps {
  order: OrderWithItems | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  delivering: "Entregando",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  delivering: "bg-cyan-100 text-cyan-700 border-cyan-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const paymentLabels: Record<string, string> = {
  pix: "💎 Pix",
  cash: "💵 Dinheiro",
  credit: "💳 Crédito",
  debit: "💳 Débito",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR");
};

export default function OrderDetailDialog({ order, open, onOpenChange }: OrderDetailDialogProps) {
  const [printing, setPrinting] = useState(false);

  if (!order) return null;

  const items = order.order_items || [];

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const idempotencyKey = `manual-${order.id}-${Date.now()}`;
      const { error } = await supabase.from("print_jobs").insert({
        order_id: order.id,
        store_id: order.store_id,
        idempotency_key: idempotencyKey,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Pedido enviado para impressão!");
    } catch (e: any) {
      toast.error("Erro ao enviar para impressão: " + e.message);
    }
    setPrinting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Detalhes do Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status + ID */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[order.status]}`}>
              <Clock className="h-3 w-3" />
              {statusLabels[order.status]}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {order.tracking_code ? `#${order.tracking_code}` : order.id.slice(0, 8)}
            </span>
          </div>

          {/* Date */}
          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>

          <Separator />

          {/* Customer info */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary" /> Cliente
            </h4>
            <p className="text-sm font-medium">{order.customer_name}</p>
            {order.customer_phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
              </p>
            )}
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              {order.order_type === "delivery" ? (
                <><Truck className="h-3.5 w-3.5" /> Entrega</>
              ) : (
                <><StoreIcon className="h-3.5 w-3.5" /> Retirada</>
              )}
            </p>
            {order.order_type === "delivery" && order.customer_address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {order.customer_address}
              </p>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Itens
            </h4>
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x</span> {item.product_name}
                  {item.additionals && Array.isArray(item.additionals) && (item.additionals as any[]).length > 0 && (
                    <div className="text-xs text-muted-foreground ml-4">
                      {(item.additionals as any[]).map((a: any, i: number) => (
                        <span key={i}>+ {a.name}{a.price > 0 ? ` (${formatBRL(a.price)})` : ""}{i < (item.additionals as any[]).length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-medium whitespace-nowrap">{formatBRL(Number(item.subtotal))}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(Number(order.subtotal))}</span>
            </div>
            {order.delivery_fee && Number(order.delivery_fee) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>{formatBRL(Number(order.delivery_fee))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span className="text-green-600">{formatBRL(Number(order.total))}</span>
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{paymentLabels[order.payment_method || "cash"] || order.payment_method}</span>
          </div>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Observações</h4>
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{order.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
