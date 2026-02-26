/**
 * Printer Manager
 * Orchestrates WebUSB → WebSerial fallback, reconnection, and status tracking
 */

import { PrinterAdapter, PrinterStatus, PrinterType, StoredDevice } from "./types";
import { WebUSBAdapter } from "./webusb-adapter";
import { WebSerialAdapter } from "./webserial-adapter";
import { DeviceStorage } from "./storage/device-storage";

type StatusListener = (status: PrinterStatus, type: PrinterType, name: string | null) => void;

export class PrinterManager {
  private static instance: PrinterManager | null = null;

  static getInstance(): PrinterManager {
    if (!PrinterManager.instance) {
      PrinterManager.instance = new PrinterManager();
    }
    return PrinterManager.instance;
  }

  private usb: WebUSBAdapter;
  private serial: WebSerialAdapter;
  private active: PrinterAdapter | null = null;
  private _status: PrinterStatus = "offline";
  private listeners: Set<StatusListener> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private unsubDisconnect: (() => void) | null = null;

  private constructor() {
    this.usb = new WebUSBAdapter();
    this.serial = new WebSerialAdapter();
  }

  get status(): PrinterStatus { return this._status; }
  get type(): PrinterType { return this.active?.type ?? "none"; }
  get name(): string | null { return this.active?.deviceName ?? null; }
  get isConnected(): boolean { return this.active?.isConnected ?? false; }
  get usbSupported(): boolean { return this.usb.isSupported; }
  get serialSupported(): boolean { return this.serial.isSupported; }

  /** Subscribe to status changes */
  onStatusChange(cb: StatusListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Pair a new printer (requires user gesture) – specify mode to avoid gesture loss */
  async pair(mode: "usb" | "serial" = "usb"): Promise<void> {
    if (mode === "usb") {
      if (!this.usb.isSupported) throw new Error("WebUSB não é suportado neste navegador");
      await this.usb.connect();
      await this.activate(this.usb);
      return;
    }

    if (mode === "serial") {
      if (!this.serial.isSupported) throw new Error("WebSerial não é suportado neste navegador");
      await this.serial.connect();
      await this.activate(this.serial);
      return;
    }

    throw new Error("Nenhuma API de impressão suportada neste navegador");
  }

  /** Auto-reconnect on page load using saved device */
  async autoReconnect(): Promise<boolean> {
    // Try WebUSB first
    if (this.usb.isSupported) {
      const ok = await this.usb.reconnect();
      if (ok) {
        await this.activate(this.usb);
        return true;
      }
    }

    // Try WebSerial
    if (this.serial.isSupported) {
      const ok = await this.serial.reconnect();
      if (ok) {
        await this.activate(this.serial);
        return true;
      }
    }

    return false;
  }

  /** Send data to the active printer */
  async send(data: Uint8Array): Promise<boolean> {
    if (!this.active?.isConnected) {
      throw new Error("Nenhuma impressora conectada");
    }
    return this.active.send(data);
  }

  /** Disconnect the active printer */
  async disconnect(): Promise<void> {
    this.stopHealthCheck();
    this.clearReconnectTimer();
    if (this.unsubDisconnect) {
      this.unsubDisconnect();
      this.unsubDisconnect = null;
    }
    if (this.active) {
      await this.active.disconnect();
      this.active = null;
    }
    await DeviceStorage.clear();
    this.setStatus("offline");
  }

  /** Destroy all timers and listeners */
  destroy(): void {
    this.stopHealthCheck();
    this.clearReconnectTimer();
    if (this.unsubDisconnect) {
      this.unsubDisconnect();
      this.unsubDisconnect = null;
    }
    this.listeners.clear();
  }

  // --- Private ---

  private async activate(adapter: PrinterAdapter): Promise<void> {
    this.active = adapter;
    this.setStatus("online");

    // Save device info
    if (adapter.vendorId !== null) {
      await DeviceStorage.save({
        id: `${adapter.vendorId}-${adapter.productId}`,
        vendorId: adapter.vendorId!,
        productId: adapter.productId ?? 0,
        name: adapter.deviceName ?? "Printer",
        type: adapter.type,
        savedAt: Date.now(),
      });
    }

    // Listen for disconnect
    if (this.unsubDisconnect) this.unsubDisconnect();
    this.unsubDisconnect = adapter.onDisconnect(() => {
      this.active = null;
      this.setStatus("reconnecting");
      this.scheduleReconnect();
    });

    this.startHealthCheck();
  }

  private setStatus(status: PrinterStatus): void {
    this._status = status;
    this.listeners.forEach(cb => cb(status, this.type, this.name));
  }

  private scheduleReconnect(attempt = 0): void {
    this.clearReconnectTimer();
    const delay = Math.min(1000 * Math.pow(2, attempt), 30_000);

    this.reconnectTimer = setTimeout(async () => {
      const ok = await this.autoReconnect();
      if (!ok && attempt < 10) {
        this.scheduleReconnect(attempt + 1);
      } else if (!ok) {
        this.setStatus("offline");
      }
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHealthCheck(): void {
    this.stopHealthCheck();
    this.healthTimer = setInterval(() => {
      if (this.active && !this.active.isConnected) {
        this.setStatus("reconnecting");
        this.scheduleReconnect();
      }
    }, 15_000);
  }

  private stopHealthCheck(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }
}
