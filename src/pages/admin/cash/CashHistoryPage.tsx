import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { CashSession } from "@/hooks/useCashSession";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History } from "lucide-react";

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

export default function CashHistoryPage() {
  const { store } = useStore();
  const [history, setHistory] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportSession, setReportSession] = useState<CashSession | null>(null);

  useEffect(() => {
    if (store) fetchHistory();
  }, [store]);

  const fetchHistory = async () => {
    if (!store) return;
    setLoading(true);
    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("store_id", store.id)
      .order("opened_at", { ascending: false })
      .limit(50);
    setHistory((data as CashSession[]) || []);
    setLoading(false);
  };

  if (!store) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><History className="h-6 w-6" /> Histórico de Caixas</h2>
        <p className="text-sm text-muted-foreground">Relatórios de turnos anteriores</p>
      </div>

      {loading ? <Skeleton className="h-40" /> : (
        <Card>
          <CardContent className="p-0">
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
                      <Badge variant={s.status === "open" ? "default" : "secondary"} className={s.status === "open" ? "bg-green-600 text-white" : ""}>
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
          </CardContent>
        </Card>
      )}

      {/* Report Dialog */}
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
                <div className="flex justify-between text-sm"><span>💵 Dinheiro</span><span className="font-medium">{formatBRL(Number(reportSession.total_cash_amount || 0))}</span></div>
                <div className="flex justify-between text-sm"><span>💎 Pix</span><span className="font-medium">{formatBRL(Number(reportSession.total_pix_amount || 0))}</span></div>
                <div className="flex justify-between text-sm"><span>💳 Cartão</span><span className="font-medium">{formatBRL(Number(reportSession.total_card_amount || 0))}</span></div>
                <div className="flex justify-between font-bold border-t pt-1 text-sm">
                  <span>Total Vendas</span><span className="text-primary">{formatBRL(Number(reportSession.total_sales_amount || 0))}</span>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <p className="font-bold text-sm">Movimentações</p>
                <div className="flex justify-between text-sm"><span className="text-blue-700 dark:text-blue-400">↓ Suprimentos</span><span className="font-medium text-blue-700 dark:text-blue-400">+{formatBRL(Number(reportSession.total_suprimentos || 0))}</span></div>
                <div className="flex justify-between text-sm"><span className="text-orange-700 dark:text-orange-400">↑ Sangrias</span><span className="font-medium text-orange-700 dark:text-orange-400">-{formatBRL(Number(reportSession.total_sangrias || 0))}</span></div>
              </div>

              <div className="rounded-lg bg-muted p-3 space-y-2">
                <div className="flex justify-between text-sm"><span>Valor inicial</span><span>{formatBRL(Number(reportSession.initial_cash_amount))}</span></div>
                <div className="flex justify-between font-bold text-sm"><span>Dinheiro esperado</span><span className="text-primary">{formatBRL(Number(reportSession.expected_cash_amount || 0))}</span></div>
                <div className="flex justify-between font-bold text-sm"><span>Dinheiro contado</span><span>{formatBRL(Number(reportSession.final_cash_amount || 0))}</span></div>
                <div className={`flex justify-between font-bold text-sm border-t pt-1 ${
                  Number(reportSession.cash_difference || 0) === 0 ? "text-green-600" :
                  Number(reportSession.cash_difference || 0) > 0 ? "text-blue-600" : "text-red-600"
                }`}>
                  <span>Diferença</span><span>{formatBRL(Number(reportSession.cash_difference || 0))}</span>
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
