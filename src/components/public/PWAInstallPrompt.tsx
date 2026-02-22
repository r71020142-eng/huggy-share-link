import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PWAInstallPromptProps {
  isPro: boolean;
  themeColor: string;
  storeName: string;
  slug: string;
  logoUrl?: string | null;
}

export function PWAInstallPrompt({ isPro, themeColor, storeName, slug, logoUrl }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (!isPro || standalone || !slug) return;

    let manifestLink: HTMLLinkElement | null = null;
    let cancelled = false;

    const setup = async () => {
      // Update theme-color meta
      const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
      if (themeMeta) themeMeta.content = themeColor;

      // Register global service worker (handles manifest + caching for all /m/ routes)
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.register("/store-sw.js", { scope: "/" });

          // Wait for SW to be controlling the page
          if (!navigator.serviceWorker.controller) {
            await new Promise<void>((resolve) => {
              navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
              // Also resolve if SW activates
              const sw = reg.installing || reg.waiting;
              if (sw) {
                sw.addEventListener("statechange", () => {
                  if (sw.state === "activated") resolve();
                });
              }
              // Timeout fallback
              setTimeout(resolve, 3000);
            });
          }
        } catch (err) {
          console.warn("SW registration failed:", err);
        }
      }

      if (cancelled) return;

      // Build manifest URL that the SW will intercept
      const params = new URLSearchParams({
        name: storeName,
        short_name: storeName.substring(0, 12),
        slug,
        theme_color: themeColor,
        icon: logoUrl || "/favicon.ico",
      });

      // Remove any existing manifest link
      const existing = document.querySelector('link[rel="manifest"]');
      if (existing) existing.remove();

      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      manifestLink.href = `/m/${slug}/manifest.json?${params.toString()}`;
      document.head.appendChild(manifestLink);
    };

    setup();

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", handler);
      if (manifestLink) manifestLink.remove();
    };
  }, [isPro, slug, themeColor, storeName, logoUrl]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

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
