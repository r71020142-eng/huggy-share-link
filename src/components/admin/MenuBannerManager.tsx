import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Image as ImageIcon, Link2, Package, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MenuBanner {
  id: string;
  menu_id: string;
  store_id: string;
  image_url: string;
  link_url: string | null;
  link_product_id: string | null;
  link_category_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface SimpleProduct {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
}

interface SimpleCategory {
  id: string;
  name: string;
  icon: string | null;
}

interface Props {
  menuId: string;
  storeId: string;
  bannerMode: string;
  onBannerModeChange: (mode: string) => void;
}

function SortableBannerItem({
  banner,
  products,
  categories,
  onRemove,
  onToggleActive,
  onUpdateLink,
}: {
  banner: MenuBanner;
  products: SimpleProduct[];
  categories: SimpleCategory[];
  onRemove: (id: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
  onUpdateLink: (id: string, linkUrl: string | null, productId: string | null, categoryId: string | null) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  const [editing, setEditing] = useState(false);
  const [linkType, setLinkType] = useState<"none" | "url" | "product" | "category">(
    banner.link_product_id ? "product" : banner.link_category_id ? "category" : banner.link_url ? "url" : "none"
  );
  const [linkValue, setLinkValue] = useState(banner.link_url || "");
  const [selectedProductId, setSelectedProductId] = useState(banner.link_product_id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(banner.link_category_id || "");
  const [productSearch, setProductSearch] = useState("");

  const linkedProduct = products.find((p) => p.id === banner.link_product_id);
  const linkedCategory = categories.find((c) => c.id === banner.link_category_id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const filteredProducts = products.filter((p) =>
    productSearch === "" || p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSave = () => {
    if (linkType === "url") {
      onUpdateLink(banner.id, linkValue || null, null, null);
    } else if (linkType === "product") {
      onUpdateLink(banner.id, null, selectedProductId || null, null);
    } else if (linkType === "category") {
      onUpdateLink(banner.id, null, null, selectedCategoryId || null);
    } else {
      onUpdateLink(banner.id, null, null, null);
    }
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <img src={banner.image_url} alt="Banner" className="h-16 w-28 rounded-lg object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Banner #{banner.sort_order + 1}</p>
          {linkedProduct && !editing && (
            <p className="text-xs text-primary truncate flex items-center gap-1">
              <Package className="h-3 w-3 shrink-0" /> {linkedProduct.name}
            </p>
          )}
          {linkedCategory && !editing && (
            <p className="text-xs text-primary truncate flex items-center gap-1">
              <FolderOpen className="h-3 w-3 shrink-0" /> {linkedCategory.icon || "📁"} {linkedCategory.name}
            </p>
          )}
          {banner.link_url && !banner.link_product_id && !banner.link_category_id && !editing && (
            <p className="text-xs text-primary truncate flex items-center gap-1">
              <Link2 className="h-3 w-3 shrink-0" /> {banner.link_url}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditing(!editing)}
            className={`p-1.5 rounded-md transition-colors ${
              banner.link_url || banner.link_product_id || banner.link_category_id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
            title="Configurar link"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <Switch
            checked={banner.is_active}
            onCheckedChange={() => onToggleActive(banner.id, banner.is_active)}
          />
          <button onClick={() => onRemove(banner.id)} className="text-destructive hover:text-destructive/80 p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="pl-7 space-y-3">
          {/* Link type selector */}
          <div className="flex gap-2">
            {(["none", "url", "product", "category"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setLinkType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  linkType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {type === "none" ? "Sem link" : type === "url" ? "Link externo" : type === "product" ? "Produto" : "Categoria"}
              </button>
            ))}
          </div>

          {linkType === "url" && (
            <Input
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder="https://exemplo.com/promocao"
              className="h-8 text-xs"
            />
          )}

          {linkType === "product" && (
            <div className="space-y-2">
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="h-8 text-xs"
              />
              <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                      selectedProductId === p.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="h-7 w-7 rounded object-cover shrink-0" />
                    ) : (
                      <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-[10px] shrink-0">📦</div>
                    )}
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum produto encontrado</p>
                )}
              </div>
            </div>
          )}

          {linkType === "category" && (
            <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-1">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    selectedCategoryId === c.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted"
                  }`}
                >
                  <span className="text-sm shrink-0">{c.icon || "📁"}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma categoria encontrada</p>
              )}
            </div>
          )

          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSave}>
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
}

export function MenuBannerManager({ menuId, storeId, bannerMode, onBannerModeChange }: Props) {
  const [banners, setBanners] = useState<MenuBanner[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchBanners = useCallback(async () => {
    const { data } = await supabase
      .from("menu_banners")
      .select("*")
      .eq("menu_id", menuId)
      .eq("store_id", storeId)
      .order("sort_order");
    setBanners((data as unknown as MenuBanner[]) || []);
    setLoading(false);
  }, [menuId, storeId]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, image_url, price")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("name");
    setProducts((data as SimpleProduct[]) || []);
  }, [storeId]);

  useEffect(() => {
    fetchBanners();
    fetchProducts();
  }, [fetchBanners, fetchProducts]);

  const handleImageUpload = async (url: string | null) => {
    if (!url) return;
    setAdding(true);
    const { error } = await supabase.from("menu_banners").insert({
      menu_id: menuId,
      store_id: storeId,
      image_url: url,
      sort_order: banners.length,
    } as any);

    if (error) {
      toast.error("Erro ao adicionar banner");
    } else {
      toast.success("Banner adicionado!");
      fetchBanners();
    }
    setAdding(false);
  };

  const removeBanner = async (id: string) => {
    await supabase.from("menu_banners").delete().eq("id", id);
    toast.success("Banner removido");
    fetchBanners();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("menu_banners").update({ is_active: !current } as any).eq("id", id);
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, is_active: !current } : b)));
    toast.success(!current ? "Banner ativado" : "Banner desativado");
  };

  const updateLink = async (id: string, linkUrl: string | null, productId: string | null) => {
    await supabase.from("menu_banners").update({
      link_url: linkUrl,
      link_product_id: productId,
    } as any).eq("id", id);
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, link_url: linkUrl, link_product_id: productId } : b))
    );
    toast.success("Link atualizado");
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(banners, oldIndex, newIndex);
    setBanners(reordered);

    await Promise.all(
      reordered.map((b, i) =>
        supabase.from("menu_banners").update({ sort_order: i } as any).eq("id", b.id)
      )
    );
  }, [banners]);

  const toggleBannerMode = async () => {
    const newMode = bannerMode === "carousel" ? "single" : "carousel";
    onBannerModeChange(newMode);
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <span className="text-sm font-medium">Modo carrossel</span>
          <p className="text-xs text-muted-foreground">Alterna banners automaticamente</p>
        </div>
        <Switch checked={bannerMode === "carousel"} onCheckedChange={toggleBannerMode} />
      </div>

      {/* Active count */}
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {banners.filter((b) => b.is_active).length} banner(s) ativo(s)
        </span>
        {bannerMode === "carousel" && (
          <Badge variant="secondary" className="text-xs">Carrossel</Badge>
        )}
      </div>

      {/* Banner list */}
      {banners.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {banners.map((banner) => (
                <SortableBannerItem
                  key={banner.id}
                  banner={banner}
                  products={products}
                  onRemove={removeBanner}
                  onToggleActive={toggleActive}
                  onUpdateLink={updateLink}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add banner */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          ADICIONAR BANNER
        </h4>
        <ImageUpload
          value={null}
          onChange={handleImageUpload}
          folder={`${storeId}/banners`}
          aspectRatio="aspect-[3/1]"
        />
      </div>
    </div>
  );
}
