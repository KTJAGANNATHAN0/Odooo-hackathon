import React, { useState } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import { Building2, Plus, MapPin, Boxes, Edit2, CheckCircle2, X } from 'lucide-react';

export const WarehouseSettingsView: React.FC = () => {
  const { warehouses, stockLevels, products, addWarehouse, updateWarehouse } = useIMSStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWhId, setEditingWhId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');

  const openCreate = () => {
    setEditingWhId(null);
    setName('');
    setCode(`WH-${Math.floor(100 + Math.random() * 900)}`);
    setLocation('');
    setIsModalOpen(true);
  };

  const openEdit = (whId: string) => {
    const wh = warehouses.find((w) => w.id === whId);
    if (!wh) return;
    setEditingWhId(wh.id);
    setName(wh.name);
    setCode(wh.code);
    setLocation(wh.location);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWhId) {
      updateWarehouse(editingWhId, { name, code, location });
    } else {
      addWarehouse({ name, code, location });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Warehouse Topology & Settings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Warehouse Locations</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure storage hubs, distribution depots, and factory floor units.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Warehouse Location
        </button>
      </div>

      {/* Grid of Warehouses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {warehouses.map((wh) => {
          const totalStockCount = stockLevels
            .filter((sl) => sl.warehouse_id === wh.id)
            .reduce((sum, item) => sum + Number(item.quantity), 0);

          const distinctSkus = new Set(
            stockLevels
              .filter((sl) => sl.warehouse_id === wh.id && Number(sl.quantity) > 0)
              .map((sl) => sl.product_id)
          ).size;

          return (
            <div
              key={wh.id}
              className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-indigo-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                    {wh.code}
                  </span>
                  <button
                    onClick={() => openEdit(wh.id)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{wh.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{wh.location || 'Primary Campus Location'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Total Units</div>
                  <div className="font-mono font-bold text-sm text-indigo-300">{totalStockCount}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Active SKUs</div>
                  <div className="font-mono font-bold text-sm text-emerald-300">{distinctSkus}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-4">
              {editingWhId ? 'Edit Warehouse Location' : 'Add Warehouse Location'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main Storage Hub"
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Warehouse Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="WH-MAIN"
                  className="w-full bg-slate-800 font-mono text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Location Address</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Building A - Sector 4"
                  className="w-full bg-slate-800 text-slate-200 text-sm rounded-xl px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
