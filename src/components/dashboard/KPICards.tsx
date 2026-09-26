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
      title: 'Products in stock',
      value: kpis.totalProductsInStock,
      subInfo: 'Distinct SKUs with available stock',
      icon: <Boxes className="w-4 h-4 text-blue-700" />,
      tab: 'stock',
    },
    {
      title: 'Low stock',
      value: kpis.lowStockItemsCount,
      subInfo: 'At or below reorder threshold',
      icon: <AlertTriangle className="w-4 h-4 text-amber-700" />,
      tab: 'products',
    },
    {
      title: 'Out of stock',
      value: kpis.outOfStockItemsCount,
      subInfo: 'Products with zero available quantity',
      icon: <XCircle className="w-4 h-4 text-red-700" />,
      tab: 'products',
    },
    {
      title: 'Pending receipts',
      value: kpis.toReceiveCount,
      subInfo: `${kpis.receiptsLateCount} overdue`,
      icon: <ArrowDownLeft className="w-4 h-4 text-emerald-700" />,
      tab: 'receipts',
    },
    {
      title: 'Pending deliveries',
      value: kpis.toDeliverCount,
      subInfo: `${kpis.deliveriesWaitingCount} waiting for stock`,
      icon: <ArrowUpRight className="w-4 h-4 text-blue-700" />,
      tab: 'deliveries',
    },
    {
      title: 'Internal transfers',
      value: kpis.internalTransfersScheduledCount,
      subInfo: 'Scheduled or in progress',
      icon: <ArrowLeftRight className="w-4 h-4 text-slate-600" />,
      tab: 'transfers',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={() => onNavigateToTab && onNavigateToTab(card.tab)}
          className="glass-card p-4 text-left hover:border-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm font-medium text-slate-600">{card.title}</span>
            {card.icon}
          </div>
          <div className="text-2xl font-semibold text-slate-900 tabular-nums">{card.value}</div>
          <p className="text-xs text-slate-500 mt-1">{card.subInfo}</p>
        </button>
      ))}
    </div>
  );
};
