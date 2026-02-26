import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Printer, Wifi, WifiOff, AlertTriangle, Clock, Search,
  RefreshCcw, Activity, BarChart3, XCircle, CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RuntimeStatus {
  id: string;
  store_id: string;
  last_heartbeat: string | null;
  printer_status: string;
  printer_type: string | null;
  printer_name: string | null;
  queue_size: number;
  failed_jobs: number;
  last_print_at: string | null;
  total_prints: number;
  total_errors: number;
  updated_at: string;
  stores?: { name: string; slug: string } | null;
}

interface PrintLog {
  id: string;
  store_id: string;
  order_id: string | null;
  status: string;
  error_message: string | null;
  attempts: number;
  printed_at: string | null;
  created_at: string;
  stores?: { name: string } | null;
}

export default function PrintMonitoring() {
  const [runtimeStatuses, setRuntimeStatuses] = useState<RuntimeStatus[]>([]);
  const [printLogs, setPrintLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailStoreId, setDetailStoreId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, logsRes] = await Promise.all([
        supabase
          .from("store_runtime_status")
          .select("*, stores(name, slug)")
          .order("updated_at", { ascending: false }),
        supabase
          .from("print_logs")
          .select("*, stores(name)")
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (statusRes.data) setRuntimeStatuses(statusRes.data as any);
      if (logsRes.data) setPrintLogs(logsRes.data as any);
    } catch (e) {
      console.error("Failed to fetch monitoring data:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime updates
    const channel = supabase
      .channel("superadmin-monitoring")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_runtime_status" }, () => fetchData())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "print_logs" }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredLogs = printLogs.filter(log => {
    if (selectedStore !== "all" && log.store_id !== selectedStore) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (searchQuery && !log.order_id?.includes(searchQuery)) return false;
    return true;
  });

  const storesFromRuntime = runtimeStatuses.map(s => ({
    id: s.store_id,
    name: (s.stores as any)?.name || s.store_id.substring(0, 8),
  }));

  const offlineStores = runtimeStatuses.filter(s => {
    if (s.printer_status === "offline") return true;
    if (s.last_heartbeat) {
      const diff = Date.now() - new Date(s.last_heartbeat).getTime();
      return diff > 5 * 60 * 1000; // 5 min
    }
    return false;
  });

  const stuckQueues = runtimeStatuses.filter(s => s.queue_size > 5);
  const highErrorStores = runtimeStatuses.filter(s => s.total_errors > 0 && s.total_prints > 0 && (s.total_errors / s.total_prints) > 0.2);

  const totalPrints = runtimeStatuses.reduce((a, s) => a + s.total_prints, 0);
  const totalErrors = runtimeStatuses.reduce((a, s) => a + s.total_errors, 0);
  const onlineCount = runtimeStatuses.filter(s => s.printer_status === "online").length;

  const detailStore = detailStoreId ? runtimeStatuses.find(s => s.store_id === detailStoreId) : null;
  const detailLogs = detailStoreId ? printLogs.filter(l => l.store_id === detailStoreId) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Monitoramento de Impressão
          </h1>
          <p className="text-muted-foreground">Status em tempo real de todas as lojas</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{onlineCount}/{runtimeStatuses.length}</p>
                <p className="text-xs text-muted-foreground">Impressoras Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{totalPrints}</p>
                <p className="text-xs text-muted-foreground">Total Impressões</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{totalErrors}</p>
                <p className="text-xs text-muted-foreground">Total Erros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {totalPrints > 0 ? ((1 - totalErrors / totalPrints) * 100).toFixed(1) : "100"}%
                </p>
                <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(offlineStores.length > 0 || stuckQueues.length > 0 || highErrorStores.length > 0) && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas ({offlineStores.length + stuckQueues.length + highErrorStores.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {offlineStores.map(s => (
              <div key={`off-${s.store_id}`} className="flex items-center gap-2 text-sm">
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="font-medium">{(s.stores as any)?.name}</span>
                <span className="text-muted-foreground">— Offline há{" "}
                  {s.last_heartbeat
                    ? formatDistanceToNow(new Date(s.last_heartbeat), { locale: ptBR })
                    : "tempo indeterminado"}
                </span>
              </div>
            ))}
            {stuckQueues.map(s => (
              <div key={`stuck-${s.store_id}`} className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">{(s.stores as any)?.name}</span>
                <span className="text-muted-foreground">— Fila travada: {s.queue_size} jobs</span>
              </div>
            ))}
            {highErrorStores.map(s => (
              <div key={`err-${s.store_id}`} className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-orange-600" />
                <span className="font-medium">{(s.stores as any)?.name}</span>
                <span className="text-muted-foreground">— Alta taxa de erro: {((s.total_errors / s.total_prints) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de Lojas */}
      <Card>
        <CardHeader>
          <CardTitle>Status por Loja</CardTitle>
        </CardHeader>
        <CardContent>
          {runtimeStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma loja com dados de impressão ainda.</p>
          ) : (
            <div className="space-y-3">
              {runtimeStatuses.map(s => (
                <div
                  key={s.store_id}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setDetailStoreId(detailStoreId === s.store_id ? null : s.store_id)}
                >
                  <div className="flex items-center gap-3">
                    {s.printer_status === "online" ? (
                      <Wifi className="h-4 w-4 text-green-600" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{(s.stores as any)?.name || s.store_id.substring(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.printer_name || "Sem impressora"} • {s.printer_type || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-right">
                      <p>Fila: <span className={s.queue_size > 5 ? "text-destructive font-bold" : ""}>{s.queue_size}</span></p>
                      <p>Falhas: {s.failed_jobs}</p>
                    </div>
                    <div className="text-right">
                      <p>Prints: {s.total_prints}</p>
                      <p>Erros: {s.total_errors}</p>
                    </div>
                    {s.last_heartbeat && (
                      <div className="text-right">
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(s.last_heartbeat), { locale: ptBR, addSuffix: true })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhe da loja selecionada */}
      {detailStore && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detalhes: {(detailStore.stores as any)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={detailStore.printer_status === "online" ? "default" : "destructive"}>
                  {detailStore.printer_status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Impressora</p>
                <p className="font-medium">{detailStore.printer_name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Última impressão</p>
                <p className="font-medium">
                  {detailStore.last_print_at
                    ? new Date(detailStore.last_print_at).toLocaleString("pt-BR")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Taxa de sucesso</p>
                <p className="font-medium">
                  {detailStore.total_prints > 0
                    ? ((1 - detailStore.total_errors / detailStore.total_prints) * 100).toFixed(1) + "%"
                    : "—"}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="font-medium mb-2">Histórico de impressão</p>
              <ScrollArea className="max-h-64">
                <div className="space-y-1">
                  {detailLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum log encontrado.</p>
                  ) : (
                    detailLogs.map(log => (
                      <div key={log.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                        <div className="flex items-center gap-2">
                          {log.status === "success" ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span className="font-mono">{log.order_id?.substring(0, 8)}...</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>x{log.attempts}</span>
                          {log.error_message && (
                            <span className="text-destructive max-w-[200px] truncate">{log.error_message}</span>
                          )}
                          <span className="text-muted-foreground">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs Globais com Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Impressão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as lojas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as lojas</SelectItem>
                {storesFromRuntime.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID do pedido..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="max-h-96">
            <div className="space-y-1">
              {filteredLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum log encontrado.</p>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      {log.status === "success" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                      <span className="font-medium">{(log.stores as any)?.name || "—"}</span>
                      <span className="font-mono">{log.order_id?.substring(0, 8)}...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-[10px]">
                        {log.status}
                      </Badge>
                      <span>x{log.attempts}</span>
                      <span className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
