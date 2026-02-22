import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Minus, MapPin, Phone, Clock, X, Store, Search } from "lucide-react";
import { toast } from "sonner";
import { ProductDetailModal } from "@/components/public/ProductDetailModal";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Neighborhood = Database["public"]["Tables"]["neighborhoods"]["Row"];

interface CartItem {
  product: Product;
  quantity: number;
  additionals?: { name: string; price: number; quantity: number }[];
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Checkout fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState("delivery");
  const [customerAddress, setCustomerAddress] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) fetchMenu();
  }, [slug]);

  const fetchMenu = async () => {
    const { data: menuData } = await supabase
      .from("menus")
      .select("*")
      .eq("slug", slug!)
      .eq("is_published", true)
      .single();

    if (!menuData) { setNotFound(true); setLoading(false); return; }
    setMenu(menuData);

    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("id", menuData.store_id)
      .single();
    setStore(storeData);

    const [{ data: prods }, { data: cats }, { data: hoods }] = await Promise.all([
      supabase.from("products").select("*").eq("store_id", menuData.store_id).eq("is_active", true).order("sort_order"),
      supabase.from("categories").select("*").eq("store_id", menuData.store_id).eq("is_active", true).order("sort_order"),
      supabase.from("neighborhoods").select("*").eq("store_id", menuData.store_id).eq("is_active", true).order("name"),
    ]);

    setProducts(prods || []);
    setCategories(cats || []);
    setNeighborhoods(hoods || []);
    setLoading(false);
  };

  const addToCart = (product: Product, qty = 1, additionals?: { name: string; price: number; quantity: number }[]) => {
    setCart((prev) => {
      // If has additionals, always add as new item
      if (additionals && additionals.length > 0) {
        return [...prev, { product, quantity: qty, additionals }];
      }
      const existing = prev.find((i) => i.product.id === product.id && !i.additionals?.length);
      if (existing) return prev.map((i) => i.product.id === product.id && !i.additionals?.length ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product, quantity: qty }];
    });
    toast.success(`${product.name} adicionado!`);
  };

  const handleProductAdd = (product: Product, quantity: number, selectedAdditionals: any[]) => {
    const adds = selectedAdditionals.map((s) => ({
      name: s.additional.name,
      price: Number(s.additional.price) || 0,
      quantity: s.quantity,
    }));
    addToCart(product, quantity, adds);
    setSelectedProduct(null);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? null : { ...i, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const selectedNeighborhood = neighborhoods.find((n) => n.id === neighborhoodId);
  const deliveryFee = orderType === "delivery" ? Number(selectedNeighborhood?.delivery_fee || 0) : 0;
  const orderTotal = cartTotal + deliveryFee;

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const filteredProducts = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory && p.category_id !== activeCategory) return false;
    return true;
  });

  const handleCheckout = async () => {
    if (!store || !customerName.trim()) return;
    if (orderType === "delivery" && !customerAddress.trim()) {
      toast.error("Informe o endereço de entrega");
      return;
    }
    if (store.min_order && cartTotal < store.min_order) {
      toast.error(`Pedido mínimo: ${formatBRL(store.min_order)}`);
      return;
    }

    setSubmitting(true);

    // If store is Pro, create order in DB
    if (store.plan_type === "pro") {
      const { data: order, error } = await supabase.from("orders").insert({
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        order_type: orderType,
        customer_address: orderType === "delivery" ? customerAddress : null,
        neighborhood_id: orderType === "delivery" && neighborhoodId ? neighborhoodId : null,
        delivery_fee: deliveryFee,
        subtotal: cartTotal,
        total: orderTotal,
        payment_method: paymentMethod,
        notes,
      }).select().single();

      if (error) {
        toast.error("Erro ao criar pedido");
        setSubmitting(false);
        return;
      }

      // Insert order items
      if (order) {
        await supabase.from("order_items").insert(
          cart.map((item) => ({
            order_id: order.id,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            subtotal: item.product.price * item.quantity,
          }))
        );
      }

      toast.success("Pedido enviado com sucesso! 🎉");
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } else {
      // Basic plan: send via WhatsApp
      const items = cart.map((i) => `• ${i.quantity}x ${i.product.name} - ${formatBRL(i.product.price * i.quantity)}`).join("\n");
      const msg = `🛒 *Novo Pedido*\n\n👤 ${customerName}\n📱 ${customerPhone}\n${orderType === "delivery" ? `📍 ${customerAddress}\n` : "🏪 Retirada\n"}\n${items}\n\n💰 Subtotal: ${formatBRL(cartTotal)}${deliveryFee > 0 ? `\n🚚 Entrega: ${formatBRL(deliveryFee)}` : ""}\n💵 *Total: ${formatBRL(orderTotal)}*\n💳 ${paymentMethod === "cash" ? "Dinheiro" : paymentMethod === "pix" ? "Pix" : "Cartão"}${notes ? `\n📝 ${notes}` : ""}`;

      const phone = (store.whatsapp || "").replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
        <Store className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Cardápio não encontrado</h1>
        <p className="text-muted-foreground">Este cardápio não existe ou não está publicado.</p>
      </div>
    );
  }

  const themeColor = menu?.theme_color || store?.theme_color || "#7c3aed";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      {(menu?.banner_url || store?.banner_url) && (
        <img src={menu?.banner_url || store?.banner_url} alt="" className="h-48 w-full object-cover" />
      )}

      {/* Store info bar */}
      <div className="px-4 py-3" style={{ backgroundColor: themeColor }}>
        <div className="flex items-center gap-3">
          {(menu?.logo_url || store?.logo_url) ? (
            <img src={menu?.logo_url || store?.logo_url} alt={store?.name} className="h-14 w-14 rounded-full border-2 border-white/30 object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 text-2xl" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              🍨
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{store?.name}</h1>
              {store?.is_open ? (
                <Badge className="bg-green-500 text-white text-[10px] px-2 py-0.5">● ABERTO</Badge>
              ) : (
                <Badge className="bg-white/20 text-white text-[10px] px-2 py-0.5">FECHADO</Badge>
              )}
            </div>
            {store?.estimated_time && (
              <span className="flex items-center gap-1 text-xs text-white/80 mt-0.5">
                <Clock className="h-3 w-3" /> {store.estimated_time}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Promo banner */}
      {store?.promo_banner && (
        <div className="mx-4 mt-4 rounded-lg p-3 text-center text-sm font-medium" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
          {store.promo_banner}
        </div>
      )}

      {/* Store info */}
      <div className="mx-4 mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {store?.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {store.address}</span>}
        {store?.operating_hours && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {store.operating_hours}</span>}
        {store?.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {store.whatsapp}</span>}
        {store?.min_order > 0 && <span>Pedido mín: {formatBRL(store.min_order)}</span>}
      </div>

      {/* Search */}
      <div className="mx-4 mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${!activeCategory ? "text-white" : "bg-muted text-muted-foreground"}`}
            style={!activeCategory ? { backgroundColor: themeColor } : {}}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat.id ? "text-white" : "bg-muted text-muted-foreground"}`}
              style={activeCategory === cat.id ? { backgroundColor: themeColor } : {}}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Destaques (Featured) */}
      {(() => {
        const featuredProducts = filteredProducts.filter((p) => p.is_featured);
        if (featuredProducts.length === 0) return null;
        return (
          <div className="mt-6 px-4">
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
              <span>⭐</span> Destaques
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {featuredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="shrink-0 w-[140px] text-left"
                >
                  <div className="relative overflow-hidden rounded-xl">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-[140px] w-[140px] object-cover" />
                    ) : (
                      <div className="flex h-[140px] w-[140px] items-center justify-center bg-muted text-4xl">📦</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-sm font-bold text-white">{formatBRL(product.price)}</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm font-medium line-clamp-1">{product.name}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Cardápio */}
      <div className="mt-6 px-4">
        <h2 className="text-lg font-bold mb-3">Cardápio</h2>
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} onClick={() => setSelectedProduct(product)} className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">📦</div>
              )}
              <div className="flex flex-1 flex-col min-w-0">
                <span className="font-semibold text-sm line-clamp-1">{product.name}</span>
                {product.description && <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>}
                <span className="text-sm font-bold mt-0.5" style={{ color: themeColor }}>{formatBRL(product.price)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md"
                style={{ backgroundColor: themeColor }}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Nenhum produto encontrado.</div>
          )}
        </div>
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            onClick={() => setCartOpen(true)}
            className="w-full h-14 text-base font-bold shadow-xl rounded-xl"
            style={{ backgroundColor: themeColor }}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Ver carrinho • {cartCount} {cartCount === 1 ? "item" : "itens"} • {formatBRL(cartTotal)}
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carrinho ({cartCount} itens)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm" style={{ color: themeColor }}>{formatBRL(item.product.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(item.product.id, -1)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQty(item.product.id, 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span style={{ color: themeColor }}>{formatBRL(cartTotal)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}>Continuar comprando</Button>
            <Button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} style={{ backgroundColor: themeColor }}>
              Finalizar pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Pedido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(31) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label>Tipo do pedido</Label>
              <Select value={orderType} onValueChange={setOrderType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {store?.delivery_enabled && <SelectItem value="delivery">🚚 Entrega</SelectItem>}
                  {store?.pickup_enabled && <SelectItem value="pickup">🏪 Retirada</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            {orderType === "delivery" && (
              <>
                <div className="space-y-2">
                  <Label>Endereço *</Label>
                  <Input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Rua, número, bairro" />
                </div>
                {neighborhoods.length > 0 && (
                  <div className="space-y-2">
                    <Label>Bairro (taxa de entrega)</Label>
                    <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
                      <SelectTrigger><SelectValue placeholder="Selecione o bairro" /></SelectTrigger>
                      <SelectContent>
                        {neighborhoods.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.name} — {formatBRL(Number(n.delivery_fee))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label>Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Dinheiro</SelectItem>
                  <SelectItem value="pix">📱 Pix</SelectItem>
                  <SelectItem value="card">💳 Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma observação?" rows={2} />
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(cartTotal)}</span></div>
              {deliveryFee > 0 && <div className="flex justify-between"><span>Entrega</span><span>{formatBRL(deliveryFee)}</span></div>}
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total</span>
                <span style={{ color: themeColor }}>{formatBRL(orderTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Voltar</Button>
            <Button onClick={handleCheckout} disabled={submitting} style={{ backgroundColor: themeColor }}>
              {submitting ? "Enviando..." : store?.plan_type === "pro" ? "Confirmar Pedido" : "Enviar via WhatsApp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={handleProductAdd}
        themeColor={themeColor}
      />
    </div>
  );
}
