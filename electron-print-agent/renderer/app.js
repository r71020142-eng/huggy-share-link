const { createClient } = require('@supabase/supabase-js');
const Store = require('electron-store');
const os = require('os');
const { ipcRenderer } = require('electron');

const config = new Store({ encryptionKey: 'acailab-secure-key-2024' });

// CHANGE THIS to your Supabase URL and anon key
const SUPABASE_URL = 'https://ejmgpxrypogmhgoqpilf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbWdweHJ5cG9nbWhnb3FwaWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MjM1ODgsImV4cCI6MjA4NzI5OTU4OH0.TK2PdUu4h8DizGUmFko0WJ2kMg4OkBZM6Z3G7xntXqc';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let storeId = null;
let token = null;
let agentId = null;
let heartbeatInterval = null;
let realtimeChannel = null;
let printedOrderIds = new Set();
let printers = [];
let autoPrint = config.get('autoPrint', true);

// DOM elements
const screenConnect = document.getElementById('screen-connect');
const screenMain = document.getElementById('screen-main');
const btnConnect = document.getElementById('btnConnect');
const btnDisconnect = document.getElementById('btnDisconnect');
const btnTestPrint = document.getElementById('btnTestPrint');
const connectError = document.getElementById('connectError');
const printLog = document.getElementById('printLog');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const machineInfo = document.getElementById('machineInfo');

// Check saved credentials
const saved = config.get('credentials');
if (saved) {
  document.getElementById('storeId').value = saved.storeId;
  document.getElementById('token').value = saved.token;
}

function log(msg) {
  const time = new Date().toLocaleTimeString();
  printLog.innerHTML += `\n[${time}] ${msg}`;
  printLog.scrollTop = printLog.scrollHeight;
}

// Connect
btnConnect.addEventListener('click', async () => {
  storeId = document.getElementById('storeId').value.trim();
  token = document.getElementById('token').value.trim();
  if (!storeId || !token) { connectError.textContent = 'Preencha todos os campos'; return; }

  btnConnect.disabled = true;
  connectError.textContent = 'Conectando...';

  try {
    const res = await fetch(`${FUNCTIONS_URL}/print-agent-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify({
        store_id: storeId, token, action: 'connect',
        machine_name: os.hostname(),
        agent_version: '1.0.0',
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na conexão');

    agentId = data.agent_id;
    config.set('credentials', { storeId, token });

    machineInfo.textContent = `Máquina: ${os.hostname()} | Store: ${storeId.substring(0, 8)}...`;
    screenConnect.classList.add('hidden');
    screenMain.classList.remove('hidden');

    startHeartbeat();
    startRealtime();
    log('✅ Conectado com sucesso');
  } catch (e) {
    connectError.textContent = e.message;
  } finally {
    btnConnect.disabled = false;
  }
});

// Heartbeat
function startHeartbeat() {
  heartbeatInterval = setInterval(async () => {
    try {
      const res = await fetch(`${FUNCTIONS_URL}/print-agent-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
        body: JSON.stringify({ store_id: storeId, token, action: 'heartbeat' }),
      });
      const data = await res.json();
      if (!data.is_active) {
        log('⚠️ Token revogado! Desconectando...');
        disconnect();
      }
    } catch {
      statusDot.className = 'dot offline';
      statusText.textContent = 'Offline - tentando reconectar...';
    }
  }, 30000);
}

// Realtime — listen only to this store's orders
function startRealtime() {
  realtimeChannel = supabase
    .channel(`orders-${storeId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: `store_id=eq.${storeId}`,
    }, async (payload) => {
      const order = payload.new;
      if (printedOrderIds.has(order.id)) return; // dedup
      printedOrderIds.add(order.id);

      log(`📦 Novo pedido #${order.tracking_code || order.id.substring(0, 8)}`);

      if (autoPrint) {
        // Fetch order items
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        printOrder(order, items || []);
      }
    })
    .subscribe();
}

