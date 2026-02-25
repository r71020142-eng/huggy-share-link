const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({ encryptionKey: 'acailab-secure-key-2024' });

let mainWindow;
let tray;
let isQuitting = false;

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

  mainWindow.loadFile('renderer/index.html');
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
