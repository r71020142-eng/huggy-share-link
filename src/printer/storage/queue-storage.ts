/**
 * Queue Storage – Persistent print job queue in IndexedDB
 */

import { PrintJob, PrintJobStatus } from "../types";
import { idbPut, idbGet, idbDelete, idbGetAll, STORES } from "../db";

export class QueueStorage {
  /** Persist a job */
  static async save(job: PrintJob): Promise<void> {
    await idbPut(STORES.QUEUE, job);
  }

  /** Get a job by ID */
  static async get(id: string): Promise<PrintJob | undefined> {
    return idbGet<PrintJob>(STORES.QUEUE, id);
  }

  /** Remove a completed/cancelled job */
  static async remove(id: string): Promise<void> {
    await idbDelete(STORES.QUEUE, id);
  }

  /** Get all jobs */
  static async getAll(): Promise<PrintJob[]> {
    return idbGetAll<PrintJob>(STORES.QUEUE);
  }

  /** Get jobs filtered by status */
  static async getByStatus(status: PrintJobStatus): Promise<PrintJob[]> {
    const all = await QueueStorage.getAll();
    return all.filter(j => j.status === status);
  }

  /** Update job status and optionally error/attempts */
  static async update(id: string, patch: Partial<PrintJob>): Promise<PrintJob | null> {
    const job = await QueueStorage.get(id);
    if (!job) return null;
    const updated = { ...job, ...patch };
    await QueueStorage.save(updated);
    return updated;
  }
}
