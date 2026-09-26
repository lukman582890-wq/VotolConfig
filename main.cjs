const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const { buildLDGET, buildWritePacket, parsePage, set16, buildRemoteControlPacket } = require('./src/services/votoCore.js');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

/**
 * Creates the main Electron browser window.
 * Configures preload scripts, enforces context isolation for security,
 * sets up a modern frameless title bar, and loads either the Vite dev
 * server (in development) or the built web assets (in production).
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: true,
      contextIsolation: true
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e1e1e',
      symbolColor: '#74b1be',
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

const { listPorts, connect, disconnect, setPolling, sendPacket, setHeartbeat } = require('./src/backend/serial_handler.cjs');

let isReadingConfig = false;
let configPages = {};
let rawPages = {};
let configPromiseResolve = null;
let configTimeout = null;

ipcMain.handle('list-ports', async () => {
  return await listPorts();
});

/**
 * IPC Handler: connect
 * Establishes a serial or RFCOMM Bluetooth connection to the given port.
 * It sets up a packet listener to process incoming binary data:
 * - LDGET (0x52) packets are collected into `configPages` until all 7 are received.
 * - SHOW (0x59) telemetry packets are parsed and sent directly to the UI (renderer).
 */
ipcMain.handle('connect', async (event, portPath, baudRate) => {
  return await connect(portPath, baudRate, (packet) => {
    if (packet.length < 24) return;

    // Parameter Page Response (LDGET)
    if (packet[0] === 0xC0 && packet[1] === 0x14 && packet[2] === 0x05 && packet[3] === 0x52) {
      if (isReadingConfig) {
        const pageNum = packet[4];
        configPages[pageNum] = packet;
        // Check if we have all 7 pages
        if (configPages[1] && configPages[2] && configPages[3] && configPages[4] && configPages[5] && configPages[6] && configPages[7]) {
          if (configPromiseResolve) {
            clearTimeout(configTimeout);
            configPromiseResolve(configPages);
            configPromiseResolve = null;
          }
        }
      }
      return;
    }

    // Telemetry response (CMD_SHOW)
    if (!isReadingConfig && packet[0] === 0xC0 && packet[1] === 0x14 && packet[2] === 0x0D && packet[3] === 0x59) {
      const volt = packet.readUInt16BE(5) / 10;
      const current = packet.readInt16BE(7) / 10;
      const rpm = packet.readUInt16BE(14);
      const ic_temp = packet[16] - 50;
      const ex_temp = packet[17] - 50;

      const fu_stat = packet[20];
      const ic_stat = packet[21];

      // Sending to UI
      mainWindow.webContents.send('telemetry-data', {
        volt, current, rpm, ic_temp, ex_temp, fu_stat, ic_stat
      });
    }
  });
});

ipcMain.handle('disconnect', async () => {
  return await disconnect();
});

ipcMain.handle('set-polling', async (event, active) => {
  return setPolling(active);
});

/**
 * IPC Handler: write-config
 * Sends the modified configuration back to the controller.
 * Requires `rawPages` to be populated first (via Read or Import) 
 * to merge user changes safely into the original base bytes.
 * Temporarily disables background telemetry polling to ensure write safety.
 */
ipcMain.handle('write-config', async (event, pd) => {
  if (Object.keys(rawPages).length < 5) {
    return { success: false, message: "Please Read or Import first to establish safe base bytes." };
  }

  setPolling(false);

  try {
    const toWrite = [
      { num: 1, raw: Buffer.from(rawPages[1]), data: pd.page1 },
      { num: 2, raw: Buffer.from(rawPages[2]), data: pd.page2 },
      { num: 3, raw: Buffer.from(rawPages[3]), data: pd.page3 },
      { num: 4, raw: Buffer.from(rawPages[4]), data: pd.page4 },
      { num: 5, raw: Buffer.from(rawPages[5]), data: pd.page5 },
      { num: 6, raw: Buffer.from(rawPages[6]), data: pd.page5 },
      { num: 7, raw: Buffer.from(rawPages[7]), data: { ...pd.page1, ...pd.page4 } }
    ];

    for (const page of toWrite) {
      const fullPacket = buildWritePacket(page.num, rawPages[page.num], page.data, pd.page3);
      sendPacket(fullPacket);
      await new Promise(r => setTimeout(r, 150));
    }

    return { success: true };
  } catch (err) {
    console.error("Write error:", err);
    return { success: false, message: err.message };
  } finally {
    setPolling(true);
  }
});

