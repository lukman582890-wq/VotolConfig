import React from 'react';
import { cn } from '../utils/cn';

const PORT_OPTIONS = [
  { value: 0, label: "1: empty_func" },
  { value: 1, label: "2: low_speed_switch" },
  { value: 2, label: "3: low_speed_indication" },
  { value: 3, label: "4: mid_speed_indication" },
  { value: 4, label: "5: high_speed_indication" },
  { value: 5, label: "6: high_speed_switch" },
  { value: 6, label: "7: egear_butten" },
  { value: 7, label: "8: stealavoid" },
  { value: 8, label: "9: lamehome" },
  { value: 9, label: "10: reverse_set" },
  { value: 10, label: "11: single_wire_communication" },
  { value: 11, label: "12: side_sustain" },
  { value: 12, label: "13: hall_smulat_output" },
  { value: 13, label: "14: soft_start_selct" },
  { value: 14, label: "15: cruise_butten" },
  { value: 15, label: "16: high_break" },
  { value: 16, label: "17: park_input" },
  { value: 17, label: "18: sport_input" },
  { value: 18, label: "19: undef_IO_option" },
  { value: 19, label: "20: emergent_sotp / LY_safe_start" },
  { value: 20, label: "21: LY_undef_IO_option" },
  { value: 21, label: "22: LY_e_gear" },
  { value: 22, label: "23: LY_single_wire_communication" },
  { value: 23, label: "24: speed_limit" },
  { value: 24, label: "25: eabs_on_off" },
  { value: 25, label: "26: cruise_with_lamehome" },
  { value: 26, label: "27: egear_with_lamehome" },
  { value: 27, label: "28: low_break" },
  { value: 28, label: "29: half_test_single_wire_communication" },
  { value: 29, label: "30: park_iwith_lamehome" },
  { value: 30, label: "31: reverse_pressed_run" },
  { value: 31, label: "32: hill_down_disable" },
  { value: 32, label: "33: voltage_select" },
  { value: 33, label: "34: auto_cruise_enable" },
  { value: 34, label: "35: DRN_switch_D_butten" },
  { value: 35, label: "36: DRN_switch_R_butten" },
  { value: 36, label: "37: ebreak_ctl_deal" },
  { value: 37, label: "38: Ext_temp_KTY83_122" },
  { value: 38, label: "39: pre_charger" },
  { value: 39, label: "40: main_relay_on_deal" },
  { value: 40, label: "41: high_break_plus_deal" },
  { value: 41, label: "42: low_break_plus_deal" },
  { value: 42, label: "43: change_motor_direct" },
  { value: 43, label: "44: _low_speed_switch_butten" },
  { value: 44, label: "45: _120_change_motor_direct" },
  { value: 45, label: "46: _60_change_motor_direct" },
  { value: 46, label: "47: two_egear" },
  { value: 47, label: "48: four_egear" },
  { value: 48, label: "49: egear_two_current" },
  { value: 49, label: "50: footplat_enable" },
  { value: 50, label: "51: coast_enable" },
  { value: 51, label: "52: Ext_temperatrue_KTY84_150" },
  { value: 52, label: "53: Ext_temperatrue_MF52_103_B3380" },
  { value: 53, label: "54: egear_add" },
  { value: 54, label: "55: egear_sub" },
  { value: 55, label: "56: park_with_auto_enter" },
  { value: 56, label: "57: Lead_acid_Lithium_selcet" },
  { value: 57, label: "58: park_hold_dectet" },
  { value: 58, label: "59: cruise_with_reverse" },
  { value: 59, label: "60: remove_speed_limit_with_58" },
  { value: 60, label: "61: seat_switch_dectet" },
  { value: 61, label: "62: fan_ctrl" },
  { value: 62, label: "63: LED_ERR_flash" },
  { value: 63, label: "64: empty_func" }
];

const PORTS = [
  { id: 'pd0', label: 'PD0' },
  { id: 'jtck', label: 'JTCK' },
  { id: 'swd', label: 'SWD' },
  { id: 'pa11', label: 'PA11' },
  { id: 'pb3', label: 'PB3' },
  { id: 'pd1', label: 'PD1' },
  { id: 'pa12', label: 'PA12' },
  { id: 'pc15', label: 'PC15' },
  { id: 'pa0', label: 'PA0' },
  { id: 'pb9', label: 'PB9' },
  { id: 'pb4', label: 'PB4' },
  { id: 'pa15', label: 'PA15' },
  { id: 'pb2', label: 'PB2' },
  { id: 'pc14', label: 'PC14' },
  { id: 'pb5', label: 'PB5' },
  { id: 'pd15', label: 'PD15 (empty)' }
];

const DEFAULT_PORT = { io: false, sw: false, la: false, mode: 'F', func: 0 };

export function Page5Config({ data, onUpdate }) {
  const handleChange = (portId, field, value) => {
    const current = data || {};
    const currPort = { ...(current[portId] || DEFAULT_PORT) };
    
    if (['io', 'sw', 'la'].includes(field)) {
       currPort[field] = !currPort[field];
    } else {
       currPort[field] = value;
    }
    
    onUpdate({ ...current, [portId]: currPort });
  };

  const getPort = (id) => data?.[id] || DEFAULT_PORT;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Port Settings
          </h2>
          <p className="text-text-secondary mt-1">Configure internal IO, switches, and pin mappings.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {PORTS.map(port => {
          const cfg = getPort(port.id);
          return (
            <div key={port.id} className="bg-surface border border-border-color rounded-xl p-3 sm:p-4 flex flex-col gap-2.5 relative overflow-hidden group hover:border-primary/50 transition-all duration-200">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/10 transition-all duration-300 group-hover:bg-primary" />
              
              <div className="font-bold text-text-primary text-[13px] sm:text-base px-1">{port.label}</div>

              {/* Status Toggles: Changed to 3-column grid to fit better */}
              <div className="grid grid-cols-3 gap-1 px-1">
                {['io', 'sw', 'la'].map(field => (
                  <button
                    key={field}
                    onClick={() => handleChange(port.id, field)}
                    className={cn(
                      "py-1 rounded text-[9px] sm:text-[10px] font-bold border transition-all uppercase",
                      cfg[field] 
                        ? "bg-primary/20 text-primary border-primary/40" 
                        : "bg-bg-color/50 text-text-secondary border-border-color/20"
                    )}
                  >
                    {field}
                  </button>
                ))}
              </div>

              {/* Mode Selector */}
              <div className="flex bg-bg-color/50 rounded-lg p-1 border border-border-color/30">
                {['F', 'U', 'D'].map(m => (
                  <button
                    key={m}
                    onClick={() => handleChange(port.id, 'mode', m)}
                    className={cn(
                      "flex-1 py-1 text-[10px] sm:text-xs font-black rounded transition-all",
                      cfg.mode === m 
                        ? "bg-primary text-bg-color shadow-sm" 
                        : "text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Function Select */}
              <select 
                value={cfg.func}
                onChange={(e) => handleChange(port.id, 'func', parseInt(e.target.value))}
                className="w-full bg-bg-color/50 border border-border-color/30 rounded-lg px-2 py-2 text-[12px] sm:text-sm text-text-primary outline-none focus:border-primary transition-all"
              >
                {PORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
