/**
 * Print Engine – Shared Types
 * Sistema de impressão térmica multi-loja
 */

export type PrinterStatus = "online" | "offline" | "reconnecting";
export type PrinterType = "webusb" | "webserial" | "none";
export type PrintJobStatus = "pending" | "printing" | "failed" | "done";

export interface PrintJob {
  id: string;
  orderId: string;
  storeId: string;
  payload: PrintPayload;
  backendJobId?: string;
  allowReprint?: boolean;
  attempts: number;
  maxAttempts: number;
  status: PrintJobStatus;
  createdAt: number;
  lastAttemptAt?: number;
  error?: string;
}

export interface PrintPayload {
  order: Record<string, any>;
  items: Record<string, any>[];
  store: Record<string, any>;
  copies: number;
  mode: "kitchen" | "counter" | "both";
}

export interface StoredDevice {
  id: string;
  vendorId: number;
  productId: number;
  serialNumber?: string;
  name: string;
  type: PrinterType;
  savedAt: number;
}

export interface PrinterAdapter {
  readonly isSupported: boolean;
  readonly isConnected: boolean;
  readonly type: PrinterType;
  deviceName: string | null;
  vendorId: number | null;
  productId: number | null;
  connect(): Promise<void>;
  reconnect(): Promise<boolean>;
  send(data: Uint8Array): Promise<boolean>;
  disconnect(): Promise<void>;
  onDisconnect(cb: () => void): () => void;
}

export interface PrintEngineState {
  printerStatus: PrinterStatus;
  printerType: PrinterType;
  printerName: string | null;
  queue: PrintJob[];
  pendingCount: number;
  lastPrintAt: number | null;
  consecutiveErrors: number;
  recentErrors: string[];
  autoPrint: boolean;
}

/** Known thermal printer USB vendor IDs */
export const THERMAL_PRINTER_VENDORS = [
  0x0416, 0x0483, 0x04b8, 0x067b, 0x0fe6,
  0x1a86, 0x1504, 0x154f, 0x0dd4, 0x0ec0, 0x0000,
];