/**
 * IPC Handler: read-config
 * Triggers a full configuration read from the controller.
 * Sends the LDGET command and waits for all 7 parameter pages.
 * Once received, parses the binary data into user-friendly JSON objects
 * and seamlessly updates the background heartbeat with accurate calibration.
 */
ipcMain.handle('read-config', async (event) => {
  console.log("Read config requested");

  setPolling(false);
  isReadingConfig = true;
  const LDGET_PACKET = buildLDGET();
  sendPacket(LDGET_PACKET);

  return new Promise((resolve) => {
    configPromiseResolve = (pages) => {
      isReadingConfig = false;

      const p1 = pages[1].slice(5, 22);
      const p2 = pages[2].slice(5, 22);
      const p3 = pages[3].slice(5, 22);
      const p4 = pages[4].slice(5, 22);
      const p5 = pages[5] ? pages[5].slice(5, 22) : Array(17).fill(0);
      const p6 = (pages[6] ? pages[6].slice(5, 22) : Buffer.alloc(17));
      const p7 = pages[7].slice(5, 22);

      console.log("--- RAW CONFIG READ (17 bytes/page) ---");
      for (let i = 1; i <= 7; i++) {
        const p = pages[i] ? pages[i].slice(5, 22) : Buffer.alloc(17);
        console.log(`P${i} HEX:`, p.toString('hex').toUpperCase());
      }
      console.log("---------------------------------------");

      rawPages = { 1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6, 7: p7 };

      const parsedPages = {
        page1: parsePage(1, p1),
        page2: parsePage(2, p2),
        page3: parsePage(3, p3),
        page4: parsePage(4, p4, null, p7),
        page5: parsePage(5, p5, p6)
      };

      // CRITICAL: Update the background heartbeat BEFORE resuming polling
      // This prevents sending zeroed-out calibration pulses
      // Determine effective calibration for the heartbeat
      let v = parsedPages.page1.volCal || 0;
      let c = parsedPages.page1.curCal || 0;

      // If Page 1 is empty, pull from Page 4 (High-res) and scale down for standard Heartbeat
      if (v === 0 && parsedPages.page4?.volCal) v = Math.round(parsedPages.page4.volCal / 3.0);
      if (c === 0 && parsedPages.page4?.curCal) c = Math.round(parsedPages.page4.curCal / 3.0);

      const hbPacket = buildRemoteControlPacket({
        volCal: v,
        curCal: c,
        weakFluxCal: parsedPages.page4 ? parsedPages.page4.weakFluxCal : 0,
        remoteEnabled: false
      });
      setHeartbeat(hbPacket);

      setPolling(true);
      resolve({ success: true, pages: parsedPages });
    };

    configTimeout = setTimeout(() => {
      configPromiseResolve = null;
      isReadingConfig = false;
      setPolling(true);
      resolve({ success: false, message: "Timeout waiting for controller read" });
    }, 8000); // 8s for BT latency
  });
});

// Helper to convert 2 bytes from array to Int16
const get16 = (lines, startIdx) => {
  return (lines[startIdx] << 8) | lines[startIdx + 1];
};

/**
 * Decodes the 2-byte port configuration from the Votol controller.
 * @param {number} b1 - Byte 1: Contains flags (Switch, Up/Down mode, Latching)
 * @param {number} b2 - Byte 2: Contains I/O direction and the discrete Function ID
 * @returns {Object} Parsed port object with booleans and readable modes.
 */
