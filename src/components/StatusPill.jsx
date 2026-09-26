import React from 'react';
import { cn } from '../utils/cn';

export function StatusPill({ active, label, activeColorClass = "bg-success text-white shadow-success/20", inactiveColorClass = "bg-surface-hover text-text-secondary border-transparent" }) {
  return (
    <div className={cn(
      "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border",
      active 
        ? cn("border-transparent shadow-lg", activeColorClass)
        : cn("border-border-color", inactiveColorClass)
    )}>
      {label}
    </div>
  );
}
