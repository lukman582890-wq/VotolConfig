import React from 'react';

export function Page4Config({ data, onUpdate }) {
  const config = data || {
    autoReverse: false,
    hdcEnable: false,
    outputLin: false,
    cruise: false,
    doubleVoltage: false,
    maxRpm: '',
    gear1Ampe: '',
    gear2Ampe: '',
    gear3Ampe: '',
    fluxWeaken2: '',
    higeFlux2: '',
    midFlux2: '',
    weakFluxCal: '',
    startVolt: '',
    endVolt: '',
    lowProtect: '',
    highProtect: '',
    rateDecline: '',
    rateRise: '',
    startTorque: '',
    combTorque: ''
  };

  const handleChange = (key, val) => {
    if (onUpdate) onUpdate({ ...config, [key]: val });
  };

  return (
    <div className="w-full max-w-none mx-auto animation-fade-in space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Throttle Calibration (Page 7) Card */}
        <div className="bg-surface border border-border-color rounded-2xl shadow-lg flex flex-col">
          <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
            <h2 className="text-lg font-bold text-text-primary">Throttle Calibration</h2>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'lowProtect', label: 'Low Protect (V)', step: '0.01' },
                { id: 'startVolt', label: 'Start Voltage (V)', step: '0.01' },
                { id: 'endVolt', label: 'End Voltage (V)', step: '0.01' },
                { id: 'highProtect', label: 'High Protect (V)', step: '0.01' },
              ].map(f => (
                <div key={f.id} className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{f.label}</label>
                  <input type="number" step={f.step} value={config[f.id]} onChange={e => handleChange(f.id, parseFloat(e.target.value))}
                    className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-color">
              {[
                { id: 'rateRise', label: 'Rate of Rise' },
                { id: 'rateDecline', label: 'Rate of Decline' },
                { id: 'startTorque', label: 'Start Torque' },
                { id: 'combTorque', label: 'Comb. Torque' },
              ].map(f => (
                <div key={f.id} className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{f.label}</label>
                  <input type="number" value={config[f.id]} onChange={e => handleChange(f.id, parseInt(e.target.value))}
                    className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Features (Page 4) Card */}
        <div className="bg-surface border border-border-color rounded-2xl shadow-lg flex flex-col">
          <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
            <h2 className="text-lg font-bold text-text-primary">Advanced Features</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
             <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Absolute Max RPM</label>
                  <input type="number" value={config.maxRpm} onChange={e => handleChange('maxRpm', parseInt(e.target.value))}
                    className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                </div>
             </div>
             <div className="space-y-3 pt-4 border-t border-border-color">
                {[
                  { id: 'autoReverse', label: 'Auto Reverse Enable' },
                  { id: 'hdcEnable', label: 'HDC (Hill Descent Control)' },
                  { id: 'cruise', label: 'Cruise Control Enable' },
                  { id: 'doubleVoltage', label: 'Double Voltage Mode' }
                ].map(f => (
                  <label key={f.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={config[f.id]} onChange={e => handleChange(f.id, e.target.checked)} className="peer sr-only" />
                      <div className="w-10 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 border border-border-color transition-all"></div>
                    </div>
                    <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">{f.label}</span>
                  </label>
                ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
