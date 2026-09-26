const { SerialPort } = require('serialport');

let currentPort = null;
let pollInterval = null;
let isPaused = true;
let heartbeatPacket = Buffer.alloc(24);

function setPolling(active) {
  isPaused = !active;
}

function setHeartbeat(buf) {
  if (buf && buf.length === 24) {
    heartbeatPacket = Buffer.from(buf);
  }
}

function sendPacket(buf) {
  if (currentPort && currentPort.isOpen) {
    currentPort.write(buf);
    return true;
  }
  return false;
}

async function listPorts() {
  try {
    const ports = await SerialPort.list();
    return ports
      .filter(p => !p.path.includes('rfcomm')) // rfcomm is BT-only, handled separately
      .map(p => ({ path: p.path, manufacturer: p.manufacturer }));
  } catch (err) {
    console.error('Failed to list ports:', err);
    return [];
  }
}

async function connect(portPath, baudRate, onDataCallback) {
  return new Promise((resolve, reject) => {
    if (currentPort && currentPort.isOpen) {
      currentPort.close();
    }

    currentPort = new SerialPort({ path: portPath, baudRate: baudRate }, (err) => {
      if (err) {
        console.error('Error opening port:', err.message);
        return reject({ success: false, message: err.message });
      }
      
      let rawBuf = Buffer.alloc(0);
      
      currentPort.on('data', (data) => {
        rawBuf = Buffer.concat([rawBuf, data]);
        
        while (rawBuf.length >= 24) {
          const c0Idx = rawBuf.indexOf(0xC0);
          if (c0Idx === -1) {
            rawBuf = Buffer.alloc(0);
            break;
          }
          if (c0Idx > 0) {
            rawBuf = rawBuf.slice(c0Idx);
          }
          if (rawBuf.length < 24) break;

          const packet = rawBuf.slice(0, 24);
          if (packet[23] === 0x0D) {
            onDataCallback(packet);
            rawBuf = rawBuf.slice(24);
          } else {
            rawBuf = rawBuf.slice(1);
          }
        }
      });

      const rate = baudRate <= 9600 ? 1250 : 500;
      pollInterval = setInterval(() => {
        if (!isPaused && currentPort && currentPort.isOpen) {
          currentPort.write(heartbeatPacket);
        }
      }, rate);

      resolve({ success: true, message: `Connected to ${portPath}` });
    });
  });
}

async function disconnect() {
  if (pollInterval) clearInterval(pollInterval);
  if (currentPort && currentPort.isOpen) {
    return new Promise((resolve) => {
      currentPort.close((err) => {
        currentPort = null;
        resolve({ success: !err });
      });
    });
  }
  return { success: true };
}

module.exports = { listPorts, connect, disconnect, setPolling, sendPacket, setHeartbeat };
