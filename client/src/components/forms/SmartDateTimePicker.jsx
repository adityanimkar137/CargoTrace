import React, { useEffect, useMemo } from 'react';
import { Calendar, Clock, Zap, RotateCcw } from 'lucide-react';

/**
 * Format Date object to HTML5 datetime-local string (YYYY-MM-DDTHH:mm)
 */
export function toDateTimeLocalString(date = new Date()) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format datetime-local string to clean human-readable date and time
 */
export function formatHumanDateTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function SmartDateTimePicker({
  value,
  onChange,
  required = false,
  label = 'Date & Time',
  accentColor = 'blue',
  autoFillNow = true
}) {
  // Auto-fill to current time on mount if value is not provided
  useEffect(() => {
    if (autoFillNow && !value) {
      onChange(toDateTimeLocalString(new Date()));
    }
  }, [autoFillNow, value, onChange]);

  const timezoneName = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  }, []);

  const handleApplyOffset = (offsetHours) => {
    const baseDate = value ? new Date(value) : new Date();
    const newDate = new Date(baseDate.getTime() + offsetHours * 60 * 60 * 1000);
    onChange(toDateTimeLocalString(newDate));
  };

  const handleSetNow = () => {
    onChange(toDateTimeLocalString(new Date()));
  };

  const accentStyles = {
    blue: {
      ring: 'focus:ring-blue-500',
      badge: 'text-blue-400 bg-blue-950/60 border-blue-900',
      activeBtn: 'hover:bg-blue-600 hover:text-white hover:border-blue-500'
    },
    rose: {
      ring: 'focus:ring-rose-500',
      badge: 'text-rose-400 bg-rose-950/60 border-rose-900',
      activeBtn: 'hover:bg-rose-600 hover:text-white hover:border-rose-500'
    },
    amber: {
      ring: 'focus:ring-amber-400 bg-amber-950/60 border-amber-900',
      badge: 'text-amber-400 bg-amber-950/60 border-amber-900',
      activeBtn: 'hover:bg-amber-600 hover:text-white hover:border-amber-500'
    },
    emerald: {
      ring: 'focus:ring-emerald-500',
      badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-900',
      activeBtn: 'hover:bg-emerald-600 hover:text-white hover:border-emerald-500'
    }
  }[accentColor] || {
    ring: 'focus:ring-blue-500',
    badge: 'text-blue-400 bg-blue-950/60 border-blue-900',
    activeBtn: 'hover:bg-blue-600 hover:text-white hover:border-blue-500'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block font-medium text-slate-300">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
          <Clock className="h-3 w-3 text-slate-500" />
          <span>{timezoneName}</span>
        </span>
      </div>

      <div className="relative">
        <Calendar className="h-4 w-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none" />
        <input
          type="datetime-local"
          required={required}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:ring-2 ${accentStyles.ring} transition`}
        />
      </div>

      {/* Preset Action Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={handleSetNow}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white text-[11px] font-medium transition cursor-pointer"
          title="Set to Current Date & Time"
        >
          <Zap className="h-3 w-3" />
          <span>Now</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplyOffset(-1)}
          className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-mono transition cursor-pointer"
          title="1 hour ago"
        >
          -1 hr
        </button>

        <button
          type="button"
          onClick={() => handleApplyOffset(-4)}
          className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-mono transition cursor-pointer"
          title="4 hours ago"
        >
          -4 hrs
        </button>

        <button
          type="button"
          onClick={() => handleApplyOffset(24)}
          className="px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white text-[11px] font-mono transition cursor-pointer"
          title="+24 hours"
        >
          +24 hrs
        </button>

        {value && (
          <span className="text-[11px] text-slate-400 pl-1 font-sans hidden sm:inline">
            Selected: <strong className="text-slate-200">{formatHumanDateTime(value)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
