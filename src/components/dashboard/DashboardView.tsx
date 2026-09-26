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
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white text-amber-700 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm text-slate-900">
                {alertProducts.length} products need replenishment
              </div>
              <div className="text-xs text-slate-600">
                {alertProducts.map((p) => p.name).join(', ')}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('products')}
            className="px-3 py-2 rounded-md bg-white border border-amber-300 text-amber-800 font-semibold text-xs transition-all shrink-0"
          >
            Review Low Stock Products
          </button>
        </div>
      )}

      {/* Hero Banner & Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Inventory Overview
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Manage and monitor inventory operations across your warehouses.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenCreateOp('receipt')}
            className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" /> Receipt
          </button>
          <button
            onClick={() => onOpenCreateOp('delivery')}
            className="px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" /> Delivery
          </button>
          <button
            onClick={() => onOpenCreateOp('transfer')}
            className="px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transfer
          </button>
          <button
            onClick={() => onOpenCreateOp('adjustment')}
            className="px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-4 h-4" /> Adjustment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KPICards kpis={kpis} onNavigateToTab={onNavigateToTab} />

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 gap-4">
        <StockTrendChart />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] gap-4 items-start">
        <RecentOperationsTable
          searchQuery={searchQuery}
          onOpenValidate={onOpenValidate}
          onOpenDetail={onOpenDetail}
        />
        <LowStockBarChart />
      </div>
    </div>
  );
};
