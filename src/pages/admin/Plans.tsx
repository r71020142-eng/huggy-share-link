import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Plans() {
  const { store, isPro, refreshStore } = useStore();
  const [activationCode, setActivationCode] = useState("");
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    if (!store || !activationCode.trim()) return;
    setActivating(true);

    // Validate key
    const { data: key, error } = await supabase
      .from("activation_keys")
      .select("*")
      .eq("code", activationCode.trim())
      .eq("is_active", true)
      .single();

    if (error || !key) {
      toast.error("Chave inválida ou inativa.");
      setActivating(false);
      return;
    }

    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      toast.error("Esta chave expirou.");
      setActivating(false);
      return;
    }

    if (key.max_uses && (key.current_uses ?? 0) >= key.max_uses) {
      toast.error("Esta chave já atingiu o limite de uso.");
      setActivating(false);
      return;
    }

    // Activate
    const { error: updateError } = await supabase
      .from("stores")
      .update({ plan_type: key.plan_type })
      .eq("id", store.id);

    if (updateError) {
      toast.error("Erro ao ativar plano.");
      setActivating(false);
      return;
    }

    // Update key usage
    await supabase.from("activation_keys").update({
      current_uses: (key.current_uses ?? 0) + 1,
      used_at: new Date().toISOString(),
      used_by_store_id: store.id,
    }).eq("id", key.id);

    toast.success("Plano Pro ativado com sucesso! 🎉");
    await refreshStore();
    setActivationCode("");
    setActivating(false);
  };

  const basicFeatures = [
    "Até 10 produtos",
    "1 cardápio online",
    "3 categorias",
    "Pedidos via WhatsApp",
    "Painel de pedidos básico",
  ];

  const basicLocked = [
    "CRM avançado de clientes",
    "Analytics e relatórios",
    "Rastreio de pedidos em tempo real",
    "PWA personalizado",
    "Múltiplos cardápios",
  ];

  const proFeatures = [
    "Produtos ilimitados",
    "Múltiplos cardápios",
    "Categorias ilimitadas",
    "Checkout 100% online (sem WhatsApp)",
    "Rastreio de pedidos em tempo real",
    "Analytics avançado (faturamento, ticket médio, top produtos)",
    "CRM de clientes (LTV, histórico, WhatsApp)",
    "Relatórios exportáveis (CSV)",
    "PWA personalizado instalável",
    "Domínio customizado",
    "Suporte prioritário 24/7",
    "Painel de pedidos premium",
  ];

  const comparisonRows = [
    { feature: "Produtos", basic: "10", pro: "Ilimitados" },
    { feature: "Categorias", basic: "3", pro: "Ilimitadas" },
    { feature: "Cardápios", basic: "1", pro: "Ilimitados" },
    { feature: "CRM de clientes", basic: "Não", pro: "Sim" },
    { feature: "Analytics avançado", basic: "Não", pro: "Sim" },
    { feature: "Exportação CSV", basic: "Não", pro: "Sim" },
    { feature: "Checkout online", basic: "WhatsApp", pro: "Integrado" },
    { feature: "Rastreio em tempo real", basic: "Não", pro: "Sim" },
    { feature: "PWA instalável", basic: "Não", pro: "Sim" },
  ];

  if (!store) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">Planos</h2>
      <p className="text-muted-foreground">Escolha o melhor plano para sua loja</p>

      {/* Current plan badge */}
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">
            Plano atual: <span className="text-primary">{isPro ? "Pro" : "Básico"}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {isPro ? "Você tem acesso completo a todos os recursos" : "Atualize para desbloquear recursos avançados"}
          </p>
        </div>
        <Badge className={isPro ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
          {isPro ? "ATIVO" : "BÁSICO"}
        </Badge>
      </div>

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="text-sm text-muted-foreground">Básico</span>
              <br />
              <span className="text-3xl font-bold">Grátis</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Para começar a vender online</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {basicFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" /> {f}
              </div>
            ))}
            {basicLocked.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground line-through">
                <Lock className="h-4 w-4" /> {f}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary relative">
          <Badge className="absolute -top-3 right-4 bg-destructive text-destructive-foreground">RECOMENDADO</Badge>
          {isPro && <Badge className="absolute -top-3 right-36 bg-primary text-primary-foreground">ATIVO</Badge>}
          <CardHeader>
            <CardTitle>
              <span className="text-sm text-muted-foreground">Pro</span>
              <br />
              <span className="text-3xl font-bold text-primary">Premium</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">Recursos completos para crescer</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {proFeatures.map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" /> {f}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Activation */}
      {!isPro && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Ativar Plano Pro</h3>
            <div className="flex gap-3">
              <Input
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="Digite sua chave de ativação"
                className="max-w-sm"
              />
              <Button onClick={handleActivate} disabled={activating}>
                {activating ? "Ativando..." : "Ativar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo de limites</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase text-xs">Recurso</TableHead>
                <TableHead className="text-center uppercase text-xs">Básico</TableHead>
                <TableHead className="text-center uppercase text-xs text-primary">Pro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="text-primary">{row.feature}</TableCell>
                  <TableCell className="text-center font-medium">{row.basic}</TableCell>
                  <TableCell className="text-center font-bold text-primary">{row.pro}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isPro && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-6 text-center">
          <p className="text-2xl">🎉</p>
          <p className="font-bold text-lg mt-2">Plano Pro ativo!</p>
          <p className="text-sm text-muted-foreground">Aproveite todos os recursos sem limites.</p>
        </div>
      )}
    </div>
  );
}
