/**
 * WebSerial Adapter – Fallback for printers not compatible with WebUSB
 * Uses navigator.serial API (Chrome/Edge 89+)
 */

import { PrinterAdapter, PrinterType } from "./types";

declare global {
  interface Navigator {
    serial?: {
      requestPort(options?: { filters?: Array<{ usbVendorId?: number }> }): Promise<any>;
      getPorts(): Promise<any[]>;
      addEventListener(type: string, listener: EventListener): void;
      removeEventListener(type: string, listener: EventListener): void;
    };
  }
}

export class WebSerialAdapter implements PrinterAdapter {
  private port: any = null;
  private writer: WritableStreamDefaultWriter | null = null;
  private disconnectCbs: Set<() => void> = new Set();
  private boundDisconnect: EventListener | null = null;

  readonly type: PrinterType = "webserial";

  get isSupported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.serial;
  }

  get isConnected(): boolean {
    return !!this.port?.readable;
  }

  get deviceName(): string | null {
    if (!this.port) return null;
    const info = this.port.getInfo?.();
    if (info?.usbVendorId) {
      return `Serial (0x${info.usbVendorId.toString(16)})`;
    }
    return "Impressora Serial";
  }

  get vendorId(): number | null {
    return this.port?.getInfo?.()?.usbVendorId ?? null;
  }

  get productId(): number | null {
    return this.port?.getInfo?.()?.usbProductId ?? null;
  }

  /** Request a serial port (requires user gesture) */
  async connect(): Promise<void> {
    if (!this.isSupported) throw new Error("WebSerial not supported");

    const port = await navigator.serial!.requestPort();
    await this.openPort(port);
    this.listenEvents();
  }

  /** Reconnect to a previously authorized port */
  async reconnect(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const ports = await navigator.serial!.getPorts();
      if (ports.length === 0) return false;
      await this.openPort(ports[0]);
      this.listenEvents();
      return true;
    } catch {
      return false;
    }
  }

  /** Send raw bytes */
  async send(data: Uint8Array): Promise<boolean> {
    if (!this.writer) return false;

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Serial print timeout (10s)")), 10_000)
    );

    try {
      await Promise.race([this.writer.write(data), timeout]);
      return true;
    } catch (e) {
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    this.removeEvents();
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port?.readable) {
        await this.port.close();
      }
    } catch { /* ignore */ }
    this.port = null;
  }

  onDisconnect(cb: () => void): () => void {
    this.disconnectCbs.add(cb);
    return () => this.disconnectCbs.delete(cb);
  }

  // --- Private ---

  private async openPort(port: any): Promise<void> {
    await port.open({ baudRate: 9600 });
    this.port = port;
    this.writer = port.writable.getWriter();
  }

  private listenEvents(): void {
    if (!navigator.serial) return;

    this.boundDisconnect = ((e: any) => {
      if (e.target === this.port || e.port === this.port) {
        this.writer = null;
        this.port = null;
        this.disconnectCbs.forEach(cb => cb());
      }
    }) as EventListener;

    navigator.serial.addEventListener("disconnect", this.boundDisconnect);
  }

  private removeEvents(): void {
    if (!navigator.serial || !this.boundDisconnect) return;
    navigator.serial.removeEventListener("disconnect", this.boundDisconnect);
    this.boundDisconnect = null;
  }
}
