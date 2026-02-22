import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Key, Store, Users } from "lucide-react";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ keys: 0, stores: 0, proStores: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [{ count: keysCount }, { data: stores }] = await Promise.all([
      supabase.from("activation_keys").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("stores").select("plan_type"),
    ]);
    setStats({
      keys: keysCount || 0,
      stores: (stores || []).length,
      proStores: (stores || []).filter((s) => s.plan_type === "pro").length,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Visão Geral</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Key className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Chaves ativas</p>
              <p className="text-3xl font-bold">{stats.keys}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Store className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Lojas</p>
              <p className="text-3xl font-bold">{stats.stores}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Users className="h-10 w-10 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Lojas Pro</p>
              <p className="text-3xl font-bold text-primary">{stats.proStores}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
