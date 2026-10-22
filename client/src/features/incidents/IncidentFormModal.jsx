import React, { useState, useEffect } from 'react';
import { X, AlertOctagon, MapPin, Calendar, AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { SmartDateTimePicker } from '../../components/forms/SmartDateTimePicker.jsx';
import { LocationCheckpointPicker } from '../../components/forms/LocationCheckpointPicker.jsx';

export function IncidentFormModal({ isOpen, onClose, shipmentId, shipment, initialData, onSuccess }) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [damageType, setDamageType] = useState(initialData?.damageType || 'PHYSICAL_DAMAGE');
  const [severity, setSeverity] = useState(initialData?.severity || 'MODERATE');
  const [location, setLocation] = useState(initialData?.location || '');
  const [discoveredAt, setDiscoveredAt] = useState(initialData?.discoveredAt || '');
  const [affectedCargo, setAffectedCargo] = useState(initialData?.affectedCargo || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.title !== undefined) setTitle(initialData.title);
      if (initialData.description !== undefined) setDescription(initialData.description);
      if (initialData.damageType !== undefined) setDamageType(initialData.damageType);
      if (initialData.severity !== undefined) setSeverity(initialData.severity);
      if (initialData.location !== undefined) setLocation(initialData.location);
      if (initialData.discoveredAt !== undefined) setDiscoveredAt(initialData.discoveredAt);
      if (initialData.affectedCargo !== undefined) setAffectedCargo(initialData.affectedCargo);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !location.trim() || !discoveredAt) {
      setError('Title, description, location, and discovery date/time are required.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/shipments/${shipmentId}/incidents`, {
        title: title.trim(),
        description: description.trim(),
        damageType,
        severity,
        location: location.trim(),
        discoveredAt,
        affectedCargo: affectedCargo.trim() || null
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to report damage incident.');
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
            <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-900">
              <AlertOctagon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Report Damage Incident</h3>
              <p className="text-xs text-slate-400">Document cargo loss, physical damage, or seal breach</p>
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
          {initialData?.escalatedFrom && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 flex items-start space-x-2.5 text-rose-200">
              <ArrowUpRight className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-semibold block text-white text-[11px]">Workflow Escalation Active</span>
                <span className="text-[11px] text-rose-200/90 leading-relaxed">
                  Pre-filled automatically from inspection condition findings. Review details and submit to log the formal incident into the investigation pipeline.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Incident Summary / Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Container Wall Puncture & Water Staining"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Damage Category</label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
              >
                <option value="PHYSICAL_DAMAGE">PHYSICAL_DAMAGE — Impact or Crushing</option>
                <option value="PACKAGING_DAMAGE">PACKAGING_DAMAGE — Tearing / Broken Pallet</option>
                <option value="WATER_DAMAGE">WATER_DAMAGE — Moisture or Rain Intrusion</option>
                <option value="CONTAMINATION">CONTAMINATION — Chemical or Spillage</option>
                <option value="MISSING_OR_DAMAGED_PARTS">MISSING_PARTS — Shortage or Theft</option>
                <option value="OTHER">OTHER — Miscellaneous Incident</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
              >
                <option value="MINOR">MINOR — Superficial damage</option>
                <option value="MODERATE">MODERATE — Partial cargo impact</option>
                <option value="MAJOR">MAJOR — Severe cargo impairment / loss</option>
                <option value="UNKNOWN">UNKNOWN — Unquantified</option>
              </select>
            </div>
          </div>

          <LocationCheckpointPicker
            value={location}
            onChange={setLocation}
            origin={shipment?.origin}
            destination={shipment?.destination}
            required
            label="Discovery Location"
            accentColor="rose"
          />

          <SmartDateTimePicker
            value={discoveredAt}
            onChange={setDiscoveredAt}
            required
            label="Discovery Date & Time"
            accentColor="rose"
          />

          <div>
            <label className="block font-medium text-slate-300 mb-1">Affected Goods / Cargo Items</label>
            <input
              type="text"
              value={affectedCargo}
              onChange={(e) => setAffectedCargo(e.target.value)}
              placeholder="e.g. Pallets 3 through 6 (Precision Servo Motors)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Detailed Damage Observations</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide complete physical observations: outer carton tearing, wetness, crushed corners, seal tampering..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? 'Reporting...' : 'Report Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
