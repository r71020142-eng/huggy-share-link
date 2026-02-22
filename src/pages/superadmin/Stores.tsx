import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SuperAdminStores() {
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
    setStores(data || []);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Lojas ({stores.length})</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Loja</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Criada em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stores.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">/{s.slug}</TableCell>
              <TableCell><Badge variant={s.plan_type === "pro" ? "default" : "secondary"}>{s.plan_type}</Badge></TableCell>
              <TableCell><Badge variant={s.is_open ? "default" : "secondary"}>{s.is_open ? "Aberta" : "Fechada"}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{s.whatsapp || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
