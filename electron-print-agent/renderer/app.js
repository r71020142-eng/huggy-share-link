/**
 * Açaí Lab Print Agent — Renderer Process
 * No require() — runs with contextIsolation:true, nodeIntegration:false
 */

// ── Config (inlined, no require) ──────────────────────
const SUPABASE_URL = 'https://ejmgpxrypogmhgoqpilf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbWdweHJ5cG9nbWhnb3FwaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjM1ODgsImV4cCI6MjA4NzI5OTU4OH0.TK2PdUu4h8DizGUmFko0WJ2kMg4OkBZM6Z3G7xntXqc';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Supabase loaded via CDN <script> tag (global: window.supabase)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const api = window.electronAPI;

// ── Printer Commands (inlined) ────────────────────────
function padColumns(left, center, right) {
  const totalWidth = 32;
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

function buildReceiptCommands(order, items, store, options = {}) {
  const copies = options.copies || 1;
  const mode = options.mode || 'both';
  const allCommands = [];

  for (let copy = 0; copy < copies; copy++) {
    const viaLabel = copies > 1
      ? (copy === 0 ? '1ª VIA - COZINHA' : '2ª VIA - BALCÃO')
      : (mode === 'kitchen' ? 'COZINHA' : mode === 'counter' ? 'BALCÃO' : 'COZINHA/BALCÃO');

    const cmds = [];
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
    cmds.push({ type: 'align', value: 'ct' });
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'text', value: `[ ${viaLabel} ]` });
    cmds.push({ type: 'style', value: 'normal' });
    cmds.push({ type: 'text', value: '================================' });
    cmds.push({ type: 'align', value: 'lt' });

    const dateStr = new Date(order.created_at).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const orderTypeLabel = order.order_type === 'delivery' ? 'TELE-ENTREGA' : 'RETIRADA';
    cmds.push({ type: 'text', value: `Pedido ${orderTypeLabel}` });
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'size', w: 1, h: 1 });
    cmds.push({ type: 'text', value: `#${order.tracking_code || '---'}` });
    cmds.push({ type: 'size', w: 0, h: 0 });
    cmds.push({ type: 'style', value: 'normal' });
    if (order.order_type === 'delivery') cmds.push({ type: 'text', value: '[RECEBER EM CASA]' });
    cmds.push({ type: 'text', value: `Data: ${dateStr}` });
    cmds.push({ type: 'text', value: '================================' });
    cmds.push({ type: 'style', value: 'b' });
    cmds.push({ type: 'text', value: `Cliente: ${order.customer_name}` });
    cmds.push({ type: 'style', value: 'normal' });
    if (order.customer_address) cmds.push({ type: 'text', value: `End: ${order.customer_address}` });
    if (order.customer_phone) cmds.push({ type: 'text', value: `Tel: ${order.customer_phone}` });
    cmds.push({ type: 'text', value: '================================' });
    cmds.push({ type: 'text', value: padColumns('ITEM', 'QTD', 'VALOR') });
    cmds.push({ type: 'text', value: '--------------------------------' });

    for (const item of items) {
      const name = truncate(item.product_name, 18);
      const qty = String(item.quantity);
      const val = formatBRL(item.subtotal);
      cmds.push({ type: 'text', value: padColumns(name, qty, val) });
      if (item.additionals) {
        try {
          const adds = typeof item.additionals === 'string' ? JSON.parse(item.additionals) : item.additionals;
          if (Array.isArray(adds)) {
            for (const a of adds) {
              const addName = typeof a === 'string' ? a : (a.name || '');
              const addPrice = a.price ? ` +${formatBRL(a.price)}` : '';
              cmds.push({ type: 'text', value: `  + ${addName}${addPrice}` });
            }
          }
        } catch { /* ignore */ }
      }
    }

    cmds.push({ type: 'text', value: '================================' });
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
    if (order.payment_method) cmds.push({ type: 'text', value: `Pagamento: ${order.payment_method}` });
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

