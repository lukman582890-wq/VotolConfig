import { Capacitor } from '@capacitor/core';
import { UsbSerial } from 'capacitor-usb-serial';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Buffer } from 'buffer';
import { BluetoothCommunication } from '@yesprasoon/capacitor-bluetooth-communication';
import { buildLDGET, buildWritePacket, parsePage, parseTelemetry, buildRemoteControlPacket, buildChecksum } from './votoCore';

// Using @yesprasoon/capacitor-bluetooth-communication (Jan 2025, Capacitor 8 compatible)
// API: enableBluetooth(), scanDevices()→{devices}, connect({address}), sendData({data:hex}), disconnect(), addListener()
const BT_PLUGIN = BluetoothCommunication || (Capacitor.Plugins && Capacitor.Plugins.BluetoothCommunication);

/**
 * Bridge class handling serial communication across platforms (Electron PC vs Android).
 * Manages the underlying connection (USB or Bluetooth) and abstracts it to provide
 * high-level methods like connect, readConfig, and writeConfig to the UI.
 * Crucially, it also maintains the background telemetry "heartbeat" required 
 * to keep the Votol controller active and responsive.
 */
class SerialManager {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.connectedDevice = null;
    this.readListener = null;
    this.readBuffer = Buffer.alloc(0);
    this.telemetryListeners = new Set();
    this.pollInterval = null;
    this.isPollingPaused = false;
    this.lastRawPages = {};
    this.heartbeatData = {
      volCal: 0,
      curCal: 0,
      weakFluxCal: 0,
      throttle: 0,
      gear: 'L',
      brake: false,
      reverse: false,
      lock: false,
      remoteEnabled: false
    };
    this.isReadingConfig = false;
    this.configPages = {};
    this.configPromiseResolve = null;
    this.configTimeout = null;

    // Bluetooth state
    this.connectionMode = 'usb';   // 'usb' | 'bluetooth'
    this.btPollInterval = null;
    this.btDevice = null;          // { mac, name } for Android BT

