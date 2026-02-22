import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  roles: string[];
  store_name?: string;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string; email: string }>({ open: false, userId: "", email: "" });
  const [selectedRole, setSelectedRole] = useState<"admin" | "moderator" | "user" | "superadmin">("admin");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: stores }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("stores").select("owner_id, name"),
    ]);

    const roleMap: Record<string, string[]> = {};
    (roles || []).forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const storeMap: Record<string, string> = {};
    (stores || []).forEach((s) => { storeMap[s.owner_id] = s.name; });

    const merged = (profiles || []).map((p) => ({
      ...p,
      roles: roleMap[p.user_id] || [],
      store_name: storeMap[p.user_id],
    }));

    setUsers(merged);
    setLoading(false);
  };

  const addRole = async () => {
    const { error } = await supabase.from("user_roles").insert({
      user_id: roleDialog.userId,
      role: selectedRole,
    });
    if (error) {
      if (error.message.includes("duplicate")) toast.error("Usuário já possui essa role.");
      else toast.error("Erro: " + error.message);
    } else {
      toast.success(`Role "${selectedRole}" adicionada!`);
      await logActivity("role_added", "user", roleDialog.userId, { role: selectedRole, email: roleDialog.email });
      fetchUsers();
    }
    setRoleDialog({ open: false, userId: "", email: "" });
  };

  const removeRole = async (userId: string, role: string, email: string) => {
    if (role === "superadmin" && !confirm("Tem certeza que deseja remover a role superadmin?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`Role "${role}" removida.`);
      await logActivity("role_removed", "user", userId, { role, email });
      fetchUsers();
    }
  };

  const logActivity = async (action: string, entityType: string, entityId: string, details: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.email?.toLowerCase().includes(q) || u.display_name?.toLowerCase().includes(q);
  });

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin": return "destructive" as const;
      case "admin": return "default" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Usuários ({filtered.length})</h2>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por email ou nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                <TableCell className="text-sm">{u.store_name || "—"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma</span>}
                    {u.roles.map((r) => (
                      <Badge key={r} variant={roleBadgeVariant(r)} className="gap-1 text-xs">
                        {r}
                        <button onClick={() => removeRole(u.user_id, r, u.email || "")} className="ml-0.5 hover:text-destructive-foreground">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setRoleDialog({ open: true, userId: u.user_id, email: u.email || "" })}>
                    <Shield className="mr-1 h-3 w-3" /> Role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={roleDialog.open} onOpenChange={(o) => setRoleDialog((prev) => ({ ...prev, open: o }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Role</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Usuário: {roleDialog.email}</p>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="moderator">moderator</SelectItem>
                <SelectItem value="admin">admin</SelectItem>
                <SelectItem value="superadmin">superadmin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, userId: "", email: "" })}>Cancelar</Button>
            <Button onClick={addRole}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