function buildTestReceiptCommands() {
  const testOrder = {
    tracking_code: 'TESTE001', created_at: new Date().toISOString(), order_type: 'delivery',
    customer_name: 'Cliente Teste', customer_phone: '(00) 00000-0000',
    customer_address: 'Rua Teste, 123 - Centro', subtotal: 35.90, delivery_fee: 5.00,
    total: 40.90, payment_method: 'Dinheiro', notes: 'Sem cebola',
  };
  const testItems = [
    { product_name: 'Açaí 500ml', quantity: 2, subtotal: 35.90, additionals: [{ name: 'Granola', price: 2.00 }, { name: 'Leite Condensado' }] },
  ];
  const testStore = { name: 'Açaí Lab', address: 'Rua Exemplo, 100', city: 'São Paulo - SP', phone: '(11) 9999-9999' };
  return buildReceiptCommands(testOrder, testItems, testStore, { copies: 1, mode: 'both' });
}

// ── State ──────────────────────────────────────────────
let storeId = null;
let token = null;
let agentId = null;
let heartbeatInterval = null;
let realtimeChannel = null;
let printedOrderIds = new Set();
let autoPrint = true;
let printMode = 'both';
let copies = 1;
let printers = [];

// ── DOM ────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const screenConnect = $('screen-connect');
const screenMain = $('screen-main');
const btnConnect = $('btnConnect');
const btnDisconnect = $('btnDisconnect');
const btnTestPrint = $('btnTestPrint');
const btnDetectUsb = $('btnDetectUsb');
const btnAddNetwork = $('btnAddNetwork');
const connectError = $('connectError');
const printLog = $('printLog');
const statusDot = $('statusDot');
const statusText = $('statusText');
const machineInfo = $('machineInfo');
const lastSeenText = $('lastSeenText');
const chkAutoPrint = $('chkAutoPrint');
const selPrintMode = $('selPrintMode');
const selCopies = $('selCopies');
const printerList = $('printerList');
const modalNetwork = $('modalNetwork');
const btnSaveNetwork = $('btnSaveNetwork');
const btnCancelNetwork = $('btnCancelNetwork');

// ── Init ───────────────────────────────────────────────
(async function init() {
  const saved = await api.storeGet('credentials');
  if (saved) {
    $('inputStoreId').value = saved.storeId || '';
    $('inputToken').value = saved.token || '';
  }
  autoPrint = await api.storeGet('autoPrint', true);
  printMode = await api.storeGet('printMode', 'both');
  copies = await api.storeGet('copies', 1);
  printers = await api.storeGet('printers', []);
  chkAutoPrint.checked = autoPrint;
  selPrintMode.value = printMode;
  selCopies.value = String(copies);
  renderPrinters();
})();

// ── Logging ────────────────────────────────────────────
function log(msg) {
  const time = new Date().toLocaleTimeString('pt-BR');
  printLog.innerHTML += `\n[${time}] ${msg}`;
  printLog.scrollTop = printLog.scrollHeight;
}

function showError(msg) { connectError.textContent = msg; connectError.classList.remove('hidden'); connectError.style.color = '#e74c3c'; }
function showInfo(msg) { connectError.textContent = msg; connectError.classList.remove('hidden'); connectError.style.color = '#f39c12'; }
function hideError() { connectError.classList.add('hidden'); connectError.textContent = ''; }

