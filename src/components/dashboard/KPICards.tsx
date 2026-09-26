import React from 'react';
import {
  Boxes,
  AlertTriangle,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Clock,
} from 'lucide-react';
import { DashboardKPIs } from '../../types';

interface KPICardsProps {
  kpis: DashboardKPIs;
  onNavigateToTab?: (tab: string) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, onNavigateToTab }) => {
  const cards = [
    {
      title: 'Receipts',
      value: `${kpis.toReceiveCount} to receive`,
      subInfo: `${kpis.receiptsLateCount} Late · ${kpis.receiptsOperationsCount} operations`,
      icon: <ArrowDownLeft className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
      pillBg: 'bg-emerald-500/20 text-emerald-300',
      tab: 'receipts',
    },
    {
      title: 'Delivery Orders',
      value: `${kpis.toDeliverCount} to Deliver`,
      subInfo: `${kpis.deliveriesLateCount} Late · ${kpis.deliveriesWaitingCount} waiting · ${kpis.deliveriesOperationsCount} operations`,
      icon: <ArrowUpRight className="w-5 h-5 text-blue-400" />,
      bg: 'bg-blue-950/40 border-blue-500/30 text-blue-300',
      pillBg: 'bg-blue-500/20 text-blue-300',
      tab: 'deliveries',
    },
    {
      title: 'Transfers Scheduled',
      value: `${kpis.internalTransfersScheduledCount} scheduled`,
      subInfo: 'Internal inter-warehouse shifts',
      icon: <ArrowLeftRight className="w-5 h-5 text-purple-400" />,
      bg: 'bg-purple-950/40 border-purple-500/30 text-purple-300',
      pillBg: 'bg-purple-500/20 text-purple-300',
      tab: 'transfers',
    },
    {
      title: 'Total Products In Stock',
      value: `${kpis.totalProductsInStock} SKUs`,
      subInfo: 'Distinct products with available stock',
      icon: <Boxes className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-950/40 border-indigo-500/20 text-indigo-300',
      pillBg: 'bg-indigo-500/20 text-indigo-300',
      tab: 'stock',
    },
    {
      title: 'Low Stock Warnings',
      value: `${kpis.lowStockItemsCount} Low Stock`,
      subInfo: 'Stock level ≤ Reorder Threshold',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
      pillBg: 'bg-amber-500/20 text-amber-300',
      tab: 'products',
    },
    {
      title: 'Out of Stock Alert',
      value: `${kpis.outOfStockItemsCount} Out of Stock`,
      subInfo: 'Zero inventory available',
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      bg: 'bg-red-950/40 border-red-500/30 text-red-300',
      pillBg: 'bg-red-500/20 text-red-300',
      tab: 'products',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          onClick={() => onNavigateToTab && onNavigateToTab(card.tab)}
          className={`glass-card p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${card.bg}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 tracking-wide truncate">{card.title}</span>
            <div className={`p-2 rounded-xl ${card.pillBg}`}>{card.icon}</div>
          </div>
          <div className="text-xl font-extrabold text-white font-mono">{card.value}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">{card.subInfo}</p>
        </div>
      ))}
    </div>
  );
};
