import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export function ShipmentFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by reference, description, carrier, tracking, or route..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center space-x-3 shrink-0">
        {/* Status Filter */}
        <div className="flex items-center space-x-1.5 font-mono">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="ARRIVED">Arrived</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-1.5 font-mono">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Date Created</option>
            <option value="expectedArrival">Expected Arrival</option>
            <option value="shipmentReference">Reference</option>
            <option value="status">Status</option>
            <option value="origin">Origin</option>
            <option value="destination">Destination</option>
          </select>

          <button
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition font-mono cursor-pointer"
            title={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
}
