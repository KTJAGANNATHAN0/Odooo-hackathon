import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Operation, OperationType } from '../../types';
import { RecentOperationsTable } from '../dashboard/RecentOperationsTable';
import { OperationFormModal } from './OperationFormModal';
import { ValidateOperationModal } from './ValidateOperationModal';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Check,
} from 'lucide-react';

interface OperationsViewProps {
  type: OperationType;
  searchQuery: string;
}

export const OperationsView: React.FC<OperationsViewProps> = ({ type, searchQuery }) => {
  const { operations, warehouses } = useIMSStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [opToValidate, setOpToValidate] = useState<Operation | null>(null);

  const filteredOps = operations.filter((op) => op.type === type);

  const getHeaderInfo = () => {
    switch (type) {
      case 'receipt':
        return {
          title: 'Incoming Receipts (Goods Received)',
          desc: 'Manage incoming shipments from vendors. Validating increases warehouse stock levels.',
          icon: <ArrowDownLeft className="w-6 h-6 text-emerald-400" />,
          buttonText: 'Create Goods Receipt',
          color: 'emerald',
        };
      case 'delivery':
        return {
          title: 'Delivery Orders (Outgoing Stock)',
          desc: 'Manage customer sales dispatches and picking lists. Validating decrements warehouse stock levels.',
          icon: <ArrowUpRight className="w-6 h-6 text-blue-400" />,
          buttonText: 'Create Delivery Order',
          color: 'blue',
        };
      case 'transfer':
        return {
          title: 'Internal Warehouse Transfers',
          desc: 'Relocate stock between warehouses, factory floors, or storage racks. Logs double-entry ledger shifts.',
          icon: <ArrowLeftRight className="w-6 h-6 text-purple-400" />,
          buttonText: 'Create Internal Transfer',
          color: 'purple',
        };
      case 'adjustment':
        return {
          title: 'Stock Count Adjustments',
          desc: 'Fix inventory discrepancies between physical count and recorded system stock.',
          icon: <SlidersHorizontal className="w-6 h-6 text-amber-400" />,
          buttonText: 'Perform Stock Adjustment',
          color: 'amber',
        };
    }
  };

  const info = getHeaderInfo();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {info.icon}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{info.title}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">{info.desc}</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> {info.buttonText}
        </button>
      </div>

      {/* Main Table Container */}
      <RecentOperationsTable
        filterType={type}
        searchQuery={searchQuery}
        onOpenValidate={(op) => setOpToValidate(op)}
        onOpenDetail={(op) => setOpToValidate(op)}
      />

      {/* Modals */}
      <OperationFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultType={type}
      />

      <ValidateOperationModal
        operation={opToValidate}
        onClose={() => setOpToValidate(null)}
      />
    </div>
  );
};
