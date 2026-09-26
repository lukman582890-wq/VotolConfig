import React from 'react';

// Using the protocol decoding logic from votol_reader.py
const modelMap = { 0x05: 'EM-30s', 0x0A: 'EM-50s', 0x14: 'EM-100s', 0x1E: 'EM-150s', 0x28: 'EM-200s' };
const voltMap = { 0: '48V', 1: '60V', 2: '72V', 3: '84V', 4: '96V' };

const DEFAULT_CONFIG = {
  model: '',
  batteryVoltage: '',
  overvoltage: '',
  undervoltageSoft: '',
  undervoltageVar: '',
  busCurrent: '',
  phaseCurrent: '',
  undervoltage: '',
  volCal: '',
  curCal: ''
};

export function Page1Config({ data, onUpdate }) {
  const config = { ...DEFAULT_CONFIG, ...(data || {}) };

  const handleChange = (key, val) => {
    if (onUpdate) onUpdate({ ...config, [key]: val });
  };

  return (
    <div className="w-full max-w-6xl mx-auto animation-fade-in space-y-6">
  <div className="bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50">
          <h2 className="text-lg font-bold text-text-primary">Basic Settings</h2>
          <p className="text-sm text-text-secondary">Fundamental controller boundaries and limits.</p>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Hardware Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Hardware
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary pl-1">Model</label>
                <select 
                  value={config.model}
                  onChange={(e) => handleChange('model', parseInt(e.target.value))}
                  className="w-full bg-bg-color border border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  {Object.entries(modelMap).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary pl-1">Battery Voltage</label>
                <select 
                  value={config.batteryVoltage}
                  onChange={(e) => handleChange('batteryVoltage', parseInt(e.target.value))}
                  className="w-full bg-bg-color border border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  {Object.entries(voltMap).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Voltage Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Voltage Limits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'overvoltage', label: 'Overvoltage (V)', step: '0.1' },
                { id: 'undervoltageSoft', label: 'Soft Undervolt (V)', step: '0.1' },
                { id: 'undervoltage', label: 'Undervoltage (V)', step: '0.1' },
                { id: 'undervoltageVar', label: 'Variation (V)', step: '0.1' }
              ].map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary pl-1 truncate">{field.label}</label>
                  <input 
                    type="number"
                    step={field.step}
                    value={config[field.id]}
                    onChange={(e) => handleChange(field.id, parseFloat(e.target.value))}
                    className="w-full bg-bg-color border border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Current Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full"></span>
              Current Limits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'busCurrent', label: 'Busbar (A)', step: '1' },
                { id: 'phaseCurrent', label: 'Phase (A)', step: '10' }
              ].map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary pl-1">{field.label}</label>
                  <input 
                    type="number"
                    step={field.step}
                    value={config[field.id]}
                    onChange={(e) => handleChange(field.id, parseFloat(e.target.value))}
                    className="w-full bg-bg-color border border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              ))}
            </div>
          </section>



        </div>
      </div>
    </div>
  );
}
