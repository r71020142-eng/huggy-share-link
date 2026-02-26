/**
 * ESC/POS Receipt Builder
 * Pure function – no USB, no queue, no API dependencies
 * Generates raw byte commands for 58mm thermal printers
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const COL_WIDTH = 32;

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text + "\n");
}

function pad(left: string, center: string, right: string): string {
  const c = center.padStart(3);
  const r = right.padStart(8);
  const lw = COL_WIDTH - c.length - r.length;
  return left.substring(0, lw).padEnd(lw) + c + r;
}

function brl(value: number): string {
  return `R$ ${(value || 0).toFixed(2)}`;
}

interface ReceiptConfig {
  copies?: number;
  mode?: "kitchen" | "counter" | "both";
}

export function buildReceipt(
  order: Record<string, any>,
  items: Record<string, any>[],
  store: Record<string, any>,
  config: ReceiptConfig = {}
): Uint8Array {
  const { copies = 1, mode = "both" } = config;
  const parts: Uint8Array[] = [];

  const bytes = (...b: number[]) => parts.push(new Uint8Array(b));
  const text = (t: string) => parts.push(encode(t));
  const line = () => text("================================");
  const init = () => bytes(ESC, 0x40);
  const center = () => bytes(ESC, 0x61, 1);
  const left = () => bytes(ESC, 0x61, 0);
  const bold = (on: boolean) => bytes(ESC, 0x45, on ? 1 : 0);
  const big = (on: boolean) => bytes(GS, 0x21, on ? 0x11 : 0x00);
  const feed = (n: number) => { for (let i = 0; i < n; i++) bytes(LF); };
  const cut = () => bytes(GS, 0x56, 0x00);

  for (let copy = 0; copy < copies; copy++) {
    const via = copies > 1
      ? (copy === 0 ? "1ª VIA - COZINHA" : "2ª VIA - BALCÃO")
      : (mode === "kitchen" ? "COZINHA" : mode === "counter" ? "BALCÃO" : "COZINHA/BALCÃO");

    init();
    center(); bold(true); big(true);
    text((store?.name || "LOJA").toUpperCase());
    big(false); bold(false);
    text("NAO E DOCUMENTO FISCAL");
    if (store?.address) text(store.address);
    if (store?.whatsapp) text(`Tel: ${store.whatsapp}`);
    line();
    bold(true); text(`[ ${via} ]`); bold(false);
    line();
    left();

    const date = new Date(order.created_at).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const typeLabel = order.order_type === "delivery" ? "TELE-ENTREGA" : "RETIRADA";
    text(`Pedido ${typeLabel}`);
    bold(true); big(true);
    text(`#${order.tracking_code || "---"}`);
    big(false); bold(false);
    if (order.order_type === "delivery") text("[RECEBER EM CASA]");
    text(`Data: ${date}`);
    line();

    bold(true); text(`Cliente: ${order.customer_name}`); bold(false);
    if (order.customer_address) text(`End: ${order.customer_address}`);
    if (order.customer_phone) text(`Tel: ${order.customer_phone}`);
    line();

    text(pad("ITEM", "QTD", "VALOR"));
    text("--------------------------------");

    for (const item of items) {
      const name = (item.product_name || "").substring(0, 18);
      text(pad(name, String(item.quantity), brl(item.subtotal)));
      if (item.additionals) {
        try {
          const adds = typeof item.additionals === "string"
            ? JSON.parse(item.additionals)
            : item.additionals;
          if (Array.isArray(adds)) {
            for (const a of adds) {
              const aName = typeof a === "string" ? a : (a.name || "");
              const aPrice = a.price ? ` +${brl(a.price)}` : "";
              text(`  + ${aName}${aPrice}`);
            }
          }
        } catch { /* malformed additionals – skip */ }
      }
    }

    line();
    text(`Produtos:       ${brl(order.subtotal)}`);
    if (order.delivery_fee > 0) {
      text(`Taxa Entrega:   ${brl(order.delivery_fee)}`);
    }
    line();
    bold(true); big(true);
    text(`TOTAL: ${brl(order.total)}`);
    big(false); bold(false);
    line();

    if (order.payment_method) text(`Pagamento: ${order.payment_method}`);
    if (order.notes) {
      text("--------------------------------");
      bold(true); text(`OBS: ${order.notes}`); bold(false);
    }

    feed(3);
    cut();
  }

  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { result.set(p, offset); offset += p.length; }
  return result;
}
