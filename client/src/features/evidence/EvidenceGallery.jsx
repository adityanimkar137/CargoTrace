import React, { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  ShieldCheck,
  Download,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { EvidenceUploadModal } from './EvidenceUploadModal.jsx';

export function EvidenceGallery({ shipmentId }) {
  const { permissions } = useAuth();
  const canUpload = permissions.includes('evidence:upload');

  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvidence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get(`/shipments/${shipmentId}/evidence`);
      setEvidenceList(data.evidence || []);
    } catch (err) {
      setError(err.message || 'Failed to load evidence records');
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const isImage = (contentType) => contentType && contentType.startsWith('image/');

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Cargo Evidence Gallery</h3>
          <p className="text-xs text-slate-400">Verifiable photographs, seal records, and inspection document artifacts</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchEvidence}
            disabled={loading}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
            title="Refresh gallery"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {canUpload && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Evidence</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-900 rounded-lg text-rose-300 flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-mono">Loading evidence records...</div>
      ) : evidenceList.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 border border-dashed border-slate-800 rounded-xl space-y-2">
          <UploadCloud className="h-6 w-6 text-slate-600 mx-auto" />
          <p className="text-slate-300 font-semibold">No Evidence Uploaded Yet</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            Upload photographs of seals, cargo condition, container walls, or shipping waybills.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {evidenceList.map((ev) => (
            <div key={ev._id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
              <div>
                {/* Media Preview Header */}
                <div className="h-36 bg-slate-900 border-b border-slate-800 flex items-center justify-center overflow-hidden relative group">
                  {isImage(ev.contentType) ? (
                    <img
                      src={ev.fileUrl}
                      alt={ev.originalFilename}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <FileText className="h-10 w-10 text-emerald-400 mx-auto mb-1" />
                      <span className="text-[11px] font-mono text-slate-300 block truncate max-w-[180px]">
                        {ev.originalFilename}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 flex items-center space-x-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950/90 text-emerald-300 border border-emerald-800/80">
                      {ev.evidenceType}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-950/90 text-slate-400 border border-slate-800">
                      {ev.storageMode === 'firebase' ? 'Firebase' : 'Local'}
                    </span>
                  </div>
                </div>

                {/* Evidence Details */}
                <div className="p-3.5 space-y-2 font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-200">{ev.evidenceReference}</span>
                    <span className="text-slate-500">{(ev.sizeBytes / 1024).toFixed(1)} KB</span>
                  </div>

                  <p className="font-sans text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {ev.description || ev.originalFilename}
                  </p>

                  {/* SHA-256 Badge */}
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800/80 text-[10px] text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">SHA-256: {ev.sha256}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-3.5 py-2 border-t border-slate-900 bg-slate-900/40 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>By: {ev.uploadedBy?.displayName || 'User'}</span>
                <a
                  href={ev.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  <span>View</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <EvidenceUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shipmentId={shipmentId}
        onSuccess={fetchEvidence}
      />
    </div>
  );
}
