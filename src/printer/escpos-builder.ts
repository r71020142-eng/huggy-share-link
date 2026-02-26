/**
 * ESC/POS Receipt Builder
 * 58mm thermal printer – 32 columns – CP850 encoding
 * Pure function – no USB, no queue, no API dependencies
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const WIDTH = 32;

// ─── CP850 Encoding Map ───────────────────────────────────────
// Maps Unicode code points to CP850 byte values for Latin accented chars
const CP850_MAP: Record<number, number> = {
  0x00c7: 0x80, // Ç
  0x00fc: 0x81, // ü
  0x00e9: 0x82, // é
  0x00e2: 0x83, // â
  0x00e4: 0x84, // ä
  0x00e0: 0x85, // à
  0x00e5: 0x86, // å
  0x00e7: 0x87, // ç
  0x00ea: 0x88, // ê
  0x00eb: 0x89, // ë
  0x00e8: 0x8a, // è
  0x00ef: 0x8b, // ï
  0x00ee: 0x8c, // î
  0x00ec: 0x8d, // ì
  0x00c4: 0x8e, // Ä
  0x00c5: 0x8f, // Å
  0x00c9: 0x90, // É
  0x00e6: 0x91, // æ
  0x00c6: 0x92, // Æ
  0x00f4: 0x93, // ô
  0x00f6: 0x94, // ö
  0x00f2: 0x95, // ò
  0x00fb: 0x96, // û
  0x00f9: 0x97, // ù
  0x00ff: 0x98, // ÿ
  0x00d6: 0x99, // Ö
  0x00dc: 0x9a, // Ü
  0x00f8: 0x9b, // ø
  0x00a3: 0x9c, // £
  0x00d8: 0x9d, // Ø
  0x00d7: 0x9e, // ×
  0x00e1: 0xa0, // á
  0x00ed: 0xa1, // í
  0x00f3: 0xa2, // ó
  0x00fa: 0xa3, // ú
  0x00f1: 0xa4, // ñ
  0x00d1: 0xa5, // Ñ
  0x00aa: 0xa6, // ª
  0x00ba: 0xa7, // º
  0x00bf: 0xa8, // ¿
  0x00ae: 0xa9, // ®
  0x00ac: 0xaa, // ¬
  0x00bd: 0xab, // ½
  0x00bc: 0xac, // ¼
  0x00a1: 0xad, // ¡
  0x00ab: 0xae, // «
  0x00bb: 0xaf, // »
  0x00c3: 0xb7, // Ã  (CP850 specific)
  0x00e3: 0xc7, // ã  (CP850 specific)
  0x00c0: 0xb7, // À  — fallback to Ã slot if needed
  0x00c1: 0xb5, // Á
  0x00c2: 0xb6, // Â
  0x00ca: 0xd2, // Ê
  0x00cd: 0xd6, // Í
  0x00d3: 0xe0, // Ó
  0x00da: 0xe9, // Ú
};

/** Encode a string to CP850 bytes */
function encodeCP850(text: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i)!;
    if (cp < 0x80) {
      bytes.push(cp); // ASCII range
    } else if (CP850_MAP[cp] !== undefined) {
      bytes.push(CP850_MAP[cp]);
    } else {
      bytes.push(0x3f); // '?' for unmapped chars
    }
  }
  return new Uint8Array(bytes);
}

// ─── Layout Helpers (32 columns) ──────────────────────────────

/** Truncate/pad a string to exact width */
function fit(s: string, w: number): string {
  return s.length > w ? s.substring(0, w) : s;
}

/** Left-right aligned line */
function lr(left: string, right: string): string {
  const l = fit(left, WIDTH - right.length - 1);
  const gap = WIDTH - l.length - right.length;
  return l + " ".repeat(Math.max(gap, 1)) + right;
}

/** Center a string */
function center(text: string): string {
  const t = fit(text, WIDTH);
  const pad = Math.floor((WIDTH - t.length) / 2);
  return " ".repeat(pad) + t;
}

/** Separator line */
const SEP = "-".repeat(WIDTH);

