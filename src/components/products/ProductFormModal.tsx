import React, { useState, useEffect } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Product, UnitOfMeasure } from '../../types';
import { X, Package, Plus, Trash2, Building2, Upload } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, warehouses, addProduct, updateProduct } = useIMSStore();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('pcs');
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [costPrice, setCostPrice] = useState<number>(3000);
  const [imageUrl, setImageUrl] = useState('');
  
  // Initial stocks for new product
  const [initialStocks, setInitialStocks] = useState<{ warehouse_id: string; quantity: number }[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategoryId(productToEdit.category_id);
      setUnitOfMeasure(productToEdit.unit_of_measure);
      setReorderLevel(productToEdit.reorder_level);
      setCostPrice(productToEdit.cost_price || 3000);
      setImageUrl(productToEdit.image_url || '');
    } else {
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setCategoryId(categories[0]?.id || '');
      setUnitOfMeasure('pcs');
      setReorderLevel(10);
      setCostPrice(3000);
      setImageUrl('');
      setInitialStocks(warehouses.map((w) => ({ warehouse_id: w.id, quantity: 0 })));
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name,
        sku,
        category_id: categoryId,
        unit_of_measure: unitOfMeasure,
        reorder_level: Number(reorderLevel),
        cost_price: Number(costPrice),
        image_url: imageUrl,
      });
    } else {
      const formattedStocks = warehouses.map((w) => {
        const found = initialStocks.find((st) => st.warehouse_id === w.id);
        return { warehouse_id: w.id, quantity: Math.max(0, Number(found?.quantity) || 0) };
      });

      addProduct(
        {
          name,
          sku,
          category_id: categoryId,
          unit_of_measure: unitOfMeasure,
          reorder_level: Number(reorderLevel),
          cost_price: Number(costPrice),
          image_url: imageUrl || '/images/steel_rods.png',
        },
        formattedStocks
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {productToEdit ? 'Edit Product Configuration' : 'Create New Product'}
            </h2>
            <p className="text-xs text-slate-400">Define SKU, reorder thresholds, and warehouse stock levels</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Industrial Steel Rods 12mm"
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="RAW-STL-001"
                className="w-full bg-slate-800 font-mono text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unit of Measure (UOM) *</label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="litre">Litres (litre)</option>
                <option value="box">Boxes (box)</option>
                <option value="meter">Meters (meter)</option>
                <option value="pallet">Pallets (pallet)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reorder Level Threshold *</label>
              <input
                type="number"
                min={0}
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full bg-slate-800 font-mono text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Triggers low-stock alerts on dashboard</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Initial Stock Allocations (Only when creating) */}
          {!productToEdit && (
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Initial Stock Allocation per Warehouse
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {warehouses.map((wh) => {
                  const currentQty = initialStocks.find((s) => s.warehouse_id === wh.id)?.quantity ?? 0;
                  return (
                    <div key={wh.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                      <div className="text-xs font-semibold text-slate-200">{wh.name}</div>
                      <div className="text-[10px] text-indigo-400 font-mono mb-1.5">{wh.code}</div>
                      <input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={currentQty === 0 ? '' : currentQty}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                          setInitialStocks((prev) => {
                            const exists = prev.some((item) => item.warehouse_id === wh.id);
                            if (exists) {
                              return prev.map((item) => (item.warehouse_id === wh.id ? { ...item, quantity: val } : item));
                            }
                            return [...prev, { warehouse_id: wh.id, quantity: val }];
                          });
                        }}
                        className="w-full bg-slate-900 font-mono text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
