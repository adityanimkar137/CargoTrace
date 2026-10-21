import React, { useState, useEffect } from 'react';
import { X, Link2, Search, AlertCircle, Edit3 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';

const RECORD_CATEGORY_OPTIONS = [
  { id: 'shipment', label: 'Shipment' },
  { id: 'custody', label: 'Custody Event' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'incident', label: 'Incident' },
  { id: 'evidence', label: 'Evidence File' }
];

const RELATIONSHIP_OPTIONS_BY_PAIR = {
  'shipment:custody': [
    { value: 'SHIPMENT_HAS_CUSTODY_EVENT', label: 'Shipment Incorporates Custody Event', desc: 'Chain-of-custody transfer event' }
  ],
  'shipment:inspection': [
    { value: 'SHIPMENT_HAS_INSPECTION', label: 'Shipment Incorporates Inspection', desc: 'Condition inspection check' }
  ],
  'shipment:incident': [
    { value: 'SHIPMENT_HAS_INCIDENT', label: 'Shipment Incorporates Incident', desc: 'Damage or security incident' }
  ],
  'shipment:evidence': [
    { value: 'SHIPMENT_HAS_EVIDENCE', label: 'Shipment Incorporates Evidence', desc: 'Digital evidence artifact' }
  ],
  'inspection:incident': [
    { value: 'INSPECTION_DOCUMENTS_INCIDENT', label: 'Inspection Documents Damage Incident', desc: 'Condition inspection findings document or record this damage incident' }
  ],
  'inspection:evidence': [
    { value: 'INSPECTION_SUPPORTED_BY_EVIDENCE', label: 'Inspection Supported By Evidence', desc: 'Condition inspection is supported by attached evidence photo/document' }
  ],
  'inspection:custody': [
    { value: 'INSPECTION_OBSERVED_DURING_CUSTODY', label: 'Inspection Observed During Custody Interval', desc: 'Inspection occurred during specific custody transfer' }
  ],
  'custody:custody': [
    { value: 'CUSTODY_EVENT_PRECEDES_CUSTODY_EVENT', label: 'Custody Handover Precedes Handover', desc: 'Chronological custody sequence transition' }
  ],
  'custody:incident': [
    { value: 'INCIDENT_OCCURRED_DURING_CUSTODY', label: 'Incident Occurred During Custody Interval', desc: 'Damage incident occurred during specific carrier/custodian interval' }
  ],
  'custody:evidence': [
    { value: 'CUSTODY_SUPPORTED_BY_EVIDENCE', label: 'Custody Supported By Evidence', desc: 'Handover event is supported by attached evidence photo/document' }
  ],
  'incident:evidence': [
    { value: 'INCIDENT_SUPPORTED_BY_EVIDENCE', label: 'Incident Supported By Evidence', desc: 'Damage incident is corroborated by this evidence photo/document' }
  ],
  'incident:custody': [
    { value: 'INCIDENT_OCCURRED_DURING_CUSTODY', label: 'Incident Occurred During Custody Interval', desc: 'Damage incident occurred during specific carrier/custodian interval' }
  ],
  'incident:inspection': [
    { value: 'INSPECTION_DOCUMENTS_INCIDENT', label: 'Inspection Documents Damage Incident', desc: 'Condition inspection findings document or record this damage incident' }
  ],
  'evidence:evidence': [
    { value: 'EVIDENCE_CORROBORATES_EVIDENCE', label: 'Evidence Corroborates Evidence', desc: 'Evidence artifact corroborates or validates another evidence file' }
  ]
};

export function RecordLinkerModal({
  isOpen,
  onClose,
  shipmentId,
  sourceType: initialSourceType = 'incident',
  sourceId: initialSourceId = '',
  sourceTitle: initialSourceTitle = '',
  initialRelationship = null,
  onSuccess
}) {
  const isEditMode = !!initialRelationship;

  const [sourceType, setSourceType] = useState(initialRelationship?.sourceType || initialSourceType);
  const [sourceCandidates, setSourceCandidates] = useState([]);
  const [selectedSource, setSelectedSource] = useState(
    initialSourceId ? { id: initialSourceId, type: initialSourceType, title: initialSourceTitle || `${initialSourceType.toUpperCase()} ${initialSourceId}` } : null
  );
  const [sourceQuery, setSourceQuery] = useState('');
  const [loadingSourceCandidates, setLoadingSourceCandidates] = useState(false);

  const [targetType, setTargetType] = useState(
    initialRelationship?.targetType || (initialSourceType === 'inspection' ? 'evidence' : 'evidence')
  );
  const [targetCandidates, setTargetCandidates] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(
    initialRelationship?.targetId ? { id: initialRelationship.targetId, type: initialRelationship.targetType, title: initialRelationship.targetSummary } : null
  );
  const [targetQuery, setTargetQuery] = useState('');
  const [loadingTargetCandidates, setLoadingTargetCandidates] = useState(false);

  const [relationshipType, setRelationshipType] = useState(initialRelationship?.relationshipType || '');
  const [explanation, setExplanation] = useState(initialRelationship?.explanation || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Source Candidates
  useEffect(() => {
    if (!isOpen || !shipmentId) return;

    const fetchSourceCandidates = async () => {
      setLoadingSourceCandidates(true);
      try {
        const res = await apiClient.get(
          `/shipments/${shipmentId}/relationships/candidates?targetType=${sourceType}&query=${encodeURIComponent(sourceQuery)}`
        );
        const filtered = res.candidates || [];
        setSourceCandidates(filtered);

        // If no selectedSource or selectedSource type changed, default to first candidate
        if (filtered.length > 0 && (!selectedSource || selectedSource.type !== sourceType)) {
          setSelectedSource(filtered[0]);
        }
      } catch (err) {
        console.error('Failed to fetch source candidates:', err);
      } finally {
        setLoadingSourceCandidates(false);
      }
    };

    const timer = setTimeout(fetchSourceCandidates, 150);
    return () => clearTimeout(timer);
  }, [isOpen, shipmentId, sourceType, sourceQuery]);

  // Fetch Target Candidates
  useEffect(() => {
    if (!isOpen || !shipmentId) return;

    const fetchTargetCandidates = async () => {
      setLoadingTargetCandidates(true);
      try {
        const res = await apiClient.get(
          `/shipments/${shipmentId}/relationships/candidates?targetType=${targetType}&query=${encodeURIComponent(targetQuery)}`
        );
        // Exclude current selected source record if same type
        const filtered = (res.candidates || []).filter(
          (c) => !(c.type === selectedSource?.type && c.id === selectedSource?.id)
        );
        setTargetCandidates(filtered);

        if (filtered.length > 0 && (!selectedTarget || selectedTarget.type !== targetType)) {
          setSelectedTarget(filtered[0]);
        }
      } catch (err) {
        console.error('Failed to fetch target candidates:', err);
      } finally {
        setLoadingTargetCandidates(false);
      }
    };

    const timer = setTimeout(fetchTargetCandidates, 150);
    return () => clearTimeout(timer);
  }, [isOpen, shipmentId, targetType, targetQuery, selectedSource]);

  // Update allowed relationship options whenever sourceType or targetType changes
  const allowedOptions = RELATIONSHIP_OPTIONS_BY_PAIR[`${sourceType}:${targetType}`] || [];

  useEffect(() => {
    if (allowedOptions.length > 0) {
      if (!allowedOptions.some((opt) => opt.value === relationshipType)) {
        setRelationshipType(allowedOptions[0].value);
      }
    } else {
      setRelationshipType('');
    }
  }, [sourceType, targetType, allowedOptions]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSource) {
      setError('Please select a valid source record.');
      return;
    }
    if (!selectedTarget) {
      setError('Please select a valid target record.');
      return;
    }
    if (selectedSource.type === selectedTarget.type && selectedSource.id === selectedTarget.id) {
      setError('Cannot create a self-referencing relationship link.');
      return;
    }
    if (!relationshipType) {
      setError(`No valid relationship type available for link between ${sourceType} and ${targetType}.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      sourceType: selectedSource.type,
      sourceId: selectedSource.id,
      targetType: selectedTarget.type,
      targetId: selectedTarget.id,
      relationshipType,
      explanation: explanation.trim() || undefined
    };

    try {
      if (isEditMode) {
        await apiClient.patch(`/shipments/${shipmentId}/relationships/${initialRelationship._id}`, payload);
      } else {
        await apiClient.post(`/shipments/${shipmentId}/relationships`, payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to persist relationship link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-900">
              {isEditMode ? <Edit3 className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditMode ? 'Correct Investigation Link' : 'Establish Investigation Link'}
              </h3>
              <p className="text-xs text-slate-400">Auditable bidirectional relationship link between records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SOURCE RECORD SELECTION */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">1. Source Record (From)</span>
              {selectedSource && (
                <span className="text-[10px] text-blue-400 font-bold truncate max-w-[250px]">
                  Selected: {selectedSource.title}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
              {RECORD_CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={`src_${cat.id}`}
                  type="button"
                  onClick={() => setSourceType(cat.id)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                    sourceType === cat.id
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {sourceType !== 'shipment' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={sourceQuery}
                    onChange={(e) => setSourceQuery(e.target.value)}
                    placeholder={`Search ${sourceType} source records...`}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden text-[11px]"
                  />
                </div>

                {loadingSourceCandidates ? (
                  <div className="p-2 text-center text-slate-500 text-[10px]">Searching source records...</div>
                ) : sourceCandidates.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {sourceCandidates.map((cand) => {
                      const isSelected = selectedSource?.id === cand.id;
                      return (
                        <div
                          key={`src_cand_${cand.id}`}
                          onClick={() => setSelectedSource(cand)}
                          className={`p-2 rounded border cursor-pointer text-[10px] flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-950/80 border-blue-600 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="block">{cand.title}</span>
                            <span className="text-slate-400 text-[9px] block">{cand.subtitle}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[9px]">
                            {cand.badge || 'RECORD'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2 text-center text-slate-500 text-[10px]">No matching {sourceType} records found.</div>
                )}
              </div>
            )}
          </div>

          {/* TARGET RECORD SELECTION */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-bold">2. Target Record (To)</span>
              {selectedTarget && (
                <span className="text-[10px] text-purple-400 font-bold truncate max-w-[250px]">
                  Selected: {selectedTarget.title}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
              {RECORD_CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={`tgt_${cat.id}`}
                  type="button"
                  onClick={() => setTargetType(cat.id)}
                  className={`py-1.5 px-2 rounded-lg border text-center transition cursor-pointer ${
                    targetType === cat.id
                      ? 'bg-purple-600 text-white border-purple-500 font-bold'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {targetType !== 'shipment' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    placeholder={`Search ${targetType} target records...`}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden text-[11px]"
                  />
                </div>

                {loadingTargetCandidates ? (
                  <div className="p-2 text-center text-slate-500 text-[10px]">Searching target records...</div>
                ) : targetCandidates.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {targetCandidates.map((cand) => {
                      const isSelected = selectedTarget?.id === cand.id;
                      return (
                        <div
                          key={`tgt_cand_${cand.id}`}
                          onClick={() => setSelectedTarget(cand)}
                          className={`p-2 rounded border cursor-pointer text-[10px] flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-950/80 border-purple-600 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <span className="block">{cand.title}</span>
                            <span className="text-slate-400 text-[9px] block">{cand.subtitle}</span>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 text-[9px]">
                            {cand.badge || 'RECORD'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2 text-center text-slate-500 text-[10px]">No matching {targetType} records found.</div>
                )}
              </div>
            )}
          </div>

          {/* RELATIONSHIP TYPE PICKER */}
          <div>
            <label className="block font-medium text-slate-300 mb-1 font-mono">
              3. Compatible Relationship Link Type
            </label>
            {allowedOptions.length === 0 ? (
              <div className="p-2.5 bg-amber-950/60 border border-amber-900 rounded text-amber-300 text-[11px] font-mono">
                No direct relationship type defined for {sourceType.toUpperCase()} → {targetType.toUpperCase()}. Please select a compatible category pair (e.g. Incident → Evidence or Inspection → Incident).
              </div>
            ) : (
              <select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {allowedOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.desc}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* EXPLANATION */}
          <div>
            <label className="block font-medium text-slate-300 mb-1 font-mono">
              4. Investigator Linkage Rationale / Explanation
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. High-resolution seal photo corroborates broken seal finding IND-SEAL-8821 recorded at JNPT destination receipt..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800 font-mono">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSource || !selectedTarget || !relationshipType}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? 'Saving Link...' : isEditMode ? 'Update Relationship Link' : 'Establish Relationship Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
