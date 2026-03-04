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

  /** Pair a new device (requires user gesture) – shows ALL USB devices */
  async connect(): Promise<void> {
    if (!this.isSupported) throw new Error("WebUSB not supported");

    // Try with known vendor filters first, then fallback to no filter
    let device: any;
    try {
      device = await navigator.usb!.requestDevice({
        filters: THERMAL_PRINTER_VENDORS.map(v => ({ vendorId: v })),
      });
    } catch (e: any) {
      if (e.name === "NotFoundError") {
        // User cancelled or no device matched filters – try without filters
        try {
          device = await navigator.usb!.requestDevice({ filters: [] });
        } catch (e2: any) {
          throw e2; // propagate (NotFoundError = user cancelled)
        }
      } else {
        throw e;
      }
    }

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
    // If already open, try to close first
    if (device.opened) {
      try { await device.close(); } catch { /* ignore */ }
    }

    try {
      await device.open();
    } catch (e: any) {
      if (e.message?.includes("Access denied") || e.name === "SecurityError") {
        throw new Error(
          "Acesso negado ao dispositivo USB. Feche outras abas/programas que possam estar usando a impressora e tente novamente."
        );
      }
      throw e;
    }

    if (device.configuration === null) {
      try {
        await device.selectConfiguration(1);
      } catch {
        // Some devices don't support selectConfiguration
      }
    }

    // Try to reset device before claiming (helps release stale claims)
    try {
      if (typeof device.reset === "function") {
        await device.reset();
      }
    } catch {
      // reset() not supported on all devices, continue
    }

    // Try to claim an interface — iterate all available interfaces
    let claimedInterface: number | null = null;
    const interfaces = device.configuration?.interfaces || [];
    
    for (const iface of interfaces) {
      const ifaceNum = iface.interfaceNumber;
      try {
        await device.claimInterface(ifaceNum);
        claimedInterface = ifaceNum;
        break;
      } catch {
        // Try release + reclaim
        try {
          await device.releaseInterface(ifaceNum);
          await device.claimInterface(ifaceNum);
          claimedInterface = ifaceNum;
          break;
        } catch {
          continue;
        }
      }
    }

    if (claimedInterface === null) {
      await device.close();
      throw new Error(
        "Não foi possível acessar a interface USB. Desconecte e reconecte a impressora fisicamente, feche outros programas que a usam (ex: driver POS), ou tente Conectar via Serial."
      );
    }

    // Find bulk OUT endpoint on the claimed interface
    const iface = interfaces.find((i: any) => i.interfaceNumber === claimedInterface);
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
