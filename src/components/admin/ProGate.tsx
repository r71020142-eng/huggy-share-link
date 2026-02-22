import { useStore } from "@/hooks/useStore";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface ProGateProps {
  children: React.ReactNode;
  feature: string;
  description?: string;
  /** If true, show content with overlay instead of replacing it */
  overlay?: boolean;
}

/**
 * Wraps content that is only available for Pro plan.
 * Shows upgrade wall for Basic plan users.
 */
export function ProGate({ children, feature, description, overlay }: ProGateProps) {
  const { isPro } = useStore();
  const navigate = useNavigate();

  if (isPro) return <>{children}</>;

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-30 blur-[1px] select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 rounded-2xl border bg-card/95 backdrop-blur-sm p-6 shadow-lg max-w-xs text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">{feature}</p>
              {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </div>
            <button
              onClick={() => navigate("/admin/plans")}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Desbloquear com Pro
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-8 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="font-bold">{feature}</p>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <button
        onClick={() => navigate("/admin/plans")}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        Ativar Plano Pro
      </button>
    </motion.div>
  );
}

/** Badge shown next to Pro-only features in menus/lists */
export function ProBadge() {
  const { isPro } = useStore();
  if (isPro) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className="ml-1.5 bg-primary/10 text-primary text-[10px] px-1.5 py-0 font-bold cursor-help border-0">
          PRO
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-[200px]">
        Recurso exclusivo do Plano Pro. Faça upgrade para desbloquear.
      </TooltipContent>
    </Tooltip>
  );
}
