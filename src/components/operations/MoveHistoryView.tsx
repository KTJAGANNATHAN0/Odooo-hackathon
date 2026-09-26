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
} from 'lucide-react';

interface MoveHistoryViewProps {
  searchQuery: string;
}

export const MoveHistoryView: React.FC<MoveHistoryViewProps> = ({ searchQuery }) => {
  const { ledger, products, warehouses, activeWarehouseId } = useIMSStore();

  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredLedger = ledger.filter((item) => {
    // Warehouse filter
    if (activeWarehouseId !== 'all' && item.warehouse_id !== activeWarehouseId) return false;

    // Movement type filter
    if (selectedType !== 'all' && item.movement_type !== selectedType) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const prod = products.find((p) => p.id === item.product_id);
      const matchProd = prod?.name.toLowerCase().includes(q) || prod?.sku.toLowerCase().includes(q);
      const matchRef = item.reference_no?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      return matchProd || matchRef || matchNotes;
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Reference No', 'Product Name', 'SKU', 'Warehouse', 'Movement Type', 'Quantity Change', 'Quantity After', 'Performed By', 'Notes'];
    
    const rows = filteredLedger.map((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      const wh = warehouses.find((w) => w.id === item.warehouse_id);
      return [
        item.id,
        new Date(item.performed_at).toISOString(),
        item.reference_no || 'N/A',
        `"${prod?.name || ''}"`,
        prod?.sku || '',
        wh?.code || '',
        item.movement_type,
        item.quantity_change,
        item.quantity_after,
        `"${item.performed_by}"`,
        `"${item.notes || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stock_ledger_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStyle = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
      case 'OUT':
        return 'bg-blue-950/60 text-blue-400 border-blue-500/30';
      case 'TRANSFER_IN':
      case 'TRANSFER_OUT':
        return 'bg-purple-950/60 text-purple-400 border-purple-500/30';
      case 'ADJUST':
        return 'bg-amber-950/60 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Immutable Stock Audit Ledger</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Stock Move History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete trace of every quantity increase, decrease, internal transfer, and inventory correction.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4 text-cyan-400" /> Export to CSV
        </button>
      </div>

      {/* Filter Bar & Ledger Table */}
      <div className="glass-card rounded-2xl border border-slate-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Ledger Entries ({filteredLedger.length})
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
                {t === 'all' ? 'All Types' : t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Ref No</th>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4">Qty Change</th>
                <th className="py-3 px-4">Resulting Qty</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No movement ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => {
                  const prod = products.find((p) => p.id === item.product_id);
                  const wh = warehouses.find((w) => w.id === item.warehouse_id);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(item.performed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {item.reference_no || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{prod?.name || 'Unknown Product'}</div>
                        <div className="text-[10px] text-indigo-400 font-mono">{prod?.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">{wh?.code || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getBadgeStyle(item.movement_type)}`}>
                          {item.movement_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        <span className={item.quantity_change > 0 ? 'text-emerald-400' : 'text-blue-400'}>
                          {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        {item.quantity_after} {prod?.unit_of_measure}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.performed_by}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{item.notes || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
