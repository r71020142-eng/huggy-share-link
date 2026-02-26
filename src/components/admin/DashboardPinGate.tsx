import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

export function DashboardPinGate({ children }: Props) {
  const { store, refreshStore } = useStore();
  const [unlocked, setUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "create" | "confirm">("enter");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!store) return;
    setHasPin(!!store.dashboard_pin_hash);
    setStep(store.dashboard_pin_hash ? "enter" : "create");
    setUnlocked(false);
    setPin("");
    setConfirmPin("");
  }, [store?.id]);

  if (!store || hasPin === null) return null;
  if (unlocked) return <>{children}</>;

  const hashPin = async (raw: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(raw + store.id);
    const buffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleCreatePin = async () => {
    if (pin.length !== 4) return;
    setStep("confirm");
  };

  const handleConfirmCreate = async () => {
    if (confirmPin !== pin) {
      toast.error("As senhas não coincidem. Tente novamente.");
      setConfirmPin("");
      return;
    }
    setLoading(true);
    const hash = await hashPin(pin);
    const { error } = await supabase.from("stores").update({ dashboard_pin_hash: hash }).eq("id", store.id);
    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar senha.");
      return;
    }
    await refreshStore();
    toast.success("Senha do Dashboard criada com sucesso!");
    setUnlocked(true);
  };

  const handleVerifyPin = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    const hash = await hashPin(pin);
    setLoading(false);
    if (hash === store.dashboard_pin_hash) {
      setUnlocked(true);
    } else {
      toast.error("Senha incorreta.");
      setPin("");
    }
  };

  return (
    <Dialog open={!unlocked} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-2">
            {step === "enter" ? <Lock className="h-7 w-7 text-primary" /> : <ShieldCheck className="h-7 w-7 text-primary" />}
          </div>
          <DialogTitle>
            {step === "enter" ? "Acesso ao Dashboard" : step === "create" ? "Criar senha do Dashboard" : "Confirmar senha"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === "enter"
              ? "Digite sua senha de 4 dígitos para acessar a visão geral."
              : step === "create"
              ? "Crie uma senha de 4 dígitos para proteger o Dashboard desta loja."
              : "Repita a senha de 4 dígitos para confirmar."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {step === "enter" && (
            <>
              <InputOTP maxLength={4} value={pin} onChange={setPin} onComplete={handleVerifyPin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              <Button onClick={handleVerifyPin} disabled={pin.length !== 4 || loading} className="w-full">
                {loading ? "Verificando..." : "Acessar"}
              </Button>
            </>
          )}

          {step === "create" && (
            <>
              <InputOTP maxLength={4} value={pin} onChange={setPin} onComplete={handleCreatePin}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              <Button onClick={handleCreatePin} disabled={pin.length !== 4} className="w-full">
                Continuar
              </Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <InputOTP maxLength={4} value={confirmPin} onChange={setConfirmPin} onComplete={handleConfirmCreate}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
              <Button onClick={handleConfirmCreate} disabled={confirmPin.length !== 4 || loading} className="w-full">
                {loading ? "Salvando..." : "Confirmar e acessar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setStep("create"); setPin(""); setConfirmPin(""); }}>
                Voltar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
