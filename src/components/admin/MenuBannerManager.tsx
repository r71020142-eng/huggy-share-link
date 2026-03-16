import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Plus, Image as ImageIcon } from "lucide-react";
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
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface Props {
  menuId: string;
  storeId: string;
  bannerMode: string;
  onBannerModeChange: (mode: string) => void;
}

function SortableBannerItem({
  banner,
  onRemove,
  onToggleActive,
}: {
  banner: MenuBanner;
  onRemove: (id: string) => void;
  onToggleActive: (id: string, current: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <img src={banner.image_url} alt="Banner" className="h-16 w-28 rounded-lg object-cover" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">Banner #{banner.sort_order + 1}</p>
        {banner.link_url && (
          <p className="text-xs text-muted-foreground truncate">{banner.link_url}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={banner.is_active}
          onCheckedChange={() => onToggleActive(banner.id, banner.is_active)}
        />
        <button onClick={() => onRemove(banner.id)} className="text-destructive hover:text-destructive/80 p-1">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function MenuBannerManager({ menuId, storeId, bannerMode, onBannerModeChange }: Props) {
  const [banners, setBanners] = useState<MenuBanner[]>([]);
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
    setBanners((data as MenuBanner[]) || []);
    setLoading(false);
  }, [menuId, storeId]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

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
                  onRemove={removeBanner}
                  onToggleActive={toggleActive}
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
