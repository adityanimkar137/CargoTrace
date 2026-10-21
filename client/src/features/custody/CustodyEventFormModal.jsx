import React, { useState } from 'react';
import { X, MapPin, Calendar, Clock, UserCheck, AlertCircle, FileText, ArrowRightLeft } from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { SmartDateTimePicker } from '../../components/forms/SmartDateTimePicker.jsx';
import { LocationCheckpointPicker } from '../../components/forms/LocationCheckpointPicker.jsx';

export function CustodyEventFormModal({ isOpen, onClose, shipmentId, shipment, onSuccess }) {
  const [eventType, setEventType] = useState('CUSTODY_HANDOVER');
  const [fromParty, setFromParty] = useState('');
  const [toParty, setToParty] = useState('');
  const [location, setLocation] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!location.trim() || !occurredAt) {
      setError('Event location and occurrence date/time are required.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/shipments/${shipmentId}/custody-events`, {
        eventType,
        fromParty: fromParty.trim() || null,
        toParty: toParty.trim() || null,
        location: location.trim(),
        occurredAt,
        notes: notes.trim() || null
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record custody handover.');
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
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-900">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Record Custody Handover</h3>
              <p className="text-xs text-slate-400">Log custodian transition, pickup, or hub receipt</p>
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
            <label className="block font-medium text-slate-300 mb-1">Custody Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            >
              <option value="CUSTODY_HANDOVER">CUSTODY_HANDOVER — Custodian Transfer</option>
              <option value="PICKUP">PICKUP — Origin Dispatch</option>
              <option value="HUB_ARRIVAL">HUB_ARRIVAL — Transit Terminal Arrival</option>
              <option value="HUB_DEPARTURE">HUB_DEPARTURE — Transit Terminal Departure</option>
              <option value="RECEIPT_BY_CUSTODIAN">RECEIPT_BY_CUSTODIAN — Destination Receipt</option>
              <option value="OTHER">OTHER — Miscellaneous Log</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Releasing Party (From)</label>
              <input
                type="text"
                value={fromParty}
                onChange={(e) => setFromParty(e.target.value)}
                placeholder="e.g. Origin Warehouse Team"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Receiving Party (To)</label>
              <input
                type="text"
                value={toParty}
                onChange={(e) => setToParty(e.target.value)}
                placeholder="e.g. Express Trucking Driver #882"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <LocationCheckpointPicker
            value={location}
            onChange={setLocation}
            origin={shipment?.origin}
            destination={shipment?.destination}
            required
            label="Custody Event Location"
            accentColor="blue"
          />

          <SmartDateTimePicker
            value={occurredAt}
            onChange={setOccurredAt}
            required
            label="Occurrence Date & Time"
            accentColor="blue"
          />

          <div>
            <label className="block font-medium text-slate-300 mb-1">Operational Context / Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Container seal verification notes, bill of lading signature info..."
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? 'Recording...' : 'Record Custody Handover'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
