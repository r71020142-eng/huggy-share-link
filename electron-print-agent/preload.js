const { contextBridge, ipcRenderer } = require('electron');

const bridge = {
  // Secure store
  storeGet: (key, defaultVal) => ipcRenderer.invoke('store-get', key, defaultVal),
  storeSet: (key, val) => ipcRenderer.invoke('store-set', key, val),
  storeDelete: (key) => ipcRenderer.invoke('store-delete', key),

  // System
  getHostname: () => ipcRenderer.invoke('get-hostname'),

  // Printing
  printEscpos: (printerConfig, commands) => ipcRenderer.invoke('print-escpos', { printerConfig, commands }),
  detectUsbPrinters: () => ipcRenderer.invoke('detect-usb-printers'),

  // Tray events
  onTrayTestPrint: (callback) => ipcRenderer.on('tray-test-print', callback),
  onTrayAutoPrintChanged: (callback) => ipcRenderer.on('tray-auto-print-changed', (_event, val) => callback(val)),
};

// Backward compatibility: some renderer builds still use window.api
contextBridge.exposeInMainWorld('electronAPI', bridge);
contextBridge.exposeInMainWorld('api', bridge);
