import React, { useState, useEffect, useCallback } from 'react';
import {
  PackagePlus,
  Package,
  MapPin,
  ArrowRight,
  Truck,
  Calendar,
  Eye,
  Edit2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Inbox,
  FilterX
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { ShipmentStatusBadge } from '../components/ShipmentStatusBadge.jsx';
import { ShipmentFilters } from '../components/ShipmentFilters.jsx';
import { ShipmentFormModal } from '../components/ShipmentFormModal.jsx';
import { ShipmentDetailModal } from '../components/ShipmentDetailModal.jsx';

export function ShipmentListPage() {
  const { permissions, organization, role } = useAuth();
  const canCreate = permissions.includes('shipment:create');
  const canUpdate = permissions.includes('shipment:update');

  // Query & Pagination state
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder
      });

      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);

      const data = await apiClient.get(`/shipments?${params.toString()}`);
      setShipments(data.shipments || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      setError(err.message || 'Failed to retrieve shipments');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleCreateNew = () => {
    setEditingShipment(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (shipment) => {
    setEditingShipment(shipment);
    setIsFormModalOpen(true);
  };

  const handleViewDetails = (shipment) => {
    setSelectedShipment(shipment);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-bold text-white tracking-tight">Cargo Shipments</h2>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-blue-950/80 text-blue-300 border border-blue-800">
              {pagination.total} {pagination.total === 1 ? 'Shipment' : 'Shipments'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational shipment ledger and consignment tracking for {organization?.name}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchShipments}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
            title="Refresh shipments"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {canCreate && (
            <button
              onClick={handleCreateNew}
              className="flex items-center space-x-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm font-medium transition cursor-pointer"
            >
              <PackagePlus className="h-4 w-4" />
              <span>Register Shipment</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Bar */}
      <ShipmentFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-900 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table or Empty States */}
      {loading ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-mono text-xs">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-400 mb-2" />
          <span>Loading authorized shipment records...</span>
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-12 text-center">
          {search || status ? (
            <div className="max-w-md mx-auto space-y-3">
              <FilterX className="h-8 w-8 mx-auto text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-200">No Matching Shipments Found</h3>
              <p className="text-xs text-slate-400">
                No shipments in your organization match the current search filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 font-mono transition cursor-pointer"
              >
                Clear Search Filters
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto space-y-3">
              <Inbox className="h-8 w-8 mx-auto text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-200">No Shipments Registered Yet</h3>
              <p className="text-xs text-slate-400">
                Your organization has no registered cargo shipments in the ledger.
              </p>
              {canCreate && (
                <button
                  onClick={handleCreateNew}
                  className="mt-2 inline-flex items-center space-x-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition cursor-pointer"
                >
                  <PackagePlus className="h-4 w-4" />
                  <span>Register First Shipment</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-medium">Reference & Status</th>
                  <th className="py-3 px-4 font-medium">Description</th>
                  <th className="py-3 px-4 font-medium">Transport Route</th>
                  <th className="py-3 px-4 font-medium">Carrier / Tracking</th>
                  <th className="py-3 px-4 font-medium">Expected Arrival</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {shipments.map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{shipment.shipmentReference}</div>
                      <div className="mt-1">
                        <ShipmentStatusBadge status={shipment.status} />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-sans text-slate-300 max-w-xs truncate">
                      {shipment.description}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <span className="truncate max-w-[120px]">{shipment.origin}</span>
                        <ArrowRight className="h-3 w-3 text-blue-400 shrink-0" />
                        <span className="truncate max-w-[120px]">{shipment.destination}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-sans">{shipment.carrier || '—'}</div>
                      <div className="text-slate-500 text-[11px] font-mono">{shipment.trackingReference || 'No tracking ref'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {shipment.expectedArrival
                        ? new Date(shipment.expectedArrival).toLocaleDateString()
                        : 'Unscheduled'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleViewDetails(shipment)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 text-xs font-sans transition cursor-pointer flex items-center space-x-1"
                          title="Open Shipment Workspace"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Open Workspace</span>
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(shipment)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-blue-300 border border-slate-800 transition cursor-pointer"
                            title="Edit Shipment"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div>
              Showing <span className="text-slate-200 font-semibold">{shipments.length}</span> of{' '}
              <span className="text-slate-200 font-semibold">{pagination.total}</span> records
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-2 text-slate-300">
                  Page {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <ShipmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        shipment={editingShipment}
        onSuccess={fetchShipments}
      />

      {/* Detail Modal */}
      <ShipmentDetailModal
        isOpen={Boolean(selectedShipment)}
        onClose={() => setSelectedShipment(null)}
        shipment={selectedShipment}
        onEdit={handleEdit}
      />
    </div>
  );
}
