import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Trash2, Plus, ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Edit3 } from 'lucide-react';
import { apiClient } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { RecordLinkerModal } from './RecordLinkerModal.jsx';

export function ConnectedRelationshipsPanel({
  shipmentId,
  recordType,
  recordId,
  recordTitle,
  onRelationshipChanged
}) {
  const { permissions } = useAuth();
  const canEdit = permissions.includes('shipment:update');

  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLinkerOpen, setIsLinkerOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchRelationships = useCallback(async () => {
    if (!shipmentId || !recordType || !recordId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/shipments/${shipmentId}/relationships/record/${recordType}/${recordId}`
      );
      setRelationships(res.relationships || []);
    } catch (err) {
      setError(err.message || 'Failed to load connected relationships');
    } finally {
      setLoading(false);
    }
  }, [shipmentId, recordType, recordId]);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const handleDelete = async (relId) => {
    if (!window.confirm('Are you sure you want to remove this investigation relationship link?')) return;
    setDeletingId(relId);
    try {
      await apiClient.delete(`/shipments/${shipmentId}/relationships/${relId}`);
      await fetchRelationships();
      if (onRelationshipChanged) onRelationshipChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete relationship');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLinkSuccess = () => {
    fetchRelationships();
    if (onRelationshipChanged) onRelationshipChanged();
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Link2 className="h-4 w-4 text-blue-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Connected Investigation Relationships ({relationships.length})
          </h4>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setIsLinkerOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Link Related Record</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-950/60 border border-rose-900 rounded text-rose-300 text-[11px] flex items-center space-x-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-4 text-center text-slate-500 font-mono text-[11px]">Loading relationship graph connections...</div>
      ) : relationships.length === 0 ? (
        <div className="p-3 bg-slate-900/50 border border-dashed border-slate-800 rounded-lg text-center text-slate-500 text-[11px]">
          No explicit event relationships linked to this record yet. Click 'Link Related Record' above to attach photos, inspections, or handovers.
        </div>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => {
            const isOutgoing = rel.isOutgoing;
            return (
              <div
                key={rel._id}
                className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2">
                    {isOutgoing ? (
                      <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <ArrowLeft className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    )}
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold text-[10px]">
                      {rel.relationshipType}
                    </span>
                    <span className="text-slate-200 font-bold">{rel.connectedSummary}</span>
                  </div>

                  {rel.explanation && (
                    <p className="text-slate-400 font-sans text-xs leading-relaxed pl-5.5">{rel.explanation}</p>
                  )}

                  <div className="text-[10px] text-slate-500 pl-5.5 flex items-center space-x-2">
                    <span>Linked by: {rel.createdBy?.displayName || 'Investigator'}</span>
                    <span>·</span>
                    <span>{new Date(rel.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center space-x-1.5 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingRelationship(rel)}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition cursor-pointer"
                      title="Correct / Edit relationship link"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rel._id)}
                      disabled={deletingId === rel._id}
                      className="p-1.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-900 transition cursor-pointer"
                      title="Remove relationship link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record Linker Modal for Creating New Link */}
      <RecordLinkerModal
        isOpen={isLinkerOpen}
        onClose={() => setIsLinkerOpen(false)}
        shipmentId={shipmentId}
        sourceType={recordType}
        sourceId={recordId}
        sourceTitle={recordTitle}
        onSuccess={handleLinkSuccess}
      />

      {/* Record Linker Modal for Correcting Existing Link */}
      {editingRelationship && (
        <RecordLinkerModal
          isOpen={true}
          onClose={() => setEditingRelationship(null)}
          shipmentId={shipmentId}
          initialRelationship={editingRelationship}
          onSuccess={handleLinkSuccess}
        />
      )}
    </div>
  );
}
