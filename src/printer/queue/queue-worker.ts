/**
 * Queue Worker – Sequentially processes print jobs with retry and backoff
 * One job at a time. Locked processing to prevent concurrent prints.
 * Logs every print attempt to the backend for observability.
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
  private storeId: string;
  private running = false;
  private locked = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<WorkerEventListener> = new Set();
  private consecutiveErrors = 0;

  constructor(
    queue: PrintQueue,
    printer: PrinterManager,
    api: PrintApiClient,
    printed: PrintedOrdersStorage,
    storeId: string
  ) {
    this.queue = queue;
    this.printer = printer;
    this.api = api;
    this.printed = printed;
    this.storeId = storeId;
  }

  onEvent(cb: WorkerEventListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  start(): void {
    this.running = true;
    this.tick();
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  nudge(): void {
    if (this.running && !this.locked) {
      this.tick();
    }
  }

  get errors(): number {
    return this.consecutiveErrors;
  }

  private async tick(): Promise<void> {
    if (!this.running || this.locked) return;

    const job = this.queue.getNextPending();
    if (!job) {
      this.scheduleNext(2000);
      return;
    }

    // CRITICAL: Verify job belongs to this store
    if (job.storeId !== this.storeId) {
      console.warn("[QueueWorker] Skipping job from different store:", job.storeId);
      await this.queue.updateStatus(job.id, "done");
      this.tick();
      return;
    }

    // Deduplication check
    if (!job.allowReprint && this.printed.has(job.orderId)) {
      await this.queue.updateStatus(job.id, "done");
      this.emit("skipped-duplicate", { orderId: job.orderId });
      this.tick();
      return;
    }

    if (!this.printer.isConnected) {
      this.emit("printer-offline");
      this.scheduleNext(5000);
      return;
    }

    this.locked = true;
    await this.queue.updateStatus(job.id, "printing");

    try {
      const { order, items, store, copies, mode } = job.payload;
      const data = buildReceipt(order, items, store, { copies, mode });

      const ok = await this.printer.send(data);
      if (!ok) throw new Error("Falha no envio de dados");

      await this.printed.mark(job.orderId);
      await this.queue.updateStatus(job.id, "done");

      // Confirm on backend
      try {
        if (job.backendJobId) {
          await this.api.confirmJob(job.backendJobId);
        } else {
          await this.api.confirmPrint(job.orderId, job.storeId);
        }
      } catch {
        this.emit("backend-confirm-failed", { orderId: job.orderId });
      }

      // Log success to print_logs
      this.api.logPrint(
        this.storeId,
        job.orderId,
        job.id,
        "success",
        job.attempts + 1
      ).catch(() => {});

      // Update runtime metrics
      this.api.updateRuntimeStatus(this.storeId, {
        last_print_at: new Date().toISOString(),
      }).catch(() => {});

      this.consecutiveErrors = 0;
      this.emit("printed", { orderId: job.orderId });

      this.locked = false;
      this.tick();
    } catch (e: any) {
      this.consecutiveErrors++;
      const errorMsg = e.message || "Erro desconhecido";
      await this.queue.updateStatus(job.id, "failed", errorMsg);
      this.emit("error", { orderId: job.orderId, error: errorMsg, attempts: job.attempts + 1 });

      if (job.backendJobId) {
        this.api.markJobFailed(job.backendJobId, errorMsg).catch(() => {});
      } else {
        this.api.markFailed(job.orderId, job.storeId, errorMsg).catch(() => {});
      }

      // Log failure to print_logs
      this.api.logPrint(
        this.storeId,
        job.orderId,
        job.id,
        "failed",
        job.attempts + 1,
        errorMsg
      ).catch(() => {});

      this.locked = false;

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
