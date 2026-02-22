import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Eye, EyeOff, Copy, Pencil, Trash2, Link, Share2, Palette } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Menu = Database["public"]["Tables"]["menus"]["Row"];

export default function Menus() {
  const { store } = useStore();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  useEffect(() => {
    if (store) fetchMenus();
  }, [store]);

  const fetchMenus = async () => {
    if (!store) return;
    const { data } = await supabase.from("menus").select("*").eq("store_id", store.id).order("created_at");
    setMenus(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!store || !name.trim() || !slug.trim()) return;
    const { error } = await supabase.from("menus").insert({ name, slug, store_id: store.id });
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Cardápio criado!");
      setDialogOpen(false);
      fetchMenus();
    }
  };

  const togglePublish = async (menu: Menu) => {
    await supabase.from("menus").update({ is_published: !menu.is_published }).eq("id", menu.id);
    fetchMenus();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cardápio?")) return;
    await supabase.from("menus").delete().eq("id", id);
    toast.success("Cardápio excluído");
    fetchMenus();
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cardápios</h2>
          <p className="text-sm text-muted-foreground">{menus.length} cardápios (ilimitados)</p>
        </div>
        <Button onClick={() => { setName(""); setSlug(""); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo cardápio
        </Button>
      </div>

      <div className="space-y-4">
        {menus.map((menu) => (
          <div key={menu.id} className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{menu.name}</span>
                    {menu.is_primary && <Badge variant="secondary">Principal</Badge>}
                    <Badge variant={menu.is_published ? "default" : "secondary"}>
                      {menu.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">/m/{menu.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" title="Compartilhar"><Share2 className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" title="Link"><Link className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => togglePublish(menu)} title={menu.is_published ? "Despublicar" : "Publicar"}>
                  {menu.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost"><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                {!menu.is_primary && (
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(menu.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <button className="flex items-center gap-1 text-primary hover:underline">✏️ Produtos e categorias</button>
              <button className="flex items-center gap-1 text-primary hover:underline">🖼️ Logo e banner</button>
              <button className="flex items-center gap-1 text-primary hover:underline"><Palette className="h-3 w-3" /> Design e tema</button>
              <button className="flex items-center gap-1 text-primary hover:underline">🔗 Ver cardápio</button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cardápio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }} placeholder="Ex: Cardápio Principal" />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="cardapio-principal" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
