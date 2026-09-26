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
} from 'lucide-react';

interface RecentOperationsTableProps {
  searchQuery: string;
  onOpenValidate: (op: Operation) => void;
  onOpenDetail: (op: Operation) => void;
  onNavigateToType?: (type: OperationType) => void;
}

export const RecentOperationsTable: React.FC<RecentOperationsTableProps> = ({
  searchQuery,
  onOpenValidate,
  onOpenDetail,
  onNavigateToType,
}) => {
  const { operations, warehouses, products, activeWarehouseId } = useIMSStore();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredOps = operations.filter((op) => {
    // Warehouse Filter
    if (activeWarehouseId !== 'all') {
      if (op.source_warehouse_id !== activeWarehouseId && op.destination_warehouse_id !== activeWarehouseId) {
        return false;
      }
    }

    // Type Filter
    if (selectedType !== 'all' && op.type !== selectedType) return false;

    // Status Filter
    if (selectedStatus !== 'all' && op.status !== selectedStatus) return false;

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = op.reference_no.toLowerCase().includes(q);
      const matchParty = op.supplier_or_customer?.toLowerCase().includes(q);
      const matchProduct = op.lines.some((l) => {
        const prod = products.find((p) => p.id === l.product_id);
        return prod?.name.toLowerCase().includes(q) || prod?.sku.toLowerCase().includes(q);
      });
      return matchRef || matchParty || matchProduct;
    }

    return true;
  });

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
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Ready to Validate
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

  const getTypeIcon = (type: OperationType) => {
    switch (type) {
      case 'receipt':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'delivery':
        return <ArrowUpRight className="w-4 h-4 text-blue-400" />;
      case 'transfer':
        return <ArrowLeftRight className="w-4 h-4 text-purple-400" />;
      case 'adjustment':
        return <SlidersHorizontal className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 p-5">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Operations & Movement Ledger</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time track of incoming receipts, delivery orders, internal transfers & inventory counts
          </p>
        </div>

        {/* Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Type Filter Pill */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80">
            {['all', 'receipt', 'delivery', 'transfer', 'adjustment'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  selectedType === t
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 text-slate-300 text-xs font-medium rounded-xl px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="waiting">Waiting</option>
            <option value="ready">Ready</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Reference No</th>
              <th className="py-3 px-4">Document Type</th>
              <th className="py-3 px-4">Party / Source → Dest</th>
              <th className="py-3 px-4">Items / Qty</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredOps.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500">
                  No operations match your current search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredOps.map((op) => {
                const srcWh = warehouses.find((w) => w.id === op.source_warehouse_id)?.code || '—';
                const destWh = warehouses.find((w) => w.id === op.destination_warehouse_id)?.code || '—';

                return (
                  <tr key={op.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{op.reference_no}</td>
                    <td className="py-3 px-4 capitalize">
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        {getTypeIcon(op.type)}
                        <span>{op.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {op.type === 'receipt' && (
                        <span>Vendor: <strong className="text-slate-200">{op.supplier_or_customer || 'Vendor'}</strong> → {destWh}</span>
                      )}
                      {op.type === 'delivery' && (
                        <span>{srcWh} → <strong className="text-slate-200">{op.supplier_or_customer || 'Customer'}</strong></span>
                      )}
                      {op.type === 'transfer' && (
                        <span>{srcWh} → {destWh}</span>
                      )}
                      {op.type === 'adjustment' && (
                        <span>Audit Wh: {srcWh}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {op.lines.length} line(s)
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(op.status)}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(op.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenDetail(op)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        {op.status !== 'done' && op.status !== 'canceled' && (
                          <button
                            onClick={() => onOpenValidate(op)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-semibold flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" /> Validate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