const decodePort = (b1, b2) => {
  // b1: flags base C0 + 1:SW, 2:U, 4:D, 8:LA
  // b2: func byte (bit7: IO, bits 0-6: ID)
  const sw = !!(b1 & 0x01);
  const modeVal = (b1 >> 1) & 0x03; // bit 1,2
  const la = !!(b1 & 0x08);
  const io = !!(b2 & 0x80);
  const func = b2 & 0x7F; // 0-based ID

  return {
    io,
    sw,
    la,
    mode: modeVal === 1 ? 'U' : (modeVal === 2 ? 'D' : 'F'),
    func: (func === 127 || func === 0xFF) ? 0 : func
  };
};

const encodePort = (p) => {
  let b1 = 0xC0;
  if (p.sw) b1 |= 0x01;
  if (p.mode === 'U') b1 |= 0x02;
  else if (p.mode === 'D') b1 |= 0x04;
  if (p.la) b1 |= 0x08;

  let b2 = (p.func || 0) & 0x7F;
  if (p.io) b2 |= 0x80;

  return [b1, b2];
};

ipcMain.handle('import-config', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Config.ini',
    filters: [{ name: 'INI Files', extensions: ['ini'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) return { success: false };

  try {
    const raw = fs.readFileSync(filePaths[0], 'utf-8');
    // split by newlines, clean up, parse to ints
    const lines = raw.split(/\r?\n/).filter(line => line.trim() !== '').map(n => parseInt(n, 10));

    if (lines.length < 119) {
      throw new Error(`Invalid Config.ini format. Expected 119 values, got ${lines.length}`);
    }

    // Map according to Votol Page structure (17 bytes per page)
    // Page 1 is lines 0-16
    const p1 = lines.slice(0, 17);
    // Page 2 is lines 17-33
    const p2 = lines.slice(17, 34);
    // Page 3 is lines 34-50
    const p3 = lines.slice(34, 51);
    // Page 4 is lines 51-67
    const p4 = lines.slice(51, 68);
    const p5 = lines.slice(68, 85);
    const p6 = lines.slice(85, 102);
    const p7 = lines.slice(102, 119);

    rawPages = { 1: p1, 2: p2, 3: p3, 4: p4, 5: p5, 6: p6, 7: p7 };

    const pages = {
      page1: parsePage(1, p1),
      page2: parsePage(2, p2),
      page3: parsePage(3, p3),
      page4: parsePage(4, p4, null, p7),
      page5: parsePage(5, p5, p6)
    };

    return { success: true, pages };
  } catch (err) {
    console.error("Import error:", err);
    return { success: false, message: err.message };
  }
});

ipcMain.handle('export-config', async (event) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Config.ini',
    defaultPath: 'Config_export.ini',
    filters: [{ name: 'INI Files', extensions: ['ini'] }]
  });

  if (canceled || !filePath) return { success: false };

  try {
    if (Object.keys(rawPages).length < 7) {
      return { success: false, message: "No data to export. Please Read or Import first." };
    }

    const allLines = [];
    for (let i = 1; i <= 7; i++) {
      const p = rawPages[i];
      for (let b of p) allLines.push(b.toString());
    }

    fs.writeFileSync(filePath, allLines.join('\n') + '\n', 'utf-8');
    return { success: true };
  } catch (err) {
    console.error("Export error:", err);
    return { success: false, message: err.message };
  }
});

/**
 * IPC Handler: send-remote-control
 * Builds and sends a special CMD_SHOW (0x59) packet that allows the app
 * to take direct control of the controller (throttle, gear, brake, lock),
 * bypassing the physical hardware inputs if `remoteEnabled` is true.
 * This effectively acts as a diagnostic or test-bench feature.
 */
