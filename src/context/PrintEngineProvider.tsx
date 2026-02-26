/**
 * PrintEngineProvider – Global context that keeps the print engine alive across routes.
 * Must be mounted once at the top of the app tree.
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import { PrinterManager } from "@/printer/printer-manager";
import { PrintQueue } from "@/printer/queue/print-queue";
import { QueueWorker } from "@/printer/queue/queue-worker";
import { PrintApiClient } from "@/printer/network/api-client";
import { PrintHeartbeat } from "@/printer/network/heartbeat";
import { PrintRealtime } from "@/printer/network/realtime";
import { PrintedOrdersStorage } from "@/printer/storage/printed-orders-storage";
import { buildReceipt } from "@/printer/escpos-builder";
import type { PrinterStatus, PrinterType, PrintJob, PrintPayload } from "@/printer/types";
import { useStore } from "@/hooks/useStore";

interface PrintEngineState {
  printerStatus: PrinterStatus;
  printerType: PrinterType;
  printerName: string | null;
  queue: PrintJob[];
  pendingCount: number;
  lastPrintAt: number | null;
  consecutiveErrors: number;
  recentErrors: string[];
  autoPrint: boolean;
  initialized: boolean;
}

interface PrintEngineContextType extends PrintEngineState {
  pairPrinter: (mode: "usb" | "serial") => Promise<void>;
  disconnectPrinter: () => Promise<void>;
  testPrint: () => Promise<void>;
  setAutoPrint: (value: boolean) => void;
  retryFailed: () => Promise<void>;
  usbSupported: boolean;
  serialSupported: boolean;
}

const defaultState: PrintEngineState = {
  printerStatus: "offline",
  printerType: "none",
  printerName: null,
  queue: [],
  pendingCount: 0,
  lastPrintAt: null,
  consecutiveErrors: 0,
  recentErrors: [],
  autoPrint: true,
  initialized: false,
};

const PrintEngineContext = createContext<PrintEngineContextType>({
  ...defaultState,
  pairPrinter: async () => {},
  disconnectPrinter: async () => {},
  testPrint: async () => {},
  setAutoPrint: () => {},
  retryFailed: async () => {},
  usbSupported: false,
  serialSupported: false,
});

const MAX_RECENT_ERRORS = 10;

export function PrintEngineProvider({ children }: { children: ReactNode }) {
  const { store } = useStore();
  const storeId = store?.id;

  const [state, setState] = useState<PrintEngineState>(defaultState);

  const managerRef = useRef<PrinterManager>(PrinterManager.getInstance());
  const queueRef = useRef<PrintQueue | null>(null);
  const workerRef = useRef<QueueWorker | null>(null);
  const apiRef = useRef<PrintApiClient | null>(null);
  const heartbeatRef = useRef<PrintHeartbeat | null>(null);
  const realtimeRef = useRef<PrintRealtime | null>(null);
  const printedRef = useRef<PrintedOrdersStorage | null>(null);
  const autoPrintRef = useRef(true);
  const storeCache = useRef<Record<string, any>>({});
  const bootedStoreRef = useRef<string | null>(null);

  // Boot engine when storeId becomes available
  useEffect(() => {
    if (!storeId) return;
    if (bootedStoreRef.current === storeId) return; // Already booted for this store

    bootedStoreRef.current = storeId;

    const manager = managerRef.current;
    const queue = new PrintQueue();
    const api = new PrintApiClient();
    const printed = new PrintedOrdersStorage();

    queueRef.current = queue;
    apiRef.current = api;
    printedRef.current = printed;

    const worker = new QueueWorker(queue, manager, api, printed);
    workerRef.current = worker;

    const heartbeat = new PrintHeartbeat(api, manager, storeId);
    heartbeatRef.current = heartbeat;

    // Status changes from PrinterManager
    const unsubStatus = manager.onStatusChange((status, type, name) => {
      setState(prev => ({ ...prev, printerStatus: status, printerType: type, printerName: name }));
      if (status === "online") {
        toast.success(`Impressora "${name}" conectada via ${type === "webusb" ? "USB" : "Serial"}`);
        heartbeat.start();
        worker.nudge();
      } else if (status === "offline") {
        toast.warning("Impressora desconectada");
        heartbeat.stop();
      } else if (status === "reconnecting") {
        toast.info("Reconectando impressora...");
      }
    });

    // Queue changes
    const unsubQueue = queue.onChange((jobs) => {
      setState(prev => ({
        ...prev,
        queue: jobs,
        pendingCount: jobs.filter(j => j.status === "pending" || j.status === "printing").length,
      }));
    });

    // Worker events
    const unsubWorker = worker.onEvent((event, data) => {
      if (event === "printed") {
        setState(prev => ({ ...prev, lastPrintAt: Date.now(), consecutiveErrors: 0 }));
        toast.success("Pedido impresso com sucesso!");
      } else if (event === "error") {
        setState(prev => ({
          ...prev,
          consecutiveErrors: worker.errors,
          recentErrors: [
            `[${new Date().toLocaleTimeString("pt-BR")}] ${data?.error}`,
            ...prev.recentErrors,
          ].slice(0, MAX_RECENT_ERRORS),
        }));
      }
    });

    // Realtime subscription for new print jobs
    const realtime = new PrintRealtime(storeId, async (printJob) => {
      if (!autoPrintRef.current) return;
      if (printed.has(printJob.order_id)) return;
      if (queue.hasOrder(printJob.order_id)) return;

      try {
        const [items, storeData] = await Promise.all([
          api.fetchOrderItems(printJob.order_id),
          storeCache.current[storeId]
            ? Promise.resolve(storeCache.current[storeId])
            : api.fetchStore(storeId).then(s => { storeCache.current[storeId] = s; return s; }),
        ]);

        const pendingJobs = await api.fetchPending(storeId);
        const match = pendingJobs.find(j => j.order_id === printJob.order_id);
        const order = match?.orders || {};

        const payload: PrintPayload = { order, items, store: storeData, copies: 1, mode: "both" };
        await queue.enqueue(printJob.order_id, storeId, payload);
        worker.nudge();
      } catch (e: any) {
        console.error("[PrintEngine] Failed to enqueue order:", e);
      }
    });
    realtimeRef.current = realtime;

    // Boot sequence
    (async () => {
      await printed.init();
      await queue.init();

      const reconnected = await manager.autoReconnect();
      if (reconnected) heartbeat.start();

      worker.start();
      realtime.start();

      // Load pending jobs from backend
      try {
        const pendingJobs = await api.fetchPending(storeId);
        const storeData = await api.fetchStore(storeId);
        storeCache.current[storeId] = storeData;

        for (const pj of pendingJobs) {
          if (printed.has(pj.order_id) || queue.hasOrder(pj.order_id)) continue;
          const items = await api.fetchOrderItems(pj.order_id);
          await queue.enqueue(pj.order_id, storeId, {
            order: pj.orders || {},
            items,
            store: storeData,
            copies: 1,
            mode: "both",
          });
        }
        worker.nudge();
      } catch (e) {
        console.warn("[PrintEngine] Failed to load pending jobs:", e);
      }

      setState(prev => ({ ...prev, initialized: true }));
    })();

    return () => {
      unsubStatus();
      unsubQueue();
      unsubWorker();
      worker.stop();
      heartbeat.stop();
      realtime.stop();
      // Do NOT destroy manager – it's a singleton and keeps the USB connection
      bootedStoreRef.current = null;
    };
  }, [storeId]);

  // Sync autoPrint ref
  useEffect(() => {
    autoPrintRef.current = state.autoPrint;
  }, [state.autoPrint]);

  const sendTestPrint = useCallback(async (kind: "manual" | "auto" = "manual") => {
    const manager = managerRef.current;
    if (!manager.isConnected) {
      if (kind === "manual") toast.error("Impressora não conectada");
      return false;
    }
    const testOrder = {
      tracking_code: "TESTE", created_at: new Date().toISOString(), order_type: "delivery",
      customer_name: "Cliente Teste", customer_phone: "(00) 00000-0000",
      customer_address: "Rua Teste, 123", subtotal: 35.90, delivery_fee: 5.00,
      total: 40.90, payment_method: "Dinheiro", notes: "Sem cebola",
    };
    const testItems = [{ product_name: "Açaí 500ml", quantity: 2, subtotal: 35.90, additionals: [{ name: "Granola", price: 2.00 }] }];
    try {
      const data = buildReceipt(testOrder, testItems, { name: "Teste Print Engine" });
      await manager.send(data);
      toast.success(kind === "auto" ? "Impressão de teste automática enviada!" : "Impressão de teste enviada!");
      return true;
    } catch (e: any) {
      toast.error("Erro no teste: " + (e.message || "Erro desconhecido"));
      return false;
    }
  }, []);

  const pairPrinter = useCallback(async (mode: "usb" | "serial" = "usb") => {
    try {
      await managerRef.current.pair(mode);
      toast.info("Conexão concluída. Enviando impressão de teste automática...");
      await sendTestPrint("auto");
    } catch (e: any) {
      if (e.name === "NotFoundError") return;
      const msg = e.message || "Erro desconhecido";
      if (msg.includes("Acesso negado ao dispositivo USB") || msg.includes("Access denied")) {
        toast.error("USB bloqueado pelo sistema/driver da impressora.", {
          description: "Feche programas que usam a impressora, tente 'Conectar via Serial' ou use o Print Agent Desktop.",
          duration: 9000,
        });
        return;
      }
      toast.error("Erro ao conectar impressora: " + msg, { duration: 7000 });
    }
  }, [sendTestPrint]);

  const disconnectPrinter = useCallback(async () => {
    await managerRef.current.disconnect();
  }, []);

  const testPrint = useCallback(async () => {
    await sendTestPrint("manual");
  }, [sendTestPrint]);

  const setAutoPrint = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, autoPrint: value }));
  }, []);

  const retryFailed = useCallback(async () => {
    const queue = queueRef.current;
    if (!queue) return;
    const failed = queue.getAll().filter(j => j.status === "failed");
    for (const job of failed) {
      await queue.updateStatus(job.id, "pending");
    }
    workerRef.current?.nudge();
    toast.info(`${failed.length} job(s) reenfileirado(s)`);
  }, []);

  const manager = managerRef.current;

  return (
    <PrintEngineContext.Provider value={{
      ...state,
      pairPrinter,
      disconnectPrinter,
      testPrint,
      setAutoPrint,
      retryFailed,
      usbSupported: manager.usbSupported,
      serialSupported: manager.serialSupported,
    }}>
      {children}
    </PrintEngineContext.Provider>
  );
}

export const usePrintEngine = () => useContext(PrintEngineContext);
