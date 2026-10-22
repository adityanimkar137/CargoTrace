import React from 'react';
import {
  X,
  FileText,
  MapPin,
  User,
  Calendar,
  ShieldCheck,
  Hash,
  ExternalLink,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';

/**
 * Interactive Record Preview Modal
 * Allows investigators to open and inspect any referenced record (inspection, custody event, incident, evidence)
 */
export function RecordPreviewModal({ record, onClose }) {
  if (!record) return null;

  const recordTitle = record.label || record.title || record.evidenceReference || record.shipmentReference || 'Record Preview';
  const recordType = record.type || record.referencedType || 'Record';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-mono text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl space-y-4 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white truncate max-w-xs">{recordTitle}</h3>
            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
              {recordType.toUpperCase()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer p-1 rounded hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Photo Preview if available */}
          {(record.fileUrl || record.photoUrl) && (
            <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-2 text-center">
              <img
                src={record.fileUrl || record.photoUrl}
                alt={recordTitle}
                className="max-h-56 mx-auto object-contain rounded"
              />
              <span className="text-[10px] text-slate-500 mt-1 block flex items-center justify-center space-x-1">
                <ImageIcon className="h-3 w-3" />
                <span>Verified Image Artifact</span>
              </span>
            </div>
          )}

          {/* Core Properties */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {record.location && (
              <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                  <MapPin className="h-3 w-3 text-purple-400" />
                  <span>LOCATION</span>
                </span>
                <span className="text-slate-200 block font-bold">{record.location}</span>
              </div>
            )}

            {(record.actor || record.uploadedBy || record.inspectedBy || record.reportedBy) && (
              <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                  <User className="h-3 w-3 text-blue-400" />
                  <span>ACTOR / INSPECTOR</span>
                </span>
                <span className="text-slate-200 block font-bold">
                  {typeof (record.actor || record.uploadedBy || record.inspectedBy || record.reportedBy) === 'object'
                    ? (record.actor || record.uploadedBy || record.inspectedBy || record.reportedBy)?.displayName
                    : (record.actor || record.uploadedBy || record.inspectedBy || record.reportedBy)}
                </span>
              </div>
            )}

            {(record.occurredAt || record.uploadedAt || record.inspectedAt || record.createdAt) && (
              <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                  <Calendar className="h-3 w-3 text-emerald-400" />
                  <span>TIMESTAMP</span>
                </span>
                <span className="text-slate-200 block font-bold">
                  {new Date(record.occurredAt || record.uploadedAt || record.inspectedAt || record.createdAt).toLocaleString()}
                </span>
              </div>
            )}

            {(record.verificationStatus || record.confirmationStatus || record.sealCondition) && (
              <div className="p-2 bg-slate-950 rounded border border-slate-800 space-y-0.5">
                <span className="text-slate-500 text-[10px] flex items-center space-x-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  <span>STATUS / SEAL</span>
                </span>
                <span className="text-slate-200 block font-bold">
                  {record.verificationStatus || record.confirmationStatus || `SEAL: ${record.sealCondition}`}
                </span>
              </div>
            )}
          </div>

          {/* Details / Observations */}
          {(record.observations || record.summary || record.notes || record.explanation) && (
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] font-bold block">RECORD OBSERVATIONS & NOTES</span>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {record.observations || record.summary || record.notes || record.explanation}
              </p>
            </div>
          )}

          {/* SHA-256 Digest if evidence */}
          {record.sha256 && (
            <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] space-y-0.5">
              <span className="text-slate-500 font-bold block flex items-center space-x-1">
                <Hash className="h-3 w-3 text-emerald-400" />
                <span>SHA-256 BYTE INTEGRITY DIGEST</span>
              </span>
              <span className="text-emerald-300 font-mono block break-all font-bold">{record.sha256}</span>
              <span className="text-slate-500 text-[9px] block italic mt-1">
                Hash match verifies digital artifact byte integrity since upload; does not prove capture time or physical condition.
              </span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
