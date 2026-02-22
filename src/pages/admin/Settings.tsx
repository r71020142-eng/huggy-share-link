import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Settings() {
  const { store, refreshStore } = useStore();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [promoBanner, setPromoBanner] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setName(store.name);
      setWhatsapp(store.whatsapp || "");
      setAddress(store.address || "");
      setOperatingHours(store.operating_hours || "");
      setPromoBanner(store.promo_banner || "");
      setEstimatedTime(store.estimated_time || "");
      setMinOrder(String(store.min_order || ""));
      setIsOpen(store.is_open ?? true);
      setDeliveryEnabled(store.delivery_enabled ?? true);
      setPickupEnabled(store.pickup_enabled ?? true);
    }
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);

    const { error } = await supabase.from("stores").update({
      name,
      whatsapp,
      address,
      operating_hours: operatingHours,
      promo_banner: promoBanner,
      estimated_time: estimatedTime,
      min_order: parseFloat(minOrder) || 0,
      is_open: isOpen,
      delivery_enabled: deliveryEnabled,
      pickup_enabled: pickupEnabled,
    }).eq("id", store.id);

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Configurações salvas!");
      await refreshStore();
    }
    setSaving(false);
  };

  if (!store) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Configurações da Loja</h2>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome da loja</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp (só números)</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+55 31 9999-9999" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Endereço</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Horário de funcionamento</Label>
          <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} placeholder="Seg a Sáb: 15h às 23h" />
        </div>

        <div className="space-y-2">
          <Label>Banner promocional</Label>
          <Input value={promoBanner} onChange={(e) => setPromoBanner(e.target.value)} placeholder="🎉 Promoção especial..." />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tempo estimado</Label>
            <Input value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pedido mínimo (R$)</Label>
            <Input type="number" step="0.01" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <Checkbox checked={isOpen} onCheckedChange={(v) => setIsOpen(!!v)} />
            <span className="text-sm">Loja aberta</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={deliveryEnabled} onCheckedChange={(v) => setDeliveryEnabled(!!v)} />
            <span className="text-sm">Delivery</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={pickupEnabled} onCheckedChange={(v) => setPickupEnabled(!!v)} />
            <span className="text-sm">Retirada</span>
          </label>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleSave} disabled={saving} className="px-8">
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
