import React, { useState } from 'react';
import { X, ClipboardCheck, MapPin, Calendar, AlertTriangle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { SmartDateTimePicker } from '../../components/forms/SmartDateTimePicker.jsx';
import { LocationCheckpointPicker } from '../../components/forms/LocationCheckpointPicker.jsx';

export function InspectionFormModal({ isOpen, onClose, shipmentId, shipment, onSuccess }) {
  const [inspectionType, setInspectionType] = useState('HUB');
  const [location, setLocation] = useState('');
  const [inspectedAt, setInspectedAt] = useState('');
  const [overallCondition, setOverallCondition] = useState('UNKNOWN');
  const [packagingCondition, setPackagingCondition] = useState('UNKNOWN');
  const [sealCondition, setSealCondition] = useState('INTACT');
  const [visibleDamage, setVisibleDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [observations, setObservations] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!location.trim() || !inspectedAt) {
      setError('Inspection location and date/time are required.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/shipments/${shipmentId}/inspections`, {
        inspectionType,
        location: location.trim(),
        inspectedAt,
        overallCondition,
        packagingCondition,
        sealCondition,
        visibleDamage,
        damageDescription: visibleDamage ? damageDescription.trim() || null : null,
        observations: observations.trim() || null
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit inspection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-900">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Record Condition Inspection</h3>
              <p className="text-xs text-slate-400">Log physical condition, packaging, and seal integrity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">Inspection Category</label>
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
            >
              <option value="ORIGIN">ORIGIN — Origin Loading Check</option>
              <option value="CUSTODY_TRANSFER">CUSTODY_TRANSFER — Handover Inspection</option>
              <option value="HUB">HUB — Intermediate Terminal Check</option>
              <option value="DESTINATION">DESTINATION — Receipt Check</option>
              <option value="OTHER">OTHER — Special Audit</option>
            </select>
          </div>

          <LocationCheckpointPicker
            value={location}
            onChange={setLocation}
            origin={shipment?.origin}
            destination={shipment?.destination}
            required
            label="Inspection Checkpoint / Location"
            accentColor="emerald"
          />

          <SmartDateTimePicker
            value={inspectedAt}
            onChange={setInspectedAt}
            required
            label="Inspection Date & Time"
            accentColor="emerald"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Overall Condition</label>
              <select
                value={overallCondition}
                onChange={(e) => setOverallCondition(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="GOOD">GOOD</option>
                <option value="MINOR_DAMAGE">MINOR_DAMAGE</option>
                <option value="MAJOR_DAMAGE">MAJOR_DAMAGE</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Packaging</label>
              <select
                value={packagingCondition}
                onChange={(e) => setPackagingCondition(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="GOOD">GOOD</option>
                <option value="MINOR_DAMAGE">MINOR_DAMAGE</option>
                <option value="MAJOR_DAMAGE">MAJOR_DAMAGE</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Seal Integrity</label>
              <select
                value={sealCondition}
                onChange={(e) => setSealCondition(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="INTACT">INTACT</option>
                <option value="DAMAGED">DAMAGED</option>
                <option value="BROKEN_SEAL">BROKEN_SEAL</option>
                <option value="NOT_APPLICABLE">N/A</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleDamage}
                onChange={(e) => setVisibleDamage(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="font-semibold text-rose-300 flex items-center">
                <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-400" /> Visible Damage Observed
              </span>
            </label>

            {visibleDamage && (
              <textarea
                rows={2}
                value={damageDescription}
                onChange={(e) => setDamageDescription(e.target.value)}
                placeholder="Describe visible damage location, crushing, tearing, or moisture marks..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Inspector Observations</label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="General findings, environmental exposure notes, cargo strapping..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Record Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
