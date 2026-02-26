/**
 * ESC/POS Receipt Builder
 * 58mm thermal printer – 32 columns – CP850 encoding
 * Replica exata da comanda original (sem double width/height)
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const WIDTH = 32;

// ─── CP850 Encoding Map ───────────────────────────────────────
const CP850_MAP: Record<number, number> = {
  0x00c7: 0x80, 0x00fc: 0x81, 0x00e9: 0x82, 0x00e2: 0x83,
  0x00e4: 0x84, 0x00e0: 0x85, 0x00e5: 0x86, 0x00e7: 0x87,
  0x00ea: 0x88, 0x00eb: 0x89, 0x00e8: 0x8a, 0x00ef: 0x8b,
  0x00ee: 0x8c, 0x00ec: 0x8d, 0x00c4: 0x8e, 0x00c5: 0x8f,
  0x00c9: 0x90, 0x00e6: 0x91, 0x00c6: 0x92, 0x00f4: 0x93,
  0x00f6: 0x94, 0x00f2: 0x95, 0x00fb: 0x96, 0x00f9: 0x97,
  0x00ff: 0x98, 0x00d6: 0x99, 0x00dc: 0x9a, 0x00f8: 0x9b,
  0x00a3: 0x9c, 0x00d8: 0x9d, 0x00d7: 0x9e, 0x00e1: 0xa0,
  0x00ed: 0xa1, 0x00f3: 0xa2, 0x00fa: 0xa3, 0x00f1: 0xa4,
  0x00d1: 0xa5, 0x00aa: 0xa6, 0x00ba: 0xa7, 0x00bf: 0xa8,
  0x00ae: 0xa9, 0x00ac: 0xaa, 0x00bd: 0xab, 0x00bc: 0xac,
  0x00a1: 0xad, 0x00ab: 0xae, 0x00bb: 0xaf,
  0x00c3: 0xb7, 0x00e3: 0xc7, 0x00c0: 0xb7, 0x00c1: 0xb5,
  0x00c2: 0xb6, 0x00ca: 0xd2, 0x00cd: 0xd6, 0x00d3: 0xe0,
  0x00da: 0xe9,
};

function encodeCP850(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i)!;
    if (cp < 0x80) bytes.push(cp);
    else if (CP850_MAP[cp] !== undefined) bytes.push(CP850_MAP[cp]);
    else bytes.push(0x3f);
  }
  return new Uint8Array(bytes);
}

// ─── Layout Helpers (32 columns) ──────────────────────────────

function fit(s: string, w: number): string {
  return s.length > w ? s.substring(0, w) : s;
}

/** Left-right aligned line within 32 cols */
function lr(left: string, right: string): string {
  const l = fit(left, WIDTH - right.length - 1);
  const gap = WIDTH - l.length - right.length;
  return l + " ".repeat(Math.max(gap, 1)) + right;
}

/** Center a string within 32 cols */
function center(text: string): string {
  const t = fit(text, WIDTH);
  const pad = Math.floor((WIDTH - t.length) / 2);
  return " ".repeat(pad) + t;
}

const SEP = "-".repeat(WIDTH);

function brl(v: number): string {
  return (v || 0).toFixed(2).replace(".", ",");
}

