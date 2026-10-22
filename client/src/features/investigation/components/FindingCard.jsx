import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

/**
 * Standard Evidence Status Mapping & Badge Styling
 */
export function getEvidenceStatusBadge(statusRaw) {
  const status = (statusRaw || '').toUpperCase();

  if (status === 'VERIFIED_FACT' || status === 'RECORDED_FACT') {
    return {
      label: 'VERIFIED FACT',
      style: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      icon: CheckCircle2
    };
  }

  if (status === 'CORROBORATED_FINDING') {
    return {
      label: 'CORROBORATED FINDING',
      style: 'bg-blue-950/80 text-blue-300 border-blue-800',
      icon: ShieldCheck
    };
  }

  if (status === 'UNCONFIRMED_HYPOTHESIS' || status === 'HYPOTHESIS' || status === 'UNRESOLVED') {
    return {
      label: 'UNCONFIRMED HYPOTHESIS',
      style: 'bg-amber-950/80 text-amber-300 border-amber-800',
      icon: HelpCircle
    };
  }

  if (status === 'EVIDENCE_GAP' || status === 'CONFIRMED_GAP') {
    return {
      label: 'EVIDENCE GAP',
      style: 'bg-rose-950/80 text-rose-300 border-rose-800',
      icon: AlertTriangle
    };
  }

  return {
    label: 'UNCONFIRMED HYPOTHESIS',
    style: 'bg-slate-800 text-slate-300 border-slate-700',
    icon: HelpCircle
  };
}

/**
 * Reusable Standard Finding Component
 */
export function FindingCard({
  finding,
  onRecordClick
}) {
  const {
    title,
    observed,
    category, // status raw
    severity,
    severityRationale,
    supportingRecords = [],
    contradictoryRecords = [],
    provesText,
    doesNotProveText,
    recommendedNextAction
  } = finding;

  const badge = getEvidenceStatusBadge(category);
  const StatusIcon = badge.icon;

  const getSeverityStyle = (sev) => {
    switch ((sev || '').toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/60 border-rose-900';
      case 'HIGH':
        return 'text-amber-400 bg-amber-950/60 border-amber-900';
      case 'MEDIUM':
        return 'text-yellow-400 bg-yellow-950/60 border-yellow-900';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-md print:bg-white print:border-gray-300 print:text-black">
      {/* Header: Title, Status Badge, Severity Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
        <div className="flex items-center space-x-2">
          <StatusIcon className="h-4 w-4 shrink-0 text-slate-300" />
          <h4 className="text-xs font-bold text-slate-200 print:text-black font-mono">
            {title}
          </h4>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1 font-mono text-[10px]">
          <span className={`px-2 py-0.5 rounded border font-bold flex items-center space-x-1 ${badge.style}`}>
            <StatusIcon className="h-3 w-3 shrink-0" />
            <span>{badge.label}</span>
          </span>

          {severity && (
            <span className={`px-2 py-0.5 rounded border font-bold ${getSeverityStyle(severity)}`}>
              PRIORITY: {severity.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Observed Summary & Problem Statement */}
      <div className="text-slate-300 font-sans text-xs leading-relaxed print:text-gray-800">
        <p>{observed}</p>
        {severityRationale && (
          <p className="text-[11px] text-slate-400 mt-1 italic font-mono print:text-gray-600">
            Priority rationale: {severityRationale}
          </p>
        )}
      </div>

      {/* Proves vs. Does Not Prove Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
        <div className="p-2.5 bg-emerald-950/30 border border-emerald-900/50 rounded-lg space-y-1 print:bg-emerald-50 print:border-emerald-200">
          <span className="text-emerald-400 font-bold block print:text-emerald-800 flex items-center space-x-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>WHAT THE EVIDENCE PROVES</span>
          </span>
          <p className="text-slate-300 print:text-gray-900 leading-relaxed font-sans">
            {provesText || 'Establishes recorded event parameters.'}
          </p>
        </div>

        <div className="p-2.5 bg-amber-950/30 border border-amber-900/50 rounded-lg space-y-1 print:bg-amber-50 print:border-amber-200">
          <span className="text-amber-400 font-bold block print:text-amber-800 flex items-center space-x-1">
            <HelpCircle className="h-3 w-3" />
            <span>WHAT REMAINS UNPROVEN</span>
          </span>
          <p className="text-slate-300 print:text-gray-900 leading-relaxed font-sans">
            {doesNotProveText || 'Does not independently prove transit timing or party fault.'}
          </p>
        </div>
      </div>

      {/* Supporting & Contradictory Record Chips */}
      <div className="space-y-2 text-[10px] font-mono pt-1">
        {supportingRecords.length > 0 && (
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-slate-400 font-bold">Supporting Records:</span>
            {supportingRecords.map((rec, i) => (
              <button
                key={i}
                onClick={() => onRecordClick && onRecordClick(rec)}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono inline-flex items-center space-x-1 cursor-pointer transition"
              >
                <FileText className="h-2.5 w-2.5 text-blue-400" />
                <span>{typeof rec === 'string' ? rec : rec.label || rec.id}</span>
                <ExternalLink className="h-2 w-2 text-slate-500" />
              </button>
            ))}
          </div>
        )}

        {contradictoryRecords.length > 0 && (
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-slate-400 font-bold">Contradictory / Clean Logs:</span>
            {contradictoryRecords.map((rec, i) => (
              <button
                key={i}
                onClick={() => onRecordClick && onRecordClick(rec)}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono inline-flex items-center space-x-1 cursor-pointer transition"
              >
                <FileText className="h-2.5 w-2.5 text-slate-400" />
                <span>{typeof rec === 'string' ? rec : rec.label || rec.id}</span>
                <ExternalLink className="h-2 w-2 text-slate-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Next Action */}
      {recommendedNextAction && (
        <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-xs text-blue-300 font-mono">
          <div className="flex items-center space-x-1.5">
            <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span><strong className="text-slate-200">Recommended Action:</strong> {recommendedNextAction}</span>
          </div>
        </div>
      )}
    </div>
  );
}
