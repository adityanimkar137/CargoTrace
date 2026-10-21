import React, { useEffect, useMemo } from 'react';
import { Calendar, Zap } from 'lucide-react';

/**
 * Format Date to YYYY-MM-DD
 */
export function toDateInputValue(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${year}-${month}-${day}`;
}

export function formatHumanDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString + 'T00:00:00');
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function SmartDatePicker({
  value,
  onChange,
  required = false,
  label = 'Expected Arrival Date',
  defaultPresetDays = 3 // default to +3 days for logistics
}) {
  useEffect(() => {
    if (!value && defaultPresetDays !== null) {
      const target = new Date();
      target.setDate(target.getDate() + defaultPresetDays);
      onChange(toDateInputValue(target));
    }
  }, [value, defaultPresetDays, onChange]);

  const handleSetOffsetDays = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    onChange(toDateInputValue(target));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-medium text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {value && (
          <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
            <strong className="text-slate-200">{formatHumanDate(value)}</strong>
          </span>
        )}
      </div>

      <div className="relative">
        <Calendar className="h-4 w-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
        <input
          type="date"
          required={required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Preset Action Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => handleSetOffsetDays(0)}
          className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-medium transition cursor-pointer"
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => handleSetOffsetDays(1)}
          className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-medium transition cursor-pointer"
        >
          +1 Day
        </button>

        <button
          type="button"
          onClick={() => handleSetOffsetDays(3)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white text-[11px] font-medium transition cursor-pointer"
          title="Recommended standard logistics window"
        >
          <Zap className="h-3 w-3" />
          <span>+3 Days (Std)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetOffsetDays(7)}
          className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-medium transition cursor-pointer"
        >
          +1 Week
        </button>

        <button
          type="button"
          onClick={() => handleSetOffsetDays(14)}
          className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-medium transition cursor-pointer"
        >
          +2 Weeks
        </button>
      </div>
    </div>
  );
}
