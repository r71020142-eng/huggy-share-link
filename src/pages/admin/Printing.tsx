import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Printer,
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Copy,
  Trash2,
  Monitor,
  Clock,
  Shield,
  Settings,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PrintAgent {
  id: string;
  store_id: string;
  token_hash: string;
  machine_name: string | null;
  agent_version: string | null;
  last_seen_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface PrintSettings {
  id: string;
  store_id: string;
  auto_print: boolean;
  print_mode: string;
}

export default function Printing() {
  const { store } = useStore();
  const [agent, setAgent] = useState<PrintAgent | null>(null);
  const [settings, setSettings] = useState<PrintSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const fetchData = async () => {
    if (!store) return;
    setLoading(true);

    const [agentRes, settingsRes] = await Promise.all([
      supabase
        .from("print_agents")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("store_print_settings")
        .select("*")
        .eq("store_id", store.id)
        .maybeSingle(),
    ]);

    if (agentRes.data) setAgent(agentRes.data as PrintAgent);
    else setAgent(null);

    if (settingsRes.data) setSettings(settingsRes.data as PrintSettings);
    else setSettings(null);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [store?.id]);

  // Realtime subscription for agent status
  useEffect(() => {
    if (!store) return;
    const channel = supabase
      .channel(`print-agent-${store.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "print_agents",
          filter: `store_id=eq.${store.id}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [store?.id]);

  const isOnline = agent?.last_seen_at
    ? Date.now() - new Date(agent.last_seen_at).getTime() < 60000
    : false;

  const handleGenerateToken = async () => {
    if (!store) return;
    setGeneratingToken(true);
    try {
      const { data, error } = await supabase.functions.invoke("print-agent-token", {
        body: { store_id: store.id, action: "generate" },
      });
      if (error) throw error;
      setNewToken(data.token);
      toast.success("Token gerado com sucesso!");
      fetchData();
    } catch (e: any) {
      toast.error("Erro ao gerar token: " + e.message);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!agent) return;
    const { error } = await supabase
      .from("print_agents")
      .update({ is_active: false })
      .eq("id", agent.id);
    if (error) toast.error("Erro ao revogar");
    else {
      toast.success("Token revogado");
      setNewToken(null);
      fetchData();
    }
  };

  const handleCopyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      toast.success("Token copiado!");
    }
  };

  const handleCopyStoreId = () => {
    if (store) {
      navigator.clipboard.writeText(store.id);
      toast.success("Store ID copiado!");
    }
  };

  const handleSaveSettings = async (updates: Partial<PrintSettings>) => {
    if (!store) return;
    if (settings) {
      const { error } = await supabase
        .from("store_print_settings")
        .update(updates)
        .eq("id", settings.id);
      if (error) toast.error("Erro ao salvar");
      else {
        setSettings({ ...settings, ...updates });
        toast.success("Configurações salvas");
      }
    } else {
      const { data, error } = await supabase
        .from("store_print_settings")
        .insert({ store_id: store.id, ...updates })
        .select()
        .single();
      if (error) toast.error("Erro ao salvar");
      else {
        setSettings(data as PrintSettings);
        toast.success("Configurações salvas");
      }
    }
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impressão</h1>
        <p className="text-muted-foreground">Gerencie o Print Agent e configurações de impressão térmica.</p>
      </div>

      {/* SEÇÃO 1 — STATUS DO PRINT AGENT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Status do Print Agent
          </CardTitle>
          <CardDescription>Status de conexão do aplicativo de impressão.</CardDescription>
        </CardHeader>
        <CardContent>
          {agent && agent.is_active ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                    <Wifi className="h-3 w-3 mr-1" /> Online
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-700 border-red-500/30">
                    <WifiOff className="h-3 w-3 mr-1" /> Offline
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Máquina:</span>
                  <p className="font-medium">{agent.machine_name || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Versão:</span>
                  <p className="font-medium">{agent.agent_version || "—"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Última conexão:</span>
                  <p className="font-medium">
                    {agent.last_seen_at
                      ? format(new Date(agent.last_seen_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                      : "Nunca"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum agente conectado. Gere um token e instale o Print Agent.</p>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 2 — DOWNLOAD DO PRINT AGENT */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download do Print Agent
          </CardTitle>
          <CardDescription>Baixe e instale o aplicativo de impressão no computador da loja.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="gap-2" asChild>
            <a href="https://github.com/AcaiLab/print-agent/releases/latest/download/AcaiLab-Print-Agent-Setup.exe" target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
              Baixar Print Agent (Windows .exe)
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">Versão mais recente do instalador Windows. Requer Windows 10+.</p>

          <Separator />

          <div className="space-y-2 text-sm">
            <p className="font-medium">Instruções de instalação:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Baixe o instalador acima</li>
              <li>Instale no computador da loja</li>
              <li>Abra o aplicativo "Açaí Lab Print Agent"</li>
              <li>Informe o <strong>Store ID</strong> e o <strong>Token</strong> gerados abaixo</li>
              <li>Clique em "Conectar"</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 3 — TOKEN DE CONEXÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Token de Conexão
          </CardTitle>
          <CardDescription>Gere um token seguro para conectar o Print Agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Store ID:</Label>
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{store.id}</code>
            <Button variant="ghost" size="sm" onClick={handleCopyStoreId}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          {newToken && (
            <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg space-y-2">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ⚠️ Copie o token agora! Ele não será exibido novamente.
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-background px-3 py-1.5 rounded text-xs font-mono flex-1 break-all">{newToken}</code>
                <Button variant="outline" size="sm" onClick={handleCopyToken}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleGenerateToken} disabled={generatingToken} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${generatingToken ? "animate-spin" : ""}`} />
              {agent?.is_active ? "Regenerar Token" : "Gerar Token"}
            </Button>
            {agent?.is_active && (
              <Button variant="destructive" onClick={handleRevokeToken} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Revogar Token
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SEÇÃO 4 — CONFIGURAÇÃO PADRÃO DE IMPRESSÃO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração de Impressão
          </CardTitle>
          <CardDescription>Defina o comportamento padrão de impressão da loja.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Imprimir automaticamente</Label>
              <p className="text-xs text-muted-foreground">Imprimir comanda assim que o pedido chegar.</p>
            </div>
            <Switch
              checked={settings?.auto_print ?? false}
              onCheckedChange={(v) => handleSaveSettings({ auto_print: v })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Modo de impressão padrão</Label>
            <Select
              value={settings?.print_mode ?? "both"}
              onValueChange={(v) => handleSaveSettings({ print_mode: v })}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kitchen">Apenas Cozinha</SelectItem>
                <SelectItem value="counter">Apenas Balcão</SelectItem>
                <SelectItem value="both">Ambas</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Define para quais impressoras o pedido será enviado.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
