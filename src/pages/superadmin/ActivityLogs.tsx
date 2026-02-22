import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Activity } from "lucide-react";

interface LogEntry {
  id: string;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  role_added: { label: "Role adicionada", variant: "default" },
  role_removed: { label: "Role removida", variant: "destructive" },
  store_created: { label: "Loja criada", variant: "default" },
  store_deleted: { label: "Loja excluída", variant: "destructive" },
  key_created: { label: "Chave criada", variant: "default" },
  key_deleted: { label: "Chave excluída", variant: "destructive" },
  login: { label: "Login", variant: "secondary" },
};

export default function SuperAdminActivityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs((data as LogEntry[]) || []);
    setLoading(false);
  };

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      l.user_email?.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entity_type?.toLowerCase().includes(q)
    );
  });

  const getActionInfo = (action: string) => actionLabels[action] || { label: action, variant: "outline" as const };

  const formatDetails = (details: any) => {
    if (!details) return "—";
    if (typeof details === "object") {
      return Object.entries(details)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return String(details);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Logs de Atividade</h2>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por email, ação..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Activity className="mb-2 h-10 w-10" />
          <p>Nenhum log encontrado.</p>
          <p className="text-sm">Os logs serão registrados conforme ações forem realizadas.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => {
              const info = getActionInfo(log.action);
              return (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm">{log.user_email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={info.variant}>{info.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.entity_type && (
                      <span>{log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {formatDetails(log.details)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
