import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Key, Store, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ActivationKey = Database["public"]["Tables"]["activation_keys"]["Row"];

export default function SuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [tab, setTab] = useState("keys");

  // Key creation
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newPlan, setNewPlan] = useState<"pro" | "basic">("pro");
  const [newMaxUses, setNewMaxUses] = useState("1");

  useEffect(() => {
    checkRole();
  }, [user]);

  const checkRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "superadmin")
      .maybeSingle();

    setIsSuperAdmin(!!data);
    if (data) {
      fetchKeys();
      fetchStores();
    }
    setLoading(false);
  };

  const fetchKeys = async () => {
    const { data } = await supabase.from("activation_keys").select("*").order("created_at", { ascending: false });
    setKeys(data || []);
  };

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
    setStores(data || []);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "PRO-";
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setNewCode(code);
  };

  const handleCreateKey = async () => {
    if (!newCode.trim()) return;
    const { error } = await supabase.from("activation_keys").insert({
      code: newCode,
      plan_type: newPlan,
      max_uses: parseInt(newMaxUses) || 1,
    });
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Chave criada!");
      setKeyDialogOpen(false);
      fetchKeys();
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Excluir esta chave?")) return;
    await supabase.from("activation_keys").delete().eq("id", id);
    toast.success("Chave excluída");
    fetchKeys();
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Verificando permissões...</div>;

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Shield className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Acesso negado</h2>
        <p className="text-muted-foreground">Você não tem permissão de SuperAdmin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">SuperAdmin</h2>
        <p className="text-sm text-muted-foreground">Gerencie chaves de ativação e lojas</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Key className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Chaves ativas</p>
              <p className="text-2xl font-bold">{keys.filter((k) => k.is_active).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Lojas</p>
              <p className="text-2xl font-bold">{stores.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Lojas Pro</p>
              <p className="text-2xl font-bold text-primary">{stores.filter((s) => s.plan_type === "pro").length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="keys"><Key className="mr-1 h-4 w-4" /> Chaves</TabsTrigger>
          <TabsTrigger value="stores"><Store className="mr-1 h-4 w-4" /> Lojas</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { generateCode(); setKeyDialogOpen(true); }}>
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-mono font-bold">{key.code}</TableCell>
                  <TableCell><Badge variant={key.plan_type === "pro" ? "default" : "secondary"}>{key.plan_type}</Badge></TableCell>
                  <TableCell className="text-center">{key.current_uses}/{key.max_uses}</TableCell>
                  <TableCell>
                    <Badge variant={key.is_active ? "default" : "secondary"}>
                      {key.is_active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(key.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteKey(key.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="stores">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">/{s.slug}</TableCell>
                  <TableCell><Badge variant={s.plan_type === "pro" ? "default" : "secondary"}>{s.plan_type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={s.is_open ? "default" : "secondary"}>
                      {s.is_open ? "Aberta" : "Fechada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Create key dialog */}
      <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Chave de Ativação</DialogTitle>
          </DialogHeader>
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
            <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateKey}>Criar chave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
