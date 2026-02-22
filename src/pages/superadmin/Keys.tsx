import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ActivationKey = Database["public"]["Tables"]["activation_keys"]["Row"];

export default function SuperAdminKeys() {
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState<"pro" | "basic">("pro");
  const [newMaxUses, setNewMaxUses] = useState("1");

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    const { data } = await supabase.from("activation_keys").select("*").order("created_at", { ascending: false });
    setKeys(data || []);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PRO-";
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewCode(code);
  };

  const handleCreate = async () => {
    if (!newCode.trim()) return;
    const { error } = await supabase.from("activation_keys").insert({
      code: newCode,
      plan_type: newPlan,
      max_uses: parseInt(newMaxUses) || 1,
    });
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Chave criada!"); setDialogOpen(false); fetchKeys(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta chave?")) return;
    await supabase.from("activation_keys").delete().eq("id", id);
    toast.success("Chave excluída");
    fetchKeys();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Chaves de Ativação</h2>
        <Button onClick={() => { generateCode(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova chave
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead className="text-center">Usos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead>Usada por</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((key) => (
            <TableRow key={key.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{key.code}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyCode(key.code)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell><Badge variant={key.plan_type === "pro" ? "default" : "secondary"}>{key.plan_type}</Badge></TableCell>
              <TableCell className="text-center">{key.current_uses}/{key.max_uses}</TableCell>
              <TableCell>
                <Badge variant={key.is_active ? "default" : "secondary"}>{key.is_active ? "Ativa" : "Inativa"}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(key.created_at).toLocaleDateString("pt-BR")}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{key.used_by_store_id ? "✓" : "—"}</TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(key.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Chave de Ativação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <div className="flex gap-2">
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} className="font-mono" />
                <Button variant="outline" onClick={generateCode}>Gerar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Select value={newPlan} onValueChange={(v: "pro" | "basic") => setNewPlan(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="basic">Básico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Máx. de usos</Label>
              <Input type="number" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar chave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