ipcMain.handle('send-remote-control', async (event, data) => {
  // B12: Remote/local control [55: Remote(từ uart)][AA: local(tự đk)]
  // B13-14: Throttle remote (divide 5945(base10) to get throttle voltage)
  // B15: Gear/brake/reverse/lock(remote) switch [x0->x3:L/M/H/S][8x:Brake][4x:Reverse][2x:Lock]
  // B16: weak flux calibri (max 255)
  // B17: AA
  // B18-19: Voltage Calibri (1119 opt)
  // B20-21: Current calibri

  const SHOW = Buffer.from('C9140253484F570000000000AA00000000AA00000000DC0D', 'hex');

  if (data.remoteEnabled) {
    SHOW[12] = 0x55;
  } else {
    SHOW[12] = 0xAA;
  }

  // Throttle
  const throttleVal = Math.round(data.throttle * 5945);
  SHOW[13] = (throttleVal >> 8) & 0xFF;
  SHOW[14] = throttleVal & 0xFF;

  // Flags
  let flags = 0x00;
  const gearIdx = ['L', 'M', 'H', 'S'].indexOf(data.gear);
  if (gearIdx !== -1) flags |= gearIdx;
  if (data.brake) flags |= 0x80;
  if (data.reverse) flags |= 0x40;
  if (data.lock) flags |= 0x20;
  SHOW[15] = flags;

  // Calibration
  SHOW[16] = data.weakFluxCal || 0;
  SHOW[17] = 0xAA;
  if (data.volCal) set16(SHOW, 18, data.volCal);
  if (data.curCal) set16(SHOW, 20, data.curCal);

  // XOR
  let xor = 0;
  for (let i = 0; i < 22; i++) xor ^= SHOW[i];
  SHOW[22] = xor;

  // Sync background heartbeat so poller sends latest state
  setHeartbeat(SHOW);

  return sendPacket(SHOW);
});

// ─── Bluetooth (Linux RFCOMM) IPC Handlers ────────────────────────────────────

function execPromise(cmd, timeoutMs = 5000) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutMs }, (err, stdout, stderr) => {
      resolve({ err, stdout: stdout?.trim() || '', stderr: stderr?.trim() || '' });
    });
  });
}

let rfcommBound = false;  // tracks if we bound /dev/rfcomm0

// Check if Linux BT prerequisites are met
/**
 * IPC Handler: check-bt-ready
 * Validates if the Linux host has the necessary Bluetooth infrastructure 
 * (bluetoothd running, user in correct groups, rfcomm tool available) 
 * to support RFCOMM serial connections to the controller.
 */
ipcMain.handle('check-bt-ready', async () => {
  try {
    // Is bluetoothd running?
    const { err: svcErr } = await execPromise('systemctl is-active bluetooth');
    const daemonOk = !svcErr;

    // On modern CachyOS/Arch, the 'bluetooth' group may not exist.
    // If bluetoothd is running the user already has BT access via polkit/D-Bus.
    const { stdout: groups } = await execPromise('id -Gn');
    const inBtGroup = daemonOk || groups.includes('bluetooth'); // either is fine
    const inDialout = groups.includes('uucp') || groups.includes('dialout'); // uucp = Arch, dialout = Debian

    // Is rfcomm available?
    const { err: rfcomErr } = await execPromise('which rfcomm');
    const rfcommAvail = !rfcomErr;

    return { daemonOk, inBtGroup, inDialout, rfcommAvail };
  } catch (e) {
    return { daemonOk: false, inBtGroup: false, inDialout: false, rfcommAvail: false };
  }
});

// List already-paired BT devices
ipcMain.handle('list-paired-bluetooth', async () => {
  const { stdout } = await execPromise('bluetoothctl devices Paired', 3000);
  if (!stdout) return [];

  const lines = stdout.split('\n').filter(l => l.startsWith('Device'));
  return lines.map(line => {
    const parts = line.split(' ');
    const mac = parts[1] || '';
    const name = parts.slice(2).join(' ') || mac;
    return { mac, name };
  });
});

// Active BT scan (~8 seconds)
ipcMain.handle('scan-bluetooth', async () => {
  // Start scan, wait 6s, stop, get devices
  const scanProc = exec('bluetoothctl scan on');
  await new Promise(r => setTimeout(r, 6000));
  exec('bluetoothctl scan off');
  await new Promise(r => setTimeout(r, 500));
  scanProc.kill();

  const { stdout } = await execPromise('bluetoothctl devices', 3000);
  if (!stdout) return [];

  const lines = stdout.split('\n').filter(l => l.startsWith('Device'));
  return lines.map(line => {
    const parts = line.split(' ');
    const mac = parts[1] || '';
    const name = parts.slice(2).join(' ') || mac;
    return { mac, name };
  });
});

