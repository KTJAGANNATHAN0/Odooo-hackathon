import React, { useState, useEffect } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Operation } from '../../types';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Check } from 'lucide-react';

interface ValidateOperationModalProps {
  operation: Operation | null;
  onClose: () => void;
}

export const ValidateOperationModal: React.FC<ValidateOperationModalProps> = ({
  operation,
  onClose,
}) => {
  const { validateOperation, products, warehouses } = useIMSStore();

  const [actuals, setActuals] = useState<{ product_id: string; actual_qty: number }[]>([]);

  useEffect(() => {
    if (operation) {
      setActuals(
        operation.lines.map((l) => ({
          product_id: l.product_id,
          actual_qty: l.actual_qty ?? l.expected_qty,
        }))
      );
    }
  }, [operation]);

  if (!operation) return null;

  const handleValidate = () => {
    const res = validateOperation(operation.id, actuals);

    if (res.success) {
      // Trigger canvas confetti burst
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#f59e0b', '#3b82f6'],
        });
      } catch (err) {
        // ignore if confetti fails
      }
      onClose();
    } else {
      alert(res.message);
    }
  };

  const srcWh = warehouses.find((w) => w.id === operation.source_warehouse_id)?.name;
  const destWh = warehouses.find((w) => w.id === operation.destination_warehouse_id)?.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-emerald-400">{operation.reference_no}</div>
            <h2 className="text-xl font-bold text-white">Validate & Finalize Operation</h2>
          </div>
        </div>

        {/* Operation Info Card */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 mb-6 flex flex-col sm:flex-row justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400">Type:</span>{' '}
            <strong className="text-white capitalize">{operation.type}</strong>
          </div>
          {operation.supplier_or_customer && (
            <div>
              <span className="text-slate-400">Party:</span>{' '}
              <strong className="text-white">{operation.supplier_or_customer}</strong>
            </div>
          )}
          {srcWh && (
            <div>
              <span className="text-slate-400">Source:</span> <strong className="text-white">{srcWh}</strong>
            </div>
          )}
          {destWh && (
            <div>
              <span className="text-slate-400">Destination:</span> <strong className="text-white">{destWh}</strong>
            </div>
          )}
        </div>

        {/* Line Items Actual Qty Inputs */}
        <div className="space-y-4 mb-6">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            Confirm Received / Picked Quantities
          </label>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {operation.lines.map((line) => {
              const prod = products.find((p) => p.id === line.product_id);
              const currentActual = actuals.find((a) => a.product_id === line.product_id)?.actual_qty ?? line.expected_qty;

              return (
                <div
                  key={line.id}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{prod?.name || 'Product'}</div>
                    <div className="text-xs text-slate-400 font-mono">SKU: {prod?.sku}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Expected</div>
                      <div className="font-mono text-xs font-bold text-slate-300">
                        {line.expected_qty} {line.unit_of_measure}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-emerald-400 font-bold">Actual Verified</div>
                      <input
                        type="number"
                        min={0}
                        value={currentActual}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setActuals((prev) =>
                            prev.map((a) => (a.product_id === line.product_id ? { ...a, actual_qty: val } : a))
                          );
                        }}
                        className="w-28 bg-slate-900 text-emerald-300 font-mono text-sm font-bold rounded-xl px-3 py-1.5 border border-emerald-500/40 focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleValidate}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Validate & Update Stock
          </button>
        </div>
      </div>
    </div>
  );
};
