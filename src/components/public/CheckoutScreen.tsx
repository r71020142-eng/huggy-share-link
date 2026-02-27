import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ShoppingBag } from "lucide-react";

interface CartItem {
  product: { id: string; name: string; price: number };
  quantity: number;
  additionals?: { id?: string; name: string; price: number; quantity: number }[];
}

interface CheckoutScreenProps {
  open: boolean;
  onBack: () => void;
  cart: CartItem[];
  store: any;
  neighborhoods: any[];
  onSubmit: (data: {
    customerName: string;
    customerPhone: string;
    orderType: string;
    customerAddress: string;
    neighborhoodId: string;
    paymentMethod: string;
    notes: string;
  }) => void;
  submitting: boolean;
  themeColor: string;
  formatBRL: (v: number) => string;
}

export function CheckoutScreen({
  open, onBack, cart, store, neighborhoods, onSubmit, submitting, themeColor, formatBRL,
}: CheckoutScreenProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState(store?.pickup_enabled ? "pickup" : "delivery");
  const [customerAddress, setCustomerAddress] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const cartTotal = cart.reduce((s, i) => {
    const addTotal = (i.additionals || []).reduce((a, ad) => a + ad.price * ad.quantity, 0);
    return s + (i.product.price + addTotal) * i.quantity;
  }, 0);

  const selectedNeighborhood = neighborhoods.find((n) => n.id === neighborhoodId);
  const deliveryFee = orderType === "delivery" ? Number(selectedNeighborhood?.delivery_fee || 0) : 0;
  const orderTotal = cartTotal + deliveryFee;

  const handleSubmit = () => {
    if (!customerName.trim()) return;
    if (orderType === "delivery" && !customerAddress.trim()) return;
    onSubmit({ customerName, customerPhone, orderType, customerAddress, neighborhoodId, paymentMethod, notes });
  };

  const orderTypes = [
    ...(store?.pickup_enabled ? [{ value: "pickup", label: "Retirada", icon: "🏪" }] : []),
    ...(store?.delivery_enabled ? [{ value: "delivery", label: "Entrega", icon: "🚚" }] : []),
  ];

  const paymentMethods = [
    { value: "pix", label: "Pix", icon: "💎" },
    { value: "cash", label: "Dinheiro", icon: "💵" },
    { value: "debit", label: "Débito", icon: "💳" },
    { value: "credit", label: "Crédito", icon: "💳" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 min-h-[56px]">
        <button onClick={onBack} className="rounded-full p-1 hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold">Finalizar pedido</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Resumo */}
        <div className="rounded-xl border p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumo</h3>
          {cart.map((item, i) => {
            const addTotal = (item.additionals || []).reduce((a, ad) => a + ad.price * ad.quantity, 0);
            const itemTotal = (item.product.price + addTotal) * item.quantity;
            return (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.product.name} ×{item.quantity}</span>
                <span>{formatBRL(itemTotal)}</span>
              </div>
            );
          })}
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>Entrega</span>
              <span>{formatBRL(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span style={{ color: themeColor }}>{formatBRL(orderTotal)}</span>
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Seu nome *</label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nome completo"
            className="rounded-xl border-2 py-5"
          />
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Telefone com DDD *</label>
          <Input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="(31) 99999-9999"
            className="rounded-xl border-2 py-5"
          />
        </div>

        {/* Tipo de pedido */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Tipo de pedido</label>
          <div className="grid grid-cols-2 gap-2">
            {orderTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setOrderType(type.value)}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  orderType === type.value ? "text-white" : "text-foreground"
                }`}
                style={orderType === type.value ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Endereço (delivery) */}
        {orderType === "delivery" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-bold">Endereço *</label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                className="rounded-xl border-2 py-5"
              />
            </div>
            {neighborhoods.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold">Bairro</label>
                <div className="grid grid-cols-2 gap-2">
                  {neighborhoods.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setNeighborhoodId(n.id)}
                      className={`rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-colors ${
                        neighborhoodId === n.id ? "text-white" : "text-foreground"
                      }`}
                      style={neighborhoodId === n.id ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
                    >
                      {n.name} — {formatBRL(Number(n.delivery_fee))}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagamento */}
        <div className="space-y-2">
          <label className="text-sm font-bold">Forma de pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((pm) => (
              <button
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value)}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  paymentMethod === pm.value ? "text-white" : "text-foreground"
                }`}
                style={paymentMethod === pm.value ? { backgroundColor: themeColor, borderColor: themeColor } : {}}
              >
                {pm.icon} {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <label className="text-sm font-bold">
            Observações gerais <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alguma observação geral do pedido?"
            rows={3}
            className="rounded-xl border-2"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4">
        <button
          onClick={handleSubmit}
          disabled={submitting || !customerName.trim()}
          className="w-full rounded-xl py-4 text-center font-bold text-white text-base flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          <ShoppingBag className="h-5 w-5" />
          {submitting ? "Enviando..." : `Confirmar pedido · ${formatBRL(orderTotal)}`}
        </button>
      </div>
    </div>
  );
}
