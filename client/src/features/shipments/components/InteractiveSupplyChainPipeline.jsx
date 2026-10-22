import React, { useState, useEffect } from 'react';
import {
  MapPin,
  ArrowRight,
  ArrowRightLeft,
  ClipboardCheck,
  AlertOctagon,
  ShieldAlert,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  Truck,
  Plus
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient.js';

export function InteractiveSupplyChainPipeline({
  shipment,
  activeTab,
  onSelectTab,
  onQuickAction
}) {
  const [pipelineData, setPipelineData] = useState({
    custodyCount: 0,
    custodyConfirmed: 0,
    inspectionsCount: 0,
    hasInspectionDamage: false,
    incidentsCount: 0,
    activeIncidentsCount: 0,
    anomaliesCount: 0,
    loading: true
  });

  const shipmentId = shipment?._id || shipment?.id;

  useEffect(() => {
    if (!shipmentId) return;

    let isMounted = true;

    async function loadPipelineMetrics() {
      try {
        const [custodyRes, inspRes, incRes, anomRes] = await Promise.allSettled([
          apiClient.get(`/shipments/${shipmentId}/custody-events`),
          apiClient.get(`/shipments/${shipmentId}/inspections`),
          apiClient.get(`/shipments/${shipmentId}/incidents`),
          apiClient.get(`/shipments/${shipmentId}/anomalies`)
        ]);

        if (!isMounted) return;

        const custEvents = custodyRes.status === 'fulfilled' ? custodyRes.value?.custodyEvents || [] : [];
        const inspections = inspRes.status === 'fulfilled' ? inspRes.value?.inspections || [] : [];
        const incidents = incRes.status === 'fulfilled' ? incRes.value?.incidents || [] : [];
        const anomalies = anomRes.status === 'fulfilled' ? anomRes.value?.anomalies || [] : [];

        const confirmedCustody = custEvents.filter(e => e.confirmationStatus === 'CONFIRMED').length;
        const hasDamage = inspections.some(i => i.visibleDamage || i.overallCondition === 'MAJOR_DAMAGE' || i.overallCondition === 'MINOR_DAMAGE');
        const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED').length;

        setPipelineData({
          custodyCount: custEvents.length,
          custodyConfirmed: confirmedCustody,
          inspectionsCount: inspections.length,
          hasInspectionDamage: hasDamage,
          incidentsCount: incidents.length,
          activeIncidentsCount: activeIncidents,
          anomaliesCount: anomalies.length,
          loading: false
        });
      } catch (err) {
        console.error('Failed to load pipeline metrics:', err);
        if (isMounted) {
          setPipelineData(prev => ({ ...prev, loading: false }));
        }
      }
    }

    loadPipelineMetrics();

    return () => {
      isMounted = false;
    };
  }, [shipmentId]);

  const stages = [
    {
      id: 'overview',
      tabId: 'overview',
      label: '1. Route & Origin',
      sublabel: `${shipment.origin || 'Origin'} → ${shipment.destination || 'Destination'}`,
      icon: MapPin,
      status: shipment.status || 'CREATED',
      badgeColor: 'border-blue-500/40 bg-blue-950/60 text-blue-300',
      badgeText: shipment.carrier || 'Logistics Origin',
      isCompleted: true
    },
    {
      id: 'custody',
      tabId: 'custody',
      label: '2. Custody Chain',
      sublabel: pipelineData.custodyCount === 0
        ? 'No handovers logged'
        : `${pipelineData.custodyCount} recorded (${pipelineData.custodyConfirmed} verified)`,
      icon: ArrowRightLeft,
      badgeColor: pipelineData.custodyCount > 0
        ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
        : 'border-slate-700 bg-slate-900 text-slate-400',
      badgeText: pipelineData.custodyCount > 0 ? `${pipelineData.custodyCount} Handovers` : 'Pending',
      isCompleted: pipelineData.custodyCount > 0,
      hasWarning: pipelineData.custodyCount > 0 && pipelineData.custodyConfirmed < pipelineData.custodyCount
    },
    {
      id: 'inspections',
      tabId: 'inspections',
      label: '3. Cargo Inspection',
      sublabel: pipelineData.inspectionsCount === 0
        ? 'No checks recorded'
        : `${pipelineData.inspectionsCount} checks ${pipelineData.hasInspectionDamage ? '• Damage Found' : '• Passed'}`,
      icon: ClipboardCheck,
      badgeColor: pipelineData.hasInspectionDamage
        ? 'border-amber-500/50 bg-amber-950/60 text-amber-300'
        : pipelineData.inspectionsCount > 0
        ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
        : 'border-slate-700 bg-slate-900 text-slate-400',
      badgeText: pipelineData.hasInspectionDamage ? 'Damage Flagged' : pipelineData.inspectionsCount > 0 ? 'Verified Good' : 'Pending',
      isCompleted: pipelineData.inspectionsCount > 0,
      hasWarning: pipelineData.hasInspectionDamage
    },
    {
      id: 'incidents',
      tabId: 'incidents',
      label: '4. Exceptions / Incidents',
      sublabel: pipelineData.incidentsCount === 0
        ? '0 exceptions reported'
        : `${pipelineData.incidentsCount} logged (${pipelineData.activeIncidentsCount} active)`,
      icon: AlertOctagon,
      badgeColor: pipelineData.activeIncidentsCount > 0
        ? 'border-rose-500/50 bg-rose-950/60 text-rose-300'
        : pipelineData.incidentsCount > 0
        ? 'border-amber-500/40 bg-amber-950/60 text-amber-300'
        : 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300',
      badgeText: pipelineData.activeIncidentsCount > 0 ? `${pipelineData.activeIncidentsCount} Active Alert` : 'All Clear',
      isCompleted: true,
      hasWarning: pipelineData.activeIncidentsCount > 0
    },
    {
      id: 'audit',
      tabId: 'anomalies',
      label: '5. Audit & AI Analysis',
      sublabel: pipelineData.anomaliesCount === 0
        ? 'No sequence gaps'
        : `${pipelineData.anomaliesCount} gaps detected`,
      icon: Brain,
      badgeColor: pipelineData.anomaliesCount > 0
        ? 'border-amber-500/50 bg-amber-950/60 text-amber-300'
        : 'border-purple-500/40 bg-purple-950/60 text-purple-300',
      badgeText: pipelineData.anomaliesCount > 0 ? `${pipelineData.anomaliesCount} Anomaly Flags` : 'Audit Ready',
      isCompleted: true,
      hasWarning: pipelineData.anomaliesCount > 0
    }
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-semibold text-white tracking-tight uppercase font-mono">
            Connected Supply Chain Pipeline
          </span>
          <span className="text-[11px] text-slate-400 font-sans hidden md:inline">
            • Interactive work chain connecting custody, physical condition, and investigation
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span>Click any stage to navigate</span>
        </div>
      </div>

      {/* Visual Workflow Pipeline Track */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = activeTab === stage.tabId;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectTab(stage.tabId)}
              className={`text-left p-3 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between ${
                isActive
                  ? 'bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-950/50 ring-1 ring-blue-500/30'
                  : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Top Step + Icon */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-1.5 rounded-md ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : stage.hasWarning
                      ? 'bg-rose-950 text-rose-400 border border-rose-900/60'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-medium ${stage.badgeColor}`}
                >
                  {stage.badgeText}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                  {stage.label}
                </span>
                <span className="block text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                  {stage.sublabel}
                </span>
              </div>

              {/* Bottom active pill or arrow */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                <span className={isActive ? 'text-blue-400 font-bold' : 'text-slate-500 group-hover:text-slate-300'}>
                  {isActive ? 'Current View' : 'Inspect Details'}
                </span>
                <ChevronRight className={`h-3 w-3 ${isActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
