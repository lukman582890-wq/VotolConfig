const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Serial Port operations
  listPorts: () => ipcRenderer.invoke('list-ports'),
  connect: (portPath, baudRate) => ipcRenderer.invoke('connect', portPath, baudRate),
  disconnect: () => ipcRenderer.invoke('disconnect'),
  setPolling: (active) => ipcRenderer.invoke('set-polling', active),

  // Votol Protocol operations
  writeConfig: (pagesData) => ipcRenderer.invoke('write-config', pagesData),
  readConfig: () => ipcRenderer.invoke('read-config'),
  importConfig: () => ipcRenderer.invoke('import-config'),
  exportConfig: () => ipcRenderer.invoke('export-config'),
  sendRemoteControl: (data) => ipcRenderer.invoke('send-remote-control', data),

  // Real-time events
  onTelemetryData: (callback) => ipcRenderer.on('telemetry-data', (_event, data) => callback(data)),
  onConnectionStatus: (callback) => ipcRenderer.on('connection-status', (_event, status) => callback(status)),

  // Remove event listeners
  removeTelemetryListener: () => ipcRenderer.removeAllListeners('telemetry-data'),
  removeConnectionStatusListener: () => ipcRenderer.removeAllListeners('connection-status'),

  // Bluetooth (PC/Linux RFCOMM)
  checkBtReady: () => ipcRenderer.invoke('check-bt-ready'),
  scanBluetooth: () => ipcRenderer.invoke('scan-bluetooth'),
  listPairedBluetooth: () => ipcRenderer.invoke('list-paired-bluetooth'),
  connectBluetoothRfcomm: (mac, baudRate) => ipcRenderer.invoke('connect-bluetooth-rfcomm', mac, baudRate),
  disconnectBluetoothRfcomm: () => ipcRenderer.invoke('disconnect-bluetooth-rfcomm'),
});
