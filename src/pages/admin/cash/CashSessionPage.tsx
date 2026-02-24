import { useState, useEffect } from "react";
import { useCashSession } from "@/hooks/useCashSession";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Wallet, Lock, Unlock, Clock } from "lucide-react";

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function CashSessionPage() {
  const { store } = useStore();
  const { activeSession, loading, openSession, getSessionSummary, refresh } = useCashSession();

  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [initialAmount, setInitialAmount] = useState("");
  const [opening, setOpening] = useState(false);

  // Live summary
  const [summary, setSummary] = useState<{ byMethod: Record<string, { count: number; total: number }>; grandTotal: number } | null>(null);

  useEffect(() => {
    if (activeSession) {
      getSessionSummary(activeSession.id).then(setSummary);
    } else {
      setSummary(null);
    }
  }, [activeSession]);

  const handleOpen = async () => {
    setOpening(true);
    try {
      await openSession(parseFloat(initialAmount) || 0);
      toast.success("Caixa aberto com sucesso!");
      setOpenDialogVisible(false);
      setInitialAmount("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir caixa");
    } finally {
      setOpening(false);
    }
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-6 w-6" /> Sessão Atual
        </h2>
        <p className="text-sm text-muted-foreground">Status do caixa e resumo do turno</p>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : activeSession ? (
        <Card className="border-green-300 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold text-green-700 dark:text-green-400">Caixa Aberto</span>
              <Badge className="bg-green-600 text-white">ABERTO</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Aberto em</p>
                <p className="font-medium text-sm">{new Date(activeSession.opened_at).toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor inicial</p>
                <p className="font-bold text-primary">{formatBRL(Number(activeSession.initial_cash_amount))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duração</p>
                <p className="font-medium text-sm">{Math.round((Date.now() - new Date(activeSession.opened_at).getTime()) / 60000)} min</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operador</p>
                <p className="font-medium text-sm truncate">{activeSession.opened_by}</p>
              </div>
            </div>

            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">💵 Dinheiro</p>
                  <p className="font-bold">{formatBRL(summary.byMethod["cash"]?.total || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">💎 Pix</p>
                  <p className="font-bold">{formatBRL(summary.byMethod["pix"]?.total || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">💳 Cartão</p>
                  <p className="font-bold">{formatBRL((summary.byMethod["credit"]?.total || 0) + (summary.byMethod["debit"]?.total || 0))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Vendas</p>
                  <p className="font-bold text-primary">{formatBRL(summary.grandTotal)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="p-12 text-center space-y-4">
            <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <p className="font-bold text-xl">Nenhum caixa aberto</p>
              <p className="text-sm text-muted-foreground">Abra o caixa para começar a registrar pedidos manuais</p>
            </div>
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => setOpenDialogVisible(true)}>
              <Unlock className="h-5 w-5 mr-2" /> Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={openDialogVisible} onOpenChange={setOpenDialogVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" /> Abrir Caixa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor inicial em dinheiro (R$)</label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground">Informe o valor que está no caixa ao iniciar o turno</p>
            </div>
            <Button className="w-full" onClick={handleOpen} disabled={opening}>
              {opening ? "Abrindo..." : "Confirmar Abertura"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
