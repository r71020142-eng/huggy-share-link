import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Star, ChevronDown } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function Products() {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (store) {
      fetchProducts();
      fetchCategories();
    }
  }, [store]);

  const fetchProducts = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", store.id)
      .order("sort_order");
    setProducts(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", store.id)
      .order("sort_order");
    setCategories(data || []);
  };

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "—";

  const openCreate = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setCategoryId("");
    setImageUrl("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setPrice(String(p.price));
    setCategoryId(p.category_id || "");
    setImageUrl(p.image_url || "");
    setDescription(p.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!store || !name.trim() || !price) return;

    const payload = {
      name,
      price: parseFloat(price),
      category_id: categoryId || null,
      image_url: imageUrl || null,
      description: description || null,
      store_id: store.id,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) toast.error("Erro ao atualizar");
      else toast.success("Produto atualizado!");
    } else {
      const { error } = await supabase.from("products").insert({ ...payload, sort_order: products.length });
      if (error) toast.error("Erro ao criar");
      else toast.success("Produto criado!");
    }
    setDialogOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produto excluído");
    fetchProducts();
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos</h2>
          <p className="text-sm text-muted-foreground">{products.length} produtos (ilimitados)</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Novo produto
        </Button>
      </div>

      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div className="flex items-center gap-4">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-2xl">📦</div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{product.name}</span>
                  {product.is_featured && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {getCategoryName(product.category_id)} • {formatBRL(product.price)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={product.is_active ? "default" : "secondary"}>
                {product.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <Button size="sm" variant="ghost">
                <ChevronDown className="h-4 w-4 mr-1" /> Adicionais
              </Button>
              <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(product.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {!loading && products.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">Nenhum produto criado ainda.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Açaí Tradicional 500ml" />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19.90" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Imagem</Label>
              <ImageUpload
                value={imageUrl}
                onChange={(url) => setImageUrl(url || "")}
                folder={`products/${store?.id}`}
                className="max-w-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição opcional" />
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
