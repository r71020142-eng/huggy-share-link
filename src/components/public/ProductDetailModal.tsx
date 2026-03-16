import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Minus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductAdditional = Database["public"]["Tables"]["product_additionals"]["Row"];

interface SelectedAdditional {
  additional: ProductAdditional;
  quantity: number;
}

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAdd: (product: Product, quantity: number, additionals: SelectedAdditional[]) => void;
  themeColor: string;
}

export function ProductDetailModal({ product, open, onClose, onAdd, themeColor }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [additionals, setAdditionals] = useState<ProductAdditional[]>([]);
  const [selectedAdditionals, setSelectedAdditionals] = useState<SelectedAdditional[]>([]);
  const [loadingAdditionals, setLoadingAdditionals] = useState(false);

  useEffect(() => {
    if (product && open) {
      setQuantity(1);
      setSelectedAdditionals([]);
      fetchAdditionals(product.id);
    }
  }, [product, open]);

  const fetchAdditionals = async (productId: string) => {
    setLoadingAdditionals(true);
    const { data } = await supabase
      .from("product_additionals")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("sort_order");
    setAdditionals(data || []);
    setLoadingAdditionals(false);
  };

  const freeAdditionalsCount = selectedAdditionals.reduce((sum, s) => {
    const price = Number(s.additional.price) || 0;
    return price === 0 ? sum + s.quantity : sum;
  }, 0);
  const maxFree = (product as any)?.max_free_additionals as number | null | undefined;
  const freeLimit = maxFree != null ? maxFree : Infinity;
  const freeSlotsFull = freeAdditionalsCount >= freeLimit;

  const toggleAdditional = (additional: ProductAdditional) => {
    const price = Number(additional.price) || 0;
    if (price === 0 && freeSlotsFull) return; // can't add more free
    setSelectedAdditionals((prev) => {
      const existing = prev.find((s) => s.additional.id === additional.id);
      if (existing) {
        return prev.filter((s) => s.additional.id !== additional.id);
      }
      return [...prev, { additional, quantity: 1 }];
    });
  };

  const updateAdditionalQty = (additionalId: string, delta: number) => {
    setSelectedAdditionals((prev) =>
      prev.map((s) => {
        if (s.additional.id !== additionalId) return s;
        const price = Number(s.additional.price) || 0;
        const newQty = s.quantity + delta;
        const maxQty = s.additional.max_qty || 10;
        if (newQty <= 0) return null as any;
        if (newQty > maxQty) return s;
        // Block increasing free additionals beyond limit
        if (delta > 0 && price === 0 && freeSlotsFull) return s;
        return { ...s, quantity: newQty };
      }).filter(Boolean)
    );
  };


  if (!product) return null;

  const additionalsTotal = selectedAdditionals.reduce(
    (sum, s) => sum + (Number(s.additional.price) || 0) * s.quantity, 0
  );
  const itemTotal = (product.price + additionalsTotal) * quantity;

  // Group additionals by category
  const groupedAdditionals = additionals.reduce((groups, add) => {
    const cat = add.category || "Complemento";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(add);
    return groups;
  }, {} as Record<string, ProductAdditional[]>);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[95vh] overflow-y-auto p-0 gap-0 max-w-md">
        {/* Product image */}
        <div className="relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-muted flex items-center justify-center text-6xl">📦</div>
          )}
          {product.is_featured && (
            <span
              className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-bold text-white"
              style={{ backgroundColor: themeColor }}
            >
              ✨ Destaque
            </span>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Product info */}
        <div className="p-4 space-y-1">
          <h2 className="text-xl font-bold">{product.name}</h2>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
          <p className="text-xl font-bold" style={{ color: themeColor }}>{formatBRL(product.price)}</p>
        </div>

        {/* Additionals */}
        {!loadingAdditionals && Object.keys(groupedAdditionals).length > 0 && (
          <div className="px-4 pb-4 space-y-4">
            {maxFree != null && maxFree !== Infinity && (
              <p className="text-xs font-medium text-muted-foreground">
                Adicionais grátis: {freeAdditionalsCount}/{maxFree}
              </p>
            )}
            {Object.entries(groupedAdditionals).map(([category, items]) => (
              <div key={category}>
                <h3 className="font-bold text-sm mb-2">{category}</h3>
                <div className="divide-y rounded-lg border">
                  {items.map((add) => {
                    const selected = selectedAdditionals.find((s) => s.additional.id === add.id);
                    const price = Number(add.price) || 0;
                    return (
                      <div key={add.id} className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-sm font-medium">{add.name}</p>
                          <p className="text-xs" style={{ color: price > 0 ? themeColor : "#16a34a" }}>
                            {price > 0 ? `+ ${formatBRL(price)}` : "Grátis"}
                          </p>
                        </div>
                        {selected ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateAdditionalQty(add.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: themeColor }}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-5 text-center text-sm font-medium">{selected.quantity}</span>
                            <button
                              onClick={() => updateAdditionalQty(add.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
                              style={{ backgroundColor: themeColor }}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleAdditional(add)}
                            disabled={price === 0 && freeSlotsFull}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white disabled:opacity-40"
                            style={{ backgroundColor: themeColor }}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom bar: quantity + add button */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t bg-background p-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => onAdd(product, quantity, selectedAdditionals)}
            className="flex-1 rounded-xl py-3 text-center font-bold text-white"
            style={{ backgroundColor: themeColor }}
          >
            Adicionar — {formatBRL(itemTotal)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
