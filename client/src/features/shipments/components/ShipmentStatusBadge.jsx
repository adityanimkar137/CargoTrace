import React from 'react';

const STATUS_CONFIG = {
  REGISTERED: {
    label: 'Registered',
    bg: 'bg-blue-950/80',
    text: 'text-blue-300',
    border: 'border-blue-800',
    dot: 'bg-blue-400'
  },
  IN_TRANSIT: {
    label: 'In Transit',
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-300',
    border: 'border-emerald-800',
    dot: 'bg-emerald-400 animate-pulse'
  },
  ON_HOLD: {
    label: 'On Hold',
    bg: 'bg-amber-950/80',
    text: 'text-amber-300',
    border: 'border-amber-800',
    dot: 'bg-amber-400'
  },
  ARRIVED: {
    label: 'Arrived',
    bg: 'bg-purple-950/80',
    text: 'text-purple-300',
    border: 'border-purple-800',
    dot: 'bg-purple-400'
  },
  CLOSED: {
    label: 'Closed',
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
    dot: 'bg-slate-400'
  }
};

export function ShipmentStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.REGISTERED;

  return (
    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`}></span>
      <span>{config.label}</span>
    </span>
  );
}
