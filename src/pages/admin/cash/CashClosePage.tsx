import { useState } from "react";
import { useCashSession, CashMovement } from "@/hooks/useCashSession";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function CashClosePage() {
  const { store } = useStore();
  const { activeSession, loading, closeSession, getSessionSummary, getSessionMovements } = useCashSession();

  const [preparing, setPreparing] = useState(false);
  const [summary, setSummary] = useState<{
    byMethod: Record<string, { count: number; total: number }>;
    grandTotal: number;
    totalSangrias: number;
    totalSuprimentos: number;
  } | null>(null);
  const [finalAmount, setFinalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [closing, setClosing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const prepareClose = async () => {
    if (!activeSession) return;
    setPreparing(true);
    const [sum, mvs] = await Promise.all([
      getSessionSummary(activeSession.id),
      getSessionMovements(activeSession.id),
    ]);
    const totalSangrias = mvs.filter((m: CashMovement) => m.type === "sangria").reduce((s: number, m: CashMovement) => s + Number(m.amount), 0);
    const totalSuprimentos = mvs.filter((m: CashMovement) => m.type === "suprimento").reduce((s: number, m: CashMovement) => s + Number(m.amount), 0);
    setSummary({ ...sum, totalSangrias, totalSuprimentos });
    setPreparing(false);
  };

  const expectedCash = summary
    ? Number(activeSession?.initial_cash_amount || 0)
      + (summary.byMethod["cash"]?.total || 0)
      + summary.totalSuprimentos
      - summary.totalSangrias
    : 0;
  const finalAmountNum = parseFloat(finalAmount) || 0;
  const difference = Math.round((finalAmountNum - expectedCash) * 100) / 100;

  const handleClose = async () => {
    setClosing(true);
    try {
      await closeSession(finalAmountNum, notes);
      toast.success("Caixa fechado com sucesso!");
      setSummary(null);
      setFinalAmount("");
      setNotes("");
      setConfirmOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fechar caixa");
    } finally {
      setClosing(false);
    }
  };

  if (!store) return null;
  if (loading) return <Skeleton className="h-40" />;

  if (!activeSession) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center space-y-4">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="font-bold text-xl">Nenhum caixa aberto</p>
          <p className="text-sm text-muted-foreground">Não há caixa aberto para fechar</p>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Lock className="h-6 w-6" /> Fechamento de Caixa</h2>
          <p className="text-sm text-muted-foreground">Realize a conferência e feche o turno atual</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-muted-foreground">Clique abaixo para preparar o resumo do turno e iniciar o fechamento.</p>
            <Button size="lg" variant="destructive" onClick={prepareClose} disabled={preparing}>
              {preparing ? "Carregando resumo..." : "Iniciar Fechamento"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Lock className="h-6 w-6" /> Fechamento de Caixa</h2>
        <p className="text-sm text-muted-foreground">Confira os valores e informe o total contado</p>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="font-bold">Resumo do Turno</p>
          <div className="space-y-1">
            {Object.entries(summary.byMethod).map(([method, data]) => (
              <div key={method} className="flex justify-between text-sm">
                <span>{method === "cash" ? "💵 Dinheiro" : method === "pix" ? "💎 Pix" : method === "credit" ? "💳 Crédito" : method === "debit" ? "💳 Débito" : method} ({data.count}x)</span>
                <span className="font-medium">{formatBRL(data.total)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t pt-1 text-sm">
              <span>Total Vendas</span>
              <span className="text-primary">{formatBRL(summary.grandTotal)}</span>
            </div>
          </div>

          {(summary.totalSangrias > 0 || summary.totalSuprimentos > 0) && (
            <div className="space-y-1 border-t pt-2">
              {summary.totalSuprimentos > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-400">↓ Suprimentos</span>
                  <span className="font-medium text-blue-700 dark:text-blue-400">+{formatBRL(summary.totalSuprimentos)}</span>
                </div>
              )}
              {summary.totalSangrias > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700 dark:text-orange-400">↑ Sangrias</span>
                  <span className="font-medium text-orange-700 dark:text-orange-400">-{formatBRL(summary.totalSangrias)}</span>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="flex justify-between text-sm"><span>Valor inicial</span><span>{formatBRL(Number(activeSession.initial_cash_amount))}</span></div>
            <div className="flex justify-between text-sm"><span>Vendas em dinheiro</span><span>{formatBRL(summary.byMethod["cash"]?.total || 0)}</span></div>
            {summary.totalSuprimentos > 0 && <div className="flex justify-between text-sm"><span>+ Suprimentos</span><span className="text-blue-600">+{formatBRL(summary.totalSuprimentos)}</span></div>}
            {summary.totalSangrias > 0 && <div className="flex justify-between text-sm"><span>- Sangrias</span><span className="text-orange-600">-{formatBRL(summary.totalSangrias)}</span></div>}
            <div className="flex justify-between font-bold text-sm border-t pt-1">
              <span>Dinheiro esperado no caixa</span>
              <span className="text-primary">{formatBRL(expectedCash)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Counting */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor contado em dinheiro (R$) *</label>
            <Input type="number" step="0.01" min="0" placeholder="0,00" value={finalAmount} onChange={e => setFinalAmount(e.target.value)} className="text-lg" />
          </div>

          {finalAmount && (
            <div className={`rounded-lg p-3 flex items-center gap-2 ${
              difference === 0 ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
              difference > 0 ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
              "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            }`}>
              {difference === 0 ? <CheckCircle className="h-5 w-5" /> :
               difference > 0 ? <TrendingUp className="h-5 w-5" /> :
               <TrendingDown className="h-5 w-5" />}
              <div>
                <p className="font-bold text-sm">
                  {difference === 0 ? "Caixa confere!" :
                   difference > 0 ? `Sobra de ${formatBRL(difference)}` :
                   `Falta de ${formatBRL(Math.abs(difference))}`}
                </p>
                <p className="text-xs">Esperado: {formatBRL(expectedCash)} · Contado: {formatBRL(finalAmountNum)}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações (opcional)</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anotações sobre o fechamento..." />
          </div>

          <Button className="w-full" variant="destructive" size="lg" onClick={() => setConfirmOpen(true)} disabled={!finalAmount}>
            <Lock className="h-4 w-4 mr-2" /> Fechar Caixa
          </Button>
        </CardContent>
      </Card>

      {/* Double confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Fechamento</DialogTitle>
            <DialogDescription>
              Você está prestes a fechar o caixa. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between"><span>Esperado</span><span className="font-bold">{formatBRL(expectedCash)}</span></div>
              <div className="flex justify-between"><span>Contado</span><span className="font-bold">{formatBRL(finalAmountNum)}</span></div>
              <div className={`flex justify-between font-bold border-t pt-1 ${difference === 0 ? "text-green-600" : difference > 0 ? "text-blue-600" : "text-red-600"}`}>
                <span>Diferença</span><span>{formatBRL(difference)}</span>
              </div>
            </div>
            <Button className="w-full" variant="destructive" onClick={handleClose} disabled={closing}>
              {closing ? "Fechando..." : "Sim, Fechar Caixa Agora"}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
