import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronRight, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  route: string;
}

export function OnboardingChecklist() {
  const { store } = useStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!store) return;
    checkProgress();
  }, [store]);

  const checkProgress = async () => {
    if (!store) return;

    const [{ count: catCount }, { count: prodCount }, { count: menuCount }] = await Promise.all([
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("store_id", store.id),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("store_id", store.id),
      supabase.from("menus").select("*", { count: "exact", head: true }).eq("store_id", store.id).eq("is_published", true),
    ]);

    setItems([
      {
        id: "category",
        label: "Criar primeira categoria",
        description: "Organize seus produtos em categorias",
        completed: (catCount || 0) > 0,
        route: "/admin/categories",
      },
      {
        id: "product",
        label: "Criar primeiro produto",
        description: "Adicione produtos ao seu cardápio",
        completed: (prodCount || 0) > 0,
        route: "/admin/products",
      },
      {
        id: "menu",
        label: "Publicar cardápio",
        description: "Publique seu cardápio para clientes acessarem",
        completed: (menuCount || 0) > 0,
        route: "/admin/menus",
      },
      {
        id: "test",
        label: "Testar como cliente",
        description: "Veja como seu cardápio aparece para os clientes",
        completed: (menuCount || 0) > 0 && (prodCount || 0) > 0,
        route: "/admin/menus",
      },
    ]);
    setLoading(false);
  };

  if (loading || dismissed) return null;

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;
  const allDone = completedCount === items.length;

  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-success/30 bg-success/5 p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <Rocket className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-success">🎉 Sua loja está pronta para vender!</p>
            <p className="text-sm text-muted-foreground">Todos os passos foram concluídos. Boas vendas!</p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-xs text-muted-foreground hover:text-foreground">
            Ocultar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-base">🚀 Configure sua loja</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete os passos abaixo para começar a vender
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
          <span className="text-xs text-muted-foreground">{completedCount}/{items.length}</span>
        </div>
      </div>

      <Progress value={progress} className="h-2 mb-4" />

      <div className="space-y-1">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(item.route)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
              item.completed
                ? "opacity-60"
                : "hover:bg-muted"
            }`}
          >
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            {!item.completed && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
