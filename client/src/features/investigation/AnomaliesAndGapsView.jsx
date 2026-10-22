import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  FileSearch,
  ShieldAlert,
  MessageSquare,
  X
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function AnomaliesAndGapsView({ shipmentId }) {
  const { permissions } = useAuth();
  const canReview = permissions.includes('investigation:run');

  const [anomaliesData, setAnomaliesData] = useState(null);
  const [gapsData, setGapsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Modal state
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('ACKNOWLEDGED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [anomRes, gapsRes] = await Promise.all([
        apiClient.get(`/shipments/${shipmentId}/investigation/anomalies`),
        apiClient.get(`/shipments/${shipmentId}/investigation/gaps`)
      ]);
      setAnomaliesData(anomRes);
      setGapsData(gapsRes);
    } catch (err) {
      setError(err.message || 'Failed to load investigation diagnostics');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const handleOpenReviewModal = (finding, type) => {
    setSelectedFinding({ ...finding, findingType: type });
    setReviewStatus(finding.reviewStatus !== 'OPEN' ? finding.reviewStatus : 'ACKNOWLEDGED');
    setReviewNotes(finding.reviewNotes || '');
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!selectedFinding) return;

    setSubmittingReview(true);
    try {
      await apiClient.post(`/shipments/${shipmentId}/investigation/review`, {
        findingId: selectedFinding.findingId,
        findingType: selectedFinding.findingType,
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || null
      });

      setSelectedFinding(null);
      fetchDiagnostics();
    } catch (err) {
      alert(err.message || 'Failed to save review decision');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'LOW':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getReviewStatusBadge = (status) => {
    switch (status) {
      case 'ADDRESSED':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'ACKNOWLEDGED':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'NOT_APPLICABLE':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Deterministic Anomaly & Evidence Gap Analysis</h3>
          <p className="text-xs text-slate-400">
            Explainable, rule-based diagnostic evaluation of custody continuity, condition records, and evidence completeness
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
          title="Refresh diagnostics"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Counter Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-500 block">TOTAL DETECTED ANOMALIES</span>
          <span className="text-xl font-bold text-slate-100 mt-1 block">
            {anomaliesData ? anomaliesData.totalAnomalies : '—'}
          </span>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center space-x-2">
            <span className="text-rose-400 font-bold">{anomaliesData?.bySeverity?.HIGH || 0} HIGH</span>
            <span>·</span>
            <span className="text-amber-400 font-bold">{anomaliesData?.bySeverity?.MEDIUM || 0} MED</span>
            <span>·</span>
            <span className="text-blue-400 font-bold">{anomaliesData?.bySeverity?.LOW || 0} LOW</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-500 block">OPEN EVIDENCE GAPS</span>
          <span className="text-xl font-bold text-amber-400 mt-1 block">
            {gapsData ? gapsData.openGaps : '—'}
          </span>
          <span className="text-[10px] text-slate-500 mt-2 block">
            Of {gapsData ? gapsData.totalGaps : 0} total identified checklist requirements
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-500 block">DIAGNOSTIC RULE ENGINE</span>
          <span className="text-xs font-semibold text-emerald-400 mt-1.5 block">100% Deterministic</span>
          <span className="text-[10px] text-slate-500 mt-2 block">Source-grounded & explainable checks</span>
        </div>
      </div>

      {/* Section 1: Detected Operational Anomalies */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center">
          <ShieldAlert className="h-4 w-4 mr-1.5 text-rose-400" /> Detected Operational Anomalies
        </h4>

        {loading ? (
          <div className="p-6 text-center text-slate-500 font-mono">Running anomaly detection rules...</div>
        ) : !anomaliesData || anomaliesData.anomalies.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/60 border border-slate-800 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-slate-300 font-medium">No Operational Anomalies Detected</p>
            <p className="text-slate-500 text-[11px]">Recorded custody, inspection, and incident timelines pass all deterministic checks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomaliesData.anomalies.map((anom) => (
              <div key={anom.findingId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(anom.severity)}`}>
                      {anom.severity}
                    </span>
                    <span className="font-bold text-slate-200 text-xs">{anom.title}</span>
                    <span className="text-slate-500 text-[10px] font-mono">[{anom.ruleCode}]</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getReviewStatusBadge(anom.reviewStatus)}`}>
                      {anom.reviewStatus}
                    </span>
                    {canReview && (
                      <button
                        onClick={() => handleOpenReviewModal(anom, 'ANOMALY')}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 font-mono text-[10px] transition cursor-pointer"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-300 font-sans text-xs leading-relaxed">{anom.summary}</p>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Why It Matters:</span>{' '}
                    <span className="text-slate-300">{anom.whyItMatters}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Recommended Follow-up:</span>{' '}
                    <span className="text-blue-300">{anom.recommendedAction}</span>
                  </div>
                </div>

                {anom.reviewNotes && (
                  <div className="p-2 bg-purple-950/40 border border-purple-900/60 rounded text-[11px] font-mono text-purple-300 flex items-start space-x-1.5">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-400" />
                    <span>Investigator Review Note: {anom.reviewNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Evidence Gap Analysis */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center">
          <FileSearch className="h-4 w-4 mr-1.5 text-amber-400" /> Evidence Completeness & Gaps
        </h4>

        {loading ? (
          <div className="p-6 text-center text-slate-500 font-mono">Analyzing evidence completeness...</div>
        ) : !gapsData || gapsData.evidenceGaps.length === 0 ? (
          <div className="p-6 text-center bg-slate-950/60 border border-slate-800 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            <p className="text-slate-300 font-medium">All Evidence Checkpoints Satisfied</p>
            <p className="text-slate-500 text-[11px]">No missing condition inspections or unlinked incidents identified.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gapsData.evidenceGaps.map((gap) => (
              <div key={gap.findingId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(gap.severity)}`}>
                      {gap.severity}
                    </span>
                    <span className="font-bold text-slate-200 text-xs">{gap.title}</span>
                    <span className="text-slate-500 text-[10px] font-mono">[{gap.ruleCode}]</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getReviewStatusBadge(gap.reviewStatus)}`}>
                      {gap.reviewStatus}
                    </span>
                    {canReview && (
                      <button
                        onClick={() => handleOpenReviewModal(gap, 'EVIDENCE_GAP')}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 font-mono text-[10px] transition cursor-pointer"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-300 font-sans text-xs leading-relaxed">{gap.summary}</p>

                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Why It Matters:</span>{' '}
                    <span className="text-slate-300">{gap.whyItMatters}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Recommended Action:</span>{' '}
                    <span className="text-emerald-300">{gap.recommendedAction}</span>
                  </div>
                </div>

                {gap.reviewNotes && (
                  <div className="p-2 bg-purple-950/40 border border-purple-900/60 rounded text-[11px] font-mono text-purple-300 flex items-start space-x-1.5">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-400" />
                    <span>Investigator Review Note: {gap.reviewNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FileSearch className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Record Investigation Review</h3>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
              <span className="text-purple-300 font-bold block">{selectedFinding.title}</span>
              <p className="text-slate-400 font-sans text-xs">{selectedFinding.summary}</p>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Review Decision Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ACKNOWLEDGED">ACKNOWLEDGED — Acknowledged by investigator</option>
                  <option value="ADDRESSED">ADDRESSED — Requirement satisfied or explained</option>
                  <option value="NOT_APPLICABLE">NOT_APPLICABLE — Exception not relevant to route</option>
                  <option value="OPEN">OPEN — Unresolved finding</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Review Notes / Oversight Explanation</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Record verification notes, waybill numbers, or justification..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedFinding(null)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
                >
                  {submittingReview ? 'Saving...' : 'Save Review Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
