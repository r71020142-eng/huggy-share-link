import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Plus, X, Search, GripVertical, RefreshCw, ExternalLink, LayoutGrid } from "lucide-react";
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
import type { Database } from "@/integrations/supabase/types";

type Menu = Database["public"]["Tables"]["menus"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

interface MenuProduct {
  id: string;
  menu_id: string;
  product_id: string;
  sort_order: number;
  is_available: boolean;
  product?: Product;
}

// Sortable product item component
function SortableProductItem({
  mp,
  onRemove,
  formatBRL,
}: {
  mp: MenuProduct;
  onRemove: (id: string) => void;
  formatBRL: (v: number) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border bg-card p-3"
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        {mp.product?.image_url ? (
          <img src={mp.product.image_url} alt={mp.product?.name} className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-lg">📦</div>
        )}
        <div>
          <p className="font-medium">{mp.product?.name || "Produto"}</p>
          <p className="text-sm text-primary font-medium">
            {mp.product ? formatBRL(mp.product.price) : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="default" className="bg-green-600 text-white text-xs">Disponível</Badge>
        <button onClick={() => onRemove(mp.id)} className="text-destructive hover:text-destructive/80 p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function CardapioEditor() {
  const { menuId } = useParams();
  const navigate = useNavigate();
  const { store } = useStore();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"produtos" | "categorias">("produtos");

  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (store && menuId) {
      fetchMenu();
      fetchMenuProducts();
      fetchAllProducts();
      fetchCategories();
    }
  }, [store, menuId]);

  const fetchMenu = async () => {
    if (!store || !menuId) return;
    const { data } = await supabase.from("menus").select("*").eq("id", menuId).eq("store_id", store.id).single();
    if (data) setMenu(data);
    setLoading(false);
  };

  const fetchMenuProducts = async () => {
    if (!menuId) return;
    const { data } = await supabase
      .from("menu_products")
      .select("*")
      .eq("menu_id", menuId)
      .order("sort_order");

    if (data) {
      const productIds = data.map((mp) => mp.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase.from("products").select("*").in("id", productIds);
        const enriched = data.map((mp) => ({
          ...mp,
          product: products?.find((p) => p.id === mp.product_id),
        }));
        setMenuProducts(enriched as MenuProduct[]);
      } else {
        setMenuProducts([]);
      }
    }
  };

  const fetchAllProducts = async () => {
    if (!store) return;
    const { data } = await supabase.from("products").select("*").eq("store_id", store.id).eq("is_active", true).order("name");
    setAllProducts(data || []);
  };

  const fetchCategories = async () => {
    if (!store) return;
    const { data } = await supabase.from("categories").select("*").eq("store_id", store.id).order("sort_order");
    setCategories(data || []);
  };

  const addToMenu = async (productId: string) => {
    if (!menuId) return;
    const { error } = await supabase
      .from("menu_products")
      .insert({ menu_id: menuId, product_id: productId, sort_order: menuProducts.length });
    if (error) {
      if (error.code === "23505") toast.error("Produto já está no cardápio");
      else toast.error("Erro ao adicionar");
    } else {
      toast.success("Produto adicionado ao cardápio!");
      fetchMenuProducts();
    }
  };

  const removeFromMenu = async (id: string) => {
    await supabase.from("menu_products").delete().eq("id", id);
    toast.success("Produto removido do cardápio");
    fetchMenuProducts();
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = menuProducts.findIndex((mp) => mp.id === active.id);
    const newIndex = menuProducts.findIndex((mp) => mp.id === over.id);

    const reordered = arrayMove(menuProducts, oldIndex, newIndex);
    setMenuProducts(reordered);

    // Persist new order
    const updates = reordered.map((mp, index) =>
      supabase.from("menu_products").update({ sort_order: index }).eq("id", mp.id)
    );
    await Promise.all(updates);
  }, [menuProducts]);

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const menuProductIds = menuProducts.map((mp) => mp.product_id);
  const filteredAvailable = allProducts.filter(
    (p) => !menuProductIds.includes(p.id) &&
      (searchQuery === "" || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Cardápio não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/menus")}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -m-6">
      {/* LEFT: Editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/menus")} className="rounded-lg p-1 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{menu.name}</h2>
                <Badge variant={menu.is_published ? "default" : "secondary"} className={menu.is_published ? "bg-green-600 text-white" : ""}>
                  {menu.is_published ? "Publicado" : "Rascunho"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">/m/{menu.slug}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b bg-card">
          <div className="flex">
            <button
              onClick={() => setActiveTab("produtos")}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "produtos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Produtos ({menuProducts.length})
            </button>
            <button
              onClick={() => setActiveTab("categorias")}
              className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === "categorias" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Categorias ({categories.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {activeTab === "produtos" && (
            <div className="p-6 space-y-6">
              {menuProducts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    NO CARDÁPIO — ARRASTE PARA REORDENAR
                  </h3>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={menuProducts.map((mp) => mp.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {menuProducts.map((mp) => (
                          <SortableProductItem
                            key={mp.id}
                            mp={mp}
                            onRemove={removeFromMenu}
                            formatBRL={formatBRL}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ADICIONAR PRODUTOS
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
                </div>
                <div className="space-y-1">
                  {filteredAvailable.map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm">📦</div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{formatBRL(product.price)}</p>
                        </div>
                      </div>
                      <button onClick={() => addToMenu(product.id)} className="text-muted-foreground hover:text-primary p-1 transition-colors">
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                  {filteredAvailable.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {searchQuery ? "Nenhum produto encontrado." : "Todos os produtos já estão no cardápio."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "categorias" && (
            <div className="p-6 space-y-4">
              {categories.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  Nenhuma categoria criada ainda. Crie categorias na página de Categorias.
                </p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{cat.icon || "📂"}</span>
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {allProducts.filter((p) => p.category_id === cat.id).length} produtos
                          </p>
                        </div>
                      </div>
                      <Badge variant={cat.is_active ? "default" : "secondary"} className="text-xs">
                        {cat.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* RIGHT: Mobile Preview */}
      <div className="hidden w-[380px] flex-col border-l bg-muted/30 lg:flex">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <LayoutGrid className="h-4 w-4" />
            PREVIEW MOBILE
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchMenu} className="flex items-center gap-1 text-xs text-primary hover:underline">
              <RefreshCw className="h-3 w-3" /> Recarregar
            </button>
            <a href={`/m/${menu.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex flex-1 items-start justify-center overflow-hidden p-4">
          <div className="relative w-[280px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/20 bg-background shadow-xl">
            <div className="flex items-center justify-center bg-foreground/5 py-1.5">
              <div className="h-1 w-12 rounded-full bg-foreground/20" />
            </div>
            <iframe
              src={`/m/${menu.slug}`}
              className="h-[520px] w-full border-0"
              title="Preview"
              style={{ transform: "scale(0.85)", transformOrigin: "top left", width: "118%", height: "612px" }}
            />
          </div>
        </div>
        <div className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
          Preview atualiza automaticamente ao editar o cardápio
        </div>
      </div>
    </div>
  );
}