// Bind RFCOMM and connect
/**
 * IPC Handler: connect-bluetooth-rfcomm
 * Automates the process of binding a paired Bluetooth MAC address
 * to a Linux synthetic serial port (/dev/rfcomm0) using `pkexec` and `rfcomm`.
 * Once bound, it connects using the standard serial_handler logic.
 */
ipcMain.handle('connect-bluetooth-rfcomm', async (event, mac, baudRate) => {
  if (!mac || mac === 'null' || mac === 'undefined') {
    return { success: false, message: "No MAC address provided" };
  }
  try {
    // Release any existing binding first
    await execPromise('rfcomm release 0 2>/dev/null; true', 2000);
    await new Promise(r => setTimeout(r, 300));

    // Check if device already exists (manual connection)
    const { stdout: exists } = await execPromise('ls /dev/rfcomm0 2>/dev/null || true');
    if (!exists.includes('rfcomm0')) {
      // Bind /dev/rfcomm0 to the BT device on channel 1 (standard SPP) using pkexec for automation
      const bindCmd = `pkexec rfcomm bind 0 ${mac} 1`;
      const { err: bindErr, stderr: bindStderr } = await execPromise(bindCmd, 30000); // Wait longer for GUI prompt
      if (bindErr) {
        return { success: false, message: `Error vinculando: ${bindStderr || "Cancelado o sin permisos."}` };
      }
      // Give system a moment to create the device node
      await new Promise(r => setTimeout(r, 1500));
    } else {
      console.log('Using existing /dev/rfcomm0 binding');
    }

    // Verify /dev/rfcomm0 exists
    const { stdout: devs } = await execPromise('ls /dev/rfcomm0 2>/dev/null || true');
    if (!devs.includes('rfcomm0')) {
      return { success: false, message: `El dispositivo /dev/rfcomm0 no apareció después del bind. Error: ${bindStderr || 'Ninguno'}` };
    }
    rfcommBound = true;

    // Connect via existing serial_handler (same as USB)
    const result = await connect('/dev/rfcomm0', parseInt(baudRate) || 9600, (packet) => {
      console.log(`[BT RX] len=${packet.length} head=${packet[0].toString(16)} cmd=${packet[3].toString(16)}`);
      if (packet.length < 24) return;

      if (!isReadingConfig && packet[0] === 0xC0 && packet[3] === 0x59) {
        const volt = packet.readUInt16BE(5) / 10;
        const current = packet.readInt16BE(7) / 10;
        const rpm = packet.readUInt16BE(14);
        const ic_temp = packet[16] - 50;
        const ex_temp = packet[17] - 50;
        const fu_stat = packet[20];
        const ic_stat = packet[21];
        mainWindow.webContents.send('telemetry-data', { volt, current, rpm, ic_temp, ex_temp, fu_stat, ic_stat });
        return;
      }
      if ((packet[0] === 0xC0 || packet[0] === 0xC9) && (packet[3] === 0x52 || packet[3] === 0x50)) {
        if (isReadingConfig) {
          const pageNum = packet[4];
          configPages[pageNum] = packet;
          if (configPages[1] && configPages[2] && configPages[3] && configPages[4] &&
            configPages[5] && configPages[6] && configPages[7]) {
            if (configPromiseResolve) {
              clearTimeout(configTimeout);
              configPromiseResolve(configPages);
              configPromiseResolve = null;
            }
          }
        }
      }
    });

    return result;
  } catch (e) {
    return { success: false, message: e.message };
  }
});

// Disconnect and release RFCOMM
ipcMain.handle('disconnect-bluetooth-rfcomm', async () => {
  const result = await disconnect();
  if (rfcommBound) {
    await execPromise('pkexec rfcomm release 0 2>/dev/null; true', 5000);
    rfcommBound = false;
  }
  return result;
});
