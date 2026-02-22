import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface OrderConfirmationAnimationProps {
  show: boolean;
  onComplete: () => void;
  themeColor: string;
}

export function OrderConfirmationAnimation({ show, onComplete, themeColor }: OrderConfirmationAnimationProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-background"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
          className="flex flex-col items-center gap-5 px-8 text-center"
        >
          {/* Animated circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 150 }}
            className="relative"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: 2 }}
              className="flex h-28 w-28 items-center justify-center rounded-full"
              style={{ backgroundColor: `${themeColor}15` }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.3, damping: 10 }}
              >
                <CheckCircle2 className="h-16 w-16" style={{ color: themeColor }} />
              </motion.div>
            </motion.div>
            {/* Particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 6) * 60,
                  y: Math.sin((i * Math.PI * 2) / 6) * 60,
                }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                className="absolute top-1/2 left-1/2 h-2 w-2 rounded-full"
                style={{ backgroundColor: themeColor }}
              />
            ))}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold"
          >
            Pedido enviado! 🎉
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-muted-foreground text-sm max-w-xs"
          >
            Seu pedido foi recebido e está sendo processado. Acompanhe o status em tempo real.
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            onClick={onComplete}
            className="mt-4 rounded-xl px-8 py-3 font-bold text-white"
            style={{ backgroundColor: themeColor }}
            whileTap={{ scale: 0.95 }}
          >
            Acompanhar pedido →
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
