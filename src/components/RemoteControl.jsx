import React, { useState, useEffect } from 'react';
import { Sliders, Cpu, Zap, Activity } from 'lucide-react';
import { StatusPill } from './StatusPill';
import { serialManager } from '../services/serialManager';

export function RemoteControl() {
  const [remoteEnabled, setRemoteEnabled] = useState(false);
  const [throttle, setThrottle] = useState(0.7); // Votol idle throttle typically 0.7-1.0V
  const [gear, setGear] = useState('L');
  const [brake, setBrake] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [lock, setLock] = useState(false);

  useEffect(() => {
    if (remoteEnabled) {
      const interval = setInterval(() => {
        serialManager.sendRemoteControl({
          remoteEnabled,
          throttle,
          gear,
          brake,
          reverse,
          lock,
          volCal: 1119,
          curCal: 15,
          weakFluxCal: 0
        });
      }, 100); // 10Hz update rate
      return () => clearInterval(interval);
    }
  }, [remoteEnabled, throttle, gear, brake, reverse, lock]);

  const handleStop = () => {
    setThrottle(0.7);
    setBrake(true);
    setRemoteEnabled(true);
    // Explicitly set brake to true and throttle to idle
  };

  return (
    <div className="w-full h-full max-w-none mx-auto animation-fade-in pb-12 overflow-hidden">
      
      {/* --- PC LAYOUT (Desktop / Large Screens) --- */}
      <div className="hidden md:block bg-surface border border-border-color rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
        <div className="px-6 py-4 border-b border-border-color bg-surface-hover/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Remote Control (PC Mode)</h2>
            <p className="text-sm text-text-secondary">Override controller inputs via mouse/keyboard.</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Enable Remote</span>
            <div className="relative flex items-center">
              <input 
                type="checkbox" 
                checked={remoteEnabled} 
                onChange={e => setRemoteEnabled(e.target.checked)} 
                className="peer sr-only" 
              />
              <div className="w-12 h-7 bg-surface-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all border border-border-color shadow-sm"></div>
            </div>
          </label>
        </div>

        <div className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                Throttle Control
              </label>
              <div className="text-2xl font-bold text-primary tabular-nums">
                {throttle.toFixed(2)} <span className="text-sm font-medium text-text-secondary">V</span>
              </div>
            </div>
            <div className="px-2">
              <input 
                type="range" 
                min="0.5" max="4.5" step="0.01"
                disabled={!remoteEnabled}
                value={throttle} 
                onChange={e => setThrottle(parseFloat(e.target.value))}
                className="w-full h-3 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border-color">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4 text-warning" />Remote Gear</label>
              <div className="flex gap-2">
                {['L', 'M', 'H', 'S'].map(g => (
                  <button key={g} disabled={!remoteEnabled} onClick={() => setGear(g)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all border ${gear === g ? 'bg-primary border-primary text-bg-color' : 'bg-bg-color border-border-color text-text-secondary'} disabled:opacity-30`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-text-primary uppercase tracking-wider flex items-center gap-2"><Activity className="w-4 h-4 text-danger" />Quick Actions</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'brake', label: 'Brake', state: brake, set: setBrake, color: 'danger' },
                  { id: 'reverse', label: 'Reverse', state: reverse, set: setReverse, color: 'warning' },
                  { id: 'lock', label: 'Lock', state: lock, set: setLock, color: 'primary' }
                ].map(action => (
                  <button key={action.id} disabled={!remoteEnabled} onClick={() => action.set(!action.state)}
                    className={`py-3 rounded-xl text-xs font-bold uppercase transition-all border ${action.state ? 'bg-' + action.color + ' border-' + action.color + ' text-white' : 'bg-bg-color border-border-color text-text-secondary'} disabled:opacity-30`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE EMERGENCY LAYOUT (Android / Phone) --- */}
      <div className="block md:hidden h-screen -mt-4 -mx-4 pb-20 relative bg-bg-color overflow-hidden">
        
        {/* Header Toggle */}
        <div className="px-6 py-4 border-b border-border-color bg-surface flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${remoteEnabled ? 'bg-danger animate-pulse shadow-[0_0_8px_red]' : 'bg-text-secondary'}`} />
                <h2 className="text-sm font-black text-text-primary uppercase tracking-widest">Emergency Remote</h2>
            </div>
            <label className="flex items-center gap-2 h-8 px-3 rounded-full bg-surface-hover border border-border-color">
                <input type="checkbox" checked={remoteEnabled} onChange={e => setRemoteEnabled(e.target.checked)} className="peer sr-only" />
                <div className="w-8 h-4 bg-bg-color rounded-full relative peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
            </label>
        </div>

        {/* Center Panel (Dual Throttle + STOP) */}
        <div className="flex h-[calc(100%-140px)] p-4 gap-4">
            
            {/* Left: Gear & Action Switches (Thumb Easy) */}
            <div className="w-1/3 flex flex-col gap-3 justify-end pb-8">
                <div className="space-y-2">
                    <span className="text-[10px] font-black text-text-secondary uppercase">Gears</span>
                    <div className="grid grid-cols-2 gap-2">
                        {['L', 'M', 'H', 'S'].map(g => (
                            <button key={g} disabled={!remoteEnabled} onClick={() => setGear(g)}
                                className={`h-14 rounded-2xl font-black text-lg transition-all border ${gear === g ? 'bg-warning border-warning text-bg-color' : 'bg-surface border-border-color text-text-secondary'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    disabled={!remoteEnabled} 
                    onClick={() => setReverse(!reverse)}
                    className={`h-20 rounded-2xl flex flex-col items-center justify-center font-black uppercase text-xs border transition-all ${reverse ? 'bg-orange-500 border-orange-600 text-white' : 'bg-surface border-border-color text-text-secondary'}`}
                >
                    <Activity className="w-5 h-5 mb-1" />
                    Reverse
                </button>
            </div>

            {/* Right: Giant Vertical Throttle (Thumb optimized) */}
            <div className="flex-1 flex flex-col items-center justify-between py-4 bg-surface rounded-3xl border border-border-color shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                
                <div className="z-10 text-center">
                    <div className="text-[10px] font-black text-text-secondary uppercase mb-1 tracking-tighter">Throttle Voltage</div>
                    <div className="text-4xl font-black text-primary tabular-nums">{throttle.toFixed(2)}</div>
                </div>

                <div className="relative h-2/3 w-16 bg-bg-color rounded-full border border-border-color flex items-end p-1">
                    {/* Visual Meter */}
                    <div 
                        className="w-full bg-gradient-to-t from-primary to-blue-400 rounded-full transition-all duration-75"
                        style={{ height: `${((throttle - 0.5) / 4.0) * 100}%` }}
                    />
                    {/* Hidden Invisible Range for ease of use */}
                    <input 
                        type="range" 
                        min="0.5" max="4.5" step="0.01"
                        disabled={!remoteEnabled}
                        value={throttle} 
                        onChange={e => setThrottle(parseFloat(e.target.value))}
                        style={{ transform: 'rotate(-90deg)', width: '220px', position: 'absolute', bottom: '110px', left: '-82px', opacity: 0 }}
                    />
                </div>

                <div className="z-10 pb-4">
                     <Sliders className="w-8 h-8 text-primary/50 animate-bounce" />
                </div>
            </div>

            {/* Right Sidebar: Panic STOP and Brake */}
            <div className="w-1/4 flex flex-col gap-4">
                <button 
                    onClick={handleStop}
                    className="flex-1 bg-danger hover:bg-danger/90 active:scale-95 rounded-3xl flex flex-col items-center justify-center border-4 border-white/20 shadow-[0_0_20px_rgba(255,59,48,0.4)]"
                >
                    <div className="text-white font-black text-2xl uppercase italic">STOP</div>
                    <span className="text-[10px] text-white/70 font-bold uppercase mt-1">Panic</span>
                </button>

                <button 
                   disabled={!remoteEnabled} 
                   onClick={() => setBrake(!brake)}
                   className={`h-1/3 rounded-3xl flex flex-col items-center justify-center font-black uppercase text-xs border transition-all ${brake ? 'bg-danger border-danger text-white' : 'bg-surface border-border-color text-text-secondary'}`}
                >
                    <Zap className="w-6 h-6 mb-1" />
                    Brake
                </button>
            </div>
        </div>

        {/* Status Bar */}
        <div className={`absolute bottom-0 inset-x-0 h-16 flex items-center justify-center border-t border-border-color transition-colors ${remoteEnabled ? 'bg-danger text-white' : 'bg-surface text-text-secondary'}`}>
             <span className="font-black uppercase tracking-[0.3em] text-sm italic">
                {remoteEnabled ? '⚠ DANGER: REMOTE CONTROL ACTIVE ⚠' : 'Ready to Connect'}
             </span>
        </div>
      </div>

    </div>
  );
}
