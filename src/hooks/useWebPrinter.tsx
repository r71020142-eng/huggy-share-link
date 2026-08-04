import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Web USB type augmentation (not in default TS lib)
declare global {
  interface USB {
    requestDevice(options: { filters: Array<{ vendorId?: number }> }): Promise<any>;
    addEventListener(type: string, listener: (e: any) => void): void;
    removeEventListener(type: string, listener: (e: any) => void): void;
  }
  interface Navigator {
    usb?: USB;
  }
}

// ESC/POS constants
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

// Known thermal printer USB vendor IDs
const THERMAL_PRINTER_VENDORS = [
  0x0416, // WinBond (many POS printers)
  0x0483, // STMicroelectronics
  0x04b8, // Epson
  0x067b, // Prolific (USB-Serial adapters)
  0x0fe6, // ICS (Kontron)
  0x1a86, // QinHeng (CH340/CH341)
  0x1504, // CUSTOM
  0x154f, // SNBC
  0x0dd4, // Custom Engineering
  0x0ec0, // Bematech (most 58mm printers)
  0x0000, // Generic
];

interface PrinterInfo {
  device: any;
  name: string;
  vendorId: number;
  productId: number;
  connected: boolean;
}

function textEncoder(text: string): Uint8Array {
  // Simple CP437/Latin encoding for Portuguese chars
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

function padColumns(left: string, center: string, right: string): string {
  const totalWidth = 32;
  const centerStr = center.padStart(3);
  const rightStr = right.padStart(8);
  const leftWidth = totalWidth - centerStr.length - rightStr.length;
  return left.substring(0, leftWidth).padEnd(leftWidth) + centerStr + rightStr;
}

function formatBRL(value: number): string {
  return `R$ ${(value || 0).toFixed(2)}`;
}

function buildEscPosBytes(order: any, items: any[], store: any, copies = 1, mode = "both"): Uint8Array {
  const parts: Uint8Array[] = [];

  const addBytes = (...bytes: number[]) => parts.push(new Uint8Array(bytes));
  const addText = (text: string) => parts.push(textEncoder(text + "\n"));
  const addLine = () => addText("================================");

  // Commands
  const init = () => addBytes(ESC, 0x40); // Initialize
  const alignCenter = () => addBytes(ESC, 0x61, 1);
  const alignLeft = () => addBytes(ESC, 0x61, 0);
  const bold = (on: boolean) => addBytes(ESC, 0x45, on ? 1 : 0);
  const doubleSize = (on: boolean) => addBytes(GS, 0x21, on ? 0x11 : 0x00);
  const feed = (lines: number) => { for (let i = 0; i < lines; i++) addBytes(LF); };
  const cut = () => addBytes(GS, 0x56, 0x00);

  for (let copy = 0; copy < copies; copy++) {
    const viaLabel = copies > 1
      ? (copy === 0 ? "1ª VIA - COZINHA" : "2ª VIA - BALCÃO")
      : (mode === "kitchen" ? "COZINHA" : mode === "counter" ? "BALCÃO" : "COZINHA/BALCÃO");

    init();
    alignCenter();
    bold(true);
    doubleSize(true);
    addText((store?.name || "ACAI LAB").toUpperCase());
    doubleSize(false);
    bold(false);
    addText("NAO E DOCUMENTO FISCAL");
    if (store?.address) addText(store.address);
    if (store?.whatsapp) addText(`Tel: ${store.whatsapp}`);
    addLine();
    bold(true);
    addText(`[ ${viaLabel} ]`);
    bold(false);
    addLine();
    alignLeft();

    const dateStr = new Date(order.created_at).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
    const orderTypeLabel = order.order_type === "delivery" ? "TELE-ENTREGA" : "RETIRADA";
    addText(`Pedido ${orderTypeLabel}`);
    bold(true);
    doubleSize(true);
    addText(`#${order.tracking_code || "---"}`);
    doubleSize(false);
    bold(false);
    if (order.order_type === "delivery") addText("[RECEBER EM CASA]");
    addText(`Data: ${dateStr}`);
    addLine();
    bold(true);
    addText(`Cliente: ${order.customer_name}`);
    bold(false);
    if (order.customer_address) {
      const addr = order.customer_address;
      for (let i = 0; i < addr.length; i += 32) {
        addText(`End: ${addr.substring(i, i + 32)}`);
      }
    }
    if (order.customer_phone) addText(`Tel: ${order.customer_phone}`);
    addLine();
    addText(padColumns("ITEM", "QTD", "VALOR"));
    addText("--------------------------------");

    for (const item of items) {
      const name = (item.product_name || "").substring(0, 18);
      addText(padColumns(name, String(item.quantity), formatBRL(item.subtotal)));
      if (item.additionals) {
        try {
          const adds = typeof item.additionals === "string" ? JSON.parse(item.additionals) : item.additionals;
          if (Array.isArray(adds)) {
            for (const a of adds) {
              const addName = typeof a === "string" ? a : (a.name || "");
              const addPrice = a.price ? ` +${formatBRL(a.price)}` : "";
              addText(`  + ${addName}${addPrice}`);
            }
          }
        } catch { /* ignore */ }
      }
    }

    addLine();
    addText(`Produtos:       ${formatBRL(order.subtotal)}`);
    if (order.delivery_fee && order.delivery_fee > 0) {
      addText(`Taxa Entrega:   ${formatBRL(order.delivery_fee)}`);
    }
    addLine();
    bold(true);
    doubleSize(true);
    addText(`TOTAL: ${formatBRL(order.total)}`);
    doubleSize(false);
    bold(false);
    addLine();
    if (order.payment_method) addText(`Pagamento: ${order.payment_method}`);
    if (order.notes) {
      addText("--------------------------------");
      bold(true);
      addText(`OBS: ${order.notes}`);
      bold(false);
    }
    feed(3);
    cut();
  }

  // Merge all parts
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}

export function useWebPrinter(storeId: string | undefined) {
  const [printer, setPrinter] = useState<PrinterInfo | null>(null);
  const [autoPrint, setAutoPrint] = useState(true);
  const [printing, setPrinting] = useState(false);
  const printedIds = useRef(new Set<string>());
  const printerRef = useRef<PrinterInfo | null>(null);
  const autoPrintRef = useRef(true);

  // Keep refs in sync
  useEffect(() => { printerRef.current = printer; }, [printer]);
  useEffect(() => { autoPrintRef.current = autoPrint; }, [autoPrint]);

  // Check if Web USB is supported
  const isSupported = typeof navigator !== "undefined" && !!navigator.usb;

  const pairPrinter = useCallback(async () => {
    if (!navigator.usb) {
      toast.error("Web USB não suportado neste navegador. Use o Google Chrome.");
      return;
    }
    try {
      const device = await navigator.usb.requestDevice({
        filters: THERMAL_PRINTER_VENDORS.map(v => ({ vendorId: v })),
      });
      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }
      await device.claimInterface(0);

      const info: PrinterInfo = {
        device,
        name: device.productName || `Impressora USB (${device.vendorId.toString(16)})`,
        vendorId: device.vendorId,
        productId: device.productId,
        connected: true,
      };
      setPrinter(info);
      toast.success(`Impressora "${info.name}" conectada!`);
    } catch (e: any) {
      if (e.name !== "NotFoundError") {
        toast.error("Erro ao conectar impressora: " + e.message);
      }
    }
  }, []);

  const disconnectPrinter = useCallback(async () => {
    if (printer?.device?.opened) {
      try { await printer.device.close(); } catch { /* ignore */ }
    }
    setPrinter(null);
    toast.info("Impressora desconectada");
  }, [printer]);

  const sendData = useCallback(async (data: Uint8Array) => {
    const p = printerRef.current;
    if (!p?.device?.opened) {
      toast.error("Impressora não conectada");
      return false;
    }
    try {
      // Find the bulk OUT endpoint
      const iface = p.device.configuration?.interfaces?.[0];
      const alternate = iface?.alternates?.[0];
      const endpoint = alternate?.endpoints?.find(e => e.direction === "out");

      if (endpoint) {
        await p.device.transferOut(endpoint.endpointNumber, data);
      } else {
        // Fallback: try control transfer
        await p.device.controlTransferOut({
          requestType: "class",
          recipient: "interface",
          request: 0x09,
          value: 0x0300,
          index: 0,
        }, data);
      }
      return true;
    } catch (e: any) {
      toast.error("Erro na impressão: " + e.message);
      return false;
    }
  }, []);

  const testPrint = useCallback(async () => {
    setPrinting(true);
    const testOrder = {
      tracking_code: "TESTE001",
      created_at: new Date().toISOString(),
      order_type: "delivery",
      customer_name: "Cliente Teste",
      customer_phone: "(00) 00000-0000",
      customer_address: "Rua Teste, 123 - Centro",
      subtotal: 35.90,
      delivery_fee: 5.00,
      total: 40.90,
      payment_method: "Dinheiro",
      notes: "Sem cebola",
    };
    const testItems = [
      { product_name: "Açaí 500ml", quantity: 2, subtotal: 35.90, additionals: [{ name: "Granola", price: 2.00 }, { name: "Leite Condensado" }] },
    ];
    const data = buildEscPosBytes(testOrder, testItems, { name: "Açaí Lab - Teste" }, 1, "both");
    const ok = await sendData(data);
    if (ok) toast.success("Impressão de teste enviada!");
    setPrinting(false);
  }, [sendData]);

  const printOrder = useCallback(async (order: any) => {
    if (!printerRef.current?.connected) return;
    setPrinting(true);
    try {
      const { data: items } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      const { data: storeData } = await supabase.from("stores").select("name, address, whatsapp").eq("id", order.store_id).single();
      const bytes = buildEscPosBytes(order, items || [], storeData || {}, 1, "both");
      const ok = await sendData(bytes);
      if (ok) toast.success(`Pedido #${order.tracking_code || order.id.substring(0, 8)} impresso!`);
    } catch (e: any) {
      toast.error("Erro ao imprimir pedido: " + e.message);
    }
    setPrinting(false);
  }, [sendData]);

  // Realtime: auto-print new orders
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`web-print-${storeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` },
        async (payload) => {
          const order = payload.new as any;
          if (printedIds.current.has(order.id)) return;
          printedIds.current.add(order.id);

          if (autoPrintRef.current && printerRef.current?.connected) {
            await printOrder(order);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeId, printOrder]);

  // Detect disconnect
  useEffect(() => {
    if (!navigator.usb) return;
    const handleDisconnect = (e: any) => {
      if (printer && e.device === printer.device) {
        setPrinter(prev => prev ? { ...prev, connected: false } : null);
        toast.warning("Impressora desconectada do USB");
      }
    };
    navigator.usb.addEventListener("disconnect", handleDisconnect);
    return () => navigator.usb.removeEventListener("disconnect", handleDisconnect);
  }, [printer]);

  return {
    printer,
    autoPrint,
    setAutoPrint,
    printing,
    isSupported,
    pairPrinter,
    disconnectPrinter,
    testPrint,
    printOrder,
  };
}
