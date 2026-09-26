import React, { useState, useEffect } from 'react';
import { useIMSStore } from '../../store/useIMSStore';
import {
  Boxes,
  LayoutDashboard,
  ArrowLeftRight,
  Package,
  Layers,
  History,
  Settings,
  ChevronDown,
  Building2,
  MapPin,
  Zap,
  Bell,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  Database,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { SupabaseConfigModal } from '../modals/SupabaseConfigModal';

export type MainNavTab =
  | 'dashboard'
  | 'operations'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'products'
  | 'stock'
  | 'history'
  | 'settings_warehouse'
  | 'settings_location'
  | 'profile';

interface TopNavHeaderProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  onOpenAuth: () => void;
}

export const TopNavHeader: React.FC<TopNavHeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  onSearchQuery,
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
  } = useIMSStore();

  const [ttl, setTtl] = useState(redisCacheTTL);
  const [showOpMenu, setShowOpMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showWhDropdown, setShowWhDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  useEffect(() => {
    setTtl(redisCacheTTL);
    const interval = setInterval(() => {
      setTtl((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [redisCacheTTL]);

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

  const userInitial = user ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        {/* Brand & Main Top Navigation */}
        <div className="flex items-center gap-6">
          {/* App Logo */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-base text-white tracking-tight">
                StockSense <span className="text-indigo-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-indigo-500/20">Odoo</span>
              </span>
            </div>
          </div>

          {/* Top Nav Links (Dashboard · Operations · Products · Stock · Move History · Settings) */}
          <nav className="hidden md:flex items-center gap-1 font-medium text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dashboard
            </button>

            {/* Operations Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowOpMenu(!showOpMenu);
                  setShowSettingsMenu(false);
                }}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all ${
                  ['operations', 'receipts', 'deliveries', 'transfers', 'adjustments'].includes(activeTab)
                    ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Operations</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showOpMenu && (
                <div className="absolute left-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setActiveTab('receipts');
                      setShowOpMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 font-medium"
                  >
                    Receipts (Incoming)
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('deliveries');
                      setShowOpMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 font-medium"
                  >
                    Delivery Orders (Outgoing)
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('transfers');
                      setShowOpMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 font-medium"
                  >
                    Internal Transfers
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('adjustments');
                      setShowOpMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 font-medium"
                  >
                    Stock Adjustments
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'products'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Products
            </button>

            {/* Top-Level Stock Nav Item */}
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'stock'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Stock
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Move History
            </button>

            {/* Settings Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSettingsMenu(!showSettingsMenu);
                  setShowOpMenu(false);
                }}
                className={`px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all ${
                  ['settings_warehouse', 'settings_location'].includes(activeTab)
                    ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Settings</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showSettingsMenu && (
                <div className="absolute left-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setActiveTab('settings_warehouse');
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 font-medium"
                  >
                    Warehouse Settings
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('settings_location');
                      setShowSettingsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 font-medium"
                  >
                    Locations & Rooms
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Controls & Profile Initial Avatar */}
        <div className="flex items-center gap-3">
          {/* Supabase Connection Status Pill */}
          <button
            onClick={() => setShowSupabaseModal(true)}
            title="Click to view or configure Supabase database connection"
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all hover:scale-105 ${
              isSupabaseConfigured()
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-750 text-slate-300 hover:border-emerald-500/40'
            }`}
          >
            <Database className={`w-3.5 h-3.5 ${isSupabaseConfigured() ? 'text-emerald-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className="font-semibold text-[11px]">{isSupabaseConfigured() ? 'Supabase: Live' : 'Supabase: Connect'}</span>
          </button>

          {/* Upstash Redis TTL Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5 fill-emerald-400 animate-pulse text-emerald-400" />
            <span>Redis TTL: {ttl}s</span>
          </div>

          {/* Warehouse Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowWhDropdown(!showWhDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-medium transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{activeWhName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showWhDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50">
                <button
                  onClick={() => {
                    setActiveWarehouse('all');
                    setShowWhDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                    activeWarehouseId === 'all'
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>All Warehouses</span>
                </button>
                {warehouses.map((wh) => (
                  <button
                    key={wh.id}
                    onClick={() => {
                      setActiveWarehouse(wh.id);
                      setShowWhDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between ${
                      activeWarehouseId === wh.id
                        ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{wh.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{wh.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              <Bell className="w-4 h-4" />
              {lowStockProducts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] flex items-center justify-center">
                  {lowStockProducts.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-50 text-xs">
                <div className="font-bold text-amber-400 mb-2 border-b border-slate-800 pb-1">
                  Low Stock Warnings ({lowStockProducts.length})
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 flex justify-between">
                      <span className="text-amber-200 font-medium">{p.name}</span>
                      <span className="font-mono text-amber-400 font-bold">{p.reorder_level} {p.unit_of_measure}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar Icon with User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 hover:ring-2 hover:ring-indigo-400 text-white font-extrabold text-sm flex items-center justify-center shadow-lg transition-all"
              title={user ? user.name : 'Profile Menu'}
            >
              {userInitial}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                {user && (
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="font-bold text-xs text-white truncate">{user.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                    <div className="text-[10px] text-indigo-400 font-semibold mt-0.5">{user.role}</div>
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 font-medium flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-indigo-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                    onOpenAuth();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/40 font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Supabase Configuration Modal */}
      <SupabaseConfigModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />
    </header>
  );
};
