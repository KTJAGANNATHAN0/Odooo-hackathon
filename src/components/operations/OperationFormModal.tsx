import React, { useState, useEffect } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { OperationType, UnitOfMeasure } from '../../types';
import {
  X,
  Plus,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface OperationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType: OperationType;
}

interface FormLine {
  product_id: string;
  expected_qty: number;
  unit_of_measure: UnitOfMeasure;
}

export const OperationFormModal: React.FC<OperationFormModalProps> = ({
  isOpen,
  onClose,
  defaultType,
}) => {
  const { products, warehouses, createOperation, getProductWarehouseStock } = useIMSStore();

  const [type, setType] = useState<OperationType>(defaultType);
  const [partyName, setPartyName] = useState('');
  const [sourceWhId, setSourceWhId] = useState('');
  const [destWhId, setDestWhId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<FormLine[]>([]);

  useEffect(() => {
    setType(defaultType);
    setPartyName('');
    setNotes('');
    const firstWh = warehouses[0]?.id || '';
    const secondWh = warehouses[1]?.id || warehouses[0]?.id || '';
    setSourceWhId(firstWh);
    setDestWhId(secondWh);

    if (products.length > 0) {
      setLines([
        {
          product_id: products[0].id,
          expected_qty: 10,
          unit_of_measure: products[0].unit_of_measure,
        },
      ]);
    }
  }, [defaultType, isOpen, products, warehouses]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    if (products.length === 0) return;
    setLines([
      ...lines,
      {
        product_id: products[0].id,
        expected_qty: 10,
        unit_of_measure: products[0].unit_of_measure,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleProductChange = (idx: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    const uom = prod ? prod.unit_of_measure : 'pcs';
    setLines(
      lines.map((l, i) => (i === idx ? { ...l, product_id: productId, unit_of_measure: uom } : l))
    );
  };

  const handleQtyChange = (idx: number, qty: number) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, expected_qty: qty } : l)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert('Please add at least one line item to create an operation document.');
      return;
    }

    createOperation({
      type,
      supplier_or_customer: partyName,
      source_warehouse_id: type === 'receipt' ? undefined : sourceWhId,
      destination_warehouse_id: type === 'delivery' ? undefined : destWhId,
      notes,
      lines,
    });

    onClose();
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'receipt':
        return 'Create Goods Receipt (Incoming)';
      case 'delivery':
        return 'Create Delivery Order (Outgoing)';
      case 'transfer':
        return 'Create Internal Warehouse Transfer';
      case 'adjustment':
        return 'Create Stock Audit Adjustment';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {type === 'receipt' && <ArrowDownLeft className="w-5 h-5 text-emerald-400" />}
            {type === 'delivery' && <ArrowUpRight className="w-5 h-5 text-blue-400" />}
            {type === 'transfer' && <ArrowLeftRight className="w-5 h-5 text-purple-400" />}
            {type === 'adjustment' && <SlidersHorizontal className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{getTypeTitle()}</h2>
            <p className="text-xs text-slate-400">Generate reference document and specify expected stock quantities</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {type === 'receipt' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Apex Metal Supplies Ltd"
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {type === 'delivery' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="e.g. Volt Motors Tech Inc"
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {type !== 'receipt' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source Warehouse *</label>
                <select
                  value={sourceWhId}
                  onChange={(e) => setSourceWhId(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type !== 'delivery' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Warehouse *</label>
                <select
                  value={destWhId}
                  onChange={(e) => setDestWhId(e.target.value)}
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Operation Line Items ({lines.length})
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line Product
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {lines.map((line, idx) => {
                const available = type !== 'receipt' ? getProductWarehouseStock(line.product_id, sourceWhId) : null;
                const isInsufficient = available !== null && available < line.expected_qty;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <label className="block text-[10px] text-slate-400 mb-1">Product</label>
                      <select
                        value={line.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full bg-slate-900 text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-700"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.sku}] {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-36">
                      <label className="block text-[10px] text-slate-400 mb-1">Expected Qty ({line.unit_of_measure})</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={line.expected_qty}
                        onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                        className="w-full bg-slate-900 font-mono text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-700"
                      />
                    </div>

                    {available !== null && (
                      <div className="text-right sm:self-center shrink-0">
                        <div className="text-[10px] text-slate-400">Current Stock</div>
                        <div className={`font-mono text-xs font-bold ${isInsufficient ? 'text-red-400' : 'text-emerald-400'}`}>
                          {available} {line.unit_of_measure}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add shipping notes, purchase order references, or shelf locations..."
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-xl p-3 border border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
            >
              Generate Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
