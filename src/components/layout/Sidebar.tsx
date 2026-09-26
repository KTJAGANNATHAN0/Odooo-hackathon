import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Building2,
  User as UserIcon,
  LogOut,
  Boxes,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useIMSStore } from '../../store/useIMSStore';

export type NavTab =
  | 'dashboard'
  | 'products'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'history'
  | 'warehouses'
  | 'profile';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}) => {
  const { operations, logout, user } = useIMSStore();

  const pendingReceipts = operations.filter(
    (o) => o.type === 'receipt' && (o.status === 'ready' || o.status === 'waiting')
  ).length;

  const pendingDeliveries = operations.filter(
    (o) => o.type === 'delivery' && (o.status === 'ready' || o.status === 'waiting')
  ).length;

  const pendingTransfers = operations.filter(
    (o) => o.type === 'transfer' && (o.status === 'ready' || o.status === 'waiting')
  ).length;

  const mainNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
  ];

  const operationsNavItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'receipts', label: 'Receipts', icon: <ArrowDownLeft className="w-4 h-4 text-emerald-400" />, badge: pendingReceipts },
    { id: 'deliveries', label: 'Delivery Orders', icon: <ArrowUpRight className="w-4 h-4 text-blue-400" />, badge: pendingDeliveries },
    { id: 'transfers', label: 'Internal Transfers', icon: <ArrowLeftRight className="w-4 h-4 text-purple-400" />, badge: pendingTransfers },
    { id: 'adjustments', label: 'Stock Adjustments', icon: <SlidersHorizontal className="w-4 h-4 text-amber-400" /> },
    { id: 'history', label: 'Move History', icon: <History className="w-4 h-4 text-cyan-400" /> },
  ];

  const settingsNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'warehouses', label: 'Warehouses', icon: <Building2 className="w-4 h-4 text-slate-400" /> },
    { id: 'profile', label: 'My Profile', icon: <UserIcon className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <aside
      className={`relative z-40 transition-all duration-300 flex flex-col justify-between glass-panel border-r border-slate-800 ${
        collapsed ? 'w-16' : 'w-64'
      } min-h-screen`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-800/80 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 font-bold shrink-0">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="leading-tight">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                  Odoo <span className="text-indigo-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-indigo-500/20">IMS</span>
                </span>
                <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-medium">
                  Inventory System
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {/* Main Section */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Overview
              </div>
            )}
            {mainNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Operations Section */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Stock Operations
              </div>
            )}
            {operationsNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Section */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Configuration
              </div>
            )}
            {settingsNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        {!collapsed && user && (
          <div className="text-xs text-slate-400 truncate max-w-[140px]">
            <div className="truncate font-semibold text-slate-300">{user.name}</div>
            <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  );
};