// ─── Builder ──────────────────────────────────────────────────

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

  const raw = (...b: number[]) => parts.push(new Uint8Array(b));
  const txt = (t: string) => { parts.push(encodeCP850(t)); raw(LF); };
  const nl = () => raw(LF);

  // ESC/POS commands – NO double width/height
  const init = () => raw(ESC, 0x40);
  const codepage = () => raw(ESC, 0x74, 19);           // CP850
  const alignCenter = () => raw(ESC, 0x61, 1);
  const alignLeft = () => raw(ESC, 0x61, 0);
  const boldOn = () => raw(ESC, 0x45, 1);
  const boldOff = () => raw(ESC, 0x45, 0);
  const cut = () => { raw(LF, LF, LF); raw(GS, 0x56, 0x00); };

  for (let copy = 0; copy < copies; copy++) {
    const via = copies > 1
      ? (copy === 0 ? "1a VIA - COZINHA" : "2a VIA - BALCAO")
      : (mode === "kitchen" ? "COZINHA" : mode === "counter" ? "BALCAO" : "COZINHA/BALCAO");

    init();
    codepage();

    // ── Header (centered, bold store name, normal size) ──
    alignCenter();
    boldOn();
    txt((store?.name || "LOJA").toUpperCase());
    boldOff();
    txt('"NAO E DOCUMENTO FISCAL"');
    if (store?.address) txt(fit(store.address, WIDTH));
    if (store?.whatsapp) txt("(" + store.whatsapp + ")");
    txt(SEP);

    // ── Via label ──
    boldOn();
    txt(center("[ " + via + " ]"));
    boldOff();

    // ── Order type + tracking code ──
    const typeLabel = order.order_type === "delivery" ? "Tele-Entrega" : "RETIRADA";
    nl();
    alignCenter();
    boldOn();
    txt("Pedido " + typeLabel + " [" + (order.tracking_code || "---") + "]");
    boldOff();

    if (order.order_type === "delivery") {
      txt("[RECEBER EM CASA]");
    }

    const date = new Date(order.created_at).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    alignLeft();
    txt("ID: " + (order.tracking_code || "---") + "    " + date);
    txt(SEP);

    // ── Customer ──
    boldOn();
    txt(order.customer_name || "");
    boldOff();
    if (order.customer_address) txt(fit(order.customer_address, WIDTH));
    if (order.customer_phone) txt("(" + (order.customer_phone || "") + ")");
    txt(SEP);

    // ── Items header ──
    txt("No. Ref. Descricao  Qtde  Valor");
    txt(SEP);

    // ── Items ──
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const qty = item.quantity || 1;
      const name = (item.product_name || "").substring(0, 22);
      const priceStr = brl(item.subtotal);
      const qtyStr = qty.toFixed(3);

      // Line 1: sequence + name
      txt((idx + 1) + "  (001) " + name + " -");
      // Line 2: price in parentheses
      txt("         (" + brl(item.unit_price) + ")");
      // Line 3: size/qty + price aligned
      const sizeLabel = "";
      txt(lr(sizeLabel + "        " + qtyStr, priceStr));

      // Additionals / Complementos – separated by paid/free
      if (item.additionals) {
        try {
          const adds = typeof item.additionals === "string"
            ? JSON.parse(item.additionals)
            : item.additionals;
          if (Array.isArray(adds) && adds.length > 0) {
            const freeAdds = adds.filter((a: any) => !a.price || a.price === 0);
            const paidAdds = adds.filter((a: any) => a.price && a.price > 0);

            if (freeAdds.length > 0) {
              txt("Inclusos:");
              for (const a of freeAdds) {
                const aName = typeof a === "string" ? a : (a.name || "");
                txt(fit("  " + aName, WIDTH));
              }
            }
            if (paidAdds.length > 0) {
              txt("Adicionais:");
              for (const a of paidAdds) {
                const aName = typeof a === "string" ? a : (a.name || "");
                const aQty = a.quantity && a.quantity > 1 ? a.quantity + "x " : "";
                const aTotal = ((a.price || 0) * (a.quantity || 1));
                txt(lr("  " + aQty + aName, brl(aTotal)));
              }
            }
          }
        } catch { /* skip */ }
      }
    }

    // ── Totals ──
    txt(SEP);
    txt(lr("Produtos:", brl(order.subtotal)));
    if (order.delivery_fee > 0) {
      txt(lr("Taxa de Entrega:", brl(order.delivery_fee)));
    }
    txt(SEP);

    boldOn();
    txt(lr("Total pedido:", brl(order.total)));
    boldOff();
    txt(SEP);

    // ── Payment ──
    if (order.payment_method) {
      const pmLabels: Record<string, string> = {
        pix: "Pix", cash: "Dinheiro", credit: "Credito", debit: "Debito",
      };
      txt(lr(pmLabels[order.payment_method] || order.payment_method, brl(order.total)));
    }
    txt(SEP);

    nl(); nl(); nl();
    cut();
  }

  // Merge all parts
  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { result.set(p, offset); offset += p.length; }
  return result;
}
