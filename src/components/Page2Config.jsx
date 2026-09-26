import React from 'react';

const DEFAULT_CONFIG = {
  busCurrentLimit: '',
  lowSpeedRatio: '',
  midSpeedRatio: '',
  highSpeedRatio: '',
  gear1Ampe: '',
  gear2Ampe: '',
  gear3Ampe: '',
  fluxWeaken1: '',
  fluxWeaken2: '',
  higeFlux1: '',
  higeFlux2: '',
  midFlux1: '',
  midFlux2: '',
  speedLimEnable: false,
  speedLimRatio: '',
  defGear: 'MID',
  motorType: 'SURFACE',
  controlType: 'BUTTON',
  softStart: false,
  softStartGrade: '',
  logoutTime: '',
  recoveryTime: '',
  hdcEnable: false,
  fluxComp: '',
  // Page 4/7 inclusions
  maxRpm: '',
  autoReverse: false,
  cruise: false,
  doubleVoltage: false,
  lowProtect: '',
  startVolt: '',
  endVolt: '',
  highProtect: '',
  rateRise: '',
  rateDecline: '',
  startTorque: '',
  combTorque: '',
  hillHold: false
};

export function Page2Config({ data, onUpdate }) {
  const config = { ...DEFAULT_CONFIG, ...(data || {}) };

  const handleChange = (key, val) => {
    if (onUpdate) onUpdate({ ...config, [key]: val });
  };

  return (
    <div className="w-full max-w-6xl mx-auto animation-fade-in space-y-6 pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Sport Mode Setup */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
              <h2 className="text-lg font-bold text-text-primary">Sport mode setup</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Current-Limiting(A)</label>
                <input type="number" value={config.busCurrentLimit} onChange={e => handleChange('busCurrentLimit', parseInt(e.target.value))}
                  className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Flux-Weakening Value</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={config.fluxWeaken1} onChange={e => handleChange('fluxWeaken1', parseInt(e.target.value))}
                    className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                  <input type="number" value={config.fluxWeaken2} onChange={e => handleChange('fluxWeaken2', parseInt(e.target.value))}
                    className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Logout time(S)</label>
                   <input type="number" value={config.logoutTime} onChange={e => handleChange('logoutTime', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Recovery time(S)</label>
                   <input type="number" value={config.recoveryTime} onChange={e => handleChange('recoveryTime', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                 </div>
              </div>
            </div>
          </div>

          {/* HDC / HHC Section */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
               <h2 className="text-lg font-bold text-text-primary">Downhill electric brake assist(HDC/HHC)</h2>
            </div>
            <div className="p-6 space-y-4">
               <div className="flex gap-8">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={config.hdcEnable} onChange={e => handleChange('hdcEnable', e.target.checked)} className="peer sr-only" />
                      <div className="w-10 h-6 bg-surface-hover rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border border-border-color relative"></div>
                    </div>
                    <span className="text-sm font-medium text-text-primary">HDC Enable</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input type="checkbox" checked={config.hillHold} onChange={e => handleChange('hillHold', e.target.checked)} className="peer sr-only" />
                      <div className="w-10 h-6 bg-surface-hover rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border border-border-color relative"></div>
                    </div>
                    <span className="text-sm font-medium text-text-primary">HHC Enable</span>
                  </label>
               </div>
            </div>
          </div>

          {/* Operational & Advanced Features */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
             <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Toggles */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Operational Features</h3>
                    {[
                      { id: 'autoReverse', label: 'Auto Reverse Enable' },
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

                  {/* Right Column: Key Limits */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Critical Limits</h3>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Absolute Max RPM (HDC Limit)</label>
                       <input type="number" value={config.maxRpm} onChange={e => handleChange('maxRpm', parseInt(e.target.value))}
                         className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Throttle Calibration Section */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
             <div className="p-6 space-y-6">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-color pb-2">Throttle Calibration</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-color">
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

          {/* Speed Limit Section */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={config.speedLimEnable} onChange={e => handleChange('speedLimEnable', e.target.checked)} className="peer sr-only" />
                <div className="w-10 h-6 bg-surface-hover rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border border-border-color relative"></div>
                <span className="text-sm font-medium text-text-primary">Speed limited enable</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Speed ratio(%)</label>
                <input type="number" value={config.speedLimRatio} onChange={e => handleChange('speedLimRatio', parseInt(e.target.value))}
                  className="w-20 bg-bg-color border border-border-color rounded-xl px-3 py-2 text-text-primary focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Flux Weakening Compensation and Paired Parameters */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
             <div className="p-6 space-y-4">
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Flux-Weakening compensation</label>
                   <input type="number" value={config.fluxComp} onChange={e => handleChange('fluxComp', parseInt(e.target.value))}
                     className="w-1/2 bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                </div>
                
                <div className="space-y-2">
                   <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Mid Flux-Weakening Value</label>
                   <div className="grid grid-cols-2 gap-4">
                     <input type="number" value={config.midFlux1} onChange={e => handleChange('midFlux1', parseInt(e.target.value))}
                       className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                     <input type="number" value={config.midFlux2} onChange={e => handleChange('midFlux2', parseInt(e.target.value))}
                       className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Hige Flux-Weakening Value</label>
                   <div className="grid grid-cols-2 gap-4">
                     <input type="number" value={config.higeFlux1} onChange={e => handleChange('higeFlux1', parseInt(e.target.value))}
                       className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                     <input type="number" value={config.higeFlux2} onChange={e => handleChange('higeFlux2', parseInt(e.target.value))}
                       className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
                   </div>
                </div>
             </div>
          </div>

          {/* Three-speed Configuration */}
          <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
              <h2 className="text-lg font-bold text-text-primary">Three-speed</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                   <div className="text-xs font-bold text-text-secondary uppercase tracking-tighter text-center">Low(%)</div>
                   <input type="number" value={config.lowSpeedRatio} onChange={e => handleChange('lowSpeedRatio', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-2 py-2 text-center text-text-primary font-bold focus:outline-none focus:border-primary" />
                   <input type="number" value={config.midSpeedRatio} onChange={e => handleChange('midSpeedRatio', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-2 py-2 text-center text-text-primary font-bold focus:outline-none focus:border-primary" />
                   <input type="number" value={config.highSpeedRatio} onChange={e => handleChange('highSpeedRatio', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-2 py-2 text-center text-text-primary font-bold focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-3">
                   <div className="text-xs font-bold text-text-secondary uppercase tracking-tighter text-center">AMP %</div>
                   <input type="number" value={config.gear1Ampe} onChange={e => handleChange('gear1Ampe', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-2 py-2 text-center text-text-primary font-bold focus:outline-none focus:border-primary" />
                   <input type="number" value={config.gear2Ampe} onChange={e => handleChange('gear2Ampe', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-2 py-2 text-center text-text-primary font-bold focus:outline-none focus:border-primary" />
                   <input type="number" value={config.gear3Ampe} onChange={e => handleChange('gear3Ampe', parseInt(e.target.value))}
                     className="w-full bg-bg-color border border-border-color rounded-xl px-2 py-2 text-center text-text-primary font-bold focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-3 pt-6">
                   <div className="text-xs font-bold text-text-secondary h-8 flex items-center justify-center">LOW</div>
                   <div className="text-xs font-bold text-text-secondary h-8 flex items-center justify-center">MID</div>
                   <div className="text-xs font-bold text-text-secondary h-8 flex items-center justify-center">HIGE</div>
                </div>
              </div>

              {/* Control Style & Default Gear */}
              <div className="pt-6 border-t border-border-color grid grid-cols-2 gap-8">
                <div className="space-y-4">
                   <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Button/Switch 3 speed</span>
                   <div className="flex flex-col gap-2">
                     <label className="flex items-center gap-3 cursor-pointer">
                       <input type="radio" checked={config.controlType === 'BUTTON'} onChange={() => handleChange('controlType', 'BUTTON')} className="accent-primary" />
                       <span className="text-sm">Button 3 speed</span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer">
                       <input type="radio" checked={config.controlType === 'SWITCH'} onChange={() => handleChange('controlType', 'SWITCH')} className="accent-primary" />
                       <span className="text-sm">Switch 3 speed</span>
                     </label>
                   </div>
                </div>
                
                <div className="space-y-4">
                   <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Three speed default gear</span>
                   <div className="flex flex-col gap-2">
                     {['Low', 'Mid', 'Hige'].map(g => (
                       <label key={g} className="flex items-center gap-3 cursor-pointer">
                         <input type="radio" checked={config.defGear === g.toUpperCase()} onChange={() => handleChange('defGear', g.toUpperCase())} className="accent-primary" />
                         <span className="text-sm">{g}</span>
                       </label>
                     ))}
                   </div>
                </div>
              </div>

              {/* Soft Start Section */}
              <div className="pt-6 border-t border-border-color bg-primary/5 -mx-6 px-6 py-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={config.softStart} onChange={e => handleChange('softStart', e.target.checked)} className="peer sr-only" />
                    <div className="w-10 h-6 bg-surface-hover rounded-full peer peer-checked:bg-success peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border border-border-color relative"></div>
                    <span className="text-sm font-medium text-text-primary">Soft start enabled</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Soft start grade:</span>
                    <input type="number" value={config.softStartGrade} onChange={e => handleChange('softStartGrade', parseInt(e.target.value))}
                      className="w-16 bg-bg-color border border-border-color rounded-xl px-2 py-1.5 text-center text-text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
