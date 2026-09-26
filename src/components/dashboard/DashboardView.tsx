import React from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { KPICards } from './KPICards';
import { StockTrendChart } from './StockTrendChart';
import { LowStockBarChart } from './LowStockBarChart';
import { RecentOperationsTable } from './RecentOperationsTable';
import { Operation, OperationType } from '../../types';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  searchQuery: string;
  onOpenCreateOp: (type: OperationType) => void;
  onOpenValidate: (op: Operation) => void;
  onOpenDetail: (op: Operation) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  searchQuery,
  onOpenCreateOp,
  onOpenValidate,
  onOpenDetail,
  onNavigateToTab,
}) => {
  const { getKPIs, products, stockLevels, activeWarehouseId } = useIMSStore();
  const kpis = getKPIs();

  // Find products below reorder level
  const alertProducts = products.filter((p) => {
    const qty = stockLevels
      .filter((sl) => sl.product_id === p.id && (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId))
      .reduce((sum, item) => sum + Number(item.quantity), 0);
    return qty <= p.reorder_level;
  });

  return (
    <div className="space-y-6">
      {/* Alert Banner if any stock low */}
      {alertProducts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">
                Low Stock Warning: {alertProducts.length} Product(s) Require Reordering!
              </div>
              <div className="text-xs text-amber-300/80">
                Critical items: {alertProducts.map((p) => p.name).join(', ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('products')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shrink-0"
          >
            Review Low Stock Products
          </button>
        </div>
      )}

      {/* Hero Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Odoo Inventory Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Real-time tracking of stock receipts, delivery pick-and-packs, internal transfers, and physical audit counts.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenCreateOp('receipt')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" /> Receipt
          </button>
          <button
            onClick={() => onOpenCreateOp('delivery')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" /> Delivery
          </button>
          <button
            onClick={() => onOpenCreateOp('transfer')}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </button>
          <button
            onClick={() => onOpenCreateOp('adjustment')}
            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-600/30 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" /> Adjustment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KPICards kpis={kpis} />

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StockTrendChart />
        <LowStockBarChart />
      </div>

      {/* Recent Operations Table */}
      <RecentOperationsTable
        searchQuery={searchQuery}
        onOpenValidate={onOpenValidate}
        onOpenDetail={onOpenDetail}
      />
    </div>
  );
};
