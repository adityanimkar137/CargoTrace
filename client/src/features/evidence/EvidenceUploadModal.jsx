import React, { useState } from 'react';
import { X, UploadCloud, File, Image as ImageIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';

export function EvidenceUploadModal({ isOpen, onClose, shipmentId, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState('CARGO_PHOTO');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10 MB limit.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('evidenceType', evidenceType);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      await apiClient.post(`/shipments/${shipmentId}/evidence`, formData);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload evidence file.');
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
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Upload Cargo Evidence</h3>
              <p className="text-xs text-slate-400">Photos, seal verification images, or inspection documents</p>
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

          {/* File Picker */}
          <div>
            <label className="block font-medium text-slate-300 mb-1">
              Select File <span className="text-rose-400">*</span> (Max 10 MB)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-6 text-center bg-slate-950 transition cursor-pointer relative">
              <input
                type="file"
                required
                accept="image/*,application/pdf,text/plain"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-300 font-mono">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-300 font-medium">Click or drag image / document here</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Supports JPG, PNG, WebP, GIF, PDF, TXT</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Evidence Category</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
            >
              <option value="CARGO_PHOTO">CARGO_PHOTO — Cargo / Container Exterior</option>
              <option value="PACKAGING_PHOTO">PACKAGING_PHOTO — Pallet / Box Condition</option>
              <option value="SEAL_PHOTO">SEAL_PHOTO — Container Seal Photograph</option>
              <option value="INSPECTION_PHOTO">INSPECTION_PHOTO — Damage / Finding Photo</option>
              <option value="DOCUMENT">DOCUMENT — Waybill / Receipt / Manifest PDF</option>
              <option value="OTHER">OTHER — Miscellaneous Attachment</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Evidence Description / Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Photo of broken bolt seal #SL-88402 at port entrance gate"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-60 transition cursor-pointer"
            >
              {submitting ? 'Uploading...' : 'Upload Evidence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
