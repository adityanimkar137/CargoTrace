import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  MapPin,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { CustodyEventFormModal } from './CustodyEventFormModal.jsx';

export function CustodyTimeline({ shipmentId, shipment }) {
  const { permissions } = useAuth();
  const canManage = permissions.includes('custody:manage');

  const [custodyEvents, setCustodyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCustodyEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/shipments/${shipmentId}/custody-events`);
      setCustodyEvents(data.custodyEvents || []);
    } catch (err) {
      setError(err.message || 'Failed to load custody timeline');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchCustodyEvents();
  }, [fetchCustodyEvents]);

  const handleAcknowledge = async (eventId, confirmationStatus) => {
    try {
      await apiClient.patch(`/custody-events/${eventId}/acknowledge`, {
        confirmationStatus,
        acknowledgementNotes: 'Acknowledged in workspace'
      });
      fetchCustodyEvents();
    } catch (err) {
      alert(err.message || 'Failed to update custody confirmation');
    }
  };

  const getConfirmationBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>CONFIRMED</span>
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
            <AlertCircle className="h-3 w-3 text-rose-400" />
            <span>DISPUTED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800">
            <HelpCircle className="h-3 w-3 text-amber-400" />
            <span>UNCONFIRMED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Chain of Custody Timeline</h3>
          <p className="text-xs text-slate-400">Verifiable handover logs, custodian transitions, and location reports</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCustodyEvents}
            disabled={loading}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
            title="Refresh timeline"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Handover</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono">Loading custody timeline...</div>
      ) : custodyEvents.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-2">
          <ArrowRightLeft className="h-6 w-6 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No Custody Handover Events Recorded</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            Record custodian transfers, pickups, or terminal receipts to establish chain-of-custody provenance.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {custodyEvents.map((event) => (
            <div key={event._id} className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="absolute -left-6 top-3.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-slate-900"></span>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-blue-400 uppercase text-[11px]">{event.eventType}</span>
                  {getConfirmationBadge(event.confirmationStatus)}
                </div>

                <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-400">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>Occurred: {new Date(event.occurredAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Custodian Transition */}
              {(event.fromParty || event.toParty) && (
                <div className="flex items-center space-x-2 font-mono text-slate-200 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400">{event.fromParty || 'Origin Custodian'}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="text-blue-300 font-semibold">{event.toParty || 'Receiving Custodian'}</span>
                </div>
              )}

              <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
                <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>{event.location}</span>
              </div>

              {event.notes && (
                <p className="text-slate-400 text-xs bg-slate-900/40 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                  {event.notes}
                </p>
              )}

              {/* Footer Audit Info */}
              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Recorded by: {event.recordedBy?.displayName || 'User'}</span>

                {canManage && event.confirmationStatus === 'UNCONFIRMED' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleAcknowledge(event._id, 'CONFIRMED')}
                      className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleAcknowledge(event._id, 'DISPUTED')}
                      className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition cursor-pointer"
                    >
                      Dispute
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CustodyEventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shipmentId={shipmentId}
        shipment={shipment}
        onSuccess={fetchCustodyEvents}
      />
    </div>
  );
}
