/**
 * Queue Worker – Sequentially processes print jobs with retry and backoff
 * One job at a time. Locked processing to prevent concurrent prints.
 */

import { PrintQueue } from "./print-queue";
import { PrinterManager } from "../printer-manager";
import { PrintApiClient } from "../network/api-client";
import { PrintedOrdersStorage } from "../storage/printed-orders-storage";
import { buildReceipt } from "../escpos-builder";

type WorkerEventListener = (event: string, data?: any) => void;

export class QueueWorker {
  private queue: PrintQueue;
  private printer: PrinterManager;
  private api: PrintApiClient;
  private printed: PrintedOrdersStorage;
  private running = false;
  private locked = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<WorkerEventListener> = new Set();
  private consecutiveErrors = 0;

  constructor(
    queue: PrintQueue,
    printer: PrinterManager,
    api: PrintApiClient,
    printed: PrintedOrdersStorage
  ) {
    this.queue = queue;
    this.printer = printer;
    this.api = api;
    this.printed = printed;
  }

  /** Subscribe to worker events */
  onEvent(cb: WorkerEventListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Start processing the queue */
  start(): void {
    this.running = true;
    this.tick();
  }

  /** Stop processing */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Trigger immediate processing */
  nudge(): void {
    if (this.running && !this.locked) {
      this.tick();
    }
  }

  get errors(): number {
    return this.consecutiveErrors;
  }

  // --- Processing ---

  private async tick(): Promise<void> {
    if (!this.running || this.locked) return;

    const job = this.queue.getNextPending();
    if (!job) {
      // Nothing to process – schedule next check
      this.scheduleNext(2000);
      return;
    }

    // Deduplication check
    if (this.printed.has(job.orderId)) {
      await this.queue.updateStatus(job.id, "done");
      this.emit("skipped-duplicate", { orderId: job.orderId });
      this.tick(); // Process next immediately
      return;
    }

    // Check printer
    if (!this.printer.isConnected) {
      this.emit("printer-offline");
      this.scheduleNext(5000);
      return;
    }

    this.locked = true;
    await this.queue.updateStatus(job.id, "printing");

    try {
      // Build ESC/POS bytes
      const { order, items, store, copies, mode } = job.payload;
      const data = buildReceipt(order, items, store, { copies, mode });

      // Send to printer
      const ok = await this.printer.send(data);
      if (!ok) throw new Error("Falha no envio de dados");

      // Mark as printed locally
      await this.printed.mark(job.orderId);
      await this.queue.updateStatus(job.id, "done");

      // Confirm on backend
      try {
        await this.api.confirmPrint(job.orderId, job.storeId);
      } catch {
        // Non-critical – job was printed physically
        this.emit("backend-confirm-failed", { orderId: job.orderId });
      }

      this.consecutiveErrors = 0;
      this.emit("printed", { orderId: job.orderId });

      // Process next immediately
      this.locked = false;
      this.tick();
    } catch (e: any) {
      this.consecutiveErrors++;
      const errorMsg = e.message || "Erro desconhecido";
      await this.queue.updateStatus(job.id, "failed", errorMsg);
      this.emit("error", { orderId: job.orderId, error: errorMsg, attempts: job.attempts + 1 });

      this.locked = false;

      // Exponential backoff based on attempts
      const delay = Math.min(1000 * Math.pow(2, job.attempts), 30_000);
      this.scheduleNext(delay);
    }
  }

  private scheduleNext(delay: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), delay);
  }

  private emit(event: string, data?: any): void {
    this.listeners.forEach(cb => cb(event, data));
  }
}
