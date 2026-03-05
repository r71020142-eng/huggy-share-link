import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Settings() {
  const { store, refreshStore } = useStore();
  const { user } = useAuth();
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
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Account fields
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setLogoUrl(store.logo_url || "");
      setBannerUrl(store.banner_url || "");
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
      logo_url: logoUrl || null,
      banner_url: bannerUrl || null,
    }).eq("id", store.id);

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Configurações salvas!");
      await refreshStore();
    }
    setSaving(false);
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Informe o novo email.");
      return;
    }
    if (newEmail.trim() === user?.email) {
      toast.error("O novo email é igual ao atual.");
      return;
    }

    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });

    if (error) {
      toast.error("Erro ao alterar email: " + error.message);
    } else {
      toast.success("Um link de confirmação foi enviado para o novo email. Verifique sua caixa de entrada.");
      setNewEmail("");
    }
    setSavingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Informe a senha atual.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setSavingPassword(true);

    // Verify current password by re-signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });

    if (signInError) {
      toast.error("Senha atual incorreta.");
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  if (!store) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Configurações da Loja</h2>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        {/* Logo & Banner */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Logo da loja</Label>
            <ImageUpload
              value={logoUrl}
              onChange={(url) => setLogoUrl(url || "")}
              folder={`logos/${store?.id}`}
              className="max-w-[150px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Banner</Label>
            <ImageUpload
              value={bannerUrl}
              onChange={(url) => setBannerUrl(url || "")}
              folder={`banners/${store?.id}`}
              aspectRatio="aspect-video"
            />
          </div>
        </div>

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

      {/* Account Section */}
      <Separator />
      <h2 className="text-2xl font-bold">Conta</h2>

      {/* Change Email */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Alterar Email</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Email atual: <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <div className="space-y-2">
          <Label>Novo email</Label>
          <Input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="novoemail@exemplo.com"
          />
        </div>
        <Button onClick={handleChangeEmail} disabled={savingEmail} variant="outline">
          {savingEmail ? "Enviando..." : "Alterar email"}
        </Button>
      </div>

      {/* Change Password */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Alterar Senha</h3>
        </div>
        <div className="space-y-2">
          <Label>Senha atual</Label>
          <div className="relative">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Nova senha</Label>
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Confirmar nova senha</Label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <Button onClick={handleChangePassword} disabled={savingPassword} variant="outline">
          {savingPassword ? "Alterando..." : "Alterar senha"}
        </Button>
      </div>
    </div>
  );
}
