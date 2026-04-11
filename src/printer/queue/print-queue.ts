/**
 * Print Queue – Manages the ordered list of print jobs
 * Handles enqueue, dequeue, status transitions, deduplication check
 */

import { PrintJob, PrintJobStatus, PrintPayload } from "../types";
import { QueueStorage } from "../storage/queue-storage";

type QueueListener = (jobs: PrintJob[]) => void;

export class PrintQueue {
  private jobs: PrintJob[] = [];
  private listeners: Set<QueueListener> = new Set();

  private sortJobs(): void {
    this.jobs.sort((a, b) => a.createdAt - b.createdAt);
  }

  /** Load persisted queue from IndexedDB */
  async init(): Promise<void> {
    this.jobs = await QueueStorage.getAll();
    // Reset any stale "printing" jobs back to pending
    for (const job of this.jobs) {
      if (job.status === "printing") {
        job.status = "pending";
        await QueueStorage.save(job);
      }
    }
    this.sortJobs();
    this.notify();
  }

  /** Subscribe to queue state changes */
  onChange(cb: QueueListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Check if an order is already in the queue */
  hasOrder(orderId: string): boolean {
    return this.jobs.some(j => j.orderId === orderId && j.status !== "done");
  }

  /** Add a new print job */
  async enqueue(
    orderId: string,
    storeId: string,
    payload: PrintPayload,
    options?: { backendJobId?: string; allowReprint?: boolean }
  ): Promise<PrintJob> {
    const job: PrintJob = {
      id: `pj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      orderId,
      storeId,
      payload,
      backendJobId: options?.backendJobId,
      allowReprint: options?.allowReprint ?? false,
      attempts: 0,
      maxAttempts: 5,
      status: "pending",
      createdAt: Date.now(),
    };
    await QueueStorage.save(job);
    this.jobs.push(job);
    this.sortJobs();
    this.notify();
    return job;
  }

  /** Get the next pending job */
  getNextPending(): PrintJob | null {
    return this.jobs
      .filter(j => j.status === "pending")
      .sort((a, b) => a.createdAt - b.createdAt)[0] ?? null;
  }

  /** Update a job's status */
  async updateStatus(jobId: string, status: PrintJobStatus, error?: string): Promise<void> {
    const idx = this.jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return;

    const patch: Partial<PrintJob> = { status };
    if (status === "printing" || status === "failed") {
      patch.attempts = this.jobs[idx].attempts + (status === "failed" ? 1 : 0);
      patch.lastAttemptAt = Date.now();
    }
    if (error) patch.error = error;

    // If exceeded max attempts, mark as permanently failed
    if (status === "failed" && (this.jobs[idx].attempts + 1) >= this.jobs[idx].maxAttempts) {
      patch.status = "failed";
    }

    const updated = await QueueStorage.update(jobId, patch);
    if (updated) {
      this.jobs[idx] = updated;
      this.notify();
    }
  }

  /** Remove completed/failed jobs from memory (keep in storage for history) */
  async removeCompleted(): Promise<void> {
    const toRemove = this.jobs.filter(j => j.status === "done");
    for (const j of toRemove) {
      await QueueStorage.remove(j.id);
    }
    this.jobs = this.jobs.filter(j => j.status !== "done");
    this.notify();
  }

  /** Get current queue snapshot */
  getAll(): PrintJob[] {
    return [...this.jobs];
  }

  get pendingCount(): number {
    return this.jobs.filter(j => j.status === "pending" || j.status === "printing").length;
  }

  private notify(): void {
    const snapshot = this.getAll();
    this.listeners.forEach(cb => cb(snapshot));
  }
}
