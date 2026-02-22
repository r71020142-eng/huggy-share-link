import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Neighborhood = Database["public"]["Tables"]["neighborhoods"]["Row"];

export default function Neighborhoods() {
  const { store } = useStore();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");

  useEffect(() => {
    if (store) fetchNeighborhoods();
  }, [store]);

  const fetchNeighborhoods = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("neighborhoods")
      .select("*")
      .eq("store_id", store.id)
      .order("name");
    setNeighborhoods(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setFee("");
    setDialogOpen(true);
  };

  const openEdit = (n: Neighborhood) => {
    setEditing(n);
    setName(n.name);
    setFee(String(n.delivery_fee || "0"));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!store || !name.trim()) return;
    const payload = { name, delivery_fee: parseFloat(fee) || 0, store_id: store.id };

    if (editing) {
      const { error } = await supabase.from("neighborhoods").update(payload).eq("id", editing.id);
      if (error) toast.error("Erro ao atualizar");
      else toast.success("Bairro atualizado!");
    } else {
      const { error } = await supabase.from("neighborhoods").insert(payload);
      if (error) toast.error("Erro ao criar");
      else toast.success("Bairro adicionado!");
    }
    setDialogOpen(false);
    fetchNeighborhoods();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este bairro?")) return;
    await supabase.from("neighborhoods").delete().eq("id", id);
    toast.success("Bairro excluído");
    fetchNeighborhoods();
  };

  const toggleActive = async (n: Neighborhood) => {
    await supabase.from("neighborhoods").update({ is_active: !n.is_active }).eq("id", n.id);
    fetchNeighborhoods();
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bairros & Taxas</h2>
          <p className="text-sm text-muted-foreground">{neighborhoods.length} bairros cadastrados</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo bairro
        </Button>
      </div>

      <div className="space-y-2">
        {neighborhoods.map((n) => (
          <div key={n.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{n.name}</span>
              <span className="text-sm text-primary font-semibold">{formatBRL(Number(n.delivery_fee))}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="cursor-pointer" variant={n.is_active ? "default" : "secondary"} onClick={() => toggleActive(n)}>
                {n.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <Button size="icon" variant="ghost" onClick={() => openEdit(n)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(n.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!loading && neighborhoods.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">Nenhum bairro cadastrado.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Bairro" : "Novo Bairro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do bairro</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Centro" />
            </div>
            <div className="space-y-2">
              <Label>Taxa de entrega (R$)</Label>
              <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} placeholder="5.00" />
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
