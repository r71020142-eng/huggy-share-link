import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import logoAnoto from "@/assets/logo-anoto.png";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: storeName },
      },
    });

    if (authError) {
      toast.error("Erro ao criar conta: " + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create the store with unique slug
      const baseSlug = storeName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Try base slug first, then append random suffix on conflict
      let slug = baseSlug;
      let storeError: any = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await supabase.from("stores").insert({
          name: storeName,
          slug,
          owner_id: authData.user.id,
        });

        if (!error) {
          storeError = null;
          break;
        }

        // 409 = conflict (duplicate slug), retry with suffix
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          const suffix = Math.random().toString(36).substring(2, 6);
          slug = `${baseSlug}-${suffix}`;
          storeError = error;
        } else {
          storeError = error;
          break;
        }
      }

      if (storeError) {
        toast.error("Erro ao criar loja: " + storeError.message);
      } else {
        toast.success("Conta criada com sucesso! 🎉");
        navigate("/admin");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pt-0 px-0">
          <div className="mx-auto mb-6 w-full overflow-hidden rounded-t-lg">
            <img src={logoAnoto} alt="Anotô" className="w-full h-auto object-cover" />
          </div>
          <CardDescription>Comece a vender online agora</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nome da loja</Label>
              <Input
                id="storeName"
                placeholder="Minha Açaíteria"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar conta grátis"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
