import { Plus, Minus, Trash2, ShoppingBag, X } from "lucide-react";

interface CartItem {
  product: { id: string; name: string; price: number; image_url: string | null };
  quantity: number;
  additionals?: { name: string; price: number; quantity: number }[];
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onCheckout: () => void;
  themeColor: string;
  formatBRL: (v: number) => string;
}

export function CartDrawer({ open, onClose, cart, onUpdateQty, onRemove, onCheckout, themeColor, formatBRL }: CartDrawerProps) {
  if (!open) return null;

  const cartTotal = cart.reduce((s, i) => {
    const addTotal = (i.additionals || []).reduce((a, ad) => a + ad.price * ad.quantity, 0);
    return s + (i.product.price + addTotal) * i.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 min-h-[56px]">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="text-lg font-bold">Minha sacola</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl border p-3">
            {item.product.image_url ? (
              <img src={item.product.image_url} alt={item.product.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">📦</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.product.name}</p>
              {item.additionals && item.additionals.length > 0 && (
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  + {item.additionals.map((a) => a.name).join(", ")}
                </p>
              )}
              <p className="text-sm font-bold" style={{ color: themeColor }}>
                {formatBRL(
                  (item.product.price + (item.additionals || []).reduce((a, ad) => a + ad.price * ad.quantity, 0)) * item.quantity
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onRemove(index)} className="p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onUpdateQty(index, -1)}
                className="flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
              <button
                onClick={() => onUpdateQty(index, 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: themeColor }}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold" style={{ color: themeColor }}>{formatBRL(cartTotal)}</span>
        </div>
        <button
          onClick={onCheckout}
          className="w-full rounded-xl py-4 text-center font-bold text-white text-base"
          style={{ backgroundColor: themeColor }}
        >
          Finalizar pedido →
        </button>
      </div>
    </div>
  );
}
