import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Boxes, Edit2, Check, MapPin } from 'lucide-react';

interface StockViewProps {
  searchQuery: string;
}

export const StockView: React.FC<StockViewProps> = ({ searchQuery }) => {
  const { products, stockLevels, operations, locations, updateStockDirectly, activeWarehouseId, warehouses } = useIMSStore();

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string>('wh-1');
  const [newQty, setNewQty] = useState<number>(0);

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  const handleStartEdit = (productId: string, currentOnHand: number) => {
    setEditingProductId(productId);
    setEditingWarehouseId(activeWarehouseId === 'all' ? 'wh-1' : activeWarehouseId);
    setNewQty(currentOnHand);
  };

  const handleSaveStock = (productId: string) => {
    updateStockDirectly(productId, editingWarehouseId, Number(newQty), 'Stock Page Quick Inline Update');
    setEditingProductId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Stock</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            On-hand, reserved, and available quantities by product and warehouse.
          </p>
        </div>
      </div>

      {/* Stock Table */}
      <div className="glass-card rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-900/60">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Per Unit Cost</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">On Hand Stock</th>
                <th className="py-3 px-4">Reserved</th>
                <th className="py-3 px-4">Free to Use</th>
                <th className="py-3 px-4 text-right">Quick Stock Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const productLevels = stockLevels.filter(
                  (sl) => sl.product_id === p.id && (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId)
                );
                const onHand = productLevels
                  .reduce((sum, item) => sum + Number(item.quantity), 0);
                const locationNames = [...new Set(
                  productLevels
                    .map((level) => locations.find((location) => location.id === level.location_id)?.name)
                    .filter(Boolean)
                )];

                // Reserved stock (pending deliveries)
                const reserved = operations
                  .filter((op) => op.type === 'delivery' && (op.status === 'ready' || op.status === 'waiting' || op.status === 'draft'))
                  .flatMap((op) => op.lines)
                  .filter((l) => l.product_id === p.id)
                  .reduce((sum, l) => sum + Number(l.expected_qty), 0);

                const freeToUse = Math.max(0, onHand - reserved);

                const isEditing = editingProductId === p.id;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{p.sku}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      ₹{p.cost_price.toLocaleString()} <span className="text-[10px] text-slate-500">/ {p.unit_of_measure}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {locationNames.length ? locationNames.join(', ') : '—'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-white text-sm">
                      {onHand} <span className="text-xs font-normal text-slate-400">{p.unit_of_measure}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400 font-semibold">
                      {reserved} {p.unit_of_measure}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-400 text-sm">
                      {freeToUse} <span className="text-xs font-normal text-slate-400">{p.unit_of_measure}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={editingWarehouseId}
                            onChange={(e) => setEditingWarehouseId(e.target.value)}
                            className="bg-slate-900 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-700"
                          >
                            {warehouses.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.code}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min={0}
                            value={newQty}
                            onChange={(e) => setNewQty(Number(e.target.value))}
                            className="w-20 bg-slate-900 text-white font-mono text-xs font-bold rounded-lg px-2 py-1 border border-indigo-500"
                          />
                          <button
                            onClick={() => handleSaveStock(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(p.id, onHand)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Update Stock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
