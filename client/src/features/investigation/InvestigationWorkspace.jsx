import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Package,
  Clock,
  ShieldAlert,
  GitFork,
  Split,
  Download,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  UploadCloud,
  ClipboardCheck,
  ArrowRight,
  MapPin,
  FileSearch,
  UserCheck,
  AlertCircle,
  HelpCircle,
  Info,
  Link2,
  Edit3,
  Trash2
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ConnectedRelationshipsPanel } from '../../components/investigation/ConnectedRelationshipsPanel.jsx';
import { RecordLinkerModal } from '../../components/investigation/RecordLinkerModal.jsx';
import { AICaseAnalysisView } from './AICaseAnalysisView.jsx';
import { AnomaliesAndGapsView } from './AnomaliesAndGapsView.jsx';
import { InvestigationTimeline } from './InvestigationTimeline.jsx';

export function InvestigationWorkspace({ shipmentId, shipment }) {
  const { permissions } = useAuth();
  const canEdit = permissions.includes('shipment:update');

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'graph' | 'evidence-comparison' | 'anomalies' | 'ai-audit'
  const [graphData, setGraphData] = useState(null);
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [selectedGraphNode, setSelectedGraphNode] = useState(null);
  const [selectedGraphEdge, setSelectedGraphEdge] = useState(null);

  // Evidence comparison data
  const [inspections, setInspections] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Linker Modal
  const [linkerSource, setLinkerSource] = useState(null);
  const [editingGraphEdge, setEditingGraphEdge] = useState(null);

  const handleDeleteGraphEdge = async (edgeId) => {
    if (!window.confirm('Are you sure you want to remove this investigation relationship link?')) return;
    try {
      await apiClient.delete(`/shipments/${shipmentId}/relationships/${edgeId}`);
      fetchGraph();
    } catch (err) {
      alert(err.message || 'Failed to delete relationship link.');
    }
  };

  const fetchGraph = useCallback(async () => {
    if (!shipmentId) return;
    setLoadingGraph(true);
    try {
      const data = await apiClient.get(`/shipments/${shipmentId}/relationships/graph`);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load investigation graph:', err);
    } finally {
      setLoadingGraph(false);
    }
  }, [shipmentId]);

  const fetchComparisonData = useCallback(async () => {
    if (!shipmentId) return;
    setLoadingComparison(true);
    try {
      const [inspRes, evRes] = await Promise.all([
        apiClient.get(`/shipments/${shipmentId}/inspections`).catch(() => ({ inspections: [] })),
        apiClient.get(`/shipments/${shipmentId}/evidence`).catch(() => ({ evidence: [] }))
      ]);
      setInspections(Array.isArray(inspRes) ? inspRes : (inspRes.inspections || []));
      setEvidenceList(Array.isArray(evRes) ? evRes : (evRes.evidence || []));
    } catch (err) {
      console.error('Failed to load comparison records:', err);
    } finally {
      setLoadingComparison(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchGraph();
    fetchComparisonData();
  }, [fetchGraph, fetchComparisonData]);

  const originInsp = inspections.find((i) => i.inspectionType === 'ORIGIN');
  const destInsp = inspections.find((i) => i.inspectionType === 'DESTINATION');

  const getNodeColor = (type) => {
    switch (type) {
      case 'shipment':
        return { bg: 'bg-blue-950', border: 'border-blue-600', text: 'text-blue-300', fill: '#1d4ed8' };
      case 'custody':
        return { bg: 'bg-indigo-950', border: 'border-indigo-600', text: 'text-indigo-300', fill: '#4338ca' };
      case 'inspection':
        return { bg: 'bg-purple-950', border: 'border-purple-600', text: 'text-purple-300', fill: '#6d28d9' };
      case 'incident':
        return { bg: 'bg-rose-950', border: 'border-rose-600', text: 'text-rose-300', fill: '#be123c' };
      case 'evidence':
        return { bg: 'bg-emerald-950', border: 'border-emerald-600', text: 'text-emerald-300', fill: '#047857' };
      case 'report':
        return { bg: 'bg-amber-950', border: 'border-amber-600', text: 'text-amber-300', fill: '#b45309' };
      default:
        return { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-slate-300', fill: '#334155' };
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Workspace Navigation Bar */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2 font-mono text-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Package },
            { id: 'timeline', label: 'Unified Timeline', icon: Clock },
            { id: 'graph', label: 'Relationship Graph', icon: GitFork },
            { id: 'evidence-comparison', label: 'Origin vs Dest Comparison', icon: Split },
            { id: 'anomalies', label: 'Anomalies & Gaps', icon: ShieldAlert },
            { id: 'ai-audit', label: 'AI Case Audit & Report', icon: Brain }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 rounded-lg flex items-center space-x-1.5 transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            fetchGraph();
            fetchComparisonData();
          }}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          title="Refresh workspace"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono">
            <div
              onClick={() => setActiveTab('timeline')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-[10px] text-slate-500 block uppercase">CUSTODY EVENTS</span>
              <span className="text-xl font-bold text-blue-400 mt-1 block">
                {graphData?.nodes?.filter((n) => n.type === 'custody').length || 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Handovers logged</span>
            </div>

            <div
              onClick={() => setActiveTab('evidence-comparison')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-[10px] text-slate-500 block uppercase">INSPECTIONS</span>
              <span className="text-xl font-bold text-purple-400 mt-1 block">
                {inspections.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Origin/Dest checks</span>
            </div>

            <div
              onClick={() => setActiveTab('overview')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-[10px] text-slate-500 block uppercase">INCIDENTS</span>
              <span className="text-xl font-bold text-rose-400 mt-1 block">
                {graphData?.nodes?.filter((n) => n.type === 'incident').length || 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Exceptions reported</span>
            </div>

            <div
              onClick={() => setActiveTab('evidence-comparison')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-[10px] text-slate-500 block uppercase">EVIDENCE FILES</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {evidenceList.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">SHA-256 verified</span>
            </div>

            <div
              onClick={() => setActiveTab('anomalies')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-[10px] text-slate-500 block uppercase">OPEN ANOMALIES</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">
                {graphData?.nodes?.filter((n) => n.type === 'anomaly').length || 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Checklist gaps</span>
            </div>

            <div
              onClick={() => setActiveTab('graph')}
              className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition"
            >
              <span className="text-[10px] text-slate-500 block uppercase">RELATIONSHIPS</span>
              <span className="text-xl font-bold text-indigo-400 mt-1 block">
                {graphData?.edges?.length || 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">Persistent links</span>
            </div>
          </div>

          {/* Tri-Pane Categorization: Facts vs Observations vs Hypotheses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Verified Facts */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-emerald-400 font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <h4 className="text-xs uppercase">1. Verified Database Facts</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Objective data backed by verified SHA-256 integrity hashes and immutable database timestamps.
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-emerald-300 font-bold block">SHA-256 Digest Match</span>
                  <span className="text-slate-400 block text-[10px] truncate">
                    {evidenceList.length > 0 ? evidenceList[0].sha256 : 'No file hashes'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-emerald-300 font-bold block">Recorded Handovers</span>
                  <span className="text-slate-400 block text-[10px]">
                    {graphData?.nodes?.filter((n) => n.type === 'custody').length || 0} custody transfers signed in database
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Recorded Observations */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-purple-400 font-bold">
                <ClipboardCheck className="h-4 w-4" />
                <h4 className="text-xs uppercase">2. Recorded Observations</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Human-entered inspection notes, seal condition checks, and incident observations.
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-purple-300 font-bold block">Origin Packaging</span>
                  <span className="text-slate-400 block text-[10px]">
                    {originInsp ? `Condition: ${originInsp.overallCondition} | Seal: ${originInsp.sealCondition}` : 'No origin check'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-purple-300 font-bold block">Destination Condition</span>
                  <span className="text-slate-400 block text-[10px]">
                    {destInsp ? `Condition: ${destInsp.overallCondition} | Seal: ${destInsp.sealCondition}` : 'No destination check'}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 3: Hypotheses & Inferences */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-amber-400 font-bold">
                <HelpCircle className="h-4 w-4" />
                <h4 className="text-xs uppercase">3. Investigator Hypotheses</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Qualitative indicators, root-cause intervals, and non-probabilistic AI risk assessments.
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-amber-300 font-bold block">Attribution & Responsibility</span>
                  <span className="text-slate-400 block text-[10px]">
                    Responsibility Undetermined until evidence narrows transit interval
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <span className="text-amber-300 font-bold block">Qualitative AI Risk Level</span>
                  <span className="text-slate-400 block text-[10px]">
                    Derived from deterministic rule gaps & evidence links
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIFIED TIMELINE */}
      {activeTab === 'timeline' && <InvestigationTimeline shipmentId={shipmentId} />}

      {/* TAB 3: RELATIONSHIP GRAPH */}
      {activeTab === 'graph' && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center">
                <GitFork className="h-4 w-4 mr-1.5 text-indigo-400" /> Interactive Investigation Relationship Graph
              </h3>
              <p className="text-slate-400 text-[11px] font-sans">
                Visual node-edge topology representing persisted database linkages across custody events, inspections, damage incidents, and evidence photos.
              </p>
            </div>

            {canEdit && (
              <button
                onClick={() => setLinkerSource({ type: 'shipment', id: shipmentId, title: shipment?.shipmentReference })}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Edge / Link Record</span>
              </button>
            )}
          </div>

          {loadingGraph ? (
            <div className="p-12 text-center text-slate-500">Loading graph topology...</div>
          ) : !graphData || graphData.nodes.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No nodes in relationship graph</div>
          ) : (
            <div className="space-y-4">
              {/* Interactive SVG / Node Canvas Representation */}
              <div className="p-6 bg-slate-900/90 rounded-xl border border-slate-800 min-h-[360px] flex flex-wrap items-center justify-center gap-4">
                {graphData.nodes.map((node) => {
                  const style = getNodeColor(node.type);
                  const isSelected = selectedGraphNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        setSelectedGraphNode(node);
                        setSelectedGraphEdge(null);
                      }}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition max-w-xs w-full shadow-lg ${
                        style.bg
                      } ${style.border} ${isSelected ? 'ring-2 ring-white scale-105' : 'hover:border-slate-500'}`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-1.5">
                        <span className={`font-bold text-[11px] ${style.text}`}>{node.type.toUpperCase()}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-950 text-slate-400 border border-slate-800">
                          {node.status}
                        </span>
                      </div>
                      <span className="font-bold text-white text-xs block">{node.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-1 truncate">{node.details}</span>
                    </div>
                  );
                })}
              </div>

              {/* Connected Relationships Details List */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">Persisted Graph Edges ({graphData.edges.length}):</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  {graphData.edges.map((edge) => (
                    <div
                      key={edge.id}
                      onClick={() => setSelectedGraphEdge(edge)}
                      className="p-2.5 bg-slate-950 rounded border border-slate-800 hover:border-indigo-600 cursor-pointer transition space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300 text-[10px]">{edge.relationshipType}</span>
                          <span className="text-slate-500 text-[9px]">{new Date(edge.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-300 font-sans text-[11px]">{edge.explanation}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[9px] text-slate-500">
                        <span>Created by: {edge.createdBy}</span>
                        {canEdit && (
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setEditingGraphEdge(edge)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition cursor-pointer"
                              title="Correct / Edit edge link"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteGraphEdge(edge.id)}
                              className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-900 transition cursor-pointer"
                              title="Delete edge link"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORIGIN VS DESTINATION EVIDENCE COMPARISON */}
      {activeTab === 'evidence-comparison' && (
        <div className="space-y-4 font-mono text-xs">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Split className="h-4 w-4 mr-1.5 text-blue-400" /> Origin vs Destination Cargo Condition Comparison
            </h3>
            <p className="text-slate-400 text-xs font-sans">
              Side-by-side verification of origin baseline inspections against destination receipt condition records and photo evidence artifacts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ORIGIN INSPECTION PANEL */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-emerald-400 text-xs uppercase flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-emerald-400" /> Origin Loading Inspection
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${originInsp?.visibleDamage ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'}`}>
                  {originInsp ? originInsp.overallCondition : 'MISSING'}
                </span>
              </div>

              {originInsp ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">LOCATION & DATE:</span>
                    <span className="text-slate-200">{originInsp.location} ({new Date(originInsp.inspectedAt).toLocaleString()})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SEAL CONDITION:</span>
                    <span className="text-emerald-300 font-bold">{originInsp.sealCondition}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">OBSERVATIONS:</span>
                    <p className="text-slate-300 font-sans text-xs">{originInsp.observations || 'None'}</p>
                  </div>

                  {/* Connected Links */}
                  <ConnectedRelationshipsPanel
                    shipmentId={shipmentId}
                    recordType="inspection"
                    recordId={originInsp._id}
                    recordTitle={`Origin Inspection (${originInsp.location})`}
                  />
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-900/50 rounded-lg">
                  No baseline origin loading inspection recorded.
                </div>
              )}
            </div>

            {/* DESTINATION INSPECTION PANEL */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-rose-400 text-xs uppercase flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-rose-400" /> Destination Receipt Inspection
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${destInsp?.visibleDamage ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'}`}>
                  {destInsp ? destInsp.overallCondition : 'MISSING'}
                </span>
              </div>

              {destInsp ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">LOCATION & DATE:</span>
                    <span className="text-slate-200">{destInsp.location} ({new Date(destInsp.inspectedAt).toLocaleString()})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SEAL CONDITION:</span>
                    <span className="text-rose-400 font-bold">{destInsp.sealCondition}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">DAMAGE OBSERVATIONS:</span>
                    <p className="text-slate-300 font-sans text-xs">{destInsp.damageDescription || destInsp.observations || 'None'}</p>
                  </div>

                  {/* Connected Links */}
                  <ConnectedRelationshipsPanel
                    shipmentId={shipmentId}
                    recordType="inspection"
                    recordId={destInsp._id}
                    recordTitle={`Destination Inspection (${destInsp.location})`}
                  />
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-slate-900/50 rounded-lg">
                  No final destination receipt inspection recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ANOMALIES & GAPS */}
      {activeTab === 'anomalies' && <AnomaliesAndGapsView shipmentId={shipmentId} />}

      {/* TAB 6: AI CASE AUDIT & REPORT */}
      {activeTab === 'ai-audit' && <AICaseAnalysisView shipmentId={shipmentId} />}

      {/* Record Linker Modal */}
      {linkerSource && (
        <RecordLinkerModal
          isOpen={true}
          onClose={() => setLinkerSource(null)}
          shipmentId={shipmentId}
          sourceType={linkerSource.type}
          sourceId={linkerSource.id}
          sourceTitle={linkerSource.title}
          onSuccess={() => {
            fetchGraph();
            fetchComparisonData();
          }}
        />
      )}

      {/* Record Linker Modal for Editing Existing Graph Edge */}
      {editingGraphEdge && (
        <RecordLinkerModal
          isOpen={true}
          onClose={() => setEditingGraphEdge(null)}
          shipmentId={shipmentId}
          initialRelationship={{
            _id: editingGraphEdge.id,
            sourceType: editingGraphEdge.sourceType,
            sourceId: editingGraphEdge.sourceId,
            targetType: editingGraphEdge.targetType,
            targetId: editingGraphEdge.targetId,
            relationshipType: editingGraphEdge.relationshipType,
            explanation: editingGraphEdge.explanation
          }}
          onSuccess={() => {
            fetchGraph();
            fetchComparisonData();
          }}
        />
      )}
    </div>
  );
}
