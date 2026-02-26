import { useStore } from "@/hooks/useStore";
import { usePrintEngine } from "@/hooks/usePrintEngine";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Printer,
  Wifi,
  WifiOff,
  Usb,
  Unplug,
  TestTube,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  List,
  Clock,
  XCircle,
  RotateCcw,
} from "lucide-react";

export default function Printing() {
  const { store } = useStore();
  const {
    printerStatus,
    printerType,
    printerName,
    queue,
    pendingCount,
    lastPrintAt,
    consecutiveErrors,
    recentErrors,
    autoPrint,
    initialized,
    pairPrinter,
    disconnectPrinter,
    testPrint,
    setAutoPrint,
    retryFailed,
    usbSupported,
    serialSupported,
  } = usePrintEngine(store?.id);

  if (!store) return null;

  const isOnline = printerStatus === "online";
  const isReconnecting = printerStatus === "reconnecting";
  const failedJobs = queue.filter(j => j.status === "failed");
  const activeJobs = queue.filter(j => j.status === "pending" || j.status === "printing");

  const statusBadge = () => {
    if (isOnline) return (
      <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1">
        <Wifi className="h-3 w-3" /> Online
      </Badge>
    );
    if (isReconnecting) return (
      <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30 gap-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Reconectando
      </Badge>
    );
    return (
      <Badge variant="destructive" className="bg-red-500/20 text-red-700 border-red-500/30 gap-1">
        <WifiOff className="h-3 w-3" /> Offline
      </Badge>
    );
  };

  const typeBadge = () => {
    if (printerType === "webusb") return <Badge variant="outline" className="gap-1"><Usb className="h-3 w-3" /> WebUSB</Badge>;
    if (printerType === "webserial") return <Badge variant="outline" className="gap-1"><Usb className="h-3 w-3" /> WebSerial</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Print Engine</h1>
        <p className="text-muted-foreground">Sistema de impressão térmica profissional com fila persistente e reconexão automática.</p>
      </div>

      {/* Compatibilidade */}
      {!usbSupported && !serialSupported && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Navegador incompatível</p>
                <p className="text-sm text-muted-foreground">
                  Requer <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> desktop.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status da Impressora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Usb className="h-5 w-5" />
            Impressora
          </CardTitle>
          <CardDescription>Conecte sua impressora térmica 58mm via USB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {printerStatus !== "offline" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {statusBadge()}
                {typeBadge()}
                {printerName && <span className="text-sm font-medium">{printerName}</span>}
              </div>

              {lastPrintAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Última impressão: {new Date(lastPrintAt).toLocaleString("pt-BR")}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={testPrint} disabled={!isOnline} className="gap-2">
                  <TestTube className="h-4 w-4" /> Testar
                </Button>
                <Button variant="destructive" onClick={disconnectPrinter} className="gap-2">
                  <Unplug className="h-4 w-4" /> Desconectar
                </Button>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {!initialized ? "Inicializando..." : "Nenhuma impressora conectada. Escolha o método de conexão:"}
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => pairPrinter("usb")} disabled={!initialized || !usbSupported} className="gap-2">
                  <Usb className="h-4 w-4" />
                  Conectar via USB
                </Button>
                <Button variant="outline" onClick={() => pairPrinter("serial")} disabled={!initialized || !serialSupported} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Conectar via Serial
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📌 A impressora deve estar ligada e conectada via USB.</p>
                <p>📌 Use Chrome ou Edge. O navegador pedirá permissão.</p>
                <p>📌 Se USB não funcionar, tente <strong>Serial</strong>.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fila de Impressão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Fila de Impressão
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount} pendente(s)</Badge>
            )}
          </CardTitle>
          <CardDescription>Jobs de impressão com retry automático e persistência.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeJobs.length > 0 ? (
            <ScrollArea className="max-h-40">
              <div className="space-y-2">
                {activeJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                    <span className="font-mono text-xs">{job.orderId.substring(0, 8)}...</span>
                    <div className="flex items-center gap-2">
                      {job.status === "printing" && <Loader2 className="h-3 w-3 animate-spin" />}
                      <Badge variant="outline" className="text-xs">
                        {job.status === "printing" ? "Imprimindo" : "Na fila"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">#{job.attempts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">Fila vazia – novos pedidos entrarão automaticamente.</p>
          )}

          {failedJobs.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="h-4 w-4" />
                  {failedJobs.length} job(s) com falha
                </div>
                <Button variant="outline" size="sm" onClick={retryFailed} className="gap-1">
                  <RotateCcw className="h-3 w-3" /> Retentar
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Impressão Automática
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Imprimir ao receber pedido</Label>
              <p className="text-xs text-muted-foreground">Pedidos entram na fila automaticamente.</p>
            </div>
            <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
          </div>
          <Separator />
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <p>Mantenha esta aba aberta. O sistema reconecta automaticamente se a impressora desconectar.</p>
          </div>
        </CardContent>
      </Card>

      {/* Erros Recentes */}
      {recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Erros Recentes
              {consecutiveErrors > 0 && (
                <Badge variant="destructive">{consecutiveErrors} consecutivo(s)</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {recentErrors.map((err, i) => (
                  <p key={i} className="text-xs text-muted-foreground font-mono">{err}</p>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Como funciona */}
      <Card>
        <CardHeader>
          <CardTitle>Arquitetura</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Novo pedido → trigger cria <strong>print_job</strong> no backend</li>
            <li>Realtime notifica o navegador → job entra na <strong>fila local</strong> (IndexedDB)</li>
            <li>Queue Worker processa sequencialmente → gera ESC/POS → envia ao <strong>USB/Serial</strong></li>
            <li>Sucesso → marca no backend + anti-duplicação local</li>
            <li>Falha → retry com backoff exponencial (até 5 tentativas)</li>
            <li>Desconexão → reconexão automática com backoff</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
