/**
 * Heartbeat – Periodic status update to backend
 */

import { PrintApiClient } from "./api-client";
import { PrinterManager } from "../printer-manager";

export class PrintHeartbeat {
  private api: PrintApiClient;
  private printer: PrinterManager;
  private storeId: string;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(api: PrintApiClient, printer: PrinterManager, storeId: string) {
    this.api = api;
    this.printer = printer;
    this.storeId = storeId;
  }

  /** Start sending heartbeats every 30s */
  start(): void {
    this.stop();
    this.send(); // Immediate first beat
    this.timer = setInterval(() => this.send(), 30_000);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async send(): Promise<void> {
    try {
      await this.api.heartbeat(
        this.storeId,
        this.printer.type,
        this.printer.name
      );
    } catch {
      // Non-critical – will retry next interval
    }
  }
}
