import React, { useState } from 'react';
import {
  X,
  Package,
  MapPin,
  ArrowRight,
  Truck,
  Calendar,
  Clock,
  Edit2,
  FileText,
  ArrowRightLeft,
  ClipboardCheck,
  AlertOctagon,
  UploadCloud,
  FileSearch,
  ShieldAlert,
  Brain,
  Sparkles,
  GitFork
} from 'lucide-react';
import { ShipmentStatusBadge } from './ShipmentStatusBadge.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { CustodyTimeline } from '../../custody/CustodyTimeline.jsx';
import { InspectionList } from '../../inspections/InspectionList.jsx';
import { IncidentList } from '../../incidents/IncidentList.jsx';
import { EvidenceGallery } from '../../evidence/EvidenceGallery.jsx';
import { InvestigationTimeline } from '../../investigation/InvestigationTimeline.jsx';
import { AnomaliesAndGapsView } from '../../investigation/AnomaliesAndGapsView.jsx';
import { AICaseAnalysisView } from '../../investigation/AICaseAnalysisView.jsx';
import { InvestigationWorkspace } from '../../investigation/InvestigationWorkspace.jsx';
import { BreadcrumbNav } from '../../../components/navigation/BreadcrumbNav.jsx';
import { InteractiveSupplyChainPipeline } from './InteractiveSupplyChainPipeline.jsx';

