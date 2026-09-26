import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { ProductDetailModal } from './ProductDetailModal';
import {
  Package,
  Plus,
  Search,
  Grid,
  List as ListIcon,
  Building2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Edit2,
  Eye,
  Layers,
} from 'lucide-react';

interface ProductsViewProps {
  searchQuery: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ searchQuery }) => {
  const { products, categories, stockLevels, activeWarehouseId } = useIMSStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDetail, setProductToDetail] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) => {
    // Category filter
    if (selectedCategory !== 'all' && p.category_id !== selectedCategory) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      return matchName || matchSku;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Package className="w-4 h-4 text-indigo-400" />
            <span>Product Master Catalog</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Products & Inventory Levels</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage SKUs, unit of measures, reorder thresholds, and warehouse availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid / List View Toggle */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs transition-all ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs transition-all ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setProductToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Product
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Categories ({products.length})
        </button>
        {categories.map((cat) => {
          const count = products.filter((p) => p.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Products Content */}
      {filteredProducts.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center border border-slate-800">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No products found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search criteria or category filter, or add a new product SKU.
          </p>
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Create Product Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const cat = categories.find((c) => c.id === p.category_id);
            const totalQty = stockLevels
              .filter(
                (sl) =>
                  sl.product_id === p.id &&
                  (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId)
              )
              .reduce((sum, item) => sum + Number(item.quantity), 0);

            const isLow = totalQty <= p.reorder_level && totalQty > 0;
            const isOut = totalQty === 0;

            return (
              <div
                key={p.id}
                onClick={() => setProductToDetail(p)}
                className="glass-card rounded-2xl border border-slate-800 hover:border-indigo-500/40 p-4 transition-all hover:scale-[1.01] cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative h-40 w-full rounded-xl bg-slate-800 overflow-hidden mb-3">
                    <img
                      src={
                        p.image_url ||
                        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80'
                      }
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                      {p.sku}
                    </div>

                    {isOut && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-950/90 text-red-400 font-bold text-[10px] border border-red-500/30">
                        OUT OF STOCK
                      </div>
                    )}
                    {isLow && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-950/90 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        LOW STOCK
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-indigo-400 font-semibold mb-0.5">{cat?.name || 'General'}</div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500">Available Stock</div>
                    <div
                      className={`font-mono font-bold text-sm ${
                        isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {totalQty} <span className="text-xs font-normal text-slate-400">{p.unit_of_measure}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductToEdit(p);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductToDetail(p);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                      title="View Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/60 uppercase tracking-wider">
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Available Stock</th>
                <th className="py-3 px-4">Reorder Level</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.category_id);
                const totalQty = stockLevels
                  .filter(
                    (sl) =>
                      sl.product_id === p.id &&
                      (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId)
                  )
                  .reduce((sum, item) => sum + Number(item.quantity), 0);

                const isLow = totalQty <= p.reorder_level && totalQty > 0;
                const isOut = totalQty === 0;

                return (
                  <tr
                    key={p.id}
                    onClick={() => setProductToDetail(p)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-4 text-slate-300">{cat?.name || '—'}</td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
                        {totalQty} {p.unit_of_measure}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {p.reorder_level} {p.unit_of_measure}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToEdit(p);
                            setIsFormOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDetail(p);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-semibold"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={productToEdit}
      />

      <ProductDetailModal
        product={productToDetail}
        onClose={() => setProductToDetail(null)}
        onEdit={(p) => {
          setProductToDetail(null);
          setProductToEdit(p);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
};
