import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  MapPin,
  Clock,
  User,
  Plus,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  AlertOctagon
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { InspectionFormModal } from './InspectionFormModal.jsx';
import { IncidentFormModal } from '../incidents/IncidentFormModal.jsx';
import { toDateTimeLocalString } from '../../components/forms/SmartDateTimePicker.jsx';

export function InspectionList({ shipmentId, shipment, onEscalateToIncident }) {
  const { permissions } = useAuth();
  const canInspect = permissions.includes('shipment:update');

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escalationData, setEscalationData] = useState(null);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/shipments/${shipmentId}/inspections`);
      setInspections(data.inspections || []);
    } catch (err) {
      setError(err.message || 'Failed to load inspections');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'GOOD':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'MINOR_DAMAGE':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'MAJOR_DAMAGE':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      default:
    }
  };

  const handleEscalate = (insp) => {
    const isMajor = insp.overallCondition === 'MAJOR_DAMAGE';
    const incidentData = {
      escalatedFrom: insp._id,
      title: `Inspection Damage: ${insp.inspectionType} @ ${insp.location}`,
      description: `Escalated from condition inspection on ${new Date(insp.inspectedAt).toLocaleString()}.\nFindings: ${insp.damageDescription || 'Physical damage identified during condition check.'}\nObservations: ${insp.observations || 'N/A'}\nPackaging condition: ${insp.packagingCondition}, Seal condition: ${insp.sealCondition}.`,
      damageType: insp.packagingCondition === 'DAMAGED' || insp.packagingCondition === 'TORN'
        ? 'PACKAGING_DAMAGE'
        : 'PHYSICAL_DAMAGE',
      severity: isMajor ? 'MAJOR' : 'MODERATE',
      location: insp.location || '',
      discoveredAt: toDateTimeLocalString(new Date(insp.inspectedAt)),
      affectedCargo: insp.damageDescription ? `Flagged: ${insp.damageDescription.slice(0, 60)}` : ''
    };

    if (onEscalateToIncident) {
      onEscalateToIncident(incidentData);
    } else {
      setEscalationData(incidentData);
      setIsEscalateModalOpen(true);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Cargo Condition Inspections</h3>
          <p className="text-xs text-slate-400">Physical condition checks, seal integrity, and packaging findings</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInspections}
            disabled={loading}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
            title="Refresh inspections"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {canInspect && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Record Inspection</span>
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
        <div className="p-8 text-center text-slate-500 font-mono">Loading inspections...</div>
      ) : inspections.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-2">
          <ClipboardCheck className="h-6 w-6 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No Inspections Performed Yet</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            Record loading checks, transfer audits, or destination receipt inspections to document physical cargo state.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {inspections.map((insp) => (
            <div key={insp._id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="font-bold text-purple-400 uppercase text-[11px]">{insp.inspectionType}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] border ${getConditionBadge(insp.overallCondition)}`}>
                    OVERALL: {insp.overallCondition}
                  </span>
                </div>

                <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>{new Date(insp.inspectedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">Packaging</span>
                  <span className="text-slate-200 font-semibold">{insp.packagingCondition}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">Seal Status</span>
                  <span className="text-slate-200 font-semibold">{insp.sealCondition}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">Location</span>
                  <span className="text-slate-200 font-semibold truncate block">{insp.location}</span>
                </div>
              </div>

              {insp.visibleDamage && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-900/80 rounded-lg text-rose-300 space-y-1">
                  <span className="font-semibold flex items-center text-[11px]">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-400" /> Visible Damage Reported
                  </span>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed font-mono">{insp.damageDescription}</p>
                </div>
              )}

              {insp.observations && (
                <p className="text-slate-300 text-xs bg-slate-900/40 p-2.5 rounded border border-slate-800/60 leading-relaxed">
                  {insp.observations}
                </p>
              )}

              {(insp.visibleDamage || insp.overallCondition === 'MAJOR_DAMAGE' || insp.overallCondition === 'MINOR_DAMAGE' || insp.sealCondition === 'BROKEN_SEAL' || insp.sealCondition === 'TAMPERED') && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-900 bg-rose-950/20 p-2 rounded-lg border border-rose-900/40">
                  <span className="text-[10px] text-rose-300 font-mono flex items-center">
                    <AlertOctagon className="h-3 w-3 mr-1 text-rose-400" /> Damage / breach flagged
                  </span>
                  <button
                    type="button"
                    onClick={() => handleEscalate(insp)}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] flex items-center space-x-1 transition cursor-pointer shadow-xs"
                  >
                    <ArrowUpRight className="h-3 w-3" />
                    <span>1-Click Escalate to Incident</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-900 text-[11px] font-mono text-slate-500 flex justify-between">
                <span>Inspector: {insp.inspectedBy?.displayName || 'Authorized Agent'}</span>
                <span>{new Date(insp.inspectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <InspectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shipmentId={shipmentId}
        shipment={shipment}
        onSuccess={fetchInspections}
      />

      <IncidentFormModal
        isOpen={isEscalateModalOpen}
        onClose={() => {
          setIsEscalateModalOpen(false);
          setEscalationData(null);
        }}
        shipmentId={shipmentId}
        shipment={shipment}
        initialData={escalationData}
        onSuccess={() => {
          setIsEscalateModalOpen(false);
          setEscalationData(null);
          fetchInspections();
        }}
      />
    </div>
  );
}
