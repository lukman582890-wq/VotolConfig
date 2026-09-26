import React from 'react';
import { cn } from '../utils/cn';

export function Gauge({ value, max, label, unit, colorClass = "text-primary" }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDasharray = `${percentage} 100`;

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-6 bg-surface border border-border-color rounded-2xl shadow-lg relative overflow-hidden group">
      {/* Subtle background glow on hover */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500", colorClass.replace('text-', 'bg-'))} />
      
      <div className="relative w-20 h-20 sm:w-32 sm:h-32 mb-1.5 sm:mb-4">
        {/* Background Circle */}
        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
          <path
            className="text-surface-hover stroke-current"
            strokeWidth="3.5"
            strokeDasharray="100 100"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Progress Circle */}
          <path
            className={cn("stroke-current transition-all duration-500 ease-out", colorClass)}
            strokeWidth="3.5"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl sm:text-3xl font-bold text-text-primary tracking-tighter">
            {value.toFixed(1)}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-text-secondary">{unit}</span>
        </div>
      </div>
      <h3 className="text-[10px] sm:text-sm font-semibold text-text-secondary uppercase tracking-wider">{label}</h3>
    </div>
  );
}
