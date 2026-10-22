import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertOctagon,
  MapPin,
  Clock,
  User,
  Plus,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { IncidentFormModal } from './IncidentFormModal.jsx';

export function IncidentList({ shipmentId, shipment, initialData }) {
  const { permissions } = useAuth();
  const canReport = permissions.includes('shipment:update');

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/shipments/${shipmentId}/incidents`);
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err.message || 'Failed to load damage incidents');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (initialData) {
      setIsModalOpen(true);
    }
  }, [initialData]);

  const handleUpdateStatus = async (incidentId, newStatus) => {
    const notes = prompt(`Enter resolution / status notes for setting incident to ${newStatus}:`);
    if (notes === null) return;

    try {
      await apiClient.patch(`/incidents/${incidentId}`, {
        status: newStatus,
        resolutionNotes: notes || undefined
      });
      fetchIncidents();
    } catch (err) {
      alert(err.message || 'Failed to update incident status');
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'MAJOR':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'MODERATE':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'MINOR':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'UNDER_REVIEW':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      default:
        return 'bg-rose-950 text-rose-300 border-rose-800';
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Damage Incidents & Exceptions</h3>
          <p className="text-xs text-slate-400">Reported physical damage events, cargo impairment, and resolution notes</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
            title="Refresh incidents"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {canReport && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Report Damage</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono">Loading damage incidents...</div>
      ) : incidents.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-2">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
          <p className="text-slate-300 font-semibold">No Damage Incidents Reported</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            No damage or exception events have been logged for this shipment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div key={inc._id} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono font-bold text-slate-200 text-sm">{inc.incidentReference}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getSeverityBadge(inc.severity)}`}>
                    SEVERITY: {inc.severity}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getStatusBadge(inc.status)}`}>
                    {inc.status}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>Discovered: {new Date(inc.discoveredAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-100 text-xs mb-1">{inc.title}</h4>
                <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-sans">
                  {inc.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block">Location:</span>
                  <span className="text-slate-300 font-semibold">{inc.location}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                  <span className="text-slate-500 block">Affected Cargo:</span>
                  <span className="text-slate-300 font-semibold">{inc.affectedCargo || 'General consignment'}</span>
                </div>
              </div>

              {inc.resolutionNotes && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/80 rounded-lg text-emerald-300 text-[11px] font-mono space-y-1">
                  <span className="font-semibold flex items-center text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolution Log:
                  </span>
                  <p className="leading-relaxed">{inc.resolutionNotes}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                <span>Reported by: {inc.reportedBy?.displayName || 'Investigator'}</span>

                {canReport && inc.status !== 'RESOLVED' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleUpdateStatus(inc._id, 'UNDER_REVIEW')}
                      className="px-2.5 py-1 rounded bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 transition cursor-pointer"
                    >
                      Set Under Review
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(inc._id, 'RESOLVED')}
                      className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <IncidentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shipmentId={shipmentId}
        shipment={shipment}
        initialData={initialData}
        onSuccess={fetchIncidents}
      />
    </div>
  );
}
