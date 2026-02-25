const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({ encryptionKey: 'acailab-secure-key-2024' });

let mainWindow;
let tray;
let isQuitting = false;

function buildFatalErrorHtml(title, message, details = '') {
  const esc = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Açaí Lab Print Agent - Erro</title>
  <style>
    body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #1a1a2e; color: #eee; display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    .card { max-width: 720px; width: 100%; background: #16213e; border-radius: 12px; padding: 20px; box-shadow: 0 8px 28px rgba(0,0,0,.35); }
    h1 { margin: 0 0 10px; font-size: 20px; color: #e94560; }
    p { margin: 0 0 12px; color: #c8c8d8; }
    pre { margin: 0; background: #0a0a1a; color: #ffb4b4; border-radius: 8px; padding: 12px; white-space: pre-wrap; word-break: break-word; max-height: 320px; overflow: auto; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${esc(title)}</h1>
    <p>${esc(message)}</p>
    <pre>${esc(details)}</pre>
  </div>
</body>
</html>`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 680,
    height: 780,
    resizable: false,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'Açaí Lab Print Agent',
  });

  let fatalShown = false;
  const showFatal = (title, message, details = '') => {
    if (fatalShown || mainWindow.isDestroyed()) return;
    fatalShown = true;
    const html = buildFatalErrorHtml(title, message, details);
    mainWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(html)}`);
  };

  const indexPath = path.join(__dirname, 'renderer', 'index.html');
  mainWindow.loadFile(indexPath).catch((err) => {
    showFatal('Falha ao abrir interface', 'Não foi possível carregar renderer/index.html', err?.stack || err?.message || String(err));
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    showFatal('Falha no carregamento', `Erro ${errorCode}: ${errorDescription}`, `URL: ${validatedURL || 'N/A'}`);
  });

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    showFatal('Erro no preload', 'Falha ao inicializar recursos internos', `${preloadPath}\n\n${error?.stack || error?.message || String(error)}`);
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    showFatal('Render process encerrado', `Motivo: ${details.reason}`, `Exit code: ${details.exitCode}`);
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  let icon;
  try {
    icon = nativeImage.createFromPath(path.join(__dirname, 'assets/icon.png'));
    icon = icon.resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir', click: () => mainWindow.show() },
    { label: 'Testar Impressão', click: () => mainWindow.webContents.send('tray-test-print') },
    {
      label: 'Auto Print',
      type: 'checkbox',
      checked: store.get('autoPrint', true),
      click: (item) => {
        store.set('autoPrint', item.checked);
        mainWindow.webContents.send('tray-auto-print-changed', item.checked);
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Açaí Lab Print Agent');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => mainWindow.show());
}

// IPC handlers for secure store access
ipcMain.handle('store-get', (_, key, defaultVal) => store.get(key, defaultVal));
ipcMain.handle('store-set', (_, key, val) => { store.set(key, val); return true; });
ipcMain.handle('store-delete', (_, key) => { store.delete(key); return true; });
ipcMain.handle('get-hostname', () => require('os').hostname());

// Printing IPC
ipcMain.handle('print-escpos', async (_, { printerConfig, commands }) => {
  return new Promise((resolve) => {
    try {
      const escpos = require('escpos');
      let device;

      if (printerConfig.type === 'usb') {
        const USB = require('escpos-usb');
        device = new USB();
      } else if (printerConfig.type === 'network') {
        const Network = require('escpos-network');
        device = new Network(printerConfig.ip, printerConfig.port || 9100);
      } else {
        resolve({ success: false, error: 'Tipo de impressora não suportado' });
        return;
      }

      device.open((err) => {
        if (err) {
          resolve({ success: false, error: err.message });
          return;
        }

        const printer = new escpos.Printer(device);

        // Execute command sequence
        for (const cmd of commands) {
          switch (cmd.type) {
            case 'font': printer.font(cmd.value); break;
            case 'align': printer.align(cmd.value); break;
            case 'style': printer.style(cmd.value); break;
            case 'size': printer.size(cmd.w, cmd.h); break;
            case 'text': printer.text(cmd.value); break;
            case 'cut': printer.cut(); break;
            case 'feed': printer.feed(cmd.lines || 1); break;
          }
        }

        printer.cut().close(() => {
          resolve({ success: true });
        });
      });
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
});

// Detect USB printers
ipcMain.handle('detect-usb-printers', () => {
  try {
    const USB = require('escpos-usb');
    const devices = USB.findPrinter();
    return devices.map((d, i) => ({
      name: `USB Printer ${i + 1}`,
      vendorId: d.deviceDescriptor?.idVendor,
      productId: d.deviceDescriptor?.idProduct,
    }));
  } catch {
    return [];
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
