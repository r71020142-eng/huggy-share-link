import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useCashSession, CashSession } from "@/hooks/useCashSession";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Wallet, Lock, Unlock, Clock, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, History
} from "lucide-react";

const METHOD_LABELS: Record<string, string> = {
  pix: "💎 Pix", cash: "💵 Dinheiro", credit: "💳 Crédito", debit: "💳 Débito",
};

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function CashRegister() {
  const { store } = useStore();
  const { activeSession, loading, openSession, closeSession, getSessionSummary, refresh } = useCashSession();

  // Open dialog
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [initialAmount, setInitialAmount] = useState("");
  const [opening, setOpening] = useState(false);

  // Close dialog
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeSummary, setCloseSummary] = useState<{ byMethod: Record<string, { count: number; total: number }>; grandTotal: number } | null>(null);

  // History
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const prepareClose = async () => {
    if (!activeSession) return;
    const summary = await getSessionSummary(activeSession.id);
    setCloseSummary(summary);
    setCloseDialogVisible(true);
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await closeSession(parseFloat(finalAmount) || 0, closeNotes);
      toast.success("Caixa fechado com sucesso!");
      setCloseDialogVisible(false);
      setFinalAmount("");
      setCloseNotes("");
      setCloseSummary(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao fechar caixa");
    } finally {
      setClosing(false);
    }
  };

  const fetchHistory = async () => {
    if (!store) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("store_id", store.id)
      .order("opened_at", { ascending: false })
      .limit(30);
    setHistory((data as CashSession[]) || []);
    setHistoryLoading(false);
    setHistoryVisible(true);
  };

  // Calculate expected cash for close dialog
  const expectedCash = closeSummary
    ? Number(activeSession?.initial_cash_amount || 0) + (closeSummary.byMethod["cash"]?.total || 0)
    : 0;
  const finalAmountNum = parseFloat(finalAmount) || 0;
  const difference = Math.round((finalAmountNum - expectedCash) * 100) / 100;

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Caixa
          </h2>
          <p className="text-sm text-muted-foreground">Controle de abertura e fechamento de caixa</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory}>
          <History className="h-4 w-4 mr-1" /> Histórico
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : activeSession ? (
        /* Active session card */
        <Card className="border-green-300 bg-green-50/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-green-600" />
                <span className="text-lg font-bold text-green-700">Caixa Aberto</span>
                <Badge className="bg-green-600 text-white">ABERTO</Badge>
              </div>
              <Button variant="destructive" size="sm" onClick={prepareClose}>
                <Lock className="h-4 w-4 mr-1" /> Fechar Caixa
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Aberto em</p>
                <p className="font-medium text-sm">
                  {new Date(activeSession.opened_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor inicial</p>
                <p className="font-bold text-primary">{formatBRL(Number(activeSession.initial_cash_amount))}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duração</p>
                <p className="font-medium text-sm">
                  {Math.round((Date.now() - new Date(activeSession.opened_at).getTime()) / 60000)} min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No active session */
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="font-bold text-lg">Nenhum caixa aberto</p>
              <p className="text-sm text-muted-foreground">Abra o caixa para começar a registrar pedidos manuais</p>
            </div>
            <Button size="lg" onClick={() => setOpenDialogVisible(true)}>
              <Unlock className="h-4 w-4 mr-2" /> Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ═══ Open Dialog ═══ */}
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
              <Input
                type="number" step="0.01" min="0"
                placeholder="0,00"
                value={initialAmount}
                onChange={e => setInitialAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Informe o valor que está no caixa ao iniciar o turno</p>
            </div>
            <Button className="w-full" onClick={handleOpen} disabled={opening}>
              {opening ? "Abrindo..." : "Confirmar Abertura"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Close Dialog ═══ */}
      <Dialog open={closeDialogVisible} onOpenChange={setCloseDialogVisible}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Fechar Caixa
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Session summary */}
            {closeSummary && (
              <div className="rounded-lg border p-4 space-y-3">
                <p className="font-bold text-sm">Resumo do turno</p>
                <div className="space-y-1">
                  {Object.entries(closeSummary.byMethod).map(([method, data]) => (
                    <div key={method} className="flex justify-between text-sm">
                      <span>{METHOD_LABELS[method] || method} ({data.count}x)</span>
                      <span className="font-medium">{formatBRL(data.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold border-t pt-1 text-sm">
                    <span>Total Geral</span>
                    <span className="text-primary">{formatBRL(closeSummary.grandTotal)}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Valor inicial</span>
                    <span>{formatBRL(Number(activeSession?.initial_cash_amount || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vendas em dinheiro</span>
                    <span>{formatBRL(closeSummary.byMethod["cash"]?.total || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm border-t pt-1">
                    <span>Dinheiro esperado no caixa</span>
                    <span className="text-primary">{formatBRL(expectedCash)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor contado em dinheiro (R$)</label>
              <Input
                type="number" step="0.01" min="0"
                placeholder="0,00"
                value={finalAmount}
                onChange={e => setFinalAmount(e.target.value)}
              />
            </div>

            {finalAmount && (
              <div className={`rounded-lg p-3 flex items-center gap-2 ${
                difference === 0 ? "bg-green-50 text-green-700" :
                difference > 0 ? "bg-blue-50 text-blue-700" :
                "bg-red-50 text-red-700"
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
              <Textarea
                value={closeNotes}
                onChange={e => setCloseNotes(e.target.value)}
                rows={2}
                placeholder="Anotações sobre o fechamento..."
              />
            </div>

            <Button className="w-full" variant="destructive" onClick={handleClose} disabled={closing || !finalAmount}>
              {closing ? "Fechando..." : "Confirmar Fechamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ History Dialog ═══ */}
      <Dialog open={historyVisible} onOpenChange={setHistoryVisible}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Histórico de Caixas
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {historyLoading ? <Skeleton className="h-40" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Abertura</TableHead>
                    <TableHead>Fechamento</TableHead>
                    <TableHead className="text-right">Inicial</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Contado</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{new Date(s.opened_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{s.closed_at ? new Date(s.closed_at).toLocaleString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-right text-xs">{formatBRL(Number(s.initial_cash_amount))}</TableCell>
                      <TableCell className="text-right text-xs">{s.expected_cash_amount != null ? formatBRL(Number(s.expected_cash_amount)) : "—"}</TableCell>
                      <TableCell className="text-right text-xs">{s.final_cash_amount != null ? formatBRL(Number(s.final_cash_amount)) : "—"}</TableCell>
                      <TableCell className={`text-right text-xs font-bold ${
                        s.cash_difference == null ? "" :
                        Number(s.cash_difference) === 0 ? "text-green-600" :
                        Number(s.cash_difference) > 0 ? "text-blue-600" : "text-red-600"
                      }`}>
                        {s.cash_difference != null ? formatBRL(Number(s.cash_difference)) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "open" ? "default" : "secondary"} className={s.status === "open" ? "bg-green-600" : ""}>
                          {s.status === "open" ? "Aberto" : "Fechado"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