export function ShipmentDetailModal({ isOpen, onClose, shipment, onEdit }) {
  const { permissions, role } = useAuth();
  const canEdit = permissions.includes('shipment:update');
  const [activeDetailTab, setActiveDetailTab] = useState('overview'); // 'overview' | 'custody' | 'inspections' | 'incidents' | 'evidence' | 'timeline' | 'anomalies'
  const [pendingIncidentData, setPendingIncidentData] = useState(null);

  if (!isOpen || !shipment) return null;

  const shipmentId = shipment._id || shipment.id;

  const handleEscalateToIncident = (data) => {
    setPendingIncidentData(data);
    setActiveDetailTab('incidents');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-900">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-mono">{shipment.shipmentReference}</h3>
                <ShipmentStatusBadge status={shipment.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{shipment.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(shipment);
                }}
                className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm font-medium transition cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation Bar */}
        <div className="bg-slate-900/90 px-6 py-2 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
          <BreadcrumbNav
            items={[
              { label: 'Shipments', onClick: onClose },
              { label: shipment.shipmentReference, isCode: true },
              {
                label: {
                  overview: 'Overview',
                  custody: 'Chain of Custody',
                  inspections: 'Condition Inspections',
                  incidents: 'Damage Incidents',
                  evidence: 'Evidence Vault',
                  timeline: 'Investigation Timeline',
                  anomalies: 'Anomalies & Gaps',
                  'ai-analysis': 'AI Case Audit'
                }[activeDetailTab] || activeDetailTab
              }
            ]}
            onBack={onClose}
            backLabel="Back to Shipments"
          />

          {/* Quick Role Actions Callout */}
          {role === 'driver' && (
            <div className="flex items-center space-x-2 text-[11px] font-sans">
              <span className="text-slate-400">Driver Actions:</span>
              <button
                type="button"
                onClick={() => setActiveDetailTab('custody')}
                className="px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/40 hover:bg-blue-600 hover:text-white transition cursor-pointer"
              >
                + Record Handover
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('inspections')}
                className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition cursor-pointer"
              >
                + Log Inspection
              </button>
            </div>
          )}

          {role === 'investigator' && (
            <div className="flex items-center space-x-2 text-[11px] font-sans">
              <span className="text-slate-400">Investigator Actions:</span>
              <button
                type="button"
                onClick={() => setActiveDetailTab('incidents')}
                className="px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition cursor-pointer"
              >
                + Report Incident
              </button>
              <button
                type="button"
                onClick={() => setActiveDetailTab('ai-analysis')}
                className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition cursor-pointer"
              >
                Run AI Audit
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950 px-6 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveDetailTab('overview')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('custody')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'custody'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span>Custody</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('inspections')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'inspections'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>Inspections</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('incidents')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'incidents'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>Incidents</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('evidence')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'evidence'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Evidence</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('timeline')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'timeline'
                ? 'border-blue-400 text-blue-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Timeline</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('anomalies')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'anomalies'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Anomalies & Gaps</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('workspace')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'workspace'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="h-3.5 w-3.5 text-indigo-400" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveDetailTab('ai-analysis')}
            className={`py-3 px-3 border-b-2 font-medium transition cursor-pointer flex items-center space-x-1.5 ${
              activeDetailTab === 'ai-analysis'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="h-3.5 w-3.5 text-purple-400" />
            <span>AI Case Analysis</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Interactive Visual Supply Chain Pipeline */}
          <InteractiveSupplyChainPipeline
            shipment={shipment}
            activeTab={activeDetailTab}
            onSelectTab={setActiveDetailTab}
          />

          {activeDetailTab === 'overview' && (
            <>
              {/* Route Section */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[11px] font-mono text-slate-500 uppercase block mb-2">Transport Route</span>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">ORIGIN</span>
                      <span className="text-slate-200 font-semibold">{shipment.origin}</span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center space-x-2 text-slate-600">
                    <div className="h-px w-16 bg-slate-800"></div>
                    <ArrowRight className="h-4 w-4 text-blue-400" />
                    <div className="h-px w-16 bg-slate-800"></div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <MapPin className="h-4 w-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-[10px] block">DESTINATION</span>
                      <span className="text-slate-200 font-semibold">{shipment.destination}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1 flex items-center">
                    <Truck className="h-3 w-3 mr-1 text-slate-400" /> CARRIER
                  </span>
                  <span className="text-slate-200 font-medium">{shipment.carrier || 'Not specified'}</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1">TRACKING REFERENCE / BOL</span>
                  <span className="text-slate-200 font-medium">{shipment.trackingReference || 'N/A'}</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1 flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-slate-400" /> EXPECTED ARRIVAL
                  </span>
                  <span className="text-slate-200 font-medium">
                    {shipment.expectedArrival ? new Date(shipment.expectedArrival).toLocaleDateString() : 'Unscheduled'}
                  </span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-slate-400" /> RECORDED TIMESTAMP
                  </span>
                  <span className="text-slate-200 font-medium">
                    {new Date(shipment.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Operational Notes */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Operational Notes
                </span>
                <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-slate-300 leading-relaxed min-h-[60px]">
                  {shipment.notes || 'No special handling notes registered for this shipment.'}
                </div>
              </div>

              {/* Provenance & Audit Info */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-mono text-slate-400">
                <div>
                  <span className="text-slate-500 block">Created By:</span>
                  <span className="text-slate-300">
                    {shipment.createdBy?.displayName || 'System'} ({shipment.createdBy?.email || 'N/A'})
                  </span>
                </div>
                {shipment.updatedBy && (
                  <div>
                    <span className="text-slate-500 block">Last Modified By:</span>
                    <span className="text-slate-300">
                      {shipment.updatedBy?.displayName} ({shipment.updatedBy?.email})
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {activeDetailTab === 'custody' && <CustodyTimeline shipmentId={shipmentId} shipment={shipment} />}

          {activeDetailTab === 'inspections' && (
            <InspectionList
              shipmentId={shipmentId}
              shipment={shipment}
              onEscalateToIncident={handleEscalateToIncident}
            />
          )}

          {activeDetailTab === 'incidents' && (
            <IncidentList
              shipmentId={shipmentId}
              shipment={shipment}
              initialData={pendingIncidentData}
            />
          )}

          {activeDetailTab === 'evidence' && <EvidenceGallery shipmentId={shipmentId} />}

          {activeDetailTab === 'timeline' && <InvestigationTimeline shipmentId={shipmentId} />}

          {activeDetailTab === 'anomalies' && <AnomaliesAndGapsView shipmentId={shipmentId} />}

          {activeDetailTab === 'workspace' && <InvestigationWorkspace shipmentId={shipmentId} shipment={shipment} />}

          {activeDetailTab === 'ai-analysis' && <AICaseAnalysisView shipmentId={shipmentId} />}
        </div>


        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Tenant: {shipment.organization?.name || 'Verified Tenant'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
