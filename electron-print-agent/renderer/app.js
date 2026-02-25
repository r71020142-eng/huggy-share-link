/**
 * Açaí Lab Print Agent — Renderer Process
 * Secure: uses contextBridge (preload.js) instead of nodeIntegration.
 */

const { SUPABASE_URL, SUPABASE_ANON_KEY, FUNCTIONS_URL } = require('../lib/supabase');
const { buildReceiptCommands, buildTestReceiptCommands } = require('../lib/printer-commands');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const api = window.electronAPI;

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

// Network modal
const modalNetwork = $('modalNetwork');
const btnSaveNetwork = $('btnSaveNetwork');
const btnCancelNetwork = $('btnCancelNetwork');

// ── Init: load saved config ────────────────────────────
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

// ── Connect ────────────────────────────────────────────
btnConnect.addEventListener('click', async () => {
  storeId = $('inputStoreId').value.trim();
  token = $('inputToken').value.trim();

  if (!storeId || !token) {
    showError('Preencha Store ID e Token');
    return;
  }

  btnConnect.disabled = true;
  showError('Conectando...');

  try {
    const hostname = await api.getHostname();

    const res = await fetch(`${FUNCTIONS_URL}/print-agent-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({
        store_id: storeId,
        token,
        action: 'connect',
        machine_name: hostname,
        agent_version: '1.0.0',
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na conexão');

    agentId = data.agent_id;

    // Save credentials securely
    await api.storeSet('credentials', { storeId, token });

    machineInfo.textContent = `Máquina: ${hostname} | Loja: ${storeId.substring(0, 8)}...`;
    screenConnect.classList.add('hidden');
    screenMain.classList.remove('hidden');

    startHeartbeat();
    startRealtime();
    log('✅ Conectado com sucesso');
  } catch (e) {
    showError(e.message);
  } finally {
    btnConnect.disabled = false;
  }
});

function showError(msg) {
  connectError.textContent = msg;
  connectError.classList.remove('hidden');
}

// ── Heartbeat ──────────────────────────────────────────
function startHeartbeat() {
  // Immediate first beat
  sendHeartbeat();

  heartbeatInterval = setInterval(sendHeartbeat, 30000);
}

async function sendHeartbeat() {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/print-agent-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({ store_id: storeId, token, action: 'heartbeat' }),
    });
    const data = await res.json();

    if (data.is_active === false) {
      log('⚠️ Token revogado pelo painel! Desconectando...');
      disconnect();
      return;
    }

    statusDot.className = 'dot online';
    statusText.textContent = 'Online';
    lastSeenText.textContent = `Último heartbeat: ${new Date().toLocaleTimeString('pt-BR')}`;
  } catch {
    statusDot.className = 'dot offline';
    statusText.textContent = 'Offline - tentando reconectar...';
    log('⚠️ Falha no heartbeat, tentando reconectar...');
  }
}

// ── Realtime ───────────────────────────────────────────
function startRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabase
    .channel(`print-orders-${storeId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `store_id=eq.${storeId}`,
    }, async (payload) => {
      const order = payload.new;

      // Deduplication
      if (printedOrderIds.has(order.id)) return;
      printedOrderIds.add(order.id);

      const code = order.tracking_code || order.id.substring(0, 8);
      log(`📦 Novo pedido #${code}`);

      if (autoPrint) {
        await printOrder(order);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        log('📡 Realtime conectado - escutando pedidos');
      } else if (status === 'CLOSED') {
        log('⚠️ Realtime desconectado - reconectando...');
        setTimeout(() => startRealtime(), 5000);
      }
    });
}

// ── Print Order ────────────────────────────────────────
async function printOrder(order) {
  try {
    // Fetch items
    const { data: items, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (error) throw error;

    // Fetch store info
    const { data: storeData } = await supabase
      .from('stores')
      .select('name, address, whatsapp')
      .eq('id', storeId)
      .single();

    const storeInfo = {
      name: storeData?.name || 'ACAI LAB',
      address: storeData?.address || '',
      city: '',
      phone: storeData?.whatsapp || '',
    };

    const commands = buildReceiptCommands(order, items || [], storeInfo, {
      copies,
      mode: printMode,
    });

    // Send to all active printers matching the mode
    const activePrinters = printers.filter(p => p.active);

    if (activePrinters.length === 0) {
      log('⚠️ Nenhuma impressora ativa configurada');
      return;
    }

    for (const printer of activePrinters) {
      // Filter by role if needed
      if (printMode !== 'both' && printer.role !== 'both' && printer.role !== printMode) {
        continue;
      }

      const result = await api.printEscpos(printer, commands);
      if (result.success) {
        log(`✅ Impresso em "${printer.name}"`);
      } else {
        log(`❌ Erro em "${printer.name}": ${result.error}`);
      }
    }
  } catch (e) {
    log(`❌ Erro ao imprimir: ${e.message}`);
  }
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
      </div>
    `;
    printerList.appendChild(div);
  }
}

window.togglePrinter = async (idx) => {
  printers[idx].active = !printers[idx].active;
  await api.storeSet('printers', printers);
  renderPrinters();
};

window.removePrinter = async (idx) => {
  printers.splice(idx, 1);
  await api.storeSet('printers', printers);
  renderPrinters();
};

// Detect USB
btnDetectUsb.addEventListener('click', async () => {
  log('🔍 Detectando impressoras USB...');
  const found = await api.detectUsbPrinters();

  if (found.length === 0) {
    log('⚠️ Nenhuma impressora USB encontrada');
    return;
  }

  for (const device of found) {
    const exists = printers.some(p => p.type === 'usb' && p.vendorId === device.vendorId);
    if (!exists) {
      printers.push({
        name: device.name || 'USB Printer',
        type: 'usb',
        vendorId: device.vendorId,
        productId: device.productId,
        role: 'both',
        active: true,
      });
    }
  }

  await api.storeSet('printers', printers);
  renderPrinters();
  log(`✅ ${found.length} impressora(s) USB detectada(s)`);
});

// Network printer modal
btnAddNetwork.addEventListener('click', () => {
  modalNetwork.classList.remove('hidden');
});

btnCancelNetwork.addEventListener('click', () => {
  modalNetwork.classList.add('hidden');
});

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
chkAutoPrint.addEventListener('change', async () => {
  autoPrint = chkAutoPrint.checked;
  await api.storeSet('autoPrint', autoPrint);
  log(`Auto print: ${autoPrint ? 'ON' : 'OFF'}`);
});

selPrintMode.addEventListener('change', async () => {
  printMode = selPrintMode.value;
  await api.storeSet('printMode', printMode);
  log(`Modo: ${printMode}`);
});

selCopies.addEventListener('change', async () => {
  copies = parseInt(selCopies.value);
  await api.storeSet('copies', copies);
  log(`Vias: ${copies}`);
});

// ── Test Print ─────────────────────────────────────────
btnTestPrint.addEventListener('click', async () => {
  const activePrinters = printers.filter(p => p.active);
  if (activePrinters.length === 0) {
    log('⚠️ Adicione e ative uma impressora primeiro');
    return;
  }

  const commands = buildTestReceiptCommands();

  for (const printer of activePrinters) {
    log(`🖨️ Testando em "${printer.name}"...`);
    const result = await api.printEscpos(printer, commands);
    if (result.success) {
      log(`✅ Teste OK em "${printer.name}"`);
    } else {
      log(`❌ Falha em "${printer.name}": ${result.error}`);
    }
  }
});

// ── Disconnect ─────────────────────────────────────────
function disconnect() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  heartbeatInterval = null;
  realtimeChannel = null;

  api.storeDelete('credentials');

  screenMain.classList.add('hidden');
  screenConnect.classList.remove('hidden');

  storeId = null;
  token = null;
  agentId = null;
  printedOrderIds.clear();

  log('🔌 Desconectado');
}

btnDisconnect.addEventListener('click', disconnect);

// ── Tray Events ────────────────────────────────────────
api.onTrayTestPrint(() => btnTestPrint.click());
api.onTrayAutoPrintChanged((val) => {
  autoPrint = val;
  chkAutoPrint.checked = val;
  log(`Auto print (tray): ${val ? 'ON' : 'OFF'}`);
});
