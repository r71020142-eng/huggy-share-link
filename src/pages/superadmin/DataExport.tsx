import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Database, Loader2, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TableName = Parameters<typeof supabase.from>[0];

interface ExportableTable {
  /** Nome real da tabela no banco */
  name: TableName;
  /** Rótulo amigável exibido na interface */
  label: string;
  /** Grupo lógico para organização visual */
  group: string;
}

/**
 * Tabelas exportáveis. A leitura respeita as políticas RLS:
 * o SuperAdmin enxerga os dados globais, demais papéis apenas o que lhes é permitido.
 */
const EXPORTABLE_TABLES: ExportableTable[] = [
  { name: "stores", label: "Lojas", group: "Cadastro" },
  { name: "profiles", label: "Usuários (perfis)", group: "Cadastro" },
  { name: "user_roles", label: "Permissões / Roles", group: "Cadastro" },
  { name: "activation_keys", label: "Chaves de ativação", group: "Cadastro" },

  { name: "menus", label: "Cardápios", group: "Catálogo" },
  { name: "menu_products", label: "Produtos do cardápio", group: "Catálogo" },
  { name: "menu_banners", label: "Banners do cardápio", group: "Catálogo" },
  { name: "categories", label: "Categorias", group: "Catálogo" },
  { name: "products", label: "Produtos", group: "Catálogo" },
  { name: "product_additionals", label: "Adicionais", group: "Catálogo" },
  { name: "neighborhoods", label: "Bairros", group: "Catálogo" },

  { name: "orders", label: "Pedidos", group: "Operação" },
  { name: "order_items", label: "Itens dos pedidos", group: "Operação" },
  { name: "order_payments", label: "Pagamentos", group: "Operação" },
  { name: "customers", label: "Clientes (CRM)", group: "Operação" },
  { name: "cash_sessions", label: "Sessões de caixa", group: "Operação" },
  { name: "cash_movements", label: "Sangrias / Suprimentos", group: "Operação" },

  { name: "print_jobs", label: "Jobs de impressão", group: "Impressão" },
  { name: "print_logs", label: "Logs de impressão", group: "Impressão" },
  { name: "print_agents", label: "Agentes de impressão", group: "Impressão" },
  { name: "store_print_settings", label: "Configurações de impressão", group: "Impressão" },
  { name: "store_print_metrics_daily", label: "Métricas diárias de impressão", group: "Impressão" },
  { name: "store_runtime_status", label: "Status em tempo real", group: "Impressão" },

  { name: "store_whatsapp_integrations", label: "Integrações WhatsApp", group: "Integrações" },
  { name: "whatsapp_events", label: "Eventos WhatsApp", group: "Integrações" },
  { name: "activity_logs", label: "Logs de atividade", group: "Integrações" },
];

const PAGE_SIZE = 1000;

/** Converte um valor arbitrário em célula CSV segura (RFC 4180). */
function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(toCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => toCsvCell(row[h])).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  // BOM garante acentuação correta ao abrir no Excel
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Busca todas as linhas de uma tabela paginando para não estourar o limite do PostgREST. */
async function fetchAllRows(table: TableName): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  let from = 0;

  // Loop defensivo: encerra quando a página retorna menos que PAGE_SIZE
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(error.message);
    const page = (data ?? []) as Record<string, unknown>[];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export default function SuperAdminDataExport() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const groups = Array.from(new Set(EXPORTABLE_TABLES.map((t) => t.group)));
  const allSelected = selected.size === EXPORTABLE_TABLES.length;

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(EXPORTABLE_TABLES.map((t) => t.name as string)));
  };

  const exportTable = async (table: ExportableTable) => {
    setBusy(table.name as string);
    try {
      const rows = await fetchAllRows(table.name);
      if (rows.length === 0) {
        toast({ title: `${table.label}: nenhum registro`, description: "Tabela vazia ou sem permissão de leitura." });
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`${table.name}_${stamp}.csv`, rowsToCsv(rows));
      toast({ title: `${table.label} exportado`, description: `${rows.length} registros em CSV.` });
    } catch (err) {
      toast({
        title: "Falha na exportação",
        description: err instanceof Error ? err.message : "Erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const exportSelected = async () => {
    const targets = EXPORTABLE_TABLES.filter((t) => selected.has(t.name as string));
    if (targets.length === 0) {
      toast({ title: "Selecione ao menos uma tabela", variant: "destructive" });
      return;
    }
    setBusy("__all__");
    let ok = 0;
    for (const t of targets) {
      try {
        const rows = await fetchAllRows(t.name);
        if (rows.length > 0) {
          const stamp = new Date().toISOString().slice(0, 10);
          downloadCsv(`${t.name}_${stamp}.csv`, rowsToCsv(rows));
          ok++;
        }
      } catch {
        // Continua as demais exportações mesmo se uma falhar
      }
    }
    setBusy(null);
    toast({ title: "Exportação concluída", description: `${ok} de ${targets.length} tabelas geradas.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Exportar Dados</h2>
            <p className="text-sm text-muted-foreground">Baixe qualquer tabela do banco em CSV.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleAll}>
            {allSelected ? "Limpar seleção" : "Selecionar tudo"}
          </Button>
          <Button onClick={exportSelected} disabled={busy !== null}>
            {busy === "__all__" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Exportar selecionadas ({selected.size})
          </Button>
        </div>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex gap-3 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Secrets, código de Edge Functions e arquivos do Storage não são exportáveis por CSV — são recursos de
            infraestrutura, não tabelas. Os metadados de e-mail, jobs, logs e integrações estão listados abaixo.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{group}</CardTitle>
              <CardDescription>
                {EXPORTABLE_TABLES.filter((t) => t.group === group).length} tabelas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {EXPORTABLE_TABLES.filter((t) => t.group === group).map((table) => (
                <div
                  key={table.name as string}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.has(table.name as string)}
                    onCheckedChange={() => toggle(table.name as string)}
                    aria-label={`Selecionar ${table.label}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{table.label}</p>
                    <Badge variant="outline" className="mt-0.5 text-[10px] font-mono">
                      {table.name as string}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => exportTable(table)}
                    disabled={busy !== null}
                    aria-label={`Exportar ${table.label}`}
                  >
                    {busy === table.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
