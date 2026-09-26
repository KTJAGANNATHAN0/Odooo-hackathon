import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { MovementType } from '../../types';
import {
  History,
  Download,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Building2,
  Grid,
  List as ListIcon,
  FileText,
} from 'lucide-react';

interface MoveHistoryViewProps {
  searchQuery: string;
}

export const MoveHistoryView: React.FC<MoveHistoryViewProps> = ({ searchQuery }) => {
  const { ledger, products, warehouses, activeWarehouseId } = useIMSStore();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const filteredLedger = ledger.filter((item) => {
    // Warehouse filter
    if (activeWarehouseId !== 'all' && item.warehouse_id !== activeWarehouseId) return false;

    // Movement type filter
    if (selectedType !== 'all' && item.movement_type !== selectedType) return false;

    // Search filter (by reference and contact)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const prod = products.find((p) => p.id === item.product_id);
      const matchProd = prod?.name.toLowerCase().includes(q) || prod?.sku.toLowerCase().includes(q);
      const matchRef = item.reference_no?.toLowerCase().includes(q);
      const matchContact = item.performed_by?.toLowerCase().includes(q) || item.notes?.toLowerCase().includes(q);
      return matchProd || matchRef || matchContact;
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = [
      'Reference',
      'Date & Time',
      'Contact',
      'From Location',
      'To Location',
      'Product SKU',
      'Product Name',
      'Movement Type',
      'Quantity Change',
      'Status',
    ];

    const rows = filteredLedger.map((item) => {
      const prod = products.find((p) => p.id === item.product_id);

      // Safe, full timestamp formatting (YYYY-MM-DD HH:mm:ss)
      let formattedDate = 'N/A';
      try {
        if (item.performed_at) {
          const d = new Date(item.performed_at);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => n.toString().padStart(2, '0');
            formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
          }
        }
      } catch {
        formattedDate = String(item.performed_at || 'N/A');
      }

      return [
        `"${item.reference_no || 'WH/IN/0001'}"`,
        `"${formattedDate}"`,
        `"${(item.performed_by || '').replace(/"/g, '""')}"`,
        `"${(item.from_location || 'Vendor').replace(/"/g, '""')}"`,
        `"${(item.to_location || 'WH/Stock1').replace(/"/g, '""')}"`,
        `"${prod?.sku || ''}"`,
        `"${(prod?.name || '').replace(/"/g, '""')}"`,
        `"${item.movement_type}"`,
        item.quantity_change,
        '"Done"',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_move_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Immutable Stock Movement Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Move History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Green rows indicate incoming (IN) stock, red rows indicate outgoing (OUT) stock movements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* List ↔ Kanban Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4 text-cyan-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar & Ledger Table */}
      <div className="glass-card rounded-2xl border border-slate-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Move Ledger Entries ({filteredLedger.length})
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
            {['all', 'IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUST'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-all ${
                  selectedType === t
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Moves' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {filteredLedger.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">Populate all moves between the From-To location in inventory</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View Table with Wireframe Columns: Reference · Date · Contact · From · To · Quantity · Status */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">From</th>
                  <th className="py-3 px-4">To</th>
                  <th className="py-3 px-4">Product & Quantity</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLedger.map((item) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  const isIncoming = item.movement_type === 'IN' || item.movement_type === 'TRANSFER_IN';
                  const isOutgoing = item.movement_type === 'OUT' || item.movement_type === 'TRANSFER_OUT';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isIncoming
                          ? 'bg-emerald-950/20 hover:bg-emerald-950/30'
                          : isOutgoing
                          ? 'bg-red-950/20 hover:bg-red-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                        {item.reference_no || 'WH/IN/0001'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">
                        {new Date(item.performed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">{item.performed_by}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{item.from_location || 'Vendor'}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{item.to_location || 'WH/Stock1'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <div className="text-white">{prod?.name}</div>
                        <div className={`text-xs ${isIncoming ? 'text-emerald-400' : isOutgoing ? 'text-red-400' : 'text-amber-400'}`}>
                          {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change} {prod?.unit_of_measure}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Done
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Kanban View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLedger.map((item) => {
              const prod = products.find((p) => p.id === item.product_id);
              const isIncoming = item.movement_type === 'IN' || item.movement_type === 'TRANSFER_IN';
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border ${
                    isIncoming ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-bold text-xs text-white">{item.reference_no}</span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(item.performed_at).toLocaleDateString()}</span>
                  </div>
                  <div className="font-bold text-sm text-slate-200">{prod?.name}</div>
                  <div className="text-xs text-slate-400 mt-1">From: {item.from_location} → To: {item.to_location}</div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono font-bold">
                    <span className={isIncoming ? 'text-emerald-400' : 'text-red-400'}>
                      {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change} {prod?.unit_of_measure}
                    </span>
                    <span className="text-emerald-400">Done</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
