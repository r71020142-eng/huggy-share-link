import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PWAInstallPromptProps {
  isPro: boolean;
  themeColor: string;
  storeName: string;
}

export function PWAInstallPrompt({ isPro, themeColor, storeName }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (!isPro || standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isPro]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  // Don't show for Basic plan or if already installed
  if (!isPro || isStandalone) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl border bg-card p-4 shadow-2xl"
        >
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-2 right-2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: themeColor }}
            >
              <Download className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Instalar {storeName}</p>
              <p className="text-xs text-muted-foreground">
                Acesse mais rápido, direto da tela inicial
              </p>
            </div>
            <button
              onClick={handleInstall}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: themeColor }}
            >
              Instalar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
