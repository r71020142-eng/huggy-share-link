/**
 * WebUSB Adapter
 * Handles low-level USB communication with thermal printers
 */

import { PrinterAdapter, PrinterType, THERMAL_PRINTER_VENDORS } from "./types";

// WebUSB type augmentation
declare global {
  interface USB {
    getDevices(): Promise<any[]>;
  }
}

export class WebUSBAdapter implements PrinterAdapter {
  private device: any = null;
  private endpoint: number = 0;
  private disconnectCbs: Set<() => void> = new Set();
  private boundDisconnect: ((e: any) => void) | null = null;
  private boundConnect: ((e: any) => void) | null = null;

  readonly type: PrinterType = "webusb";

  get isSupported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.usb;
  }

  get isConnected(): boolean {
    return !!this.device?.opened;
  }

  get deviceName(): string | null {
    return this.device?.productName || null;
  }

  get vendorId(): number | null {
    return this.device?.vendorId ?? null;
  }

  get productId(): number | null {
    return this.device?.productId ?? null;
  }

  /** Pair a new device (requires user gesture) */
  async connect(): Promise<void> {
    if (!this.isSupported) throw new Error("WebUSB not supported");

    const device = await navigator.usb!.requestDevice({
      filters: THERMAL_PRINTER_VENDORS.map(v => ({ vendorId: v })),
    });

    await this.openDevice(device);
    this.listenEvents();
  }

  /** Reconnect to a previously paired device (no user gesture needed) */
  async reconnect(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const devices = await navigator.usb!.getDevices();
      if (devices.length === 0) return false;
      await this.openDevice(devices[0]);
      this.listenEvents();
      return true;
    } catch {
      return false;
    }
  }

  /** Send raw bytes to the printer */
  async send(data: Uint8Array): Promise<boolean> {
    if (!this.device?.opened) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      if (this.endpoint > 0) {
        await this.device.transferOut(this.endpoint, data);
      } else {
        await this.device.controlTransferOut({
          requestType: "class",
          recipient: "interface",
          request: 0x09,
          value: 0x0300,
          index: 0,
        }, data);
      }
      return true;
    } catch (e: any) {
      if (e.name === "AbortError") throw new Error("Print timeout (10s)");
      throw e;
    } finally {
      clearTimeout(timeout);
    }
  }

  async disconnect(): Promise<void> {
    this.removeEvents();
    if (this.device?.opened) {
      try { await this.device.close(); } catch { /* ignore */ }
    }
    this.device = null;
    this.endpoint = 0;
  }

  onDisconnect(cb: () => void): () => void {
    this.disconnectCbs.add(cb);
    return () => this.disconnectCbs.delete(cb);
  }

  // --- Private ---

  private async openDevice(device: any): Promise<void> {
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);

    // Find bulk OUT endpoint
    const iface = device.configuration?.interfaces?.[0];
    const alt = iface?.alternates?.[0];
    const ep = alt?.endpoints?.find((e: any) => e.direction === "out");
    this.endpoint = ep?.endpointNumber ?? 0;
    this.device = device;
  }

  private listenEvents(): void {
    if (!navigator.usb) return;

    this.boundDisconnect = (e: any) => {
      if (e.device === this.device) {
        this.device = null;
        this.endpoint = 0;
        this.disconnectCbs.forEach(cb => cb());
      }
    };

    this.boundConnect = () => {
      // Auto-reconnect handled by PrinterManager
    };

    navigator.usb.addEventListener("disconnect", this.boundDisconnect as EventListener);
    navigator.usb.addEventListener("connect", this.boundConnect as EventListener);
  }

  private removeEvents(): void {
    if (!navigator.usb) return;
    if (this.boundDisconnect) {
      navigator.usb.removeEventListener("disconnect", this.boundDisconnect as EventListener);
    }
    if (this.boundConnect) {
      navigator.usb.removeEventListener("connect", this.boundConnect as EventListener);
    }
    this.boundDisconnect = null;
    this.boundConnect = null;
  }
}
