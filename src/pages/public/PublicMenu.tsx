import { useEffect, useState, useRef, useCallback } from "react";
import { formatBRL } from "@/lib/utils";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, MapPin, Phone, Clock, Store, Search } from "lucide-react";
import { toast } from "sonner";
import { ProductDetailModal } from "@/components/public/ProductDetailModal";
import { CartDrawer } from "@/components/public/CartDrawer";
import { CheckoutScreen } from "@/components/public/CheckoutScreen";
import { OrderTrackingScreen } from "@/components/public/OrderTrackingScreen";
import { OrderConfirmationAnimation } from "@/components/public/OrderConfirmationAnimation";
import { PWAInstallPrompt } from "@/components/public/PWAInstallPrompt";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Neighborhood = Database["public"]["Tables"]["neighborhoods"]["Row"];

interface CartItem {
  product: Product;
  quantity: number;
  additionals?: { id?: string; name: string; price: number; quantity: number }[];
}

interface BannerItem {
  image_url: string;
  link_url?: string | null;
}

function BannerCarousel({ banners, themeColor }: { banners: BannerItem[]; themeColor: string }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  const handleClick = () => {
    const link = banners[current]?.link_url;
    if (link) {
      if (link.startsWith("http")) {
        window.open(link, "_blank", "noopener");
      } else {
        window.location.href = link;
      }
    }
  };

  return (
    <div className="relative h-48 w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={banners[current].image_url}
          alt=""
          className={`absolute inset-0 h-48 w-full object-cover ${banners[current].link_url ? "cursor-pointer" : ""}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={handleClick}
        />
      </AnimatePresence>
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); if (timerRef.current) clearInterval(timerRef.current); }}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === current ? 20 : 8,
                backgroundColor: i === current ? themeColor : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicMenu() {
  const { slug } = useParams<{ slug: string }>();
  const [menu, setMenu] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuBanners, setMenuBanners] = useState<any[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [lastTrackingCode, setLastTrackingCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (slug) fetchMenu();
  }, [slug]);

  // Update document title and apple-touch-icon for ALL stores (iOS Add to Home Screen uses these)
  useEffect(() => {
    if (!store) return;
    const originalTitle = document.title;
    document.title = store.name || "Cardápio Digital";

    // Update theme-color meta
    const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const originalThemeColor = themeMeta?.content;
    if (themeMeta && (menu?.theme_color || store.theme_color)) {
      themeMeta.content = menu?.theme_color || store.theme_color;
    }

    // Update apple-touch-icon for iOS
    const iconUrl = menu?.logo_url || store.logo_url;
    if (iconUrl) {
      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
      if (!appleIcon) {
        appleIcon = document.createElement("link");
        appleIcon.rel = "apple-touch-icon";
        document.head.appendChild(appleIcon);
      }
      const originalIcon = appleIcon.href;
      appleIcon.href = iconUrl;

      return () => {
        document.title = originalTitle;
        if (themeMeta && originalThemeColor) themeMeta.content = originalThemeColor;
        appleIcon!.href = originalIcon;
      };
    }

    return () => {
      document.title = originalTitle;
      if (themeMeta && originalThemeColor) themeMeta.content = originalThemeColor;
    };
  }, [store, menu]);

  // Detect ?tracking= query param to auto-open tracking screen
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const trackingParam = searchParams.get("tracking");
    if (trackingParam && !loading) {
      setLastTrackingCode(trackingParam);
      setLastOrderId(null);
      setTrackingOpen(true);
    }
  }, [searchParams, loading]);

  const fetchMenu = async () => {
    const isPreview = new URLSearchParams(window.location.search).get("preview") === "1";
    let query = supabase.from("menus").select("*").eq("slug", slug!);
    if (!isPreview) query = query.eq("is_published", true);
    const { data: menuData } = await query.single();

    if (!menuData) { setNotFound(true); setLoading(false); return; }
    setMenu(menuData);

    const { data: storeData } = await supabase
      .from("stores").select("id, name, slug, address, whatsapp, logo_url, banner_url, theme_color, is_open, delivery_enabled, pickup_enabled, min_order, estimated_time, promo_banner, operating_hours, plan_type, created_at").eq("id", menuData.store_id).single();
    setStore(storeData);

    const [{ data: menuProds }, { data: allProds }, { data: cats }, { data: hoods }, { data: bannerData }] = await Promise.all([
      supabase.from("menu_products").select("product_id, sort_order, is_available").eq("menu_id", menuData.id).eq("is_available", true).order("sort_order"),
      supabase.from("products").select("*").eq("store_id", menuData.store_id).eq("is_active", true),
      supabase.from("categories").select("*").eq("store_id", menuData.store_id).eq("is_active", true).order("sort_order"),
      supabase.from("neighborhoods").select("*").eq("store_id", menuData.store_id).eq("is_active", true).order("name"),
      supabase.from("menu_banners").select("*").eq("menu_id", menuData.id).eq("is_active", true).order("sort_order"),
    ]);

    setMenuBanners(bannerData || []);

    // If menu has products linked via menu_products, use that order; otherwise fallback to all products
    let orderedProducts: Product[] = [];
    if (menuProds && menuProds.length > 0) {
      const productMap = new Map((allProds || []).map((p) => [p.id, p]));
      orderedProducts = menuProds
        .map((mp) => productMap.get(mp.product_id))
        .filter((p): p is Product => !!p);
    } else {
      orderedProducts = (allProds || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    setProducts(orderedProducts);
    setCategories(cats || []);
    setNeighborhoods(hoods || []);
    setLoading(false);
  };

  const addToCart = (product: Product, qty = 1, additionals?: { name: string; price: number; quantity: number }[]) => {
    setCart((prev) => {
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
      id: s.additional.id,
      name: s.additional.name,
      price: Number(s.additional.price) || 0,
      quantity: s.quantity,
    }));
    addToCart(product, quantity, adds);
    setSelectedProduct(null);
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart((prev) => prev.map((item, i) => {
      if (i !== index) return item;
      const newQty = item.quantity + delta;
      return newQty <= 0 ? null : { ...item, quantity: newQty };
    }).filter(Boolean) as CartItem[]);
  };

  const removeCartItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((s, i) => {
    const addTotal = (i.additionals || []).reduce((a, ad) => a + ad.price * ad.quantity, 0);
    return s + (i.product.price + addTotal) * i.quantity;
  }, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const filteredProducts = products.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeCategory && p.category_id !== activeCategory) return false;
    return true;
  });

  const isPro = store?.plan_type === "pro";

  const handleCheckout = async (data: {
    customerName: string; customerPhone: string; orderType: string;
    customerAddress: string; neighborhoodId: string; paymentMethod: string; notes: string;
  }) => {
    if (!store) return;
    const selectedNeighborhood = neighborhoods.find((n) => n.id === data.neighborhoodId);
    const deliveryFee = data.orderType === "delivery" ? Number(selectedNeighborhood?.delivery_fee || 0) : 0;
    const orderTotal = cartTotal + deliveryFee;

    if (store.min_order && cartTotal < store.min_order) {
      toast.error(`Pedido mínimo: ${formatBRL(store.min_order)}`);
      return;
    }

    setSubmitting(true);

    if (isPro) {
      const orderId = crypto.randomUUID();

      const { error: orderError } = await supabase.from("orders").insert({
        id: orderId,
        store_id: store.id,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        order_type: data.orderType,
        customer_address: data.orderType === "delivery" ? data.customerAddress : null,
        neighborhood_id: data.orderType === "delivery" && data.neighborhoodId ? data.neighborhoodId : null,
        delivery_fee: deliveryFee,
        subtotal: cartTotal,
        total: orderTotal,
        payment_method: data.paymentMethod,
        notes: data.notes,
      });

      if (orderError) {
        console.error("Erro ao criar pedido", orderError);
        toast.error("Erro ao criar pedido");
        setSubmitting(false);
        return;
      }

      const { error: itemsError } = await supabase.from("order_items").insert(
        cart.map((item) => ({
          order_id: orderId,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          subtotal: item.product.price * item.quantity,
          additionals: item.additionals || [],
        }))
      );

      if (itemsError) {
        console.error("Pedido criado, mas falhou ao criar itens", itemsError);
        toast.error("Pedido criado, mas houve erro ao salvar itens");
        setSubmitting(false);
        return;
      }

      setLastOrderId(orderId);
      setLastTrackingCode(null);

      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      setShowConfirmation(true);
    } else {
      // Basic plan - WhatsApp flow
      const items = cart.map((i) => `• ${i.quantity}x ${i.product.name} - ${formatBRL(i.product.price * i.quantity)}`).join("\n");
      const msg = `🛒 *Novo Pedido*\n\n👤 ${data.customerName}\n📱 ${data.customerPhone}\n${data.orderType === "delivery" ? `📍 ${data.customerAddress}\n` : "🏪 Retirada\n"}\n${items}\n\n💰 Subtotal: ${formatBRL(cartTotal)}${deliveryFee > 0 ? `\n🚚 Entrega: ${formatBRL(deliveryFee)}` : ""}\n💵 *Total: ${formatBRL(orderTotal)}*\n💳 ${data.paymentMethod === "cash" ? "Dinheiro" : data.paymentMethod === "pix" ? "Pix" : "Cartão"}${data.notes ? `\n📝 ${data.notes}` : ""}`;

      const phone = (store.whatsapp || "").replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
      toast.success("Pedido enviado via WhatsApp! ✅");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Carregando cardápio...</p>
        </div>
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
    <div className="min-h-screen bg-background pb-24" style={{ paddingBottom: "env(safe-area-inset-bottom, 24px)" }}>
      {/* Header banner - multiple banners with carousel support */}
      {(() => {
        const isCarousel = (menu as any)?.banner_mode === "carousel";
        const allBanners: BannerItem[] = menuBanners.length > 0
          ? menuBanners.map((b: any) => ({ image_url: b.image_url, link_url: b.link_url }))
          : (menu?.banner_url || store?.banner_url)
            ? [{ image_url: menu?.banner_url || store?.banner_url }]
            : [];

        if (allBanners.length === 0) return null;

        if (allBanners.length === 1 || !isCarousel) {
          const banner = allBanners[0];
          const img = (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={banner.image_url}
              alt=""
              className={`h-48 w-full object-cover ${banner.link_url ? "cursor-pointer" : ""}`}
              onClick={() => {
                if (banner.link_url) {
                  if (banner.link_url.startsWith("http")) window.open(banner.link_url, "_blank", "noopener");
                  else window.location.href = banner.link_url;
                }
              }}
            />
          );
          return img;
        }

        return <BannerCarousel banners={allBanners} themeColor={themeColor} />;
      })()}

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
              {isPro && (
                <Badge className="bg-white/20 text-white text-[10px] px-2 py-0.5 border-0">✦ PRO</Badge>
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
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 rounded-xl p-3 text-center text-sm font-medium"
          style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
        >
          {store.promo_banner}
        </motion.div>
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
        <Input placeholder="Buscar produto..." className="pl-10 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {(menu?.show_all_category !== false) && (
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${!activeCategory ? "text-white shadow-md" : "bg-muted text-muted-foreground"}`}
              style={!activeCategory ? { backgroundColor: themeColor } : {}}
            >
              Todos
            </button>
          )}
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${activeCategory === cat.id ? "text-white shadow-md" : "bg-muted text-muted-foreground"}`}
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
              {featuredProducts.map((product, i) => (
                <motion.button
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedProduct(product)}
                  className="shrink-0 w-[140px] text-left"
                >
                  <div className="relative overflow-hidden rounded-xl">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-[140px] w-[140px] object-cover" />
                    ) : (
                      <div className="flex h-[140px] w-[140px] items-center justify-center bg-muted text-4xl rounded-xl">📦</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-sm font-bold text-white">{formatBRL(product.price)}</span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-sm font-medium line-clamp-1">{product.name}</p>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Cardápio */}
      <div className="mt-6 px-4">
        <h2 className="text-lg font-bold mb-3">Cardápio</h2>
        <div className="space-y-3">
          {filteredProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedProduct(product)}
              className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.98]"
            >
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-md active:scale-90 transition-transform"
                style={{ backgroundColor: themeColor }}
              >
                <Plus className="h-5 w-5" />
              </button>
            </motion.div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">Nenhum produto encontrado.</div>
          )}
        </div>
      </div>

      {/* Floating cart button */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent"
            style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}
          >
            <Button
              onClick={() => setCartOpen(true)}
              className="w-full h-14 text-base font-bold shadow-xl rounded-xl transition-transform active:scale-[0.98]"
              style={{ backgroundColor: themeColor }}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ver carrinho • {cartCount} {cartCount === 1 ? "item" : "itens"} • {formatBRL(cartTotal)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQty={updateCartQty}
        onRemove={removeCartItem}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        themeColor={themeColor}
        formatBRL={formatBRL}
      />

      {/* Checkout Screen */}
      <CheckoutScreen
        open={checkoutOpen}
        onBack={() => { setCheckoutOpen(false); setCartOpen(true); }}
        cart={cart}
        store={store}
        neighborhoods={neighborhoods}
        onSubmit={handleCheckout}
        submitting={submitting}
        themeColor={themeColor}
        formatBRL={formatBRL}
      />

      {/* Order Confirmation Animation (Pro only) */}
      <OrderConfirmationAnimation
        show={showConfirmation}
        onComplete={() => {
          setShowConfirmation(false);
          setTrackingOpen(true);
        }}
        themeColor={themeColor}
      />

      {/* Order Tracking (Pro only) */}
      <OrderTrackingScreen
        open={trackingOpen}
        orderId={lastOrderId}
        trackingCode={lastTrackingCode}
        storeId={store?.id || null}
        onClose={() => setTrackingOpen(false)}
        themeColor={themeColor}
      />

      <ProductDetailModal
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={handleProductAdd}
        themeColor={themeColor}
      />

      {/* PWA Install Prompt - Pro only */}
      <PWAInstallPrompt
        isPro={isPro}
        themeColor={themeColor}
        storeName={store?.name || ""}
        slug={slug || ""}
        logoUrl={menu?.logo_url || store?.logo_url}
      />
    </div>
  );
}
