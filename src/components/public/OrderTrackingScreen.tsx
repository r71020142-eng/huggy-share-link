import { useEffect, useState } from "react";
import { X, Clock, ChefHat, Truck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderTrackingScreenProps {
  open: boolean;
  orderId: string | null;
  trackingCode: string | null;
  storeId: string | null;
  onClose: () => void;
  themeColor: string;
}

const STEPS = [
  { status: "pending", label: "Pedido recebido", description: "Aguardando confirmação da loja", icon: Clock },
  { status: "confirmed", label: "Em preparo", description: "A loja está preparando com carinho", icon: ChefHat },
  { status: "preparing", label: "Em preparo", description: "A loja está preparando com carinho", icon: ChefHat },
  { status: "delivering", label: "Pronto!", description: "Seu pedido está pronto para sair", icon: Truck },
  { status: "completed", label: "Entregue", description: "Pedido entregue com sucesso", icon: CheckCircle2 },
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  delivering: 3,
  completed: 4,
  cancelled: -1,
};

export function OrderTrackingScreen({ open, orderId, trackingCode, storeId, onClose, themeColor }: OrderTrackingScreenProps) {
  const [orderStatus, setOrderStatus] = useState("pending");
  const [resolvedTrackingCode, setResolvedTrackingCode] = useState<string | null>(null);
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Fetch initial status and resolve orderId for realtime
  useEffect(() => {
    if (!open || (!orderId && !trackingCode)) return;
    setNotFound(false);

    const fetchStatus = async () => {
      let fetchedOrderId: string | null = null;

      if (trackingCode) {
        const rpcArgs: any = { p_tracking_code: trackingCode };
        if (storeId) rpcArgs.p_store_id = storeId;
        const { data } = await supabase.rpc("get_order_by_tracking", rpcArgs);
        if (data) {
          setOrderStatus((data as any).status);
          setResolvedTrackingCode((data as any).tracking_code);
          fetchedOrderId = (data as any).id;
        } else {
          setNotFound(true);
          return;
        }
      } else if (orderId) {
        const rpcArgs: any = { p_order_id: orderId };
        if (storeId) rpcArgs.p_store_id = storeId;
        const { data } = await supabase.rpc("get_tracking_by_order_id", rpcArgs);
        if (data) {
          setOrderStatus((data as any).status);
          setResolvedTrackingCode((data as any).tracking_code);
          fetchedOrderId = (data as any).id;
        } else {
          setNotFound(true);
          return;
        }
      }

      setResolvedOrderId(fetchedOrderId || orderId || null);
    };
    fetchStatus();
  }, [orderId, trackingCode, storeId, open]);

  // Subscribe to realtime updates using resolved order ID
  useEffect(() => {
    const subId = resolvedOrderId;
    if (!open || !subId) return;

    const channel = supabase
      .channel(`order-${subId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${subId}` }, (payload) => {
        if (payload.new?.status) setOrderStatus(payload.new.status as string);
        if (payload.new?.tracking_code) setResolvedTrackingCode(payload.new.tracking_code as string);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [resolvedOrderId, open]);

  if (!open) return null;

  if (notFound) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-3 border-b px-4 py-3 min-h-[56px]">
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold">Acompanhar pedido</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <span className="text-5xl">🔍</span>
          <h3 className="text-xl font-bold">Pedido não encontrado</h3>
          <p className="text-sm text-muted-foreground text-center">
            O código de rastreio informado não pertence a esta loja ou não existe.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_INDEX[orderStatus] ?? 0;
  const progressPercent = Math.max(5, (currentIndex / 4) * 100);

  const displaySteps = [
    { label: "Pedido recebido", description: "Aguardando confirmação da loja", icon: Clock },
    { label: "Em preparo", description: "A loja está preparando com carinho", icon: ChefHat },
    { label: "Pronto!", description: "Seu pedido está pronto para sair", icon: Truck },
    { label: "Entregue", description: "Pedido entregue com sucesso", icon: CheckCircle2 },
  ];

  const stepStatusIndex = [0, 2, 3, 4]; // Maps display step to STATUS_INDEX values

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 min-h-[56px]">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold">Acompanhar pedido</h2>
        </div>
        {(resolvedTrackingCode || trackingCode) && (
          <span className="text-sm text-muted-foreground">#{resolvedTrackingCode || trackingCode}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Status icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl" style={{ backgroundColor: `${themeColor}15` }}>
              <span className="text-4xl">🛍️</span>
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full" style={{ backgroundColor: themeColor }} />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold">
              {orderStatus === "pending" && "Pedido recebido"}
              {orderStatus === "confirmed" && "Pedido confirmado"}
              {orderStatus === "preparing" && "Em preparo"}
              {orderStatus === "delivering" && "Saiu para entrega"}
              {orderStatus === "completed" && "Entregue!"}
              {orderStatus === "cancelled" && "Pedido cancelado"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {orderStatus === "pending" && "Aguardando confirmação da loja"}
              {orderStatus === "confirmed" && "A loja confirmou seu pedido"}
              {orderStatus === "preparing" && "A loja está preparando com carinho"}
              {orderStatus === "delivering" && "Seu pedido está a caminho"}
              {orderStatus === "completed" && "Pedido entregue com sucesso"}
              {orderStatus === "cancelled" && "Este pedido foi cancelado"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {orderStatus !== "cancelled" && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%`, backgroundColor: themeColor }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recebido</span>
              <span>Entregue</span>
            </div>
          </div>
        )}

        {/* Steps timeline */}
        {orderStatus !== "cancelled" && (
          <div className="space-y-0">
            {displaySteps.map((step, i) => {
              const stepIdx = stepStatusIndex[i];
              const isActive = currentIndex >= stepIdx;
              const isCurrent = currentIndex === stepIdx || (i === 1 && (currentIndex === 1 || currentIndex === 2));
              const Icon = step.icon;

              return (
                <div key={i} className="flex gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isActive ? "text-white" : "bg-muted text-muted-foreground"}`}
                      style={isActive ? { backgroundColor: themeColor } : {}}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {i < displaySteps.length - 1 && (
                      <div className="h-10 w-0.5" style={{ backgroundColor: isActive ? themeColor : "hsl(var(--muted))" }} />
                    )}
                  </div>
                  {/* Text */}
                  <div className="pt-2">
                    <p className={`font-semibold text-sm ${isActive ? "" : "text-muted-foreground"}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    {isCurrent && (
                      <p className="text-xs font-semibold mt-0.5" style={{ color: themeColor }}>● Em andamento</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
