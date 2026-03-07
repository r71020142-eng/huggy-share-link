import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MessageSquare, Loader2, CheckCircle2, XCircle, History, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface WhatsAppEvent {
  id: string;
  external_message_id: string;
  customer_phone: string | null;
  customer_name: string | null;
  message_text: string | null;
  status: string;
  order_id: string | null;
  error_message: string | null;
  received_at: string;
  processed_at: string | null;
}

export default function WhatsAppIntegration() {
  const { store } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [active, setActive] = useState(true);

  // Events
  const [events, setEvents] = useState<WhatsAppEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (!store) return;
    setLoading(true);
    supabase
      .from("store_whatsapp_integrations")
      .select("*")
      .eq("store_id", store.id)
      .eq("provider", "zapi")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setInstanceId(data.instance_id);
          setPhoneE164(data.phone_e164 || "");
          setActive(data.active);
        } else {
          setExistingId(null);
          setInstanceId("");
          setPhoneE164("");
          setActive(true);
        }
        setLoading(false);
      });
    fetchEvents();
  }, [store]);

  const fetchEvents = async () => {
    if (!store) return;
    setLoadingEvents(true);
    const { data } = await supabase
      .from("whatsapp_events")
      .select("id, external_message_id, customer_phone, customer_name, message_text, status, order_id, error_message, received_at, processed_at")
      .eq("store_id", store.id)
      .order("received_at", { ascending: false })
      .limit(20);
    setEvents((data as WhatsAppEvent[]) || []);
    setLoadingEvents(false);
  };

  const handleSave = async () => {
    if (!store) return;
    if (!instanceId.trim()) {
      toast.error("O Instance ID é obrigatório.");
      return;
    }

    setSaving(true);

    if (existingId) {
      const { error } = await supabase
        .from("store_whatsapp_integrations")
        .update({
          instance_id: instanceId.trim(),
          phone_e164: phoneE164.trim() || null,
          active,
        })
        .eq("id", existingId);

      if (error) toast.error("Erro ao atualizar: " + error.message);
      else toast.success("Integração atualizada!");
    } else {
      const { data, error } = await supabase
        .from("store_whatsapp_integrations")
        .insert({
          store_id: store.id,
          provider: "zapi",
          instance_id: instanceId.trim(),
          phone_e164: phoneE164.trim() || null,
          active,
        })
        .select()
        .single();

      if (error) toast.error("Erro ao salvar: " + error.message);
      else {
        setExistingId(data.id);
        toast.success("Integração cadastrada!");
      }
    }
    setSaving(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-xs">Processado</Badge>;
      case "error":
        return <Badge variant="destructive" className="text-xs">Erro</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Recebido</Badge>;
    }
  };

  if (!store) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Integração WhatsApp (Z-API)</h2>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm">
          {existingId ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Integração configurada</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">Nenhuma integração configurada</span>
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instanceId">Instance ID *</Label>
          <Input
            id="instanceId"
            value={instanceId}
            onChange={(e) => setInstanceId(e.target.value)}
            placeholder="Ex: 3FA85F64-5717-4562-B3FC-2C963F66AFA6"
          />
          <p className="text-xs text-muted-foreground">
            ID da instância fornecido pela Z-API ao criar sua conexão.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneE164">Telefone (E.164)</Label>
          <Input
            id="phoneE164"
            value={phoneE164}
            onChange={(e) => setPhoneE164(e.target.value)}
            placeholder="Ex: +5531999999999"
          />
          <p className="text-xs text-muted-foreground">
            Número do WhatsApp Business conectado à instância.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={active} onCheckedChange={setActive} id="active" />
          <Label htmlFor="active">Integração ativa</Label>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : existingId ? (
            "Atualizar integração"
          ) : (
            "Cadastrar integração"
          )}
        </Button>
      </div>

      {/* Events audit section */}
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Últimos eventos recebidos</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={loadingEvents}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loadingEvents ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
            Nenhum evento recebido ainda. Os eventos aparecerão aqui quando mensagens forem processadas pela integração.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((evt) => (
              <div key={evt.id} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {statusBadge(evt.status)}
                    <span className="text-sm font-medium">{evt.customer_name || "Sem nome"}</span>
                    {evt.customer_phone && (
                      <span className="text-xs text-muted-foreground">{evt.customer_phone}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(evt.received_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>

                {evt.message_text && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{evt.message_text}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>ID: {evt.external_message_id.substring(0, 16)}...</span>
                  {evt.order_id && (
                    <span className="text-primary">Pedido vinculado ✓</span>
                  )}
                  {evt.error_message && (
                    <span className="text-destructive">{evt.error_message}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}