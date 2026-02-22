import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Star, ChevronDown, ChevronUp, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type Additional = Database["public"]["Tables"]["product_additionals"]["Row"] & { category?: string };

export default function Products() {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New product inline
  const [showNewForm, setShowNewForm] = useState(false);

  // Additionals
  const [expandedAdditionals, setExpandedAdditionals] = useState<string | null>(null);
  const [additionals, setAdditionals] = useState<Additional[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addCategory, setAddCategory] = useState("");
  const [addPrice, setAddPrice] = useState("0");
  const [addMaxQty, setAddMaxQty] = useState("1");
  const [addIsRequired, setAddIsRequired] = useState(false);
  const [addIsActive, setAddIsActive] = useState(true);
  const [editingAdditionalId, setEditingAdditionalId] = useState<string | null>(null);

  // Copy additionals
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyTargetProductId, setCopyTargetProductId] = useState<string | null>(null);
  const [selectedSourceProductId, setSelectedSourceProductId] = useState<string>("");
  const [copySearchQuery, setCopySearchQuery] = useState("");

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

  const fetchAdditionals = async (productId: string) => {
    const { data } = await supabase
      .from("product_additionals")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order");
    setAdditionals((data as Additional[]) || []);
  };

  const getCategoryName = (id: string | null) => categories.find((c) => c.id === id)?.name || "—";
  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  // --- Product inline edit ---
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditDescription(p.description || "");
    setEditCategoryId(p.category_id || "");
    setEditImageUrl(p.image_url || "");
    setEditIsActive(p.is_active ?? true);
    setEditIsFeatured(p.is_featured ?? false);
  };

  const startNew = () => {
    setShowNewForm(true);
    setEditingId("__new__");
    setEditName("");
    setEditPrice("");
    setEditDescription("");
    setEditCategoryId("");
    setEditImageUrl("");
    setEditIsActive(true);
    setEditIsFeatured(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNewForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 5MB)");
      return;
    }
    const ext = file.name.split(".").pop();
    const fileName = `products/${store.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error("Erro ao enviar imagem");
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("store-assets").getPublicUrl(fileName);
    setEditImageUrl(publicUrl);
    toast.success("Imagem enviada!");
  };

  const handleSave = async () => {
    if (!store || !editName.trim() || !editPrice) return;
    const payload = {
      name: editName,
      price: parseFloat(editPrice),
      category_id: editCategoryId || null,
      image_url: editImageUrl || null,
      description: editDescription || null,
      is_active: editIsActive,
      is_featured: editIsFeatured,
      store_id: store.id,
    };

    if (editingId === "__new__") {
      const { error } = await supabase.from("products").insert({ ...payload, sort_order: products.length });
      if (error) toast.error("Erro ao criar");
      else toast.success("Produto criado!");
    } else if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) toast.error("Erro ao atualizar");
      else toast.success("Produto atualizado!");
    }
    cancelEdit();
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Produto excluído");
    fetchProducts();
  };

  // --- Additionals ---
  const toggleAdditionals = async (productId: string) => {
    if (expandedAdditionals === productId) {
      setExpandedAdditionals(null);
      setAdditionals([]);
    } else {
      setExpandedAdditionals(productId);
      await fetchAdditionals(productId);
      setShowAddForm(false);
      setEditingAdditionalId(null);
    }
  };

  const openAddAdditional = () => {
    setShowAddForm(true);
    setEditingAdditionalId(null);
    setAddName("");
    setAddCategory("");
    setAddPrice("0");
    setAddMaxQty("1");
    setAddIsRequired(false);
    setAddIsActive(true);
  };

  const openEditAdditional = (a: Additional) => {
    setShowAddForm(true);
    setEditingAdditionalId(a.id);
    setAddName(a.name);
    setAddCategory((a as any).category || "");
    setAddPrice(String(a.price ?? 0));
    setAddMaxQty(String(a.max_qty ?? 1));
    setAddIsRequired(a.is_required ?? false);
    setAddIsActive(a.is_active ?? true);
  };

  const handleSaveAdditional = async () => {
    if (!store || !expandedAdditionals || !addName.trim()) return;
    const payload = {
      name: addName,
      category: addCategory || "geral",
      price: parseFloat(addPrice) || 0,
      max_qty: parseInt(addMaxQty) || 1,
      is_required: addIsRequired,
      is_active: addIsActive,
      product_id: expandedAdditionals,
      store_id: store.id,
    };

    if (editingAdditionalId) {
      const { error } = await supabase.from("product_additionals").update(payload).eq("id", editingAdditionalId);
      if (error) toast.error("Erro: " + error.message);
      else toast.success("Adicional atualizado!");
    } else {
      const { error } = await supabase.from("product_additionals").insert({ ...payload, sort_order: additionals.length });
      if (error) toast.error("Erro: " + error.message);
      else toast.success("Adicional criado!");
    }
    setShowAddForm(false);
    setEditingAdditionalId(null);
    await fetchAdditionals(expandedAdditionals);
  };

  const handleDeleteAdditional = async (id: string) => {
    if (!confirm("Excluir este adicional?")) return;
    if (!expandedAdditionals) return;
    await supabase.from("product_additionals").delete().eq("id", id);
    toast.success("Adicional excluído");
    await fetchAdditionals(expandedAdditionals);
  };

  // --- Copy additionals ---
  const openCopyDialog = (targetProductId: string) => {
    setCopyTargetProductId(targetProductId);
    setSelectedSourceProductId("");
    setCopySearchQuery("");
    setShowCopyDialog(true);
  };

  const handleCopyAdditionals = async (mode: "replace" | "append") => {
    if (!store || !copyTargetProductId || !selectedSourceProductId) return;

    // Fetch source additionals
    const { data: sourceAdds } = await supabase
      .from("product_additionals")
      .select("*")
      .eq("product_id", selectedSourceProductId)
      .order("sort_order");

    if (!sourceAdds || sourceAdds.length === 0) {
      toast.error("O produto selecionado não tem adicionais.");
      return;
    }

    // If replace, delete current additionals
    if (mode === "replace") {
      await supabase.from("product_additionals").delete().eq("product_id", copyTargetProductId);
    }

    // Get current count for sort_order offset
    let sortOffset = 0;
    if (mode === "append") {
      const { data: existing } = await supabase
        .from("product_additionals")
        .select("id")
        .eq("product_id", copyTargetProductId);
      sortOffset = existing?.length || 0;
    }

    // Create new records (not referencing originals)
    const newAdds = sourceAdds.map((a, i) => ({
      name: a.name,
      category: a.category || "geral",
      price: a.price ?? 0,
      max_qty: a.max_qty ?? 1,
      min_qty: a.min_qty ?? 0,
      is_required: a.is_required ?? false,
      is_active: a.is_active ?? true,
      sort_order: sortOffset + i,
      product_id: copyTargetProductId,
      store_id: store.id,
    }));

    const { error } = await supabase.from("product_additionals").insert(newAdds);
    if (error) {
      toast.error("Erro ao copiar: " + error.message);
      return;
    }

    toast.success(`${sourceAdds.length} adicionais copiados com sucesso!`);
    setShowCopyDialog(false);
    setCopyTargetProductId(null);

    // Refresh if expanded
    if (expandedAdditionals === copyTargetProductId) {
      await fetchAdditionals(copyTargetProductId);
    }
  };

  const filteredCopyProducts = products.filter(
    (p) =>
      p.id !== copyTargetProductId &&
      (copySearchQuery === "" || p.name.toLowerCase().includes(copySearchQuery.toLowerCase()))
  );


  const groupedAdditionals = additionals.reduce<Record<string, Additional[]>>((acc, a) => {
    const cat = (a as any).category || "geral";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {});

  if (!store) return null;

  const renderEditForm = (isNew: boolean) => (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Nome</Label>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ex: Cheese Burguer Supremo" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Preço base (R$)</Label>
          <Input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} placeholder="21.99" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold uppercase text-muted-foreground">Descrição</Label>
        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="3 hambúrgueres, 3 queijos, bacon, salada e molho especial." rows={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Categoria</Label>
          <select
            value={editCategoryId}
            onChange={(e) => setEditCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Selecione</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Foto</Label>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Escolher arquivo
            </Button>
            <span className="text-sm text-muted-foreground">
              {editImageUrl ? "Imagem selecionada" : "Nenhum arquivo escolhido"}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          {editImageUrl && (
            <img src={editImageUrl} alt="Preview" className="mt-2 h-14 w-14 rounded-lg object-cover" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={editIsActive} onCheckedChange={(v) => setEditIsActive(!!v)} />
          Ativo
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={editIsFeatured} onCheckedChange={(v) => setEditIsFeatured(!!v)} />
          Destaque
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={cancelEdit}>Cancelar</Button>
        <Button onClick={handleSave}>
          <Check className="mr-1 h-4 w-4" /> Salvar
        </Button>
      </div>
    </div>
  );

  const renderAdditionals = (product: Product) => {
    if (expandedAdditionals !== product.id) return null;

    return (
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Adicionais</h3>
            <p className="text-sm text-muted-foreground">{product.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openCopyDialog(product.id)}>
              <Copy className="mr-1 h-4 w-4" /> Copiar de outro
            </Button>
            <Button variant="outline" size="sm" onClick={openAddAdditional}>
              <Plus className="mr-1 h-4 w-4" /> Adicionar
            </Button>
          </div>
        </div>

        {showAddForm && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Nome</Label>
                <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Leite em pó" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Categoria</Label>
                <Input value={addCategory} onChange={(e) => setAddCategory(e.target.value)} placeholder="complementos" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Preço (0 = grátis)</Label>
                <Input type="number" step="0.01" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Qtd máxima</Label>
                <Input type="number" value={addMaxQty} onChange={(e) => setAddMaxQty(e.target.value)} placeholder="1" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={addIsRequired} onCheckedChange={(v) => setAddIsRequired(!!v)} />
                Obrigatório
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={addIsActive} onCheckedChange={(v) => setAddIsActive(!!v)} />
                Ativo
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowAddForm(false); setEditingAdditionalId(null); }}>Cancelar</Button>
              <Button onClick={handleSaveAdditional}>
                <Check className="mr-1 h-4 w-4" /> Salvar
              </Button>
            </div>
          </div>
        )}

        {Object.entries(groupedAdditionals).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground">{cat}</h4>
            {items.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.name}</span>
                  {(a.price ?? 0) === 0 ? (
                    <span className="text-sm text-green-600 font-medium">Grátis</span>
                  ) : (
                    <span className="text-sm text-orange-600 font-medium">+R$ {(a.price ?? 0).toFixed(2).replace(".", ",")}</span>
                  )}
                  <span className="text-sm text-muted-foreground">· máx {a.max_qty ?? 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEditAdditional(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteAdditional(a.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {additionals.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum adicional cadastrado.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos</h2>
          <p className="text-sm text-muted-foreground">{products.length} produtos (ilimitados)</p>
        </div>
        <Button onClick={startNew}>
          <Plus className="mr-2 h-4 w-4" /> Novo produto
        </Button>
      </div>

      {showNewForm && editingId === "__new__" && renderEditForm(true)}

      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="space-y-2">
            {editingId === product.id ? (
              renderEditForm(false)
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
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
                      {getCategoryName(product.category_id)} • <span className="text-primary font-medium">{formatBRL(product.price)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                    {product.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  <button
                    onClick={() => toggleAdditionals(product.id)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                  >
                    {expandedAdditionals === product.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    Adicionais
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {renderAdditionals(product)}
          </div>
        ))}
        {!loading && products.length === 0 && !showNewForm && (
          <div className="py-12 text-center text-muted-foreground">Nenhum produto criado ainda.</div>
        )}
      </div>

      {/* Copy Additionals Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copiar adicionais de outro produto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Buscar produto..."
              value={copySearchQuery}
              onChange={(e) => setCopySearchQuery(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredCopyProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedSourceProductId(p.id)}
                  className={`flex items-center gap-3 w-full rounded-lg border p-3 text-left transition-colors ${
                    selectedSourceProductId === p.id
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm">📦</div>
                  )}
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{getCategoryName(p.category_id)}</p>
                  </div>
                </button>
              ))}
              {filteredCopyProducts.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhum produto encontrado.</p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {additionals.length > 0 && selectedSourceProductId ? (
              <>
                <Button variant="outline" onClick={() => handleCopyAdditionals("append")} disabled={!selectedSourceProductId}>
                  Adicionar aos existentes
                </Button>
                <Button variant="destructive" onClick={() => handleCopyAdditionals("replace")} disabled={!selectedSourceProductId}>
                  Substituir existentes
                </Button>
              </>
            ) : (
              <Button onClick={() => handleCopyAdditionals("replace")} disabled={!selectedSourceProductId}>
                Copiar adicionais
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
