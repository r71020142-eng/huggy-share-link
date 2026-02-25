/**
 * Generates ESC/POS command sequence for a 58mm thermal receipt.
 * Supports 1 or 2 copies, and kitchen/counter/both modes.
 *
 * @param {Object} order - The order object from Supabase
 * @param {Array} items - Array of order_items
 * @param {Object} store - Store info { name, address, city, phone }
 * @param {Object} options - { copies: 1|2, mode: 'kitchen'|'counter'|'both' }
 * @returns {Array} Array of ESC/POS command objects
 */
function buildReceiptCommands(order, items, store, options = {}) {
  const copies = options.copies || 1;
  const mode = options.mode || 'both';
  const allCommands = [];

  for (let copy = 0; copy < copies; copy++) {
    const viaLabel = copies > 1
      ? (copy === 0 ? '1ª VIA - COZINHA' : '2ª VIA - BALCÃO')
      : (mode === 'kitchen' ? 'COZINHA' : mode === 'counter' ? 'BALCÃO' : 'COZINHA/BALCÃO');

    const cmds = [];

    // Header
    cmds.push({ type: 'font', value: 'a' });
    cmds.push({ type: 'align', value: 'ct' });
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'size', w: 1, h: 1 });
    cmds.push({ type: 'text', value: (store.name || 'ACAI LAB').toUpperCase() });
    cmds.push({ type: 'style', value: 'normal' });
    cmds.push({ type: 'size', w: 0, h: 0 });
    cmds.push({ type: 'text', value: 'NAO E DOCUMENTO FISCAL' });

    if (store.address) cmds.push({ type: 'text', value: store.address });
    if (store.city) cmds.push({ type: 'text', value: store.city });
    if (store.phone) cmds.push({ type: 'text', value: `Tel: ${store.phone}` });

    cmds.push({ type: 'text', value: '================================' });

    // Via label
    cmds.push({ type: 'align', value: 'ct' });
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'text', value: `[ ${viaLabel} ]` });
    cmds.push({ type: 'style', value: 'normal' });
    cmds.push({ type: 'text', value: '================================' });

    // Order info
    cmds.push({ type: 'align', value: 'lt' });

    const dateStr = new Date(order.created_at).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const orderTypeLabel = order.order_type === 'delivery'
      ? 'TELE-ENTREGA' : 'RETIRADA';

    cmds.push({ type: 'text', value: `Pedido ${orderTypeLabel}` });
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'size', w: 1, h: 1 });
    cmds.push({ type: 'text', value: `#${order.tracking_code || '---'}` });
    cmds.push({ type: 'size', w: 0, h: 0 });
    cmds.push({ type: 'style', value: 'normal' });

    if (order.order_type === 'delivery') {
      cmds.push({ type: 'text', value: '[RECEBER EM CASA]' });
    }

    cmds.push({ type: 'text', value: `Data: ${dateStr}` });
    cmds.push({ type: 'text', value: '================================' });

    // Customer
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'text', value: `Cliente: ${order.customer_name}` });
    cmds.push({ type: 'style', value: 'normal' });

    if (order.customer_address) {
      cmds.push({ type: 'text', value: `End: ${order.customer_address}` });
    }
    if (order.customer_phone) {
      cmds.push({ type: 'text', value: `Tel: ${order.customer_phone}` });
    }

    cmds.push({ type: 'text', value: '================================' });

    // Items header
    cmds.push({ type: 'text', value: padColumns('ITEM', 'QTD', 'VALOR') });
    cmds.push({ type: 'text', value: '--------------------------------' });

    // Items
    for (const item of items) {
      const name = truncate(item.product_name, 18);
      const qty = String(item.quantity);
      const val = formatBRL(item.subtotal);
      cmds.push({ type: 'text', value: padColumns(name, qty, val) });

      // Additionals
      if (item.additionals) {
        try {
          const adds = typeof item.additionals === 'string'
            ? JSON.parse(item.additionals)
            : item.additionals;
          if (Array.isArray(adds)) {
            for (const a of adds) {
              const addName = typeof a === 'string' ? a : (a.name || '');
              const addPrice = a.price ? ` +${formatBRL(a.price)}` : '';
              cmds.push({ type: 'text', value: `  + ${addName}${addPrice}` });
            }
          }
        } catch { /* ignore parse errors */ }
      }
    }

    cmds.push({ type: 'text', value: '================================' });

    // Totals
    cmds.push({ type: 'text', value: `Produtos:       ${formatBRL(order.subtotal)}` });

    if (order.delivery_fee && order.delivery_fee > 0) {
      cmds.push({ type: 'text', value: `Taxa Entrega:   ${formatBRL(order.delivery_fee)}` });
    }

    cmds.push({ type: 'text', value: '================================' });
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'size', w: 1, h: 1 });
    cmds.push({ type: 'text', value: `TOTAL: ${formatBRL(order.total)}` });
    cmds.push({ type: 'size', w: 0, h: 0 });
    cmds.push({ type: 'style', value: 'normal' });
    cmds.push({ type: 'text', value: '================================' });

    // Payment
    if (order.payment_method) {
      cmds.push({ type: 'text', value: `Pagamento: ${order.payment_method}` });
    }

    // Notes
    if (order.notes) {
      cmds.push({ type: 'text', value: '--------------------------------' });
      cmds.push({ type: 'style', value: 'b' });
      cmds.push({ type: 'text', value: `OBS: ${order.notes}` });
      cmds.push({ type: 'style', value: 'normal' });
    }

    cmds.push({ type: 'feed', lines: 3 });
    cmds.push({ type: 'cut' });

    allCommands.push(...cmds);
  }

  return allCommands;
}

function padColumns(left, center, right) {
  const totalWidth = 32; // 58mm ≈ 32 chars
  const centerStr = center.padStart(3);
  const rightStr = right.padStart(8);
  const leftWidth = totalWidth - centerStr.length - rightStr.length;
  return left.substring(0, leftWidth).padEnd(leftWidth) + centerStr + rightStr;
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) : str;
}

function formatBRL(value) {
  return `R$ ${(value || 0).toFixed(2)}`;
}

// Test receipt commands
function buildTestReceiptCommands() {
  const testOrder = {
    tracking_code: 'TESTE001',
    created_at: new Date().toISOString(),
    order_type: 'delivery',
    customer_name: 'Cliente Teste',
    customer_phone: '(00) 00000-0000',
    customer_address: 'Rua Teste, 123 - Centro',
    subtotal: 35.90,
    delivery_fee: 5.00,
    total: 40.90,
    payment_method: 'Dinheiro',
    notes: 'Sem cebola',
  };
  const testItems = [
    { product_name: 'Açaí 500ml', quantity: 2, subtotal: 35.90, additionals: [{ name: 'Granola', price: 2.00 }, { name: 'Leite Condensado' }] },
  ];
  const testStore = { name: 'Açaí Lab', address: 'Rua Exemplo, 100', city: 'São Paulo - SP', phone: '(11) 9999-9999' };
  return buildReceiptCommands(testOrder, testItems, testStore, { copies: 1, mode: 'both' });
}

module.exports = { buildReceiptCommands, buildTestReceiptCommands };
