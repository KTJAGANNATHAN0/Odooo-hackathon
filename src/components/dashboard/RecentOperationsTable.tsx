import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Operation, OperationType, OperationStatus } from '../../types';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  Filter,
  Eye,
  Check,
  Printer,
  Grid,
  List as ListIcon,
  Building2,
  MapPin,
  Play,
} from 'lucide-react';

import { PrintOperationModal } from '../operations/PrintOperationModal';

interface RecentOperationsTableProps {
  searchQuery: string;
  onOpenValidate: (op: Operation) => void;
  onOpenDetail: (op: Operation) => void;
  filterType?: OperationType;
}

export const RecentOperationsTable: React.FC<RecentOperationsTableProps> = ({
  searchQuery,
  onOpenValidate,
  onOpenDetail,
  filterType,
}) => {
  const { operations, warehouses, products, categories, activeWarehouseId, locations, markAsReady, cancelOperation } = useIMSStore();

  const [selectedType, setSelectedType] = useState<string>(filterType || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [opToPrint, setOpToPrint] = useState<Operation | null>(null);

  const filteredOps = operations.filter((op) => {
    // Override filterType if passed
    const targetType = filterType || selectedType;

    // Warehouse Filter
    if (activeWarehouseId !== 'all') {
      if (op.source_warehouse_id !== activeWarehouseId && op.destination_warehouse_id !== activeWarehouseId) {
        return false;
      }
    }

    // Type Filter (Receipts / Delivery / Internal / Adjustments)
    if (targetType !== 'all' && op.type !== targetType) return false;

    // Status Filter (Draft, Waiting, Ready, Done, Canceled)
    if (selectedStatus !== 'all' && op.status !== selectedStatus) return false;

    // Product Category Filter
    if (selectedCategory !== 'all') {
      const matchCat = op.lines.some((line) => {
        const prod = products.find((p) => p.id === line.product_id);
        return prod?.category_id === selectedCategory;
      });
      if (!matchCat) return false;
    }

    // Location Filter
    if (selectedLocation !== 'all') {
      const loc = locations.find((l) => l.id === selectedLocation);
      if (loc) {
        const matchesWh = op.source_warehouse_id === loc.warehouse_id || op.destination_warehouse_id === loc.warehouse_id;
        if (!matchesWh) return false;
      }
    }

    // Search Query Filter (Reference or Contact/Party)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = op.reference_no.toLowerCase().includes(q);
      const matchParty = op.supplier_or_customer?.toLowerCase().includes(q);
      return matchRef || matchParty;
    }

    return true;
  });

  const handlePrint = (op: Operation) => {
    setOpToPrint(op);
  };

  const getEmptyStateText = () => {
    if (filterType === 'receipt' || selectedType === 'receipt') {
      return 'Populate all work orders added to manufacturing order';
    }
    if (filterType === 'delivery' || selectedType === 'delivery') {
      return 'Populate all delivery orders';
    }
    return 'No inventory operations match your search criteria';
  };

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Draft
          </span>
        );
      case 'waiting':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Waiting Stock
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Ready
          </span>
        );
      case 'done':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Done
          </span>
        );
      case 'canceled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/30 flex items-center gap-1.5 w-fit">
            <Ban className="w-3.5 h-3.5 text-red-400" /> Canceled
          </span>
        );
    }
  };

  const availableLocations = activeWarehouseId === 'all'
    ? locations
    : locations.filter((l) => l.warehouse_id === activeWarehouseId);

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl border border-slate-800 p-5">
        {/* Header & Dynamic Filters Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Operations Registry</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reference format: WH/IN/XXXX for receipts, WH/OUT/XXXX for deliveries, WH/INT/XXXX for transfers
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* List ↔ Kanban Toggle */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5" /> List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" /> Kanban
              </button>
            </div>

            {/* Document Type Select (when not scoped by parent view) */}
            {!filterType && (
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-900 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
                title="Filter by document type"
              >
                <option value="all">All Document Types</option>
                <option value="receipt">Receipts (Incoming)</option>
                <option value="delivery">Delivery Orders (Outgoing)</option>
                <option value="transfer">Internal Transfers</option>
                <option value="adjustment">Stock Adjustments</option>
              </select>
            )}

            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-900 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
              title="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>

            {/* Product Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
              title="Filter by product category"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Location Select */}
            {availableLocations.length > 0 && (
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-slate-900 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
                title="Filter by warehouse location"
              >
                <option value="all">All Locations</option>
                {availableLocations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content Mode */}
        {filteredOps.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="max-w-md mx-auto">{getEmptyStateText()}</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View Table (Reference · From · To · Contact · Schedule Date · Status · Actions) */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Schedule Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOps.map((op) => {
                  const srcWh = warehouses.find((w) => w.id === op.source_warehouse_id)?.code || 'Vendor';
                  const destWh = warehouses.find((w) => w.id === op.destination_warehouse_id)?.code || 'Customer';

                  return (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{op.reference_no}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">
                        {op.type === 'receipt' ? op.supplier_or_customer || 'Vendor' : srcWh}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-300">
                        {op.type === 'receipt' ? destWh : op.supplier_or_customer || destWh}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{op.supplier_or_customer || op.responsible_name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{op.schedule_date}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(op.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* TODO button for Draft state */}
                          {op.status === 'draft' && (
                            <button
                              onClick={() => markAsReady(op.id)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1"
                            >
                              <Play className="w-3.5 h-3.5" /> TODO
                            </button>
                          )}

                          {/* Validate button for Ready state */}
                          {op.status === 'ready' && (
                            <button
                              onClick={() => onOpenValidate(op)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Validate
                            </button>
                          )}

                          {/* Print button when status = Done */}
                          {op.status === 'done' && (
                            <button
                              onClick={() => handlePrint(op)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5 text-indigo-400" /> Print
                            </button>
                          )}

                          {op.status !== 'done' && op.status !== 'canceled' && (
                            <button
                              onClick={() => cancelOperation(op.id)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-red-400 hover:bg-slate-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Kanban View Toggle */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['draft', 'waiting', 'ready', 'done'].map((st) => {
              const opsByStatus = filteredOps.filter((o) => o.status === st);
              return (
                <div key={st} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{st}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-800 text-slate-400">
                      {opsByStatus.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {opsByStatus.map((op) => (
                      <div
                        key={op.id}
                        className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-xs text-indigo-300">{op.reference_no}</span>
                          <span className="text-[10px] font-mono text-slate-500">{op.schedule_date}</span>
                        </div>
                        <div className="text-xs text-slate-300">{op.supplier_or_customer || 'Internal'}</div>
                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-700/50">
                          <span className="text-slate-400">{op.lines.length} Line Items</span>
                          {op.status === 'draft' && (
                            <button
                              onClick={() => markAsReady(op.id)}
                              className="text-indigo-400 font-bold hover:underline"
                            >
                              Click TODO
                            </button>
                          )}
                          {op.status === 'ready' && (
                            <button
                              onClick={() => onOpenValidate(op)}
                              className="text-emerald-400 font-bold hover:underline"
                            >
                              Validate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wireframe Location Section Below Table for Receipts */}
      {(filterType === 'receipt' || selectedType === 'receipt') && (
        <div className="glass-card rounded-2xl border border-slate-800 p-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Locations of Warehouse</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {locations.map((loc) => (
              <div key={loc.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-xs font-bold text-white">{loc.name}</div>
                <div className="text-[10px] text-indigo-400 font-mono">{loc.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Receipt / Delivery Slip Modal */}
      <PrintOperationModal
        operation={opToPrint}
        onClose={() => setOpToPrint(null)}
      />
    </div>
  );
};
