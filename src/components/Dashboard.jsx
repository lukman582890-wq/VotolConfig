import React, { useEffect, useState } from 'react';
import { Gauge } from './Gauge';
import { StatusPill } from './StatusPill';
import { AlertTriangle, MapPin, Gauge as SpeedometerIcon, Battery, Thermometer, Cpu, Activity as ActivityIcon, Sliders, Zap } from 'lucide-react';
import { cn } from '../utils/cn';

import { serialManager } from '../services/serialManager';
import { getMotorModel, getVoltageLabel } from '../services/votoCore';

export function Dashboard({ page1, page3, page4, onUpdatePage1, onUpdatePage4, isConnected }) {
  const [telemetry, setTelemetry] = useState({
    volt: 0, current: 0, rpm: 0, ic_temp: 0, ex_temp: 0, 
    temp_cf: 0, fu_stat: 0, ic_stat: 0, faultCode: 0
  });

  const [calValues, setCalValues] = useState({
    volCal: 0,
    curCal: 0,
    weakFluxCal: 0
  });

  // Helper to determine effective calibration (Page 1 or scaled Page 4)
  const getEffectiveCal = () => {
    let v = page1?.volCal || 0;
    let c = page1?.curCal || 0;
    
    // Simplified to 1:1 direct mapping (Verified by Config.ini analysis)
    if (v === 0 && page4?.volCal) v = page4.volCal;
    if (c === 0 && page4?.curCal) c = page4.curCal;
    
    return { 
        volCal: v, 
        curCal: c, 
        weakFluxCal: page4?.weakFluxCal || 0 
    };
  };

  // Sync state if props change (e.g. on Read/Import)
  useEffect(() => {
    setCalValues(getEffectiveCal());
  }, [page4?.volCal, page1?.volCal, page4?.curCal, page1?.curCal, page4?.weakFluxCal]);

  useEffect(() => {
    const unsub = serialManager.onTelemetry((data) => {
      setTelemetry(data);
    });
    return unsub;
  }, []);

  const handleCalChange = (key, val) => {
    const newVal = parseInt(val) || 0;
    setCalValues(prev => ({ ...prev, [key]: newVal }));

    // Update background heartbeat immediately
    serialManager.updateHeartbeat({ [key]: newVal });
    
    // Split updates between Page 1 and Page 4
    if (key === 'volCal' || key === 'curCal') {
      const p1 = page1 || { volCal: 0, curCal: 0 };
      const p4 = page4 || { volCal: 0, curCal: 0 };
      onUpdatePage1({ ...p1, [key]: newVal });
      onUpdatePage4({ ...p4, [key]: newVal });
    } else if (key === 'weakFluxCal') {
      const base = page4 || { weakFluxCal: 0 };
      onUpdatePage4({ ...base, [key]: newVal });
    }
  };

  // Decode Statuses
  const gearMap = { 0: 'L', 1: 'M', 2: 'H', 3: 'S' };
  const gear = gearMap[telemetry.fu_stat & 0x03] || '?';
  const reverse = Boolean(telemetry.fu_stat & 0x04);
  const parking = Boolean(telemetry.fu_stat & 0x08);
  const brake = Boolean(telemetry.fu_stat & 0x10);
  const regen = Boolean(telemetry.fu_stat & 0x80);
  const sidestand = Boolean(telemetry.fu_stat & 0x40);

  const statusMap = { 
    0: 'IDLE', 1: 'INIT', 2: 'START', 3: 'RUN', 
    4: 'STOP', 5: 'BRAKE', 6: 'WAIT', 7: 'FAULT' 
  };
  const icStatus = (telemetry.ic_stat === 7) ? 'FAULT' : (statusMap[telemetry.ic_stat] || 'UNKNOWN');

  const handleSync = async () => {
    const res = await serialManager.readConfig();
    if (res.success && res.pages) {
      if (res.pages.page1) onUpdatePage1(res.pages.page1);
      if (res.pages.page4) onUpdatePage4(res.pages.page4);
    }
  };

  // Fault Breakdown
  const getFaults = (code) => {
    const faults = [];
    if (code & 0x01) faults.push("Hall Error");
    if (code & 0x02) faults.push("Phase Error");
    if (code & 0x04) faults.push("Undervoltage");
    if (code & 0x08) faults.push("Overvoltage");
    if (code & 0x10) faults.push("Overcurrent");
    if (code & 0x20) faults.push("Temp Sensor Error");
    if (code & 0x40) faults.push("Throttle Error");
    if (code & 0x80) faults.push("Internal Logic Error");
    // Mid/High bytes
    if (code & 0x800000) faults.push("Motor Disconnected");
    if (code & 0x10000) faults.push("Comm Timeout");
    return faults;
  };
  const activeFaults = getFaults(telemetry.faultCode);

  return (
    <div className="flex flex-col gap-6 w-full h-full max-w-none mx-auto animation-fade-in pb-12">
      
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2 sm:p-4 bg-surface border border-border-color rounded-xl shadow-lg gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <ActivityIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <div className="text-[10px] sm:text-sm font-bold text-white/60 uppercase tracking-wider">Status</div>
              <div className="text-base sm:text-xl font-bold tracking-tight mt-0.5 flex flex-wrap items-center gap-1.5">
                <span className={icStatus === 'FAULT' ? "text-danger" : "text-text-primary"}>{icStatus}</span>
                {activeFaults.map(f => (
                  <span key={f} className="text-[9px] bg-danger/10 text-danger px-1 rounded border border-danger/20 font-bold uppercase">{f}</span>
                ))}
              </div>
            </div>
          </div>

          {page1?.model && (
            <div className="border-t sm:border-t-0 sm:border-l border-border-color pt-2 sm:pt-0 sm:pl-4">
               <div className="text-[10px] sm:text-sm font-bold text-white/60 uppercase tracking-wider">Controller</div>
               <div className="text-[11px] sm:text-sm font-bold mt-0.5 text-text-primary flex items-center gap-2">
                 {getMotorModel(page1.model)} | {getVoltageLabel(page1.batteryVoltage)}
                 {page3?.swVersion && (
                   <span className="opacity-50 font-normal hidden sm:inline">
                     HW:{(page3.hwVersion / 100).toFixed(2)} SW:{(page3.swVersion / 100).toFixed(2)}
                   </span>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* State Pills */}
        <div className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-3 items-center justify-end border-t sm:border-t-0 border-border-color pt-2 sm:pt-0">
          <StatusPill active={true} label={`${gear}`} activeColorClass="bg-primary text-white" />
          <StatusPill active={parking} label="P" activeColorClass="bg-warning text-yellow-950" />
          <StatusPill active={reverse} label="R" activeColorClass="bg-danger text-white" />
          <StatusPill active={brake} label="BRK" activeColorClass="bg-danger text-white" />
          <StatusPill active={regen} label="REG" activeColorClass="bg-success text-white" />
          <StatusPill active={sidestand} label="STND" activeColorClass="bg-warning text-yellow-950" />
        </div>
      </div>

      {/* Main Gauges Grid - 2 per row on mobile! */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-6">
        <Gauge value={telemetry.rpm} max={8000} label="RPM" unit="RPM" colorClass="text-accent-color" />
        <Gauge value={telemetry.volt} max={100} label="Voltage" unit="V" colorClass="text-success-color" />
        <Gauge value={telemetry.current} max={200} label="Current" unit="A" colorClass="text-warning-color" />
        <Gauge value={telemetry.ic_temp} max={120} label="Int Temp" unit="°C" colorClass={telemetry.ic_temp > 95 ? "text-danger-color" : "text-primary"} />
      </div>

      {/* Secondary Data Blocks & Calibration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="lg:col-span-2 space-y-3 sm:space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-surface border border-border-color p-3 sm:p-6 rounded-2xl flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-surface-hover rounded-xl">
                  <Thermometer className="w-5 h-5 sm:w-6 sm:h-6 text-text-secondary" />
                </div>
              <div>
                  <p className="text-[10px] sm:text-sm text-text-secondary font-medium uppercase tracking-wider">EXT Temp</p>
                  <p className="text-lg sm:text-2xl font-bold text-text-primary">{telemetry.ex_temp}°C</p>
              </div>
            </div>
            
            <div className="bg-surface border border-border-color p-3 sm:p-6 rounded-2xl flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 bg-surface-hover rounded-xl">
                  <ActivityIcon className="w-5 h-5 sm:w-6 sm:h-6 text-text-secondary" />
                </div>
              <div>
                  <p className="text-[10px] sm:text-sm text-text-secondary font-medium uppercase tracking-wider">Temp Coef.</p>
                  <p className="text-lg sm:text-2xl font-bold text-text-primary">{telemetry.temp_cf}</p>
              </div>
            </div>
          </div>

          {/* Calibration Section */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
            <div className="px-4 py-2 sm:px-6 sm:py-4 border-b border-border-color bg-surface-hover/30 flex items-center gap-2">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wider">Calibration</h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-[9px] sm:text-xs font-semibold text-text-secondary uppercase">Volt Cal</label>
                  <input 
                    type="number"
                    value={calValues.volCal || ''} 
                    placeholder="..."
                    onChange={e => handleCalChange('volCal', e.target.value)}
                    className="w-full bg-bg-color border border-border-color rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-base text-text-primary focus:border-primary outline-none transition-colors font-mono" 
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-[9px] sm:text-xs font-semibold text-text-secondary uppercase">Cur Cal</label>
                  <input 
                    type="number"
                    value={calValues.curCal || ''} 
                    placeholder="..."
                    onChange={e => handleCalChange('curCal', e.target.value)}
                    className="w-full bg-bg-color border border-border-color rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-base text-text-primary focus:border-primary outline-none transition-colors font-mono" 
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <label className="text-[9px] sm:text-xs font-semibold text-text-secondary uppercase">Flux Cal</label>
                  <input 
                    type="number"
                    value={calValues.weakFluxCal || (calValues.weakFluxCal === 0 ? 0 : '')} 
                    placeholder="..."
                    onChange={e => handleCalChange('weakFluxCal', e.target.value)}
                    className="w-full bg-bg-color border border-border-color rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-base text-text-primary focus:border-primary outline-none transition-colors font-mono" 
                  />
                </div>
              </div>
            </div>
            {/* Diagnostics Section */}
            {(page3?.tc1 !== undefined) && (
              <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
                <div className="px-4 py-2 sm:px-6 sm:py-4 border-b border-border-color bg-surface-hover/30 flex items-center gap-2">
                  <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary uppercase tracking-wider">Diagnostics</h3>
                </div>
                <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs text-text-secondary font-medium uppercase">TC1 / TC2 / TC3</p>
                    <p className="text-xs sm:text-base font-bold font-mono">{page3.tc1} / {page3.tc2} / {page3.tc3}</p>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs text-text-secondary font-medium uppercase">Temp Protection</p>
                    <p className="text-xs sm:text-base font-bold font-mono">{page3.tempAlta}° / {page3.tempSobre}° / {page3.tempLimite}°</p>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs text-text-secondary font-medium uppercase">EABS / REV</p>
                    <p className="text-xs sm:text-base font-bold font-mono">{page3.eabsPercent}% / {page3.reverseRpm}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