/** Format BRL value */
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

  // ESC/POS commands
  const init = () => raw(ESC, 0x40);                     // Initialize
  const codepage = () => raw(ESC, 0x74, 19);             // CP850
  const alignCenter = () => raw(ESC, 0x61, 1);
  const alignLeft = () => raw(ESC, 0x61, 0);
  const boldOn = () => raw(ESC, 0x45, 1);
  const boldOff = () => raw(ESC, 0x45, 0);
  const doubleOn = () => raw(GS, 0x21, 0x11);            // Double width+height
  const doubleOff = () => raw(GS, 0x21, 0x00);
  const cut = () => { raw(LF, LF, LF); raw(GS, 0x56, 0x00); };

  for (let copy = 0; copy < copies; copy++) {
    const via = copies > 1
      ? (copy === 0 ? "1a VIA - COZINHA" : "2a VIA - BALCAO")
      : (mode === "kitchen" ? "COZINHA" : mode === "counter" ? "BALCAO" : "COZINHA/BALCAO");

    // ── Initialize & set code page ──
    init();
    codepage();

    // ── Header ──
    alignCenter();
    boldOn(); doubleOn();
    txt((store?.name || "LOJA").toUpperCase());
    doubleOff(); boldOff();
    txt("NAO E DOCUMENTO FISCAL");
    if (store?.address) txt(fit(store.address, WIDTH));
    if (store?.whatsapp) txt("Tel: " + store.whatsapp);
    txt(SEP);
    boldOn(); txt("[ " + via + " ]"); boldOff();
    txt(SEP);

    // ── Order info ──
    alignLeft();

    const typeLabel = order.order_type === "delivery" ? "TELE-ENTREGA" : "RETIRADA";
    txt("Pedido " + typeLabel);

    alignCenter();
    boldOn(); doubleOn();
    txt("#" + (order.tracking_code || "---"));
    doubleOff(); boldOff();
    alignLeft();

    if (order.order_type === "delivery") {
      txt("[RECEBER EM CASA]");
    }

    const date = new Date(order.created_at).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    txt("Data: " + date);
    txt(SEP);

    // ── Customer ──
    boldOn(); txt("Cliente: " + (order.customer_name || "")); boldOff();
    if (order.customer_address) txt("End: " + order.customer_address);
    if (order.customer_phone) txt("Tel: " + order.customer_phone);
    txt(SEP);

    // ── Items header ──
    txt(lr("ITEM", "VALOR"));
    txt(SEP);

    // ── Items ──
    for (const item of items) {
      const qty = item.quantity || 1;
      const name = (item.product_name || "").substring(0, WIDTH - 12);
      const qtyStr = qty + "x";
      const priceStr = brl(item.subtotal);

      // Line 1: Qty + Name
      txt(qtyStr + " " + name);
      // Line 2: Price aligned right
      txt(lr("", priceStr));

      // Additionals
      if (item.additionals) {
        try {
          const adds = typeof item.additionals === "string"
            ? JSON.parse(item.additionals)
            : item.additionals;
          if (Array.isArray(adds)) {
            for (const a of adds) {
              const aName = typeof a === "string" ? a : (a.name || "");
              const aPrice = a.price ? brl(a.price) : "";
              if (aPrice) {
                txt(lr("  + " + fit(aName, WIDTH - 10), "+" + aPrice));
              } else {
                txt("  + " + fit(aName, WIDTH - 4));
              }
            }
          }
        } catch { /* skip malformed */ }
      }
    }

    // ── Totals ──
    txt(SEP);
    txt(lr("Produtos:", brl(order.subtotal)));
    if (order.delivery_fee > 0) {
      txt(lr("Taxa Entrega:", brl(order.delivery_fee)));
    }
    txt(SEP);

    boldOn();
    txt(lr("TOTAL:", brl(order.total)));
    boldOff();

    txt(SEP);

    // ── Payment ──
    if (order.payment_method) {
      const pmLabels: Record<string, string> = {
        pix: "Pix", cash: "Dinheiro", credit: "Credito", debit: "Debito",
      };
      txt("Pagamento: " + (pmLabels[order.payment_method] || order.payment_method));
    }

    // ── Notes ──
    if (order.notes) {
      txt(SEP);
      boldOn(); txt("OBS: " + order.notes); boldOff();
    }

    nl(); nl(); nl();
    cut();
  }

  // Merge all parts into single Uint8Array
  const total = parts.reduce((s, p) => s + p.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { result.set(p, offset); offset += p.length; }
  return result;
}