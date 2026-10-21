import React from 'react';
import { MapPin, Navigation, Anchor, Building2, Check } from 'lucide-react';

export function LocationCheckpointPicker({
  value,
  onChange,
  origin,
  destination,
  extraCheckpoints = [],
  label = 'Event Location',
  required = false,
  accentColor = 'blue'
}) {
  // Build list of unique quick preset locations
  const presets = [];

  if (origin && origin.trim()) {
    presets.push({
      id: 'origin',
      label: 'Origin',
      value: origin.trim(),
      icon: Anchor,
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    });
  }

  if (destination && destination.trim()) {
    presets.push({
      id: 'destination',
      label: 'Destination',
      value: destination.trim(),
      icon: Building2,
      badge: 'bg-purple-950/80 text-purple-300 border-purple-800'
    });
  }

  // Common logistics checkpoint suggestions if not matching origin/destination
  const commonHubs = [
    'Terminal Gate 4 (Handover Bay)',
    'Intermediate Freight Hub Bay 12',
    'Customs Clearance Yard'
  ];

  commonHubs.forEach((hub, idx) => {
    presets.push({
      id: `hub-${idx}`,
      label: 'Hub',
      value: hub,
      icon: Navigation,
      badge: 'bg-slate-800 text-slate-300 border-slate-700'
    });
  });

  const accentStyles = {
    blue: {
      ring: 'focus:ring-blue-500',
      activeBadge: 'bg-blue-600/30 text-blue-300 border-blue-500/50'
    },
    emerald: {
      ring: 'focus:ring-emerald-500',
      activeBadge: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
    },
    rose: {
      ring: 'focus:ring-rose-500',
      activeBadge: 'bg-rose-600/30 text-rose-300 border-rose-500/50'
    }
  }[accentColor] || {
    ring: 'focus:ring-blue-500',
    activeBadge: 'bg-blue-600/30 text-blue-300 border-blue-500/50'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-medium text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
          1-Click Route Checkpoints Available
        </span>
      </div>

      <div className="relative">
        <MapPin className="h-4 w-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          required={required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Yokohama Port Gate 4 or Distribution Hub Bay 12"
          className={`w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-hidden focus:ring-2 ${accentStyles.ring} transition`}
        />
      </div>

      {/* Preset Checkpoint Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] text-slate-500 font-mono mr-0.5 uppercase tracking-wider">
          Presets:
        </span>
        {presets.map((preset) => {
          const isSelected = value && value.trim().toLowerCase() === preset.value.toLowerCase();
          const Icon = preset.icon;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer max-w-xs truncate ${
                isSelected
                  ? `${accentStyles.activeBadge} font-semibold shadow-xs`
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title={`Set location to ${preset.value}`}
            >
              {isSelected ? (
                <Check className="h-3 w-3 text-emerald-400 shrink-0" />
              ) : (
                <Icon className="h-3 w-3 text-slate-400 shrink-0" />
              )}
              <span className="text-slate-400 font-mono text-[10px] uppercase">{preset.label}:</span>
              <span className="truncate max-w-[140px] text-slate-200">{preset.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