// ESC/POS thermal print (58mm)
function printOrder(order, items) {
  try {
    const escpos = require('escpos');

    // Try each active printer
    const activePrinters = config.get('printers', []).filter(p => p.active);
    if (activePrinters.length === 0) {
      log('⚠️ Nenhuma impressora ativa configurada');
      return;
    }

    for (const printer of activePrinters) {
      let device;
      if (printer.type === 'usb') {
        const USB = require('escpos-usb');
        device = new USB();
      } else if (printer.type === 'network') {
        const Network = require('escpos-network');
        device = new Network(printer.ip, printer.port || 9100);
      }

      if (!device) continue;

      const p = new escpos.Printer(device);

      device.open(() => {
        p.font('a')
          .align('ct')
          .style('b')
          .size(1, 1)
          .text('ACAI LAB')
          .style('normal')
          .text('NAO E DOCUMENTO FISCAL')
          .text('--------------------------------')
          .align('lt')
          .text(`Pedido: ${order.tracking_code || '---'}`)
          .text(`Data: ${new Date(order.created_at).toLocaleString('pt-BR')}`)
          .text(`Tipo: ${order.order_type === 'delivery' ? 'TELE-ENTREGA' : 'RETIRADA'}`)
          .text('--------------------------------')
          .text(`Cliente: ${order.customer_name}`)
          .text(`Tel: ${order.customer_phone || '---'}`)
          .text(`End: ${order.customer_address || '---'}`)
          .text('--------------------------------')
          .text('ITEM              QTD    VALOR');

        for (const item of items) {
          const name = item.product_name.substring(0, 18).padEnd(18);
          const qty = String(item.quantity).padStart(3);
          const val = item.subtotal.toFixed(2).padStart(8);
          p.text(`${name}${qty}${val}`);

          if (item.additionals) {
            try {
              const adds = typeof item.additionals === 'string'
                ? JSON.parse(item.additionals)
                : item.additionals;
              if (Array.isArray(adds)) {
                adds.forEach(a => p.text(`  + ${a.name || a}`));
              }
            } catch {}
          }
        }

        p.text('--------------------------------')
          .text(`Subtotal:      R$ ${order.subtotal.toFixed(2)}`)
          .text(`Taxa entrega:  R$ ${(order.delivery_fee || 0).toFixed(2)}`)
          .text('--------------------------------')
          .style('b')
          .size(1, 1)
          .text(`TOTAL: R$ ${order.total.toFixed(2)}`)
          .style('normal')
          .size(0, 0)
          .text('--------------------------------')
          .text(`Pagamento: ${order.payment_method || '---'}`)
          .text('')
          .cut()
          .close();

        log(`✅ Impresso em ${printer.name}`);
      });
    }
  } catch (e) {
    log(`❌ Erro ao imprimir: ${e.message}`);
  }
}

// Disconnect
function disconnect() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  config.delete('credentials');
  screenMain.classList.add('hidden');
  screenConnect.classList.remove('hidden');
  storeId = null;
  token = null;
}

btnDisconnect.addEventListener('click', disconnect);

btnTestPrint.addEventListener('click', () => {
  const testOrder = {
    tracking_code: 'TESTE001',
    created_at: new Date().toISOString(),
    order_type: 'delivery',
    customer_name: 'Cliente Teste',
    customer_phone: '(00) 00000-0000',
    customer_address: 'Rua Teste, 123',
    subtotal: 35.90,
    delivery_fee: 5.00,
    total: 40.90,
    payment_method: 'Dinheiro',
  };
  const testItems = [
    { product_name: 'Açaí 500ml', quantity: 2, subtotal: 35.90, additionals: null },
  ];
  printOrder(testOrder, testItems);
});

// IPC from tray
ipcRenderer.on('test-print', () => btnTestPrint.click());
ipcRenderer.on('auto-print-changed', (_, val) => { autoPrint = val; log(`Auto print: ${val ? 'ON' : 'OFF'}`); });
