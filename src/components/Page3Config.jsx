import React from 'react';

const DEFAULT_CONFIG = {
  hallAngle: '',
  polePairs: '',
  reverseRpm: '',
  eabsPercent: '',
  outputType: '',
  hillHold: false,
  exchPhase: false,
  exchHall: false,
  sportAutoOff: false,
  motorRev: false
};

export function Page3Config({ data, onUpdate }) {
  const config = { ...DEFAULT_CONFIG, ...(data || {}) };

  const handleChange = (key, val) => {
    if (onUpdate) onUpdate({ ...config, [key]: val });
  };

  return (
    <div className="w-full max-w-none mx-auto animation-fade-in space-y-6 pb-12">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Motor Settings Card */}
        <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
            <h2 className="text-lg font-bold text-text-primary">Motor Settings</h2>
          </div>
          <div className="p-6 space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Pole Pairs</label>
                <input type="number" value={config.polePairs} onChange={e => handleChange('polePairs', e.target.value)}
                  className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Hall Shift Angle</label>
                <input type="number" value={config.hallAngle} onChange={e => handleChange('hallAngle', e.target.value)}
                  className="w-full bg-bg-color border border-border-color rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border-color">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" checked={config.exchHall} onChange={e => handleChange('exchHall', e.target.checked)} className="peer sr-only" />
                  <div className="w-10 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border border-border-color"></div>
                </div>
                <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Exchange Hall Wire (Yellow-Blue)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" checked={config.exchPhase} onChange={e => handleChange('exchPhase', e.target.checked)} className="peer sr-only" />
                  <div className="w-10 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border border-border-color"></div>
                </div>
                <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Exchange Phase Wire (Blue-Green)</span>
              </label>
              
               <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input type="checkbox" checked={config.motorRev} onChange={e => handleChange('motorRev', e.target.checked)} className="peer sr-only" />
                  <div className="w-10 h-6 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border border-border-color"></div>
                </div>
                <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors">Motor Reverse Direction</span>
              </label>
            </div>
          </div>
        </div>

        {/* EABS & Reversing Card */}
        <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
            <h2 className="text-lg font-bold text-text-primary">EABS & Output</h2>
          </div>
          
          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-text-primary">EBS Ratio (Regen Strength)</label>
                <span className="text-lg font-bold text-primary">{config.eabsPercent}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={config.eabsPercent} 
                onChange={e => handleChange('eabsPercent', e.target.value)}
                className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>Off (0%)</span>
                <span>Max (100%)</span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-border-color">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-text-primary">Reversing Speed Limit</label>
                <span className="text-lg font-bold text-danger">{config.reverseRpm}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={config.reverseRpm} 
                onChange={e => handleChange('reverseRpm', e.target.value)}
                className="w-full h-2 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-danger"
              />
            </div>

            <div className="pt-4 border-t border-border-color space-y-3">
               <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Dashboard Output Signal</span>
               <div className="flex gap-4 p-1 bg-bg-color rounded-xl w-fit">
                   <button 
                     onClick={() => handleChange('outputType', 'One-Lin')}
                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${config.outputType === 'One-Lin' ? 'bg-surface border border-border-color shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                   >
                     One-Lin
                   </button>
                   <button 
                     onClick={() => handleChange('outputType', 'Hall')}
                     className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${config.outputType === 'Hall' ? 'bg-surface border border-border-color shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                   >
                     Hall Speedometer
                   </button>
               </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