    if (this.isNative) {
      this.setupAndroidListener();
    } else {
      this.setupElectronListeners();
    }
  }

  updateHeartbeat(data) {
    this.heartbeatData = { ...this.heartbeatData, ...data };
    // Synchronize background heartbeat in Electron if connected
    if (!this.isNative && this.connectedDevice) {
      this.sendRemoteControl(this.heartbeatData);
    }
  }

  setupElectronListeners() {
    if (window.electronAPI) {
      window.electronAPI.onTelemetryData((data) => {
        this.emitTelemetry(data);
      });
    }
  }

  /**
   * Sets up the global event listener for incoming USB/Bluetooth binary data natively on Android.
   * Chunks are accumulated in `readBuffer` until a complete 24-byte packet is found.
   * Packets are identified by a 0xC0 or 0xC9 header and a 0x0D footer.
   * Telemetry packets (0x59) trigger UI updates, while config/ACK packets (0x50/0x52) 
   * resolve pending read/write promises.
   */
  setupAndroidListener() {
    this.readListener = UsbSerial.addListener('dataReceived', (data) => {
      const newBytes = Buffer.from(data.data, 'base64');
      this.readBuffer = Buffer.concat([this.readBuffer, newBytes]);

      while (this.readBuffer.length >= 24) {
        // Find EITHER C0 or C9
        let headIdx = -1;
        const c0Idx = this.readBuffer.indexOf(0xC0);
        const c9Idx = this.readBuffer.indexOf(0xC9);

        if (c0Idx === -1) headIdx = c9Idx;
        else if (c9Idx === -1) headIdx = c0Idx;
        else headIdx = Math.min(c0Idx, c9Idx);

        if (headIdx === -1) {
          this.readBuffer = Buffer.alloc(0);
          break;
        }
        if (headIdx > 0) {
          this.readBuffer = this.readBuffer.slice(headIdx);
        }
        if (this.readBuffer.length < 24) break;

        const packet = this.readBuffer.slice(0, 24);

        // Peek: Is it Telemetry? (Type 0x59)
        if (packet[3] === 0x59 && packet[23] === 0x0D) {
          const telemetry = parseTelemetry(packet);
          if (telemetry) {
            this.emitTelemetry(telemetry);
          }
          this.readBuffer = this.readBuffer.slice(24);
        } else if ((packet[3] === 0x50 || packet[3] === 0x52) && packet[23] === 0x0D) {
          // It's a Config packet OR ACK/NACK.
          const pageNumOrNack = packet[4];
          this.configPages[pageNumOrNack] = packet;

          // Use 'PN' as a special key for NACK detections
          if (packet[3] === 0x50 && pageNumOrNack === 0x4E) {
            console.warn("Votol: Received NACK (PN) from controller");
            this.configPages['PN'] = packet;
          }

          // If explicit Read is happening, check for completion
          if (this.isReadingConfig) {
            if (this.configPages[1] && this.configPages[2] && this.configPages[3] &&
              this.configPages[4] && this.configPages[5] && this.configPages[6] && this.configPages[7]) {
              if (this.configPromiseResolve) {
                clearTimeout(this.configTimeout);
                const resolveCopy = this.configPromiseResolve;
                this.configPromiseResolve = null;
                resolveCopy(this.configPages);
              }
            }
          }
          this.readBuffer = this.readBuffer.slice(24);
        } else {
          // Junk or unknown. Advance 1 byte.
          this.readBuffer = this.readBuffer.slice(1);
        }
      }
    });
  }

  onTelemetry(callback) {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  emitTelemetry(data) {
    this.telemetryListeners.forEach(cb => cb(data));
  }

  /**
   * Establishes a connection to the specified device.
   * @param {string} port - The USB path (Linux) or Device ID (Android)
   * @param {string|number} baud - The Baud Rate (typically 9600 or 115200)
   * @param {Function} onLoading - Optional callback to indicate connection state
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async connect(port, baud, onLoading) {
    if (this.isNative) {
      try {
        const { devices } = await UsbSerial.getDeviceConnections();
        if (devices.length === 0) {
          return { success: false, message: "No USB devices found" };
        }

        // On Android we usually pick the first one if not specified
        const deviceIdx = (port === "USB OTG" || !port) ? 0 : parseInt(port) || 0;
        const device = devices[deviceIdx];

        if (!device) return { success: false, message: "Selected device not found" };

        const { portKey } = await UsbSerial.openConnection({
          deviceId: device.deviceId,
          baudRate: parseInt(baud) || 9600,
          dataBits: 8,
          stopBits: 1,
          parity: 'none'
        });

        this.connectedDevice = { ...device, portKey };

        // Start streaming for telemetry
        await UsbSerial.startStreaming({ key: portKey, raw: true });

        // NO POLLING START YET! Doing initial sync first.
        setTimeout(async () => {
          if (onLoading) onLoading(true);
          await this.readConfig();
          if (onLoading) onLoading(false);

          // Now that sync is done, start the background heartbeat
          this.startPolling(portKey);
        }, 500);

        return { success: true };
      } catch (err) {
        console.error("Connect error:", err);
        return { success: false, message: err.message };
      }
    } else {
      const res = await window.electronAPI.connect(port, baud);
      if (res.success) {
        this.connectedDevice = { path: port, portKey: 'ELECTRON' };

        // Auto-read config to populate heartbeat in the background
        setTimeout(async () => {
          try {
            await this.readConfig();
            // Resume polling in backend now that we have values
            if (window.electronAPI.setPolling) {
              window.electronAPI.setPolling(true);
            }
          } catch (e) {
            console.warn("Votol: Electron background sync failed", e);
          }
        }, 800);
      }
      return res;
    }
  }

  async disconnect() {
    if (this.isNative) {
      if (this.connectedDevice) {
        if (this.pollInterval) clearInterval(this.pollInterval);
        await UsbSerial.endConnection({ key: this.connectedDevice.portKey });
        this.connectedDevice = null;
      }
      return { success: true };
    } else {
      return await window.electronAPI.disconnect();
    }
  }

  /**
   * Requests the full configuration from the Votol controller by sending LDGET (0x52).
   * It temporarily pauses the telemetry heartbeat to ensure a clean data stream.
   * Collects all 7 parameter pages and parses them into usable JSON structures.
   * @returns {Promise<{success: boolean, pages?: Object, message?: string}>}
   */
  async readConfig() {
    if (this.isNative) {
      if (!this.connectedDevice) return { success: false, message: "Not connected" };

      return new Promise(async (resolve) => {
        this.isReadingConfig = true;
        this.isPollingPaused = true; // PAUSE HEARTBEAT
        this.configPages = {};
        this.readBuffer = Buffer.alloc(0);
        this.configPromiseResolve = (pages) => {
          this.isReadingConfig = false;
          this.isPollingPaused = false; // RESUME HEARTBEAT

          // Construct fullData from collected pages for parseConfigPages logic
          const fullData = Buffer.concat([
            pages[1], pages[2], pages[3], pages[4], pages[5], pages[6], pages[7]
          ]);

          const parsedPages = this.parseConfigPages(fullData);
          if (parsedPages) {
            this.updateHeartbeat({
              volCal: (parsedPages.page1?.volCal !== 0 ? parsedPages.page1?.volCal : parsedPages.page4?.volCal) || 0,
              curCal: (parsedPages.page1?.curCal !== 0 ? parsedPages.page1?.curCal : parsedPages.page4?.curCal) || 0,
              weakFluxCal: parsedPages.page4?.weakFluxCal || 0
            });
          }
          resolve({ success: true, pages: parsedPages });
        };

        const ldget = buildLDGET();
        await this._nativeWrite(ldget);

        this.configTimeout = setTimeout(() => {
          this.isReadingConfig = false;
          this.isPollingPaused = false; // RESUME HEARTBEAT
          this.configPromiseResolve = null;
          resolve({ success: false, message: "Timeout reading configuration from Android stream" });
        }, 5000);
      });
    } else {
      const res = await window.electronAPI.readConfig();
      if (res.success && res.pages) {
        // Update local frontend heartbeat data from the Electron read
        if (res.pages.page1) {
          this.updateHeartbeat({
            volCal: res.pages.page1.volCal,
            curCal: res.pages.page1.curCal
          });
        }
        if (res.pages.page4) {
          this.updateHeartbeat({ weakFluxCal: res.pages.page4.weakFluxCal });
        }
      }
      return res;
    }
  }

  /**
   * Writes a modified configuration object back to the Votol controller.
   * On Android, it splits the data into 7 individual page packets, calculates 
   * checksums, and sends them sequentially with a safe delay. 
   * It temporarily pauses the telemetry heartbeat during this process.
   * @param {Object} data - The complete edited configuration object.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async writeConfig(data) {
    if (this.isNative) {
      if (!this.connectedDevice) return { success: false, message: "Not connected" };
      try {
        // 1. Soft Lock: Pause heartbeat but keep stream running to avoid thread fighting
        this.isPollingPaused = true;
        this.readBuffer = Buffer.alloc(0);

        // Sync calibration to heartbeat
        if (data.page1) {
          this.updateHeartbeat({
            volCal: data.page1.volCal,
            curCal: data.page1.curCal
          });
        }

        // Sync Flux calibration if present
        if (data.page4?.weakFluxCal !== undefined) {
          this.updateHeartbeat({ weakFluxCal: data.page4.weakFluxCal });
        }

        // Wait for last telemetry response to clear. 
        await new Promise(r => setTimeout(r, 600));
        this.readBuffer = Buffer.alloc(0); // Clean slate

        const pagesToWrite = [1, 2, 3, 4, 5, 6, 7];
        let successCount = 0;
        let report = [];

        for (const pNum of pagesToWrite) {
          const pageKey = `page${pNum}`;
          const pageData = data[pageKey] || (pNum === 6 ? data.page5 : null);

          if (pageData || this.lastRawPages[pNum]) {
            const rawBackup = this.lastRawPages[pNum] || Buffer.alloc(17);
            const packet = buildWritePacket(pNum, rawBackup, pageData || {}, data.page3);

            await this._nativeWrite(packet);

            // Update local cache from what we THINK happened
            this.lastRawPages[pNum] = packet.slice(5, 5 + 17);
            successCount++;

            // Safety delay for controller flash write
            await new Promise(r => setTimeout(r, 300));
          }
        }

        this.isPollingPaused = false;

        if (successCount === 0) {
          return { success: false, message: "Write FAILED: Unable to communicate with controller." };
        }

        return {
          success: true,
          message: "Configuration successfully synchronized!"
        };
      } catch (err) {
        console.error("WriteConfig Error:", err);
        this.isPollingPaused = false;
        return { success: false, message: err.message };
      }
    } else {
      return await window.electronAPI.writeConfig(data);
    }
  }

  /**
   * Exports the currently loaded raw configuration bytes to a standard INI file.
   * On Android, it leverages Capacitor's Filesystem and Share plugins to prompt
   * the user to save or send the generated `Config.ini` file.
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async exportConfig() {
    if (this.isNative) {
      try {
        if (Object.keys(this.lastRawPages).length < 7) {
          return { success: false, message: "No data to export. Please Read from controller first." };
        }

        const allLines = [];
        for (let i = 1; i <= 7; i++) {
          const p = this.lastRawPages[i];
          if (!p) {
            // Fill with 17 zeros if page missing
            for (let j = 0; j < 17; j++) allLines.push("0");
          } else {
            for (let b of p) allLines.push(b.toString());
          }
        }
        const iniString = allLines.join('\n') + '\n';
        const fileName = `Votol_Config_${new Date().toISOString().slice(0, 10)}.ini`;

        // Write to temp file
        const result = await Filesystem.writeFile({
          path: fileName,
          data: iniString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        // Share the file
        await Share.share({
          title: 'Export Votol Config',
          text: 'Sharing Votol Parameters (Config.ini)',
          url: result.uri,
          dialogTitle: 'Save or Share Config'
        });

        return { success: true };
      } catch (err) {
        console.error("Android Export Error:", err);
        return { success: false, message: err.message };
      }
    } else {
      return await window.electronAPI.exportConfig();
    }
  }

  /**
   * Sends a real-time 'SHOW' (0x59) command to override the controller's throttle, 
   * brake, gear, or lock states when the app is in "Remote Control" mode.
   * This overrides actual physical inputs while active.
   * @param {Object} data - State containing throttle percent, gear, and flags.
   */
  async sendRemoteControl(data) {
    if (this.isNative) {
      if (!this.connectedDevice) return;
      this.updateHeartbeat(data);
      try {
        const packet = buildRemoteControlPacket(this.heartbeatData);
        await this._nativeWrite(packet);
      } catch (e) { console.error(e); }
    } else {
      await window.electronAPI.sendRemoteControl(data);
    }
  }

  /**
   * Opens a native file picker to select and parse an existing `Config.ini` file.
   * It translates the 119 stringified integer lines back into raw binary pages,
   * then parses them so they can be viewed or written to the controller over BT/USB.
   * @returns {Promise<{success: boolean, pages?: Object, message?: string}>}
   */
  async importConfig() {
    if (this.isNative) {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ini';

        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) {
            resolve({ success: false });
            return;
          }

          try {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const raw = event.target.result;
              const lines = raw.split(/\r?\n/).filter(line => line.trim() !== '').map(n => parseInt(n, 10));

              if (lines.length < 119) {
                resolve({ success: false, message: `Invalid Config.ini. Expected 119 values, got ${lines.length}` });
                return;
              }

              // Map according to Votol Page structure (17 bytes per page)
              const p1 = Buffer.from(lines.slice(0, 17));
              const p2 = Buffer.from(lines.slice(17, 34));
              const p3 = Buffer.from(lines.slice(34, 51));
              const p4 = Buffer.from(lines.slice(51, 68));
              const p5 = Buffer.from(lines.slice(68, 85));
              const p6 = Buffer.from(lines.slice(85, 102));
              const p7 = Buffer.from(lines.slice(102, 119));

              this.lastRawPages = { 1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6, 7: p7 };

              const pages = {
                page1: parsePage(1, p1),
                page2: parsePage(2, p2),
                page3: parsePage(3, p3),
                page4: parsePage(4, p4, null, p7),
                page5: parsePage(5, p5, p6)
              };

              // Sync heartbeat
              this.updateHeartbeat({
                volCal: (pages.page1?.volCal !== 0 ? pages.page1?.volCal : pages.page4?.volCal) || 0,
                curCal: (pages.page1?.curCal !== 0 ? pages.page1?.curCal : pages.page4?.curCal) || 0,
                weakFluxCal: pages.page4?.weakFluxCal || 0
              });

              resolve({ success: true, pages });
            };
            reader.readAsText(file);
          } catch (err) {
            resolve({ success: false, message: err.message });
          }
        };

        input.click();
      });
    } else {
      return await window.electronAPI.importConfig();
    }
  }

  async getPorts() {
    if (this.isNative) {
      try {
        const { devices } = await UsbSerial.getDeviceConnections();
        const mappedDevices = devices.map((d, i) => ({
          path: `Device ${i}: ${d.deviceName}`,
          id: i,
          deviceId: d.deviceId,
          manufacturer: d.manufacturerName || 'USB OTG'
        }));

        // If no devices found, still show one option to allow the user to selection/retry
        if (mappedDevices.length === 0) {
          return [{ path: "USB OTG (Touch to Scan)", id: 0, manufacturer: "Android" }];
        }
        return mappedDevices;
      } catch (e) {
        console.error("getPorts error:", e);
        return [{ path: "USB OTG Fallback", id: 0, manufacturer: "Error" }];
      }
    } else {
      return await window.electronAPI.listPorts();
    }
  }

  parseConfigPages(data) {
    const rawPages = {};

    // Accept both C0 14 02 50 (old) and C0 14 05 52 (observed in logs)
    // Also accept C9 headers
    for (let i = 0; i < data.length - 23; i++) {
      if ((data[i] === 0xC0 || data[i] === 0xC9) && data[i + 1] === 0x14 &&
        ((data[i + 2] === 0x02 && data[i + 3] === 0x50) || (data[i + 2] === 0x05 && data[i + 3] === 0x52))) {
        const pageNum = data[i + 4];
        // Config data is 17 bytes per page (total packet 24 bytes)
        const pageData = data.slice(i + 5, i + 5 + 17);
        rawPages[pageNum] = pageData;
        this.lastRawPages[pageNum] = pageData;
        i += 23; // Skip past this 24-byte packet
      }
    }

    const pages = {};
    if (rawPages[1]) pages.page1 = parsePage(1, rawPages[1]);
    if (rawPages[2]) pages.page2 = parsePage(2, rawPages[2]);
    if (rawPages[3]) pages.page3 = parsePage(3, rawPages[3]);
    if (rawPages[4]) pages.page4 = parsePage(4, rawPages[4], null, rawPages[7]);
    if (rawPages[5]) pages.page5 = parsePage(5, rawPages[5], rawPages[6]);

    return Object.keys(pages).length > 0 ? pages : null;
  }

  startPolling(portKey) {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      if (this.isPollingPaused || !this.connectedDevice) return;
      try {
        const show = buildRemoteControlPacket(this.heartbeatData);
        await this._nativeWrite(show);
      } catch (e) {
        console.error("UsbSerial.JS Polling Error:", e);
      }
    }, 500); // 2Hz heartbeat
  }

  /** Route write to USB or BT depending on connectionMode */
  async _nativeWrite(buf) {
    if (this.connectionMode === 'bluetooth') {
      const BT = BT_PLUGIN;
      if (BT && BT.sendData) {
        // Plugin sends data.getBytes() — binary protocol needs latin-1 string encoding
        // so each byte value is preserved exactly as a character code
        const latinStr = buf.toString('binary'); // latin-1: code point == byte value
        await BT.sendData({ data: latinStr });
      }
    } else if (this.connectedDevice?.portKey && this.connectedDevice.portKey !== 'BT') {
      await UsbSerial.write({
        key: this.connectedDevice.portKey,
        message: buf.toString('base64'),
        noRead: true
      });
    }
  }

  // ── Bluetooth methods ──────────────────────────────────────────────────────

  setConnectionMode(mode) {
    this.connectionMode = mode; // 'usb' | 'bluetooth'
  }

  /** Scan for BT devices. Returns [{mac, name}] */
  async scanBluetooth() {
    if (this.isNative) {
      const BT = BT_PLUGIN;
      if (!BT) {
        alert("Plugin Bluetooth no cargado. Reinstala la app.");
        return { success: false, devices: [], message: 'Plugin BT no disponible.' };
      }
      
      try {
        if (BT.requestPermissions) {
          try {
            await BT.requestPermissions({
              permissions: ['bluetooth', 'bluetoothScan']
            });
          } catch (pe) {
            console.error("Votol BT: Permission request failed:", pe);
          }
        }
        // 1. Ensure BT is enabled
        if (BT.enableBluetooth) await BT.enableBluetooth();
        else if (BT.enable) await BT.enable();

        // 2. Scan with a timeout to prevent infinite hang
        // The plugin usually returns an object with a 'devices' array
        return await new Promise(async (resolve) => {
          const timeout = setTimeout(() => {
            resolve({ success: false, devices: [], message: 'Tiempo de espera agotado al escanear dispositivos.' });
          }, 10000); // 10s timeout

          try {
            let devices = [];
            if (BT.scanDevices) {
              const r = await BT.scanDevices();
              devices = r.devices || r || [];
            } else if (BT.scan) {
              const r = await BT.scan();
              devices = r.devices || [];
            } else if (BT.getPairedDevices) {
              const r = await BT.getPairedDevices();
              devices = r.devices || [];
            }
            clearTimeout(timeout);
            resolve({ 
              success: true, 
              devices: devices.map(d => ({ 
                mac: d.address || d.mac, 
                name: d.name || d.address || d.mac || 'Dispositivo desconocido' 
              })) 
            });
          } catch (err) {
            clearTimeout(timeout);
            resolve({ success: false, devices: [], message: err.message });
          }
        });
      } catch (e) {
        console.error('Android BT scan error:', e);
        return { success: false, devices: [], message: e.message };
      }
    } else {
      // PC: check prerequisites first then scan
      try {
        const ready = await window.electronAPI.checkBtReady();
        if (!ready.daemonOk || !ready.inBtGroup || !ready.rfcommAvail) {
          return { success: false, devices: [], btSetupNeeded: true, btStatus: ready };
        }
        const devices = await window.electronAPI.scanBluetooth();
        return { success: true, devices };
      } catch (e) {
        return { success: false, devices: [], message: e.message };
      }
    }
  }

  /** List already-paired BT devices (faster than full scan) */
  async listPairedBluetooth() {
    if (this.isNative) {
      const BT = BT_PLUGIN;
      if (!BT) return [];
      try {
        // Try various API names
        let devices = [];
        if (BT.getPairedDevices) {
          const r = await BT.getPairedDevices();
          devices = r.devices || [];
        } else if (BT.list) {
          const r = await BT.list();
          devices = r.devices || [];
        }
        return devices.map(d => ({ mac: d.address || d.mac, name: d.name || d.address || d.mac }));
      } catch (e) { return []; }
    } else {
      return await window.electronAPI.listPairedBluetooth();
    }
  }

  /** Connect via Bluetooth (HC-05, ESP32, etc.) */
  async connectBluetooth(macOrAddress, baud, onLoading) {
    this.connectionMode = 'bluetooth';
    if (this.isNative) {
      const BT = BT_PLUGIN;
      if (!BT) return { success: false, message: 'Plugin BT no disponible' };
      try {
        // Use connect() as defined in Java/definitions
        await BT.connect({ address: macOrAddress });

        this.btDevice = { mac: macOrAddress };
        this.connectedDevice = { portKey: 'BT', path: macOrAddress };
        this._startBtPollLoop(BT);

        // Initial sync: send LDGET
        setTimeout(async () => {
          if (onLoading) onLoading(true);
          this.connectedDevice = { portKey: 'BT', path: macOrAddress };
          await this.readConfig();
          if (onLoading) onLoading(false);
        }, 500);

        return { success: true };
      } catch (e) {
        this.connectionMode = 'usb';
        return { success: false, message: e.message };
      }
    } else {
      // PC: bind RFCOMM then connect
      const result = await window.electronAPI.connectBluetoothRfcomm(macOrAddress, baud);
      if (result.success) {
        this.connectedDevice = { path: '/dev/rfcomm0', portKey: 'BT_RFCOMM' };
        setTimeout(async () => {
          if (onLoading) onLoading(true);
          await this.readConfig();
          if (result.success && window.electronAPI.setPolling) {
            window.electronAPI.setPolling(true);
          }
          if (onLoading) onLoading(false);
        }, 800);
      }
      return result;
    }
  }

  /** Internal: event-driven BT read loop for Android */
  _startBtPollLoop(BT) {
    if (this.btPollInterval) clearInterval(this.btPollInterval);

    // Listen for incoming data via 'dataReceived' event
    // The Java plugin emits: notifyListeners("dataReceived", {data: String})
    // String is raw bytes read from InputStream — must parse as latin-1 (binary encoding)
    if (BT.addListener) {
      BT.addListener('dataReceived', (event) => {
        const rawStr = event.data || '';
        if (rawStr) {
          // 'binary' encoding maps each char code to a byte value (latin-1)
          const newBytes = Buffer.from(rawStr, 'binary');
          this.readBuffer = Buffer.concat([this.readBuffer, newBytes]);
          this._processBtBuffer();
        }
      });
    }

    // 500ms heartbeat ticker (same as USB path)
    this.btPollInterval = setInterval(async () => {
      if (this.isPollingPaused || !this.connectedDevice) return;
      try {
        const show = buildRemoteControlPacket(this.heartbeatData);
        await this._nativeWrite(show);
      } catch (e) { /* ignore transient errors */ }
    }, 500);
  }

  /** Process readBuffer bytes — same logic as Android USB path */
  _processBtBuffer() {
    while (this.readBuffer.length >= 24) {
      let headIdx = -1;
      const c0Idx = this.readBuffer.indexOf(0xC0);
      const c9Idx = this.readBuffer.indexOf(0xC9);
      if (c0Idx === -1) headIdx = c9Idx;
      else if (c9Idx === -1) headIdx = c0Idx;
      else headIdx = Math.min(c0Idx, c9Idx);

      if (headIdx === -1) { this.readBuffer = Buffer.alloc(0); break; }
      if (headIdx > 0) this.readBuffer = this.readBuffer.slice(headIdx);
      if (this.readBuffer.length < 24) break;

      const packet = this.readBuffer.slice(0, 24);
      if (packet[3] === 0x59 && packet[23] === 0x0D) {
        const telemetry = parseTelemetry(packet);
        if (telemetry) this.emitTelemetry(telemetry);
        this.readBuffer = this.readBuffer.slice(24);
      } else if ((packet[3] === 0x50 || packet[3] === 0x52) && packet[23] === 0x0D) {
        const pageNum = packet[4];
        this.configPages[pageNum] = packet;
        if (this.isReadingConfig) {
          if (this.configPages[1] && this.configPages[2] && this.configPages[3] &&
              this.configPages[4] && this.configPages[5] && this.configPages[6] && this.configPages[7]) {
            if (this.configPromiseResolve) {
              clearTimeout(this.configTimeout);
              const res = this.configPromiseResolve;
              this.configPromiseResolve = null;
              res(this.configPages);
            }
          }
        }
        this.readBuffer = this.readBuffer.slice(24);
      } else {
        this.readBuffer = this.readBuffer.slice(1);
      }
    }
  }

  /** Write a Buffer via BT on Android (called by readConfig/writeConfig) */
  async _writeBluetooth(buf) {
    try {
      const BT = BT_PLUGIN;
      if (!BT) return;
      await BT.writeHex({ value: buf.toString('hex') });
    } catch (e) {
      console.error('Error writing to BT:', e);
      // Optionally rethrow or handle the error as needed
    }
  }

  /** Override disconnect to also handle BT path */
  async disconnectBluetooth() {
    if (this.isNative) {
      if (this.btPollInterval) { clearInterval(this.btPollInterval); this.btPollInterval = null; }
      try {
        const BT = BT_PLUGIN;
        if (BT) await BT.disconnect();
      } catch (e) { /* ignore */ }
      this.connectedDevice = null;
      this.connectionMode = 'usb';
      return { success: true };
    } else {
      const result = await window.electronAPI.disconnectBluetoothRfcomm();
      this.connectedDevice = null;
      this.connectionMode = 'usb';
      return result;
    }
  }
}

export const serialManager = new SerialManager();
