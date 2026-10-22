import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, Truck, Calendar, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient.js';
import { SmartDatePicker } from '../../../components/forms/SmartDatePicker.jsx';

export function ShipmentFormModal({ isOpen, onClose, shipment = null, onSuccess }) {
  const isEditing = Boolean(shipment);

  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingReference, setTrackingReference] = useState('');
  const [status, setStatus] = useState('REGISTERED');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shipment) {
      setDescription(shipment.description || '');
      setOrigin(shipment.origin || '');
      setDestination(shipment.destination || '');
      setCarrier(shipment.carrier || '');
      setTrackingReference(shipment.trackingReference || '');
      setStatus(shipment.status || 'REGISTERED');
      setExpectedArrival(
        shipment.expectedArrival
          ? new Date(shipment.expectedArrival).toISOString().split('T')[0]
          : ''
      );
      setNotes(shipment.notes || '');
    } else {
      setDescription('');
      setOrigin('');
      setDestination('');
      setCarrier('');
      setTrackingReference('');
      setStatus('REGISTERED');
      setExpectedArrival('');
      setNotes('');
    }
    setError(null);
  }, [shipment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!description.trim() || !origin.trim() || !destination.trim()) {
      setError('Description, Origin, and Destination are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        description: description.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        carrier: carrier.trim() || null,
        trackingReference: trackingReference.trim() || null,
        status,
        expectedArrival: expectedArrival || null,
        notes: notes.trim() || null
      };

      if (isEditing) {
        await apiClient.patch(`/shipments/${shipment._id || shipment.id}`, payload);
      } else {
        await apiClient.post('/shipments', payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save shipment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-900">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isEditing ? `Edit Shipment — ${shipment.shipmentReference}` : 'Register New Cargo Shipment'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update consignment details and operational status' : 'Create an operational shipment record for tracking & evidence'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Shipment Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 40ft High-Cube Container — Precision CNC Machinery"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Origin Location <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Port of Yokohama, JP"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Destination Location <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Distribution Center Long Beach, CA"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Route Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              Route Presets:
            </span>
            {[
              { origin: 'Yokohama Port Gate 4, JP', destination: 'Distribution Center Long Beach, CA', label: 'Yokohama → Long Beach' },
              { origin: 'Shanghai Container Pier 3, CN', destination: 'Rotterdam Gateway Hub, NL', label: 'Shanghai → Rotterdam' },
              { origin: 'Hamburg Container Terminal, DE', destination: 'Chicago Rail Freight Yard, US', label: 'Hamburg → Chicago' },
              { origin: 'Singapore PSA Terminal 1, SG', destination: 'Felixstowe Port Bay 6, UK', label: 'Singapore → Felixstowe' }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setOrigin(p.origin);
                  setDestination(p.destination);
                }}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-blue-500/50 hover:text-blue-300 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Carrier / Logistics Provider</label>
              <div className="relative">
                <Truck className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Pacific Transpacific Line"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">External Tracking Ref / Bill of Lading</label>
              <input
                type="text"
                value={trackingReference}
                onChange={(e) => setTrackingReference(e.target.value)}
                placeholder="BOL-98402-US"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Operational Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              >
                <option value="REGISTERED">REGISTERED — Shipment entry logged</option>
                <option value="IN_TRANSIT">IN_TRANSIT — Dispatched / Underway</option>
                <option value="ON_HOLD">ON_HOLD — Inspection or clearance hold</option>
                <option value="ARRIVED">ARRIVED — Received at destination</option>
                <option value="CLOSED">CLOSED — Concluded record</option>
              </select>
            </div>

            <div className="col-span-1">
              <SmartDatePicker
                value={expectedArrival}
                onChange={setExpectedArrival}
                label="Expected Arrival Date"
                defaultPresetDays={isEditing ? null : 3}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Operational Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special handling instructions, container seal numbers, or port notes..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-60 transition cursor-pointer flex items-center space-x-1.5"
            >
              <span>{submitting ? 'Saving...' : isEditing ? 'Update Shipment' : 'Register Shipment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
