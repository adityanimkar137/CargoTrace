import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  MapPin,
  User,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Package,
  ArrowRightLeft,
  ClipboardCheck,
  AlertOctagon,
  UploadCloud
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';

export function InvestigationTimeline({ shipmentId }) {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/shipments/${shipmentId}/investigation/timeline`);
      setTimelineData(data);
    } catch (err) {
      setError(err.message || 'Failed to load investigation timeline');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const getEventIcon = (sourceType) => {
    switch (sourceType) {
      case 'custody':
        return <ArrowRightLeft className="h-4 w-4 text-blue-400" />;
      case 'inspection':
        return <ClipboardCheck className="h-4 w-4 text-purple-400" />;
      case 'incident':
        return <AlertOctagon className="h-4 w-4 text-rose-400" />;
      case 'evidence':
        return <UploadCloud className="h-4 w-4 text-emerald-400" />;
      default:
        return <Package className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Unified Investigation Timeline</h3>
          <p className="text-xs text-slate-400">
            Chronological reconstruction derived from verified custody, inspection, incident, and evidence records
          </p>
        </div>

        <button
          onClick={fetchTimeline}
          disabled={loading}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          title="Refresh timeline"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono">Building unified investigation timeline...</div>
      ) : !timelineData || timelineData.timeline.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-2">
          <Clock className="h-6 w-6 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No Investigation Timeline Records</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {timelineData.timeline.map((event) => {
            const isDelayed =
              event.recordedAt &&
              event.occurredAt &&
              new Date(event.recordedAt).getTime() - new Date(event.occurredAt).getTime() > 24 * 60 * 60 * 1000;

            return (
              <div key={event.eventId} className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="absolute -left-6 top-4 p-1 rounded-full bg-slate-900 border border-slate-700 shadow-sm">
                  {getEventIcon(event.sourceType)}
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-slate-200 uppercase text-[11px]">
                      {event.eventType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
                      {event.verificationStatus}
                    </span>
                    {isDelayed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800 flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        <span>Delayed Entry (&gt;24h)</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-400">
                    <span className="flex items-center text-slate-300">
                      <Clock className="h-3 w-3 mr-1 text-blue-400" />
                      Reported: {new Date(event.occurredAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-slate-200 font-sans leading-relaxed text-xs">{event.summary}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="truncate">Location: {event.location || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3 text-purple-400 shrink-0" />
                    <span className="truncate">Actor: {event.actor}</span>
                  </div>
                </div>

                {event.evidenceReferences && event.evidenceReferences.length > 0 && (
                  <div className="pt-2 border-t border-slate-900 flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
                    <FileCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Linked Evidence: {event.evidenceReferences.join(', ')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
