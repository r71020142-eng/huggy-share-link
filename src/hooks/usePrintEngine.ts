/**
 * usePrintEngine – Main React hook orchestrating the Print Engine
 * Wires together: PrinterManager, PrintQueue, QueueWorker, Realtime, Heartbeat
 */

import { useState, useEffect, useRef, useCallback } from "react";
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

const MAX_RECENT_ERRORS = 10;

export function usePrintEngine(storeId: string | undefined) {
  const [state, setState] = useState<PrintEngineState>({
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
  });

  const managerRef = useRef<PrinterManager | null>(null);
  const queueRef = useRef<PrintQueue | null>(null);
  const workerRef = useRef<QueueWorker | null>(null);
  const apiRef = useRef<PrintApiClient | null>(null);
  const heartbeatRef = useRef<PrintHeartbeat | null>(null);
  const realtimeRef = useRef<PrintRealtime | null>(null);
  const printedRef = useRef<PrintedOrdersStorage | null>(null);
  const autoPrintRef = useRef(true);
  const storeCache = useRef<Record<string, any>>({});

  // Initialize all modules
  useEffect(() => {
    if (!storeId) return;

    const manager = new PrinterManager();
    const queue = new PrintQueue();
    const api = new PrintApiClient();
    const printed = new PrintedOrdersStorage();

    managerRef.current = manager;
    queueRef.current = queue;
    apiRef.current = api;
    printedRef.current = printed;

    const worker = new QueueWorker(queue, manager, api, printed);
    workerRef.current = worker;

    const heartbeat = new PrintHeartbeat(api, manager, storeId);
    heartbeatRef.current = heartbeat;

    // Status changes from PrinterManager
    const unsubStatus = manager.onStatusChange((status, type, name) => {
      setState(prev => ({
        ...prev,
        printerStatus: status,
        printerType: type,
        printerName: name,
      }));

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
        setState(prev => ({
          ...prev,
          lastPrintAt: Date.now(),
          consecutiveErrors: 0,
        }));
        toast.success(`Pedido impresso com sucesso!`);
      } else if (event === "error") {
        setState(prev => ({
          ...prev,
          consecutiveErrors: worker.errors,
          recentErrors: [
            `[${new Date().toLocaleTimeString("pt-BR")}] ${data?.error}`,
            ...prev.recentErrors,
          ].slice(0, MAX_RECENT_ERRORS),
        }));
      } else if (event === "skipped-duplicate") {
        console.info("[PrintEngine] Duplicate order skipped:", data?.orderId);
      }
    });

    // Realtime: new print jobs from database
    const realtime = new PrintRealtime(storeId, async (printJob) => {
      if (!autoPrintRef.current) return;
      if (printed.has(printJob.order_id)) return;
      if (queue.hasOrder(printJob.order_id)) return;

      try {
        // Fetch order details for receipt
        const [items, storeData] = await Promise.all([
          api.fetchOrderItems(printJob.order_id),
          storeCache.current[storeId]
            ? Promise.resolve(storeCache.current[storeId])
            : api.fetchStore(storeId).then(s => { storeCache.current[storeId] = s; return s; }),
        ]);

        // Fetch order data from the join
        const pendingJobs = await api.fetchPending(storeId);
        const match = pendingJobs.find(j => j.order_id === printJob.order_id);
        const order = match?.orders || {};

        const payload: PrintPayload = {
          order,
          items,
          store: storeData,
          copies: 1,
          mode: "both",
        };

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

      // Auto-reconnect
      const reconnected = await manager.autoReconnect();
      if (reconnected) {
        heartbeat.start();
      }

      // Start worker and realtime
      worker.start();
      realtime.start();

      // Load any pending jobs from backend that weren't printed
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
      manager.destroy();
    };
  }, [storeId]);

  // Sync autoPrint ref
  useEffect(() => {
    autoPrintRef.current = state.autoPrint;
  }, [state.autoPrint]);

  const pairPrinter = useCallback(async (mode: "usb" | "serial" = "usb") => {
    try {
      await managerRef.current?.pair(mode);
    } catch (e: any) {
      if (e.name === "NotFoundError") return; // user cancelled
      const msg = e.message || "Erro desconhecido";
      toast.error("Erro ao conectar impressora: " + msg, {
        duration: 6000,
      });
    }
  }, []);

  const disconnectPrinter = useCallback(async () => {
    await managerRef.current?.disconnect();
  }, []);

  const testPrint = useCallback(async () => {
    if (!managerRef.current?.isConnected) {
      toast.error("Impressora não conectada");
      return;
    }

    const testOrder = {
      tracking_code: "TESTE",
      created_at: new Date().toISOString(),
      order_type: "delivery",
      customer_name: "Cliente Teste",
      customer_phone: "(00) 00000-0000",
      customer_address: "Rua Teste, 123",
      subtotal: 35.90,
      delivery_fee: 5.00,
      total: 40.90,
      payment_method: "Dinheiro",
      notes: "Sem cebola",
    };
    const testItems = [
      { product_name: "Açaí 500ml", quantity: 2, subtotal: 35.90, additionals: [{ name: "Granola", price: 2.00 }] },
    ];

    try {
      const data = buildReceipt(testOrder, testItems, { name: "Teste Print Engine" });
      await managerRef.current.send(data);
      toast.success("Impressão de teste enviada!");
    } catch (e: any) {
      toast.error("Erro no teste: " + e.message);
    }
  }, []);

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

  return {
    ...state,
    pairPrinter,
    disconnectPrinter,
    testPrint,
    setAutoPrint,
    retryFailed,
    usbSupported: managerRef.current?.usbSupported ?? (typeof navigator !== "undefined" && !!navigator.usb),
    serialSupported: managerRef.current?.serialSupported ?? (typeof navigator !== "undefined" && !!(navigator as any).serial),
  };
}
