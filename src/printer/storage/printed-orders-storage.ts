/**
 * Printed Orders Storage – Anti-duplication layer using IndexedDB
 * Tracks which order IDs have been successfully printed
 */

import { idbPut, idbGet, idbGetAll, STORES } from "../db";

interface PrintedRecord {
  orderId: string;
  printedAt: number;
}

export class PrintedOrdersStorage {
  private memorySet: Set<string> = new Set();

  /** Load all previously printed order IDs into memory */
  async init(): Promise<void> {
    try {
      const records = await idbGetAll<PrintedRecord>(STORES.PRINTED_ORDERS);
      records.forEach(r => this.memorySet.add(r.orderId));
    } catch {
      // IndexedDB unavailable – memory-only mode
    }
  }

  /** Check if an order has already been printed */
  has(orderId: string): boolean {
    return this.memorySet.has(orderId);
  }

  /** Mark an order as printed */
  async mark(orderId: string): Promise<void> {
    this.memorySet.add(orderId);
    try {
      await idbPut<PrintedRecord>(STORES.PRINTED_ORDERS, {
        orderId,
        printedAt: Date.now(),
      });
    } catch {
      // Memory fallback – still tracked in memorySet
    }
  }

  /** Number of printed orders tracked */
  get size(): number {
    return this.memorySet.size;
  }
}
