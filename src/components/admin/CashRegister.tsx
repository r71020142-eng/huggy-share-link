import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useCashSession, CashSession, CashMovement } from "@/hooks/useCashSession";
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
  Wallet, Lock, Unlock, Clock, TrendingUp, TrendingDown,
  CheckCircle, History, ArrowDownCircle, ArrowUpCircle, Plus
} from "lucide-react";

const METHOD_LABELS: Record<string, string> = {
  pix: "💎 Pix", cash: "💵 Dinheiro", credit: "💳 Crédito", debit: "💳 Débito",
};

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function CashRegister() {
  const { store } = useStore();
  const {
    activeSession, loading, openSession, closeSession,
    getSessionSummary, addCashMovement, getSessionMovements, refresh
  } = useCashSession();

  // Open dialog
  const [openDialogVisible, setOpenDialogVisible] = useState(false);
  const [initialAmount, setInitialAmount] = useState("");
  const [opening, setOpening] = useState(false);

  // Close dialog
  const [closeDialogVisible, setCloseDialogVisible] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closing, setClosing] = useState(false);
  const [closeSummary, setCloseSummary] = useState<{
    byMethod: Record<string, { count: number; total: number }>;
    grandTotal: number;
    movements: CashMovement[];
    totalSangrias: number;
    totalSuprimentos: number;
  } | null>(null);

  // Movement dialog
  const [movementDialogVisible, setMovementDialogVisible] = useState(false);
  const [movementType, setMovementType] = useState<"sangria" | "suprimento">("sangria");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDesc, setMovementDesc] = useState("");
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // Movements list
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [movementsVisible, setMovementsVisible] = useState(false);

  // History
  const [historyVisible, setHistoryVisible] = useState(false);
  const [history, setHistory] = useState<CashSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Report dialog
  const [reportSession, setReportSession] = useState<CashSession | null>(null);

  // Load movements when active session
  useEffect(() => {
    if (activeSession) loadMovements();
  }, [activeSession]);

  const loadMovements = async () => {
    if (!activeSession) return;
    const data = await getSessionMovements(activeSession.id);
    setMovements(data);
  };

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
    const [summary, mvs] = await Promise.all([
      getSessionSummary(activeSession.id),
      getSessionMovements(activeSession.id),
    ]);
    const totalSangrias = mvs.filter(m => m.type === "sangria").reduce((s, m) => s + Number(m.amount), 0);
    const totalSuprimentos = mvs.filter(m => m.type === "suprimento").reduce((s, m) => s + Number(m.amount), 0);
    setCloseSummary({ ...summary, movements: mvs, totalSangrias, totalSuprimentos });
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

  const handleMovement = async () => {
    setSubmittingMovement(true);
    try {
      await addCashMovement(movementType, parseFloat(movementAmount) || 0, movementDesc);
      toast.success(movementType === "sangria" ? "Sangria registrada!" : "Suprimento registrado!");
      setMovementDialogVisible(false);
      setMovementAmount("");
      setMovementDesc("");
      loadMovements();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar movimentação");
    } finally {
      setSubmittingMovement(false);
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

  // Close dialog calculations
  const expectedCash = closeSummary
    ? Number(activeSession?.initial_cash_amount || 0)
      + (closeSummary.byMethod["cash"]?.total || 0)
      + closeSummary.totalSuprimentos
      - closeSummary.totalSangrias
    : 0;
  const finalAmountNum = parseFloat(finalAmount) || 0;
  const difference = Math.round((finalAmountNum - expectedCash) * 100) / 100;

  // Live totals
  const liveSangrias = movements.filter(m => m.type === "sangria").reduce((s, m) => s + Number(m.amount), 0);
  const liveSuprimentos = movements.filter(m => m.type === "suprimento").reduce((s, m) => s + Number(m.amount), 0);

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Caixa
          </h2>
          <p className="text-sm text-muted-foreground">Controle de abertura, sangria, suprimento e fechamento</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory}>
          <History className="h-4 w-4 mr-1" /> Histórico
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : activeSession ? (
        <Card className="border-green-300 bg-green-50/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-green-600" />
                <span className="text-lg font-bold text-green-700">Caixa Aberto</span>
                <Badge className="bg-green-600 text-white">ABERTO</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => { setMovementType("suprimento"); setMovementDialogVisible(true); }}
                >
                  <ArrowDownCircle className="h-4 w-4 mr-1 text-blue-600" /> Suprimento
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => { setMovementType("sangria"); setMovementDialogVisible(true); }}
                >
                  <ArrowUpCircle className="h-4 w-4 mr-1 text-orange-600" /> Sangria
                </Button>
                <Button variant="destructive" size="sm" onClick={prepareClose}>
                  <Lock className="h-4 w-4 mr-1" /> Fechar Caixa
                </Button>
              </div>
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
                <p className="text-xs text-muted-foreground">Sangrias / Suprimentos</p>
                <p className="text-sm">
                  <span className="text-orange-600 font-medium">-{formatBRL(liveSangrias)}</span>
                  {" / "}
                  <span className="text-blue-600 font-medium">+{formatBRL(liveSuprimentos)}</span>
                </p>
              </div>
            </div>

            {/* Recent movements */}
            {movements.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-muted-foreground">Últimas movimentações</p>
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setMovementsVisible(true)}>
                    Ver todas ({movements.length})
                  </Button>
                </div>
                <div className="space-y-1">
                  {movements.slice(0, 3).map(m => (
                    <div key={m.id} className="flex justify-between text-xs bg-background rounded px-2 py-1">
                      <span className="flex items-center gap-1">
                        {m.type === "sangria"
                          ? <ArrowUpCircle className="h-3 w-3 text-orange-500" />
                          : <ArrowDownCircle className="h-3 w-3 text-blue-500" />}
                        {m.type === "sangria" ? "Sangria" : "Suprimento"}
                        {m.description && <span className="text-muted-foreground ml-1">· {m.description}</span>}
                      </span>
                      <span className={`font-medium ${m.type === "sangria" ? "text-orange-600" : "text-blue-600"}`}>
                        {m.type === "sangria" ? "-" : "+"}{formatBRL(Number(m.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
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
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground">Informe o valor que está no caixa ao iniciar o turno</p>
            </div>
            <Button className="w-full" onClick={handleOpen} disabled={opening}>
              {opening ? "Abrindo..." : "Confirmar Abertura"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Movement Dialog (Sangria/Suprimento) ═══ */}
      <Dialog open={movementDialogVisible} onOpenChange={setMovementDialogVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === "sangria"
                ? <><ArrowUpCircle className="h-5 w-5 text-orange-600" /> Registrar Sangria</>
                : <><ArrowDownCircle className="h-5 w-5 text-blue-600" /> Registrar Suprimento</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={`rounded-lg p-3 text-sm ${movementType === "sangria" ? "bg-orange-50 text-orange-800" : "bg-blue-50 text-blue-800"}`}>
              {movementType === "sangria"
                ? "Sangria = retirada de dinheiro do caixa. Diminui o valor esperado."
                : "Suprimento = entrada manual de dinheiro no caixa. Aumenta o valor esperado."}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$) *</label>
              <Input type="number" step="0.01" min="0.01" placeholder="0,00" value={movementAmount} onChange={e => setMovementAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea value={movementDesc} onChange={e => setMovementDesc(e.target.value)} rows={2} placeholder="Motivo da movimentação..." />
            </div>
            <Button
              className="w-full"
              variant={movementType === "sangria" ? "destructive" : "default"}
              onClick={handleMovement}
              disabled={submittingMovement || !movementAmount || parseFloat(movementAmount) <= 0}
            >
              {submittingMovement ? "Registrando..." : "Confirmar"}
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
                    <span>Total Vendas</span>
                    <span className="text-primary">{formatBRL(closeSummary.grandTotal)}</span>
                  </div>
                </div>

                {/* Movements summary */}
                {(closeSummary.totalSangrias > 0 || closeSummary.totalSuprimentos > 0) && (
                  <div className="space-y-1 border-t pt-2">
                    {closeSummary.totalSuprimentos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">↓ Suprimentos</span>
                        <span className="font-medium text-blue-700">+{formatBRL(closeSummary.totalSuprimentos)}</span>
                      </div>
                    )}
                    {closeSummary.totalSangrias > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-700">↑ Sangrias</span>
                        <span className="font-medium text-orange-700">-{formatBRL(closeSummary.totalSangrias)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Valor inicial</span>
                    <span>{formatBRL(Number(activeSession?.initial_cash_amount || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vendas em dinheiro</span>
                    <span>{formatBRL(closeSummary.byMethod["cash"]?.total || 0)}</span>
                  </div>
                  {closeSummary.totalSuprimentos > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>+ Suprimentos</span>
                      <span className="text-blue-600">+{formatBRL(closeSummary.totalSuprimentos)}</span>
                    </div>
                  )}
                  {closeSummary.totalSangrias > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>- Sangrias</span>
                      <span className="text-orange-600">-{formatBRL(closeSummary.totalSangrias)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-1">
                    <span>Dinheiro esperado no caixa</span>
                    <span className="text-primary">{formatBRL(expectedCash)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor contado em dinheiro (R$)</label>
              <Input type="number" step="0.01" min="0" placeholder="0,00" value={finalAmount} onChange={e => setFinalAmount(e.target.value)} />
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
              <Textarea value={closeNotes} onChange={e => setCloseNotes(e.target.value)} rows={2} placeholder="Anotações sobre o fechamento..." />
            </div>

            <Button className="w-full" variant="destructive" onClick={handleClose} disabled={closing || !finalAmount}>
              {closing ? "Fechando..." : "Confirmar Fechamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Movements List Dialog ═══ */}
      <Dialog open={movementsVisible} onOpenChange={setMovementsVisible}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Movimentações do Turno</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge variant={m.type === "sangria" ? "destructive" : "default"} className={m.type === "suprimento" ? "bg-blue-600" : ""}>
                        {m.type === "sangria" ? "Sangria" : "Suprimento"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.description || "—"}</TableCell>
                    <TableCell className={`text-right font-bold ${m.type === "sangria" ? "text-orange-600" : "text-blue-600"}`}>
                      {m.type === "sangria" ? "-" : "+"}{formatBRL(Number(m.amount))}
                    </TableCell>
                    <TableCell className="text-xs">{new Date(m.created_at).toLocaleTimeString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma movimentação</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ History Dialog ═══ */}
      <Dialog open={historyVisible} onOpenChange={setHistoryVisible}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
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
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Esperado</TableHead>
                    <TableHead className="text-right">Contado</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs">{new Date(s.opened_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{s.closed_at ? new Date(s.closed_at).toLocaleString("pt-BR") : "—"}</TableCell>
                      <TableCell className="text-right text-xs">{formatBRL(Number(s.initial_cash_amount))}</TableCell>
                      <TableCell className="text-right text-xs">{s.total_sales_amount != null ? formatBRL(Number(s.total_sales_amount)) : "—"}</TableCell>
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
                      <TableCell>
                        {s.status === "closed" && (
                          <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setReportSession(s)}>
                            Relatório
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum registro encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Report Dialog ═══ */}
      <Dialog open={!!reportSession} onOpenChange={() => setReportSession(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Relatório do Turno</DialogTitle>
          </DialogHeader>
          {reportSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Abertura</p>
                  <p className="font-medium">{new Date(reportSession.opened_at).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fechamento</p>
                  <p className="font-medium">{reportSession.closed_at ? new Date(reportSession.closed_at).toLocaleString("pt-BR") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="font-medium">
                    {reportSession.closed_at
                      ? `${Math.round((new Date(reportSession.closed_at).getTime() - new Date(reportSession.opened_at).getTime()) / 60000)} min`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <p className="font-bold text-sm">Vendas por forma de pagamento</p>
                <div className="flex justify-between text-sm">
                  <span>💵 Dinheiro</span>
                  <span className="font-medium">{formatBRL(Number(reportSession.total_cash_amount || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>💎 Pix</span>
                  <span className="font-medium">{formatBRL(Number(reportSession.total_pix_amount || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>💳 Cartão</span>
                  <span className="font-medium">{formatBRL(Number(reportSession.total_card_amount || 0))}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1 text-sm">
                  <span>Total Vendas</span>
                  <span className="text-primary">{formatBRL(Number(reportSession.total_sales_amount || 0))}</span>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <p className="font-bold text-sm">Movimentações de caixa</p>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">↓ Suprimentos</span>
                  <span className="font-medium text-blue-700">+{formatBRL(Number(reportSession.total_suprimentos || 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-700">↑ Sangrias</span>
                  <span className="font-medium text-orange-700">-{formatBRL(Number(reportSession.total_sangrias || 0))}</span>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Valor inicial</span>
                  <span>{formatBRL(Number(reportSession.initial_cash_amount))}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Dinheiro esperado</span>
                  <span className="text-primary">{formatBRL(Number(reportSession.expected_cash_amount || 0))}</span>
                </div>
                <div className="flex justify-between font-bold text-sm">
                  <span>Dinheiro contado</span>
                  <span>{formatBRL(Number(reportSession.final_cash_amount || 0))}</span>
                </div>
                <div className={`flex justify-between font-bold text-sm border-t pt-1 ${
                  Number(reportSession.cash_difference || 0) === 0 ? "text-green-600" :
                  Number(reportSession.cash_difference || 0) > 0 ? "text-blue-600" : "text-red-600"
                }`}>
                  <span>Diferença</span>
                  <span>{formatBRL(Number(reportSession.cash_difference || 0))}</span>
                </div>
              </div>

              {reportSession.notes && (
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-bold text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm">{reportSession.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
