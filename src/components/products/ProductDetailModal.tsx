import React from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Product } from '../../types';
import { defaultProductImage, resolveProductImageUrl } from '../../lib/productImage';
import {
  X,
  Package,
  Building2,
  AlertTriangle,
  History,
  Tag,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onEdit,
}) => {
  const { warehouses, categories, stockLevels, ledger } = useIMSStore();

  if (!product) return null;

  const category = categories.find((c) => c.id === product.category_id);
  const totalQty = stockLevels
    .filter((sl) => sl.product_id === product.id)
    .reduce((sum, item) => sum + Number(item.quantity), 0);

  const isLowStock = totalQty <= product.reorder_level && totalQty > 0;
  const isOutOfStock = totalQty === 0;

  const productLedger = ledger.filter((l) => l.product_id === product.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-800 pb-6 mb-6">
          <div className="w-24 h-24 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
            <img
              src={resolveProductImageUrl(product.image_url)}
              alt={product.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultProductImage;
              }}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                {product.sku}
              </span>
              {category && (
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs">
                  {category.name}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-extrabold text-white mb-2">{product.name}</h2>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Unit:</span>
                <strong className="text-slate-200 uppercase font-mono">{product.unit_of_measure}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Reorder Level:</span>
                <strong className="text-amber-400 font-mono">{product.reorder_level} {product.unit_of_measure}</strong>
              </div>
            </div>
          </div>

          <div className="text-right sm:self-center">
            <div className="text-xs text-slate-400 mb-1">Total System Stock</div>
            <div className={`text-3xl font-extrabold font-mono ${isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
              {totalQty} <span className="text-sm font-normal text-slate-400">{product.unit_of_measure}</span>
            </div>
            {isOutOfStock && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px] font-bold">
                OUT OF STOCK
              </span>
            )}
            {isLowStock && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                LOW STOCK ALERT
              </span>
            )}
          </div>
        </div>

        {/* Stock Availability Per Warehouse */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Stock Availability by Warehouse</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {warehouses.map((wh) => {
              const qty = stockLevels
                .filter((sl) => sl.product_id === product.id && sl.warehouse_id === wh.id)
                .reduce((sum, item) => sum + Number(item.quantity), 0);

              return (
                <div
                  key={wh.id}
                  className="p-4 rounded-2xl glass-card border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{wh.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{wh.code}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold font-mono ${qty === 0 ? 'text-slate-500' : 'text-indigo-300'}`}>
                      {qty}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">{product.unit_of_measure}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Movement History Ledger for Product */}
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Product Ledger History ({productLedger.length})</span>
          </h3>

          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {productLedger.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">No ledger entries logged yet for this product.</p>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Change</th>
                      <th className="py-2.5 px-3">After Qty</th>
                      <th className="py-2.5 px-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {productLedger.map((led) => (
                      <tr key={led.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(led.performed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span
                            className={
                              led.movement_type === 'IN'
                                ? 'text-emerald-400'
                                : led.movement_type === 'OUT'
                                ? 'text-blue-400'
                                : 'text-amber-400'
                            }
                          >
                            {led.movement_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {led.quantity_change > 0 ? `+${led.quantity_change}` : led.quantity_change} {product.unit_of_measure}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {led.quantity_after} {product.unit_of_measure}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{led.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
          >
            Edit Product Configuration
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
