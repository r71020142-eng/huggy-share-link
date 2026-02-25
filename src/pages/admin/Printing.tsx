import { useStore } from "@/hooks/useStore";
import { useWebPrinter } from "@/hooks/useWebPrinter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

export default function Printing() {
  const { store } = useStore();
  const {
    printer,
    autoPrint,
    setAutoPrint,
    printing,
    isSupported,
    pairPrinter,
    disconnectPrinter,
    testPrint,
  } = useWebPrinter(store?.id);

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Impressão</h1>
        <p className="text-muted-foreground">Conecte sua impressora térmica USB diretamente pelo navegador.</p>
      </div>

      {/* Compatibilidade */}
      {!isSupported && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Navegador incompatível</p>
                <p className="text-sm text-muted-foreground">
                  A impressão USB requer <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> no desktop. Abra este painel no Chrome para continuar.
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
            Impressora USB
          </CardTitle>
          <CardDescription>Conecte sua impressora térmica 58mm via USB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {printer ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {printer.connected ? (
                  <Badge className="bg-green-500/20 text-green-700 border-green-500/30 gap-1">
                    <Wifi className="h-3 w-3" /> Conectada
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-700 border-red-500/30 gap-1">
                    <WifiOff className="h-3 w-3" /> Desconectada
                  </Badge>
                )}
                <span className="text-sm font-medium">{printer.name}</span>
              </div>

              <div className="text-xs text-muted-foreground">
                Vendor: 0x{printer.vendorId.toString(16).padStart(4, "0")} | Product: 0x{printer.productId.toString(16).padStart(4, "0")}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={testPrint}
                  disabled={!printer.connected || printing}
                  className="gap-2"
                >
                  {printing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
                  Testar Impressão
                </Button>
                <Button
                  variant="destructive"
                  onClick={disconnectPrinter}
                  className="gap-2"
                >
                  <Unplug className="h-4 w-4" />
                  Desconectar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Nenhuma impressora conectada.</p>
              <Button onClick={pairPrinter} disabled={!isSupported} className="gap-2">
                <Usb className="h-4 w-4" />
                Conectar Impressora USB
              </Button>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>📌 Certifique-se de que a impressora está ligada e conectada via USB.</p>
                <p>📌 Use Google Chrome ou Microsoft Edge.</p>
                <p>📌 O navegador pedirá permissão para acessar o dispositivo USB.</p>
              </div>
            </div>
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
          <CardDescription>Quando ativada, novos pedidos são impressos automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Imprimir ao receber pedido</Label>
              <p className="text-xs text-muted-foreground">A comanda será impressa assim que chegar um novo pedido.</p>
            </div>
            <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
          </div>

          <Separator />

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
            <p>
              <strong>Importante:</strong> Mantenha esta aba do navegador aberta para que a impressão automática funcione. Se fechar a aba, os pedidos não serão impressos.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Conecte a impressora térmica 58mm ao computador via cabo USB</li>
            <li>Clique em <strong>"Conectar Impressora USB"</strong> acima</li>
            <li>Selecione a impressora na janela que aparecer</li>
            <li>Faça uma <strong>impressão de teste</strong> para verificar</li>
            <li>Ative a <strong>impressão automática</strong></li>
            <li>Mantenha esta aba aberta — novos pedidos serão impressos automaticamente! 🖨️</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