// ── Connect ────────────────────────────────────────────
btnConnect.addEventListener('click', async () => {
  storeId = $('inputStoreId').value.trim();
  token = $('inputToken').value.trim();
  if (!storeId || !token) { showError('❌ Preencha Store ID e Token'); return; }

  btnConnect.disabled = true;
  btnConnect.textContent = 'Conectando...';
  showInfo('⏳ Conectando ao servidor...');

  try {
    const hostname = await api.getHostname();
    const res = await fetch(`${FUNCTIONS_URL}/print-agent-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ store_id: storeId, token, action: 'connect', machine_name: hostname, agent_version: '1.0.0' }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `Erro HTTP ${res.status}`;
      if (res.status === 401) showError('❌ Token inválido ou agente revogado.');
      else if (res.status >= 500) showError(`❌ Servidor indisponível (${res.status}).`);
      else showError(`❌ ${errorMsg}`);
      return;
    }

    agentId = data.agent_id;
    hideError();
    await api.storeSet('credentials', { storeId, token });
    machineInfo.textContent = `Máquina: ${hostname} | Loja: ${storeId.substring(0, 8)}...`;
    screenConnect.classList.add('hidden');
    screenMain.classList.remove('hidden');
    startHeartbeat();
    startRealtime();
    log('✅ Conectado com sucesso');
  } catch (e) {
    showError(`❌ Falha de rede: ${e.message}`);
  } finally {
    btnConnect.disabled = false;
    btnConnect.textContent = 'Conectar';
  }
});

// ── Heartbeat ──────────────────────────────────────────
function startHeartbeat() { sendHeartbeat(); heartbeatInterval = setInterval(sendHeartbeat, 30000); }

async function sendHeartbeat() {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/print-agent-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ store_id: storeId, token, action: 'heartbeat' }),
    });
    const data = await res.json();
    if (data.is_active === false) { log('⚠️ Token revogado! Desconectando...'); disconnect(); return; }
    statusDot.className = 'dot online';
    statusText.textContent = 'Online';
    lastSeenText.textContent = `Último heartbeat: ${new Date().toLocaleTimeString('pt-BR')}`;
  } catch {
    statusDot.className = 'dot offline';
    statusText.textContent = 'Offline - tentando reconectar...';
  }
}

// ── Realtime ───────────────────────────────────────────
function startRealtime() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel(`print-orders-${storeId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `store_id=eq.${storeId}` }, async (payload) => {
      const order = payload.new;
      if (printedOrderIds.has(order.id)) return;
      printedOrderIds.add(order.id);
      log(`📦 Novo pedido #${order.tracking_code || order.id.substring(0, 8)}`);
      if (autoPrint) await printOrder(order);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') log('📡 Realtime conectado');
      else if (status === 'CLOSED') { log('⚠️ Realtime desconectado'); setTimeout(startRealtime, 5000); }
    });
}

// ── Print Order ────────────────────────────────────────
async function printOrder(order) {
  try {
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    const { data: storeData } = await supabase.from('stores').select('name, address, whatsapp').eq('id', storeId).single();
    const storeInfo = { name: storeData?.name || 'ACAI LAB', address: storeData?.address || '', city: '', phone: storeData?.whatsapp || '' };
    const commands = buildReceiptCommands(order, items || [], storeInfo, { copies, mode: printMode });
    const activePrinters = printers.filter(p => p.active);
    if (activePrinters.length === 0) { log('⚠️ Nenhuma impressora ativa'); return; }
    for (const printer of activePrinters) {
      if (printMode !== 'both' && printer.role !== 'both' && printer.role !== printMode) continue;
      const result = await api.printEscpos(printer, commands);
      log(result.success ? `✅ Impresso em "${printer.name}"` : `❌ Erro em "${printer.name}": ${result.error}`);
    }
  } catch (e) { log(`❌ Erro ao imprimir: ${e.message}`); }
}

// ── Printers ───────────────────────────────────────────
function renderPrinters() {
  printerList.innerHTML = '';
  if (printers.length === 0) {
    printerList.innerHTML = '<p style="font-size:11px;color:#666;text-align:center;padding:8px;">Nenhuma impressora configurada</p>';
    return;
  }
  for (let i = 0; i < printers.length; i++) {
    const p = printers[i];
    const div = document.createElement('div');
    div.className = 'printer-item';
    div.innerHTML = `
      <div class="info">
        <div class="name">${p.name} ${p.active ? '<span class="badge online">Ativa</span>' : '<span class="badge offline">Inativa</span>'}</div>
        <div class="meta">${p.type.toUpperCase()} ${p.ip ? `| ${p.ip}:${p.port}` : ''} | ${p.role}</div>
      </div>
      <div class="actions">
        <button class="btn-sm btn-secondary" onclick="togglePrinter(${i})">${p.active ? 'Desativar' : 'Ativar'}</button>
        <button class="btn-sm btn-danger" onclick="removePrinter(${i})">✕</button>
      </div>`;
    printerList.appendChild(div);
  }
}

window.togglePrinter = async (idx) => { printers[idx].active = !printers[idx].active; await api.storeSet('printers', printers); renderPrinters(); };
window.removePrinter = async (idx) => { printers.splice(idx, 1); await api.storeSet('printers', printers); renderPrinters(); };

btnDetectUsb.addEventListener('click', async () => {
  log('🔍 Detectando impressoras USB...');
  const found = await api.detectUsbPrinters();
  if (found.length === 0) { log('⚠️ Nenhuma impressora USB encontrada'); return; }
  for (const device of found) {
    if (!printers.some(p => p.type === 'usb' && p.vendorId === device.vendorId)) {
      printers.push({ name: device.name || 'USB Printer', type: 'usb', vendorId: device.vendorId, productId: device.productId, role: 'both', active: true });
    }
  }
  await api.storeSet('printers', printers);
  renderPrinters();
  log(`✅ ${found.length} impressora(s) USB detectada(s)`);
});

btnAddNetwork.addEventListener('click', () => modalNetwork.classList.remove('hidden'));
btnCancelNetwork.addEventListener('click', () => modalNetwork.classList.add('hidden'));
btnSaveNetwork.addEventListener('click', async () => {
  const name = $('netName').value.trim() || 'Impressora Rede';
  const ip = $('netIp').value.trim();
  const port = parseInt($('netPort').value) || 9100;
  const role = $('netRole').value;
  if (!ip) return;
  printers.push({ name, type: 'network', ip, port, role, active: true });
  await api.storeSet('printers', printers);
  renderPrinters();
  modalNetwork.classList.add('hidden');
  log(`✅ Impressora de rede adicionada: ${name} (${ip}:${port})`);
});

// ── Settings ───────────────────────────────────────────
chkAutoPrint.addEventListener('change', async () => { autoPrint = chkAutoPrint.checked; await api.storeSet('autoPrint', autoPrint); });
selPrintMode.addEventListener('change', async () => { printMode = selPrintMode.value; await api.storeSet('printMode', printMode); });
selCopies.addEventListener('change', async () => { copies = parseInt(selCopies.value); await api.storeSet('copies', copies); });

// ── Test Print ─────────────────────────────────────────
btnTestPrint.addEventListener('click', async () => {
  const activePrinters = printers.filter(p => p.active);
  if (activePrinters.length === 0) { log('⚠️ Adicione e ative uma impressora primeiro'); return; }
  const commands = buildTestReceiptCommands();
  for (const printer of activePrinters) {
    log(`🖨️ Testando em "${printer.name}"...`);
    const result = await api.printEscpos(printer, commands);
    log(result.success ? `✅ Teste OK em "${printer.name}"` : `❌ Falha em "${printer.name}": ${result.error}`);
  }
});

// ── Disconnect ─────────────────────────────────────────
function disconnect() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  heartbeatInterval = null; realtimeChannel = null;
  api.storeDelete('credentials');
  screenMain.classList.add('hidden');
  screenConnect.classList.remove('hidden');
  storeId = null; token = null; agentId = null;
  printedOrderIds.clear();
  log('🔌 Desconectado');
}

btnDisconnect.addEventListener('click', disconnect);

// ── Tray Events ────────────────────────────────────────
api.onTrayTestPrint(() => btnTestPrint.click());
api.onTrayAutoPrintChanged((val) => { autoPrint = val; chkAutoPrint.checked = val; });
