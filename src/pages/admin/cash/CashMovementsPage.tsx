import { useState, useEffect } from "react";
import { formatBRL } from "@/lib/utils";
import { useCashSession, CashMovement } from "@/hooks/useCashSession";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowDownCircle, ArrowUpCircle, Lock } from "lucide-react";

export default function CashMovementsPage() {
  const { store } = useStore();
  const { activeSession, loading, addCashMovement, getSessionMovements } = useCashSession();

  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [type, setType] = useState<"sangria" | "suprimento">("sangria");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeSession) loadMovements();
    else setMovements([]);
  }, [activeSession]);

  const loadMovements = async () => {
    if (!activeSession) return;
    setMovements(await getSessionMovements(activeSession.id));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await addCashMovement(type, parseFloat(amount) || 0, desc);
      toast.success(type === "sangria" ? "Sangria registrada!" : "Suprimento registrado!");
      setDialogVisible(false);
      setAmount("");
      setDesc("");
      loadMovements();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar movimentação");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSangrias = movements.filter(m => m.type === "sangria").reduce((s, m) => s + Number(m.amount), 0);
  const totalSuprimentos = movements.filter(m => m.type === "suprimento").reduce((s, m) => s + Number(m.amount), 0);

  if (!store) return null;

  if (loading) return <Skeleton className="h-40" />;

  if (!activeSession) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="p-12 text-center space-y-4">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
          <p className="font-bold text-xl">Caixa fechado</p>
          <p className="text-sm text-muted-foreground">Abra o caixa na aba "Sessão Atual" para registrar movimentações</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Sangria / Suprimento</h2>
          <p className="text-sm text-muted-foreground">Registre retiradas e entradas manuais de dinheiro</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setType("suprimento"); setDialogVisible(true); }}>
            <ArrowDownCircle className="h-4 w-4 mr-1 text-blue-600" /> Novo Suprimento
          </Button>
          <Button variant="outline" onClick={() => { setType("sangria"); setDialogVisible(true); }}>
            <ArrowUpCircle className="h-4 w-4 mr-1 text-orange-600" /> Nova Sangria
          </Button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowUpCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Sangrias</p>
              <p className="text-xl font-bold text-orange-600">-{formatBRL(totalSangrias)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ArrowDownCircle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Suprimentos</p>
              <p className="text-xl font-bold text-blue-600">+{formatBRL(totalSuprimentos)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movements table */}
      <Card>
        <CardContent className="p-0">
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
                    <Badge variant={m.type === "sangria" ? "destructive" : "default"} className={m.type === "suprimento" ? "bg-blue-600 text-white" : ""}>
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
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma movimentação neste turno</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogVisible} onOpenChange={setDialogVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {type === "sangria"
                ? <><ArrowUpCircle className="h-5 w-5 text-orange-600" /> Registrar Sangria</>
                : <><ArrowDownCircle className="h-5 w-5 text-blue-600" /> Registrar Suprimento</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className={`rounded-lg p-3 text-sm ${type === "sangria" ? "bg-orange-50 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300" : "bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300"}`}>
              {type === "sangria"
                ? "Sangria = retirada de dinheiro do caixa. Diminui o valor esperado."
                : "Suprimento = entrada manual de dinheiro no caixa. Aumenta o valor esperado."}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$) *</label>
              <Input type="number" step="0.01" min="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="Motivo da movimentação..." />
            </div>
            <Button
              className="w-full"
              variant={type === "sangria" ? "destructive" : "default"}
              onClick={handleSubmit}
              disabled={submitting || !amount || parseFloat(amount) <= 0}
            >
              {submitting ? "Registrando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
