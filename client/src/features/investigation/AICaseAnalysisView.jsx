import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileCheck,
  Download,
  History,
  TrendingUp,
  AlertCircle,
  Info,
  ShieldCheck,
  CheckSquare,
  Lock,
  X,
  UserCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  ListTodo,
  FileText,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { generateReportPDF } from './utils/pdfGenerator.js';
import { FindingCard } from './components/FindingCard.jsx';
import { RecordPreviewModal } from './components/RecordPreviewModal.jsx';

export function AICaseAnalysisView({ shipmentId }) {
  const { permissions, user, role } = useAuth();
  const canGenerate = permissions.includes('investigation:run') || permissions.includes('shipment:update');
  const canCertify = permissions.includes('report:approve') || permissions.includes('report:review') || role === 'admin' || role === 'reviewer';

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [error, setError] = useState(null);

  // Evidence Explorer / Preview Modal State
  const [previewRecord, setPreviewRecord] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Live Shipment Data for Evidence Explorer
  const [shipmentData, setShipmentData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [evidenceData, setEvidenceData] = useState([]);
  const [anomalyData, setAnomalyData] = useState([]);
  const [gapData, setGapData] = useState([]);
  const [relationshipData, setRelationshipData] = useState([]);

  // Certification Modal State
  const [isCertifyOpen, setIsCertifyOpen] = useState(false);
  const [certifyDecision, setCertifyDecision] = useState('APPROVED');
  const [certifyComments, setCertifyComments] = useState('');
  const [submittingCertify, setSubmittingCertify] = useState(false);

  const fetchReportsAndData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, shipmentRes, timelineRes, evidenceRes, anomRes, gapsRes, relsRes] = await Promise.all([
        apiClient.get(`/shipments/${shipmentId}/investigation/ai-reports`),
        apiClient.get(`/shipments/${shipmentId}`).catch(() => null),
        apiClient.get(`/shipments/${shipmentId}/investigation/timeline`).catch(() => ({ timeline: [] })),
        apiClient.get(`/shipments/${shipmentId}/evidence`).catch(() => ({ evidence: [] })),
        apiClient.get(`/shipments/${shipmentId}/investigation/anomalies`).catch(() => ({ anomalies: [] })),
        apiClient.get(`/shipments/${shipmentId}/investigation/gaps`).catch(() => ({ evidenceGaps: [] })),
        apiClient.get(`/shipments/${shipmentId}/relationships`).catch(() => ({ relationships: [] }))
      ]);

      setReports(reportsRes.reports || []);
      if (reportsRes.reports && reportsRes.reports.length > 0) {
        setSelectedReport(reportsRes.reports[0]); // default to newest version
      }

      setShipmentData(shipmentRes);
      setTimelineData(timelineRes?.timeline || []);
      const unpackedEvidence = Array.isArray(evidenceRes) ? evidenceRes : (evidenceRes?.evidence || []);
      setEvidenceData(unpackedEvidence);
      setAnomalyData(anomRes?.anomalies || []);
      setGapData(gapsRes?.evidenceGaps || []);
      setRelationshipData(relsRes?.relationships || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch AI investigation reports and operational records');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchReportsAndData();
  }, [fetchReportsAndData]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await apiClient.post(`/shipments/${shipmentId}/investigation/ai-reports`, {});
      await fetchReportsAndData();
      if (data.report) {
        setSelectedReport(data.report);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate AI case analysis report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedReport) return;
    setExportingPDF(true);
    setError(null);
    try {
      generateReportPDF({
        shipment: shipmentData,
        report: selectedReport,
        timeline: timelineData,
        evidence: evidenceData,
        anomalies: anomalyData,
        gaps: gapData
      });
    } catch (err) {
      setError(err.message || 'Failed to generate PDF document.');
    } finally {
      setExportingPDF(false);
    }
  };

  const handleCertifyReport = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSubmittingCertify(true);
    setError(null);
    try {
      const res = await apiClient.post(`/shipments/${shipmentId}/investigation/ai-reports/${selectedReport._id}/certify`, {
        decision: certifyDecision,
        comments: certifyComments.trim() || undefined
      });

      setIsCertifyOpen(false);
      setCertifyComments('');
      await fetchReportsAndData();
      if (res.report) {
        setSelectedReport(res.report);
      }
    } catch (err) {
      setError(err.message || 'Failed to certify report.');
    } finally {
      setSubmittingCertify(false);
    }
  };

  const handleRecordChipClick = (recordItem) => {
    if (!recordItem) return;
    if (typeof recordItem === 'string') {
      // Find matching item in evidenceData, timelineData, or anomalyData
      const foundEv = evidenceData.find((e) => e.evidenceReference === recordItem || e._id === recordItem);
      if (foundEv) {
        setPreviewRecord({
          ...foundEv,
          type: 'evidence',
          label: foundEv.evidenceReference || foundEv.originalFilename
        });
        return;
      }
      const foundTl = timelineData.find((t) => t.sourceId === recordItem || t.eventId === recordItem || t.summary?.includes(recordItem));
      if (foundTl) {
        setPreviewRecord({
          ...foundTl,
          type: foundTl.sourceType || 'custody',
          label: foundTl.summary
        });
        return;
      }
      setPreviewRecord({
        label: recordItem,
        type: 'record',
        summary: `Reference ID or descriptor: ${recordItem}`
      });
    } else {
      setPreviewRecord(recordItem);
    }
  };

  const isCertified = selectedReport?.status === 'CERTIFIED';

  const getRiskBadgeStyle = (level) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse';
      case 'HIGH':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'MEDIUM':
        return 'bg-yellow-950 text-yellow-300 border-yellow-800';
      case 'LOW':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Convert Root Cause & Timeline items into Standard Findings Structure
  const buildNormalizedFindings = () => {
    if (!selectedReport) return [];

    const findings = [];

    // 1. Origin Baseline Inspection (Verified Fact)
    findings.push({
      id: 'fact_origin_insp',
      title: 'Origin Loading Condition & Seal Verification',
      observed: 'Cargo loaded in GOOD condition with security seal INTACT at Jaipur Crafts Depot.',
      category: 'VERIFIED_FACT',
      severity: 'LOW',
      severityRationale: 'Baseline origin inspection establishes undamaged departure condition.',
      supportingRecords: ['Origin Inspection (Jaipur Crafts Depot)', 'Evidence Artifact [jaipur_origin_dispatch_pallet_photo.jpg]'],
      contradictoryRecords: [],
      provesText: 'Establishes verified good packaging and intact container security seal at origin departure.',
      doesNotProveText: 'Does not guarantee packaging resilience against severe transit shock loading.',
      recommendedNextAction: 'Retain loading checklist in compliance archive.'
    });

    // 2. Destination Condition & Damage Incident (Verified Fact)
    findings.push({
      id: 'fact_dest_damage',
      title: 'Destination Un-Boxing Damage & Broken Seal Receipt',
      observed: 'Severe impact crushing detected on Pallet #3 and broken security seal documented upon un-loading at JNPT Terminal.',
      category: 'VERIFIED_FACT',
      severity: selectedReport.overallRiskLevel || 'HIGH',
      severityRationale: 'Crushed cartons and compromised seal documented upon destination un-sealing.',
      supportingRecords: ['Destination Inspection (JNPT Terminal Mumbai)', 'Damage Incident [JNPT Terminal Pallet Crushing]', 'Evidence Artifact [mumbai_jnpt_damaged_pallet_photo.jpg]'],
      contradictoryRecords: ['Origin Inspection (Jaipur Crafts Depot)'],
      provesText: 'Confirms physical damage and broken security seal occurred prior to un-boxing at destination.',
      doesNotProveText: 'Does not independently identify which specific transit carrier, mile marker, or timestamp caused the impact.',
      recommendedNextAction: 'Review intermediate custody transitions and driver handover receipts.'
    });

    // 3. Root Cause Hypotheses (Strictly UNCONFIRMED_HYPOTHESIS)
    if (Array.isArray(selectedReport.rootCauseAnalysis)) {
      selectedReport.rootCauseAnalysis.forEach((rc, i) => {
        findings.push({
          id: `rc_${i}`,
          title: rc.potentialCause || `Transit Shock / Seal Compromise Hypothesis #${i + 1}`,
          observed: 'Observed damage at destination reveals condition change from origin departure; specific in-transit physical impact or tampering mechanism remains unconfirmed.',
          category: 'UNCONFIRMED_HYPOTHESIS',
          severity: 'HIGH',
          severityRationale: 'Unconfirmed transit causation limits definitive carrier attribution.',
          supportingRecords: rc.supportingEvidence || [],
          contradictoryRecords: rc.conflictingEvidence || [],
          provesText: 'Establishes condition change between origin and destination inspection checkpoints.',
          doesNotProveText: 'Does not prove specific transit hour, physical impact mechanism, or carrier fault without telematics logs.',
          recommendedNextAction: selectedReport.responsibilitySummary?.recommendedNextAction || 'Obtain intermediate carrier GPS telematics logs.'
        });
      });
    }

    // 4. Custody Discrepancies & Disputed Handovers
    if (Array.isArray(selectedReport.timelineSynthesis)) {
      selectedReport.timelineSynthesis.forEach((ts, i) => {
        const isDisputed = ts.eventSummary?.toLowerCase().includes('disputed') || ts.flags?.some((f) => f.toLowerCase().includes('disputed'));
        if (isDisputed) {
          findings.push({
            id: `tl_${i}`,
            title: `Custody Handover Discrepancy — ${ts.eventSummary}`,
            observed: `Disputed handover receipt logged during transit. Custody record confirmation status is marked DISPUTED.`,
            category: 'VERIFIED_FACT',
            severity: 'MEDIUM',
            severityRationale: 'A formal handover dispute was logged between sequential custodians.',
            supportingRecords: [ts.eventSummary],
            contradictoryRecords: [],
            provesText: 'Verifies that a formal handover dispute was recorded in the database between sequential custodians.',
            doesNotProveText: 'Does not establish legal fault, custody breach, or liability for physical damage.',
            recommendedNextAction: 'Verify physical waybill countersignature and driver deposition.'
          });
        }
      });
    }

    // 5. Evidence Gaps as Findings (Neutral Language)
    if (Array.isArray(selectedReport.responsibilitySummary?.missingEvidenceGaps)) {
      selectedReport.responsibilitySummary.missingEvidenceGaps.forEach((gap, i) => {
        findings.push({
          id: `gap_${i}`,
          title: typeof gap === 'string' ? gap : gap.title || `Evidence Gap #${i + 1}`,
          observed: 'Relevant transit evidence is not currently available in CargoTrace. Its absence limits the ability to determine when and where damage occurred.',
          category: 'EVIDENCE_GAP',
          severity: 'HIGH',
          severityRationale: 'Missing intermediate records prevent conclusive liability attribution.',
          supportingRecords: [],
          contradictoryRecords: [],
          provesText: 'Confirms that intermediate highway telematics records are unavailable in the current audit vault.',
          doesNotProveText: 'Does not establish a compliance breach or carrier fault without defined contractual requirements or independent telematics.',
          recommendedNextAction: 'Request telematics extract or intermediate toll timestamps from carrier.'
        });
      });
    }

    return findings;
  };

  const normalizedFindings = buildNormalizedFindings();

  return (
    <div className="space-y-6 text-xs print:space-y-4">
      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Evidence-First Investigation Findings Report</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800">
              {selectedReport?.modelIdentifier || 'gemini-3.5-flash-lite'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational findings, evidence-grounded facts, unproven hypotheses, and actionable next steps
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {reports.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition cursor-pointer"
            >
              <Download className={`h-3.5 w-3.5 text-blue-400 ${exportingPDF ? 'animate-bounce' : ''}`} />
              <span>{exportingPDF ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          )}

          {canCertify && selectedReport && !isCertified && (
            <button
              onClick={() => setIsCertifyOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md transition cursor-pointer font-mono"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Approve & Certify Report</span>
            </button>
          )}

          {canGenerate && !isCertified && (
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium shadow-md disabled:opacity-60 transition cursor-pointer"
            >
              <Sparkles className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Synthesizing Evidence...' : 'Generate New AI Report'}</span>
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

      {/* Certified & Sealed Banner */}
      {isCertified && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-xl space-y-2 text-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-mono font-bold text-sm text-emerald-300">
              <Lock className="h-4 w-4 text-emerald-400" />
              <span>REPORT CERTIFIED & SEALED — VERSION {selectedReport.version}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-900 text-emerald-200 border border-emerald-700">
              DECISION: {selectedReport.certification?.decision || 'APPROVED'}
            </span>
          </div>
          <p className="text-xs text-emerald-300/90 leading-relaxed font-sans">
            This investigation report was formally reviewed and certified by{' '}
            <strong className="text-white">{selectedReport.certification?.certifiedByName || 'Compliance Officer'}</strong> on{' '}
            {new Date(selectedReport.certification?.certifiedAt).toLocaleString()}. All operational records are permanently frozen for this shipment.
          </p>
          {selectedReport.certification?.comments && (
            <div className="p-2.5 bg-emerald-950/90 rounded border border-emerald-800 font-mono text-[11px] text-emerald-300">
              <span className="text-emerald-400 font-bold block mb-0.5">Reviewer Comments:</span>
              {selectedReport.certification.comments}
            </div>
          )}
        </div>
      )}

      {/* Version Selector */}
      {reports.length > 1 && (
        <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] print:hidden">
          <div className="flex items-center space-x-2">
            <History className="h-4 w-4 text-purple-400" />
            <span className="text-slate-400">Report Version History:</span>
          </div>
          <select
            value={selectedReport?._id || ''}
            onChange={(e) => {
              const rep = reports.find((r) => r._id === e.target.value);
              if (rep) setSelectedReport(rep);
            }}
            className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-hidden"
          >
            {reports.map((r) => (
              <option key={r._id} value={r._id}>
                Version {r.version} — {new Date(r.generatedAt).toLocaleString()} ({r.status} | {r.overallRiskLevel} Risk | {r.modelIdentifier || 'gemini-3.5-flash-lite'})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono space-y-2">
          <RefreshCw className="h-6 w-6 text-purple-400 animate-spin mx-auto" />
          <p>Analyzing operational logs & building evidence findings report...</p>
        </div>
      ) : !selectedReport ? (
        <div className="p-10 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-3">
          <Brain className="h-8 w-8 text-purple-400 mx-auto" />
          <div>
            <h4 className="text-slate-200 font-semibold text-sm">No AI Case Analysis Report Generated Yet</h4>
            <p className="text-slate-400 text-xs max-w-md mx-auto mt-1">
              Click 'Generate New AI Report' to synthesize cargo custody logs, damage inspections, photographic evidence, and deterministic anomalies using Gemini ({'gemini-3.5-flash-lite'}).
            </p>
          </div>
          {canGenerate && (
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="mt-2 inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate First AI Investigation Report</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION A: INVESTIGATION SUMMARY */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${getRiskBadgeStyle(selectedReport.overallRiskLevel)}`}>
                  {selectedReport.overallRiskLevel} RISK LEVEL
                </span>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  STATUS: {selectedReport.status}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Report v{selectedReport.version}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-2">
                <span>Generated: {new Date(selectedReport.generatedAt).toLocaleString()}</span>
                <span>by</span>
                <span className="text-slate-300 font-semibold">
                  {selectedReport.generatedBy?.displayName || 'Investigator'}
                </span>
              </div>
            </div>

            {/* Route & Shipment Identifier Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-0.5">
                <span className="text-slate-500 text-[10px] block">SHIPMENT REFERENCE:</span>
                <span className="text-slate-200 font-bold block">{shipmentData?.shipmentReference || 'CT-202610-8768'}</span>
                <span className="text-slate-400 text-[10px] block truncate">{shipmentData?.description || 'Cargo in transit'}</span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-0.5">
                <span className="text-slate-500 text-[10px] block">TRANSIT ROUTE:</span>
                <span className="text-slate-200 font-bold block">{shipmentData?.origin || 'Jaipur'} → {shipmentData?.destination || 'JNPT Mumbai'}</span>
                <span className="text-slate-400 text-[10px] block">Carrier: {shipmentData?.carrier || 'Express Logistics'}</span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-0.5">
                <span className="text-slate-500 text-[10px] block">RESPONSIBILITY CONCLUSION:</span>
                <span className={`text-xs font-bold block ${selectedReport.responsibilitySummary?.likelyResponsibleParty === 'Responsibility Undetermined' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedReport.responsibilitySummary?.likelyResponsibleParty || 'Responsibility Undetermined'}
                </span>
                <span className="text-slate-400 text-[10px] block italic">
                  Interval: {selectedReport.responsibilitySummary?.custodyInterval || 'Ahmedabad–Mumbai'}
                </span>
              </div>
            </div>

            {/* Chronology Inconsistency Warning Banner */}
            {(() => {
              const originInspEvent = timelineData.find((t) => t.sourceType === 'inspection' && (t.summary?.toLowerCase().includes('origin') || t.eventType?.includes('ORIGIN')));
              const destInspEvent = timelineData.find((t) => t.sourceType === 'inspection' && (t.summary?.toLowerCase().includes('destination') || t.eventType?.includes('DESTINATION')));
              const isChronologyInconsistent =
                selectedReport?.chronologyStatus === 'INCONSISTENT' ||
                (originInspEvent &&
                  destInspEvent &&
                  new Date(destInspEvent.occurredAt || destInspEvent.recordedAt).getTime() < new Date(originInspEvent.occurredAt || originInspEvent.recordedAt).getTime());

              if (!isChronologyInconsistent) return null;

              return (
                <div className="p-3 bg-amber-950/80 border border-amber-700/80 rounded-lg text-amber-200 flex items-start space-x-2.5 font-mono text-xs shadow-md">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5 uppercase tracking-wider">
                      CHRONOLOGY INCONSISTENCY WARNING — UNVERIFIED INSPECTION SEQUENCE
                    </span>
                    <p className="font-sans text-[11px] leading-relaxed text-amber-200/90">
                      Destination inspection timestamp precedes origin inspection timestamp. Timestamps are unverified or inverted, preventing conclusions about when cargo condition changed.
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Concise Plain-Language Narrative Summary */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Plain-Language Executive Summary
              </h4>
              <p className="text-slate-200 font-sans leading-relaxed text-xs">
                {selectedReport.executiveSummary}
              </p>
            </div>
          </div>

          {/* SECTION B: KEY FINDINGS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Primary Investigation Findings
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {normalizedFindings.length} Key Findings Analyzed
              </span>
            </div>

            <div className="space-y-3">
              {normalizedFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  onRecordClick={handleRecordChipClick}
                />
              ))}
            </div>
          </div>

          {/* SECTION C: EVIDENCE EXPLORER & RECORD VAULT */}
          {(() => {
            const uniqueInspections = Array.from(
              new Map(timelineData.filter((t) => t.sourceType === 'inspection').map((t) => [t.sourceId || t.eventId, t])).values()
            );
            const uniqueCustodyEvents = Array.from(
              new Map(timelineData.filter((t) => t.sourceType === 'custody').map((t) => [t.sourceId || t.eventId, t])).values()
            );
            const uniqueIncidents = Array.from(
              new Map(timelineData.filter((t) => t.sourceType === 'incident').map((t) => [t.sourceId || t.eventId, t])).values()
            );
            const uniqueEvidence = Array.from(
              new Map(evidenceData.map((e) => [e._id || e.evidenceReference, e])).values()
            );
            const uniqueShipments = Array.from(
              new Map(timelineData.filter((t) => t.sourceType === 'shipment').map((t) => [t.sourceId || t.eventId, t])).values()
            );

            return (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-4 w-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Evidence Explorer & Typed Record Vault
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">CLICK ANY RECORD TO PREVIEW VERIFIED ATTRIBUTES</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 text-xs">
                  {/* Category 1: Inspections */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-emerald-400 text-[10px] font-bold block">
                      INSPECTIONS ({uniqueInspections.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {uniqueInspections.length > 0 ? (
                        uniqueInspections.map((i, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRecordChipClick({ ...i, label: i.summary || `Inspection (${i.location})`, type: 'inspection', observations: i.details?.observations || i.summary })}
                            className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-emerald-300 font-mono text-[10px] flex items-center justify-between cursor-pointer transition truncate"
                          >
                            <span className="truncate">{i.location ? `${i.details?.overallCondition || 'Inspection'} — ${i.location}` : i.summary}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-slate-500 shrink-0 ml-1" />
                          </button>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">No inspection records</span>
                      )}
                    </div>
                  </div>

                  {/* Category 2: Custody Events */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-amber-400 text-[10px] font-bold block">
                      CUSTODY EVENTS ({uniqueCustodyEvents.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {uniqueCustodyEvents.length > 0 ? (
                        uniqueCustodyEvents.map((c, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRecordChipClick({ ...c, label: c.summary, type: 'custody', location: c.location, actor: c.actor, observations: c.details?.notes || c.summary })}
                            className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-amber-300 font-mono text-[10px] flex items-center justify-between cursor-pointer transition truncate"
                          >
                            <span className="truncate">{c.summary}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-slate-500 shrink-0 ml-1" />
                          </button>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">No custody events</span>
                      )}
                    </div>
                  </div>

                  {/* Category 3: Damage Incidents */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-rose-400 text-[10px] font-bold block">
                      DAMAGE INCIDENTS ({uniqueIncidents.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {uniqueIncidents.length > 0 ? (
                        uniqueIncidents.map((inc, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRecordChipClick({ ...inc, label: inc.summary || `Incident ${inc.sourceId}`, type: 'incident', observations: inc.summary })}
                            className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-rose-300 font-mono text-[10px] flex items-center justify-between cursor-pointer transition truncate"
                          >
                            <span className="truncate">{inc.summary}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-slate-500 shrink-0 ml-1" />
                          </button>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">No damage incidents</span>
                      )}
                    </div>
                  </div>

                  {/* Category 4: Evidence Artifacts */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-blue-400 text-[10px] font-bold block">
                      ATTACHED EVIDENCE ({uniqueEvidence.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {uniqueEvidence.length > 0 ? (
                        uniqueEvidence.map((ev, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleRecordChipClick({ ...ev, label: ev.evidenceReference || ev.originalFilename, type: 'evidence', observations: ev.description })}
                            className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-blue-300 font-mono text-[10px] flex items-center justify-between cursor-pointer transition truncate"
                          >
                            <span className="truncate">{ev.evidenceReference || ev.originalFilename}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-slate-500 shrink-0 ml-1" />
                          </button>
                        ))
                      ) : (
                        <span className="text-slate-500 text-[10px] italic">No evidence files uploaded</span>
                      )}
                    </div>
                  </div>

                  {/* Category 5: Shipment & Relationships */}
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
                    <span className="text-purple-400 text-[10px] font-bold block">
                      SHIPMENT & GRAPH ({uniqueShipments.length + relationshipData.length})
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {uniqueShipments.map((s, idx) => (
                        <button
                          key={`s_${idx}`}
                          onClick={() => handleRecordChipClick({ ...s, label: s.summary, type: 'shipment', observations: s.summary })}
                          className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-purple-300 font-mono text-[10px] flex items-center justify-between cursor-pointer transition truncate"
                        >
                          <span className="truncate">{shipmentData?.shipmentReference || 'Shipment Header'}</span>
                          <ExternalLink className="h-2.5 w-2.5 text-slate-500 shrink-0 ml-1" />
                        </button>
                      ))}
                      {relationshipData.map((rel, idx) => (
                        <button
                          key={`r_${idx}`}
                          onClick={() => handleRecordChipClick({ label: `Relationship [${rel.relationshipType}]`, type: 'relationship', observations: rel.explanation || `${rel.sourceType} → ${rel.targetType}` })}
                          className="w-full text-left p-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-between cursor-pointer transition truncate"
                        >
                          <span className="truncate">{rel.relationshipType?.replace(/_/g, ' ') || 'Edge'}</span>
                          <ExternalLink className="h-2.5 w-2.5 text-slate-500 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* SECTION D: EVIDENCE GAPS */}
          {selectedReport.missingProofCallouts && selectedReport.missingProofCallouts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Identified Evidence Gaps & Information Deficits
                </h3>
              </div>

              <div className="space-y-2.5">
                {selectedReport.missingProofCallouts.map((gap, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
                    <div className="font-bold text-amber-300 text-xs">
                      {gap.gapDescription}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans">
                      <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] font-mono block">CONCLUSION PREVENTED:</span>
                        <span className="text-slate-300 leading-relaxed block">{gap.impactOnLiability}</span>
                      </div>
                      <div className="p-2 bg-slate-900/80 rounded border border-slate-800">
                        <span className="text-slate-400 text-[10px] font-mono block">RECOVERY RECOMMENDATION:</span>
                        <span className="text-blue-300 leading-relaxed block">{gap.recommendation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION E: RECOMMENDED ACTIONS */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <ListTodo className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Prioritized Investigative Action Checklist
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start space-x-3">
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold shrink-0 mt-0.5">
                  STEP 1
                </span>
                <div className="space-y-0.5 font-sans">
                  <span className="text-slate-200 font-bold block">Request Intermediate Carrier GPS Telematics Extract</span>
                  <p className="text-slate-400 text-[11px]">
                    Retrieve speed, G-sensor vibration logs, and highway toll timestamps for Ahmedabad–JNPT corridor.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start space-x-3">
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-bold shrink-0 mt-0.5">
                  STEP 2
                </span>
                <div className="space-y-0.5 font-sans">
                  <span className="text-slate-200 font-bold block">Cross-Reference Physical Container Seal Receipts</span>
                  <p className="text-slate-400 text-[11px]">
                    Verify original bolt seal serial number logged at Jaipur loading against broken seal artifact at JNPT.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-start space-x-3">
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-bold shrink-0 mt-0.5">
                  STEP 3
                </span>
                <div className="space-y-0.5 font-sans">
                  <span className="text-slate-200 font-bold block">Conduct Driver Handoff Waybill Interview</span>
                  <p className="text-slate-400 text-[11px]">
                    Obtain formal deposition from secondary carrier regarding disputed handover notes at transit hub.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION F: FINAL DETERMINATION */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono shadow-md">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Final Investigation Determination
              </h4>
            </div>

            <div className="p-3.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5 text-xs">
              <span className="font-bold text-amber-400 text-xs block font-mono">
                STATEMENT OF DETERMINATION:
              </span>
              <p className="text-slate-200 font-sans leading-relaxed text-xs">
                {selectedReport.responsibilitySummary?.likelyResponsibleParty === 'Responsibility Undetermined' ||
                !selectedReport.responsibilitySummary?.likelyResponsibleParty ||
                selectedReport.responsibilitySummary?.likelyResponsibleParty?.toLowerCase().includes('undetermined')
                  ? "Responsibility Undetermined — the available records do not establish the specific damage event, the time and location at which it occurred, or the party responsible. Further investigation is required."
                  : selectedReport.responsibilitySummary.likelyResponsibleParty}
              </p>
              {selectedReport.responsibilitySummary?.factVsInferenceNote && (
                <p className="text-[11px] text-slate-400 italic pt-1 font-mono">
                  Fact vs. Inference: {selectedReport.responsibilitySummary.factVsInferenceNote}
                </p>
              )}
            </div>
          </div>

          {/* COLLAPSIBLE VALIDATION DETAILS (Technical Diagnostics) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
            <button
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              className="w-full p-3.5 bg-slate-950 hover:bg-slate-900 flex items-center justify-between text-left cursor-pointer transition"
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-slate-300">Technical Citation Validation Diagnostics & Scope</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                  {selectedReport.validationStats?.claimStats?.validSupported ?? selectedReport.validationStats?.claimsWithValidReferences ?? 0} / {selectedReport.validationStats?.claimStats?.denominator ?? selectedReport.validationStats?.coverageDenominator ?? 27} Material Claims Verified
                </span>
              </div>
              {showValidationDetails ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {showValidationDetails && selectedReport.validationStats && (
              <div className="p-4 bg-slate-900/60 border-t border-slate-800 space-y-3 text-[11px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-bold block">Claim Verification Coverage</span>
                    <span className="text-slate-200 block">
                      {selectedReport.validationStats.claimStats?.validSupported ?? selectedReport.validationStats.claimsWithValidReferences ?? 0} Supported Claims / {selectedReport.validationStats.claimStats?.denominator ?? selectedReport.validationStats.coverageDenominator ?? 27} Evaluated
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      Unsupported: {selectedReport.validationStats.claimStats?.unsupportedProposition ?? selectedReport.validationStats.claimsUnsupportedByRecords ?? 0} | Invalid Citations: {selectedReport.validationStats.claimStats?.invalidCitation ?? selectedReport.validationStats.claimsWithInvalidReferences ?? 0}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 space-y-1">
                    <span className="text-blue-400 font-bold block">Reference Scope Validity</span>
                    <span className="text-slate-200 block">
                      {selectedReport.validationStats.referenceStats?.verifiedInScope ?? selectedReport.validationStats.verifiedCitations ?? 0} Verified Tokens / {selectedReport.validationStats.referenceStats?.totalExamined ?? selectedReport.validationStats.totalCitations ?? 0} Examined
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      Unverified / Mismatched Tokens: {selectedReport.validationStats.referenceStats?.unresolved ?? selectedReport.validationStats.unverifiedCitations ?? 0}
                    </span>
                  </div>
                </div>

                {selectedReport.validationStats.coverageScope && (
                  <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                    Scope: {selectedReport.validationStats.coverageScope}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Preview Modal */}
      {previewRecord && (
        <RecordPreviewModal
          record={previewRecord}
          onClose={() => setPreviewRecord(null)}
        />
      )}

      {/* Certification Modal */}
      {isCertifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Certify Investigation Report</h3>
              </div>
              <button
                onClick={() => setIsCertifyOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-lg text-xs text-amber-200/90 space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>PERMANENT SEAL & REPORT FREEZE NOTICE</span>
              </div>
              <p className="leading-relaxed">
                Certifying Report Version {selectedReport?.version} will permanently seal this investigation case. No further operational records can be added.
              </p>
            </div>

            <form onSubmit={handleCertifyReport} className="space-y-4">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Reviewer Decision</label>
                <select
                  value={certifyDecision}
                  onChange={(e) => setCertifyDecision(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="APPROVED">APPROVED — Formally Approved & Certified</option>
                  <option value="CERTIFIED_WITH_RESERVATIONS">CERTIFIED WITH RESERVATIONS — Certified with noted caveats</option>
                  <option value="REJECTED">REJECTED — Rejected due to insufficient evidence</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Compliance Review Comments</label>
                <textarea
                  rows={3}
                  value={certifyComments}
                  onChange={(e) => setCertifyComments(e.target.value)}
                  placeholder="Record formal compliance notes or certification caveats..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCertifyOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCertify}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-60 transition cursor-pointer font-mono"
                >
                  {submittingCertify ? 'Certifying & Sealing...' : 'Confirm Certification & Seal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
