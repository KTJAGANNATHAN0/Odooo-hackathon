import React, { useState, useEffect } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import {
  Building2,
  Search,
  Bell,
  Zap,
  User as UserIcon,
  LogOut,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface TopbarProps {
  onSearchQuery: (query: string) => void;
  searchQuery: string;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onSearchQuery,
  searchQuery,
  onOpenProfile,
  onOpenAuth,
}) => {
  const {
    warehouses,
    activeWarehouseId,
    setActiveWarehouse,
    user,
    isAuthenticated,
    logout,
    products,
    stockLevels,
    redisCacheTTL,
    resetToDefaults,
  } = useIMSStore();

  const [ttl, setTtl] = useState(redisCacheTTL);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWhDropdown, setShowWhDropdown] = useState(false);

  // Redis cache countdown simulation
  useEffect(() => {
    setTtl(redisCacheTTL);
    const interval = setInterval(() => {
      setTtl((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [redisCacheTTL]);

  // Compute low stock products
  const lowStockProducts = products.filter((p) => {
    const qty = stockLevels
      .filter((sl) => sl.product_id === p.id && (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId))
      .reduce((sum, item) => sum + Number(item.quantity), 0);
    return qty <= p.reorder_level;
  });

  const activeWhName =
    activeWarehouseId === 'all'
      ? 'All Warehouses'
      : warehouses.find((w) => w.id === activeWarehouseId)?.name || 'Select Warehouse';

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between shadow-lg">
      {/* Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
            placeholder="Search SKU, product name, reference no (e.g. RAW-STL, REC-2026)..."
            className="w-full bg-slate-900/80 text-slate-200 placeholder-slate-500 text-sm rounded-xl pl-9 pr-4 py-2 border border-slate-700/60 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Redis Cache Status Pill */}
        <div
          title="Upstash Redis Cached Aggregations (60s TTL)"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono"
        >
          <Zap className="w-3.5 h-3.5 fill-emerald-400 animate-pulse text-emerald-400" />
          <span className="font-medium text-emerald-300">Upstash Redis:</span>
          <span>{ttl}s</span>
        </div>

        {/* Warehouse Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowWhDropdown(!showWhDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-medium transition-all"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">{activeWhName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showWhDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Warehouse
              </div>
              <button
                onClick={() => {
                  setActiveWarehouse('all');
                  setShowWhDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                  activeWarehouseId === 'all'
                    ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>All Warehouses</span>
                {activeWarehouseId === 'all' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </button>
              {warehouses.map((wh) => (
                <button
                  key={wh.id}
                  onClick={() => {
                    setActiveWarehouse(wh.id);
                    setShowWhDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                    activeWarehouseId === wh.id
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-medium">{wh.name}</div>
                    <div className="text-xs text-slate-400">{wh.code}</div>
                  </div>
                  {activeWarehouseId === wh.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition-all"
            title="Low Stock Alerts"
          >
            <Bell className="w-4 h-4" />
            {lowStockProducts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center animate-pulse">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Low Stock Warnings ({lowStockProducts.length})</span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>

              {lowStockProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">All stock levels are optimal!</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {lowStockProducts.map((p) => {
                    const qty = stockLevels
                      .filter((sl) => sl.product_id === p.id && (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId))
                      .reduce((sum, item) => sum + Number(item.quantity), 0);
                    return (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold text-amber-200">{p.name}</div>
                          <div className="text-[11px] text-amber-400/80 font-mono">
                            SKU: {p.sku} | Min: {p.reorder_level} {p.unit_of_measure}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${qty === 0 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-300'}`}>
                            {qty} {p.unit_of_measure}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Demo Data Reset Button */}
        <button
          onClick={() => {
            if (confirm('Reset all inventory data, operations, and ledger back to default Odoo demo state?')) {
              resetToDefaults();
            }
          }}
          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-amber-400 transition-all"
          title="Reset Demo Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Profile / Auth Button */}
        {isAuthenticated && user ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/50 transition-all"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs">
                {user.name.charAt(0)}
              </div>
            )}
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</div>
              <div className="text-[10px] text-indigo-400 leading-tight">{user.role}</div>
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md shadow-indigo-600/30"
          >
            Sign In / Register
          </button>
        )}
      </div>
    </header>
  );
};
