import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Activity, Settings, Cpu, Zap, Sliders, Menu, Plug, UploadCloud, DownloadCloud, Trash2, Bluetooth, Usb, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from './utils/cn';
import { Dashboard } from './components/Dashboard';
import { Page1Config } from './components/Page1Config';
import { Page2Config } from './components/Page2Config';
import { Page3Config } from './components/Page3Config';
import { Page4Config } from './components/Page4Config';
import { Page5Config } from './components/Page5Config';
import { RemoteControl } from './components/RemoteControl';
import { serialManager } from './services/serialManager';
import logo from './assets/icon.png';
export function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
        active
          ? "bg-primary/10 text-primary"
          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {active && (
        <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
      )}
    </button>
  );
}

function TopBar({ isConnected, portName, ports, baudRate, onConnect, onDisconnect, onPortChange, onBaudRateChange,
  onWriteAll, onRead, onImport, onExport, onClean, isReading, isWriting, onToggleSidebar,
  connType, onConnTypeChange, btDevices, onScanBt, isScanning, selectedBtDevice, onSelectBtDevice, btSetupIssue
}) {
  return (
    <div className="min-h-[3.5rem] pt-safe lg:pt-0 pb-2 lg:pb-0 border-b border-border-color bg-bg-color/80 backdrop-blur-md flex flex-col px-3 sm:px-6 z-10 sticky top-0 gap-1 overflow-hidden">
      {/* Row 1 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-4 min-h-[3.5rem]">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 -ml-1 text-primary hover:bg-primary/10 rounded-lg transition-colors z-[60]"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 flex-1 justify-end min-w-0">
          {/* USB / BT Mode Switch — always visible */}
          {!isConnected && (
            <div className="flex items-center rounded-lg border border-border-color overflow-hidden text-[10px] sm:text-xs shrink-0">
              <button
                onClick={() => onConnTypeChange('usb')}
                className={cn('flex items-center gap-1 px-2 py-1.5 transition-colors', connType === 'usb' ? 'bg-primary/20 text-primary' : 'bg-surface text-text-secondary hover:bg-surface-hover')}
              >
                <Usb className="w-3 h-3" />USB
              </button>
              <button
                onClick={() => onConnTypeChange('bluetooth')}
                className={cn('flex items-center gap-1 px-2 py-1.5 transition-colors', connType === 'bluetooth' ? 'bg-primary/20 text-primary' : 'bg-surface text-text-secondary hover:bg-surface-hover')}
              >
                <Bluetooth className="w-3 h-3" />BT
              </button>
            </div>
          )}

          {/* USB port + baud selectors */}
          {!isConnected && connType === 'usb' && (
            <div className="flex items-center gap-1 hidden sm:flex">
              <select
                value={portName}
                onChange={(e) => onPortChange(e.target.value)}
                className="bg-surface border border-border-color text-[10px] sm:text-xs rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-primary max-w-[130px] truncate"
              >
                {ports.map(p => (
                  <option key={p.path} value={p.path}>{p.path}</option>
                ))}
                {ports.length === 0 && <option value="">No ports</option>}
              </select>
              <select
                value={baudRate}
                onChange={(e) => onBaudRateChange(e.target.value)}
                className="bg-surface border border-border-color text-[10px] sm:text-xs rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="115200">115200</option>
                <option value="9600">9600</option>
              </select>
            </div>
          )}

          {/* BT device selector (PC only, 1 row) */}
          {!isConnected && connType === 'bluetooth' && (
            <div className="hidden sm:flex items-center gap-1">
              <select
                value={selectedBtDevice?.mac || ''}
                onChange={(e) => {
                  const d = btDevices.find(x => x.mac === e.target.value);
                  onSelectBtDevice(d || null);
                }}
                className="bg-surface border border-border-color text-[10px] sm:text-xs rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-primary max-w-[180px] truncate"
              >
                {btDevices.length === 0 && <option value="">-- Escanear primero --</option>}
                {btDevices.map(d => (
                  <option key={d.mac} value={d.mac}>{d.name}</option>
                ))}
              </select>
              <select
                value={baudRate}
                onChange={(e) => onBaudRateChange(e.target.value)}
                className="bg-surface border border-border-color text-[10px] sm:text-xs rounded-lg px-2 py-1.5 text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="115200">115200</option>
                <option value="9600">9600</option>
              </select>
              <button
                onClick={onScanBt}
                disabled={isScanning}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs border border-border-color bg-surface hover:bg-surface-hover text-text-primary disabled:opacity-50"
                title="Escanear dispositivos BT"
              >
                <RefreshCw className={cn('w-3 h-3', isScanning && 'animate-spin')} />
                <span className="hidden lg:inline">{isScanning ? 'Buscando...' : 'Escanear'}</span>
              </button>
            </div>
          )}

          {/* Status pill */}
          <div className="flex items-center gap-1 sm:gap-2 bg-surface px-1.5 py-1 sm:px-4 sm:py-2 rounded-lg border border-border-color">
            <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-[0_0_8px]", isConnected ? "bg-success shadow-success" : "bg-danger shadow-danger")} />
            <span className="text-[10px] sm:text-sm font-medium text-text-secondary whitespace-nowrap hidden md:inline">
              {isConnected ? `Connected${connType === 'bluetooth' ? ' ⦻' : ''}` : "Disc."}
            </span>
          </div>

          {isConnected && (
            <div className="flex items-center gap-1 sm:gap-2 border-l border-border-color pl-1 sm:pl-3">
              <button
                onClick={onRead}
                disabled={isReading || isWriting}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  isReading ? "bg-primary/20 text-primary border-primary/30" : "bg-surface hover:bg-surface-hover text-text-primary border-border-color"
                )}
              >
                <DownloadCloud className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isReading && "animate-pulse")} />
                <span className="hidden lg:inline">{isReading ? "Reading..." : "Read"}</span>
              </button>
              <button
                onClick={onWriteAll}
                disabled={isReading || isWriting}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-lg shadow-primary/20",
                  isWriting ? "bg-success hover:bg-success/90 text-bg-color" : "bg-primary hover:bg-primary-hover text-bg-color"
                )}
              >
                <UploadCloud className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isWriting && "animate-bounce")} />
                <span className="hidden lg:inline">{isWriting ? "Writing..." : "Write All"}</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-2 border-l border-border-color pl-1 sm:pl-3">
            <button onClick={onImport} className="flex items-center gap-2 p-1.5 rounded-lg text-text-primary border border-border-color bg-surface hover:bg-surface-hover" title="Import Config.ini">
              <DownloadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xl:inline">Import</span>
            </button>
            <button onClick={onExport} className="flex items-center gap-2 p-1.5 rounded-lg text-text-primary border border-border-color bg-surface hover:bg-surface-hover" title="Export Config.ini">
              <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xl:inline">Export</span>
            </button>
            <button onClick={onClean} className="flex items-center gap-2 p-1.5 rounded-lg text-danger border border-border-color bg-surface hover:bg-danger/10" title="Clear all fields">
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <button
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={connType === 'usb' ? (!portName && !isConnected) : (!selectedBtDevice && !isConnected)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 border",
              isConnected
                ? "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20"
                : "bg-surface text-text-primary border-border-color hover:bg-surface-hover"
            )}>
            {connType === 'bluetooth' && !isConnected ? <Bluetooth className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Plug className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="hidden xl:inline">{isConnected ? "Disconnect" : "Connect"}</span>
          </button>
        </div>
      </div>

      {/* Row 2 — Mobile BT/USB selectors (shown only on small screens) */}
      {!isConnected && (
        <div className="flex sm:hidden items-center gap-1.5 pb-1.5 flex-wrap">
          {connType === 'usb' && (
            <>
              <select
                value={portName}
                onChange={(e) => onPortChange(e.target.value)}
                className="bg-surface border border-border-color text-[10px] rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:border-primary flex-1 min-w-0 truncate"
              >
                {ports.map(p => (
                  <option key={p.path} value={p.path}>{p.path}</option>
                ))}
                {ports.length === 0 && <option value="">No ports</option>}
              </select>
              <select
                value={baudRate}
                onChange={(e) => onBaudRateChange(e.target.value)}
                className="bg-surface border border-border-color text-[10px] rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="115200">115200</option>
                <option value="9600">9600</option>
              </select>
            </>
          )}
          {connType === 'bluetooth' && (
            <>
              <select
                value={selectedBtDevice?.mac || ''}
                onChange={(e) => {
                  const d = btDevices.find(x => x.mac === e.target.value);
                  onSelectBtDevice(d || null);
                }}
                className="bg-surface border border-border-color text-[10px] rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:border-primary flex-1 min-w-0 truncate"
              >
                {btDevices.length === 0 && <option value="">-- Escanear primero --</option>}
                {btDevices.map(d => (
                  <option key={d.mac} value={d.mac}>{d.name}</option>
                ))}
              </select>
              <select
                value={baudRate}
                onChange={(e) => onBaudRateChange(e.target.value)}
                className="bg-surface border border-border-color text-[10px] rounded-lg px-2 py-1 text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="115200">115200</option>
                <option value="9600">9600</option>
              </select>
              <button
                onClick={onScanBt}
                disabled={isScanning}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border border-border-color bg-surface hover:bg-surface-hover text-text-primary disabled:opacity-50"
              >
                <RefreshCw className={cn('w-3 h-3', isScanning && 'animate-spin')} />
                {isScanning ? 'Buscando...' : 'Escanear'}
              </button>
            </>
          )}
        </div>
      )}

      {/* BT Setup Warning (PC only) */}
      {btSetupIssue && connType === 'bluetooth' && (
        <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 text-[10px] text-warning mb-1">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <strong>Configuración BT requerida.</strong> Ejecuta estos comandos una sola vez en tu terminal:
            <pre className="mt-1 text-[9px] opacity-80 whitespace-pre-wrap">{btSetupIssue}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-text-secondary h-full min-h-[400px]">
      <div className="w-16 h-16 mb-4 rounded-full bg-surface-hover flex items-center justify-center">
        <Settings className="w-8 h-8 opacity-50" />
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm opacity-60">This module is under construction.</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [ports, setPorts] = useState([]);
  const [portName, setPortName] = useState('');
  const [baudRate, setBaudRate] = useState(9600);
  const [isReading, setIsReading] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Bluetooth state
  const [connType, setConnType] = useState('usb'); // 'usb' | 'bluetooth'
  const [btDevices, setBtDevices] = useState([]);
  const [selectedBtDevice, setSelectedBtDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [btSetupIssue, setBtSetupIssue] = useState(null);

  const [pagesData, setPagesData] = useState({
    page1: null,
    page2: null,
    page3: null,
    page4: null,
    page5: null
  });

  const updatePageData = (page, data) => {
    setPagesData(prev => ({
      ...prev,
      [page]: { ...(prev[page] || {}), ...data }
    }));
  };

  /**
   * Application Startup Hook
   * On native Android, this triggers the initial Bluetooth permission request flow
   * as soon as the app loads, ensuring the user grants access before attempting to scan.
   */
  React.useEffect(() => {
    // Request permissions only ONCE on native Android startup
    if (Capacitor.isNativePlatform()) {
      const requestStartupPermissions = async () => {
        try {
          await serialManager.scanBluetooth();
        } catch (e) {
          console.error("App: Startup permission request failed", e);
        }
      };
      requestStartupPermissions();
    }
  }, []);

  /**
   * Screen WakeLock Hook (Android/Mobile)
   * Prevents the device screen from turning off automatically when the user is actively
   * viewing the Dashboard (Monitor) or using the Remote Control.
   */
  React.useEffect(() => {
    let wakeLock = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator && Capacitor.isNativePlatform() && !wakeLock) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('WakeLock request failed:', err.message);
      }
    };

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestLock();
      }
    };

    if (activeTab === 'dashboard' || activeTab === 'remote') {
      requestLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().then(() => { wakeLock = null; });
      }
    };
  }, [activeTab]);

  React.useEffect(() => {
    const fetchPorts = async () => {
      const p = await serialManager.getPorts();
      setPorts(p);
      if (p.length > 0 && !portName && !isConnected) {
        setPortName(p[0].path);
      }
    };

    fetchPorts();

    // Poll for USB ports every 2 seconds if not connected
    const interval = setInterval(() => {
      if (!isConnected) {
        fetchPorts();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, portName]);

  /**
   * Connect Handler
   * Triggers the connection sequence for either USB or Bluetooth based on `connType`.
   * It disables UI inputs during the connection attempt and alerts the user on failure.
   */
  const handleConnect = async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);
    try {
      if (connType === 'bluetooth') {
        if (!selectedBtDevice) { alert('Selecciona un dispositivo Bluetooth primero.'); return; }
        const res = await serialManager.connectBluetooth(selectedBtDevice.mac, parseInt(baudRate), (loading) => {
          setIsReading(loading);
        });
        if (res.success) setIsConnected(true);
        else alert('BT Connect failed: ' + (res.message || 'Unknown error'));
      } else {
        const res = await serialManager.connect(portName, parseInt(baudRate), (loading) => {
          setIsReading(loading);
        });
        if (res.success) setIsConnected(true);
        else alert('Failed to connect: ' + res.message);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect: ' + e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (connType === 'bluetooth') {
      await serialManager.disconnectBluetooth();
    } else {
      await serialManager.disconnect();
    }
    setIsConnected(false);
  };

  const navigation = [
    { id: 'dashboard', label: 'Monitor', icon: Activity },
    { id: 'remote', label: 'Remote Control', icon: Menu },
    { id: 'page1', label: 'Basic Config', icon: Settings },
    { id: 'page2', label: 'Sport & Speed', icon: Zap },
    { id: 'page3', label: 'Motor & EABS', icon: Cpu },
    { id: 'page5', label: 'Port Settings', icon: Plug },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return (
        <Dashboard
          page1={pagesData.page1}
          page3={pagesData.page3}
          page4={pagesData.page4}
          onUpdatePage1={(d) => updatePageData('page1', d)}
          onUpdatePage4={(d) => updatePageData('page4', d)}
          isConnected={isConnected}
        />
      );
      case 'remote': return <RemoteControl />;
      case 'page1': return <Page1Config data={pagesData.page1} onUpdate={(d) => updatePageData('page1', d)} />;
      case 'page2': return <Page2Config data={{
        ...(pagesData.page2 || {}),
        gear1Ampe: pagesData.page4?.gear1Ampe ?? '',
        gear2Ampe: pagesData.page4?.gear2Ampe ?? '',
        gear3Ampe: pagesData.page4?.gear3Ampe ?? '',
        hdcEnable: pagesData.page4?.hdcEnable ?? false,
        fluxWeaken2: pagesData.page4?.fluxWeaken2 ?? '',
        higeFlux2: pagesData.page4?.higeFlux2 ?? '',
        midFlux2: pagesData.page4?.midFlux2 ?? '',
        maxRpm: pagesData.page4?.maxRpm ?? '',
        autoReverse: pagesData.page4?.autoReverse ?? false,
        cruise: pagesData.page4?.cruise ?? false,
        doubleVoltage: pagesData.page4?.doubleVoltage ?? false,
        startVolt: pagesData.page4?.startVolt ?? '',
        endVolt: pagesData.page4?.endVolt ?? '',
        lowProtect: pagesData.page4?.lowProtect ?? '',
        highProtect: pagesData.page4?.highProtect ?? '',
        rateDecline: pagesData.page4?.rateDecline ?? '',
        rateRise: pagesData.page4?.rateRise ?? '',
        startTorque: pagesData.page4?.startTorque ?? '',
        combTorque: pagesData.page4?.combTorque ?? '',
        hillHold: pagesData.page3?.hillHold ?? false
      }} onUpdate={(d) => {
        const {
          gear1Ampe, gear2Ampe, gear3Ampe, hdcEnable, fluxWeaken2, higeFlux2, midFlux2,
          maxRpm, autoReverse, cruise, doubleVoltage,
          startVolt, endVolt, lowProtect, highProtect, rateDecline, rateRise, startTorque, combTorque,
          hillHold,
          ...p2
        } = d;
        updatePageData('page2', p2);
        updatePageData('page4', {
          ...(pagesData.page4 || {}),
          gear1Ampe, gear2Ampe, gear3Ampe, hdcEnable, fluxWeaken2, higeFlux2, midFlux2,
          maxRpm, autoReverse, cruise, doubleVoltage,
          startVolt, endVolt, lowProtect, highProtect, rateDecline, rateRise, startTorque, combTorque
        });
        if (hillHold !== undefined) {
          updatePageData('page3', {
            ...(pagesData.page3 || {}),
            hillHold
          });
        }
      }} />;
      case 'page3': return <Page3Config data={pagesData.page3} onUpdate={(d) => updatePageData('page3', d)} />;
      case 'page4': return <Page4Config data={pagesData.page4} onUpdate={(d) => updatePageData('page4', d)} />;
      case 'page5': return <Page5Config data={pagesData.page5} onUpdate={(d) => updatePageData('page5', d)} />;
      default: return <PlaceholderPage title="Unknown" />;
    }
  };

  /**
   * Write All Handler
   * Validates the configuration data and triggers a write sequence to the controller.
   * Includes safeguards against writing completely empty (null) data which could brick
   * or misconfigure the hardware.
   */
  const handleWriteAll = async () => {
    if (!isConnected) {
      alert("Please connect to the controller first.");
      return;
    }

    // Check if fields are clean (null)
    const isClean = Object.values(pagesData).every(d => d === null);
    if (isClean) {
      if (!window.confirm("All parameters are currently empty. Are you sure you want to write empty/zero values to the controller?")) {
        return;
      }
    }

    setIsWriting(true);
    try {
      const res = await serialManager.writeConfig(pagesData);
      if (res && res.success) {
        alert("Success! All parameters written to controller.");
      } else {
        alert("Failed to write parameters: " + (res?.message || "Unknown error"));
      }
    } catch (e) {
      alert("Error writing config: " + e.message);
    } finally {
      setIsWriting(false);
    }
  };

  /**
   * Read Handler
   * Pulls the 7 parameter pages from the controller into the React state `pagesData`.
   */
  const handleRead = async () => {
    if (!isConnected) {
      alert("Please connect to the controller first.");
      return;
    }
    setIsReading(true);
    try {
      const data = await serialManager.readConfig();
      if (data && data.success) {
        if (data.pages) setPagesData(data.pages);
        else alert(data.message || "Reading initiated...");
      } else {
        alert("Failed to read parameters: " + (data?.message || "Unknown error"));
      }
    } catch (e) {
      alert("Error reading config: " + e.message);
    } finally {
      setIsReading(false);
    }
  };

  /**
   * Import Handler
   * Opens an INI file and parses it into the React state, overriding current values.
   */
  const handleImport = async () => {
    try {
      const result = await serialManager.importConfig();
      if (result && result.success) {
        setPagesData(result.pages);
      } else if (result && !result.success) {
        alert(result.message);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to import config.");
    }
  };

  /**
   * Export Handler
   * Takes the raw bytes currently in memory and generates an INI file for sharing.
   */
  const handleExport = async () => {
    try {
      const result = await serialManager.exportConfig();
      if (result && result.success) {
        alert("Config exported successfully.");
      } else if (result && !result.success) {
        alert("Export failed: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to export config.");
    }
  };

  const handleClean = () => {
    setPagesData({
      page1: {},
      page2: {},
      page3: {},
      page4: {},
      page5: {}
    });
  };

  const BT_SETUP_INSTRUCTIONS = `# Solo en Linux — ejecutar UNA VEZ como setup:
sudo pacman -S bluez-utils          # instala rfcomm (CachyOS/Arch)
sudo systemctl enable bluetooth --now
sudo usermod -aG bluetooth,dialout $USER
# Crear regla udev (sin sudo para rfcomm):
echo 'SUBSYSTEM=="rfcomm",GROUP="dialout",MODE="0666"' | sudo tee /etc/udev/rules.d/99-rfcomm.rules
udevadm control --reload
# Relogin o ejecutar: newgrp dialout`;

  const handleScanBt = async () => {
    setIsScanning(true);
    setBtSetupIssue(null);
    try {
      const result = await serialManager.scanBluetooth();
      if (result.btSetupNeeded) {
        // Build specific warning based on what's missing
        const s = result.btStatus;
        let missing = [];
        if (!s.daemonOk) missing.push('• bluetoothd no está activo (systemctl start bluetooth)');
        if (!s.inBtGroup) missing.push('• Usuario no está en grupo "bluetooth" (sudo usermod -aG bluetooth $USER + relogin)');
        if (!s.rfcommAvail) missing.push('• rfcomm no encontrado (sudo pacman -S bluez-utils)');
        const details = missing.length > 0 ? missing.join('\n') : BT_SETUP_INSTRUCTIONS;
        setBtSetupIssue(details);
      } else if (!result.success) {
        alert('Error al escanear: ' + (result.message || 'desconocido'));
      } else {
        setBtDevices(result.devices || []);
        if (result.devices?.length > 0 && !selectedBtDevice) {
          setSelectedBtDevice(result.devices[0]);
        }
      }
    } catch (e) {
      alert('Scan error: ' + e.message);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex h-screen bg-bg-color text-text-primary overflow-x-hidden overflow-y-hidden font-sans selection:bg-primary/30">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 max-w-[85vw] flex-shrink-0 border-r border-border-color bg-surface flex flex-col z-[100] transition-transform duration-300 ease-in-out md:relative md:w-64 md:translate-x-0 md:z-0 pt-safe",
        isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-color">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={logo} alt="Votol Logo" className="w-full h-full rounded-lg object-contain shadow-md shadow-primary/10" />
            </div>
            <span className="font-bold text-lg text-text-primary tracking-tight">Configurator</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-text-secondary hover:text-text-primary"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((nav) => (
            <SidebarItem
              key={nav.id}
              icon={nav.icon}
              label={nav.label}
              active={activeTab === nav.id}
              onClick={() => {
                setActiveTab(nav.id);
                setIsSidebarOpen(false);
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopBar
          isConnected={isConnected}
          portName={portName}
          ports={ports}
          baudRate={baudRate}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onPortChange={setPortName}
          onBaudRateChange={setBaudRate}
          onWriteAll={handleWriteAll}
          onRead={handleRead}
          onImport={handleImport}
          onExport={handleExport}
          onClean={handleClean}
          isReading={isReading}
          isWriting={isWriting}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          connType={connType}
          onConnTypeChange={(t) => { setConnType(t); setBtSetupIssue(null); }}
          btDevices={btDevices}
          onScanBt={handleScanBt}
          isScanning={isScanning}
          selectedBtDevice={selectedBtDevice}
          onSelectBtDevice={setSelectedBtDevice}
          btSetupIssue={btSetupIssue}
        />
        <main className="flex-1 overflow-y-auto p-2 sm:p-6 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="w-full max-w-full lg:max-w-[1600px] mx-auto h-full relative z-10">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
