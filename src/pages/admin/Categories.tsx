import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function Categories() {
  const { store } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    if (store) fetchCategories();
  }, [store]);

  const fetchCategories = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", store.id)
      .order("sort_order");
    setCategories(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setIcon("");
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setIcon(cat.icon || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!store || !name.trim()) return;

    if (editing) {
      const { error } = await supabase.from("categories").update({ name, icon }).eq("id", editing.id);
      if (error) toast.error("Erro ao atualizar");
      else toast.success("Categoria atualizada!");
    } else {
      const { error } = await supabase.from("categories").insert({
        name,
        icon,
        store_id: store.id,
        sort_order: categories.length,
      });
      if (error) toast.error("Erro ao criar");
      else toast.success("Categoria criada!");
    }
    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Categoria excluída");
    fetchCategories();
  };

  const toggleActive = async (cat: Category) => {
    await supabase.from("categories").update({ is_active: !cat.is_active }).eq("id", cat.id);
    fetchCategories();
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categorias</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categorias (ilimitadas)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova categoria
        </Button>
      </div>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <span className="text-lg">{cat.icon || "📁"}</span>
              <span className="font-medium">{cat.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className="cursor-pointer"
                variant={cat.is_active ? "default" : "secondary"}
                onClick={() => toggleActive(cat)}
              >
                {cat.is_active ? "Ativa" : "Inativa"}
              </Badge>
              <Button size="icon" variant="ghost" onClick={() => openEdit(cat)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(cat.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!loading && categories.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">Nenhuma categoria criada ainda.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Açaí" />
            </div>
            <div className="space-y-2">
              <Label>Ícone (emoji ou texto)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🍨" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
