import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { OperationsView } from './components/operations/OperationsView';
import { MoveHistoryView } from './components/operations/MoveHistoryView';
import { WarehouseSettingsView } from './components/settings/WarehouseSettingsView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthModal } from './components/auth/AuthModal';
import { OperationFormModal } from './components/operations/OperationFormModal';
import { ValidateOperationModal } from './components/operations/ValidateOperationModal';
import { ProductDetailModal } from './components/products/ProductDetailModal';
import { Operation, OperationType, Product } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [createOpType, setCreateOpType] = useState<OperationType | null>(null);
  const [validateOp, setValidateOp] = useState<Operation | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const handleOpenCreateOp = (type: OperationType) => {
    setCreateOpType(type);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-row font-sans selection:bg-indigo-500 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Topbar
          searchQuery={searchQuery}
          onSearchQuery={setSearchQuery}
          onOpenProfile={() => setActiveTab('profile')}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* View Router Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
          {activeTab === 'dashboard' && (
            <DashboardView
              searchQuery={searchQuery}
              onOpenCreateOp={handleOpenCreateOp}
              onOpenValidate={(op) => setValidateOp(op)}
              onOpenDetail={(op) => setValidateOp(op)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView searchQuery={searchQuery} />
          )}

          {activeTab === 'receipts' && (
            <OperationsView type="receipt" searchQuery={searchQuery} />
          )}

          {activeTab === 'deliveries' && (
            <OperationsView type="delivery" searchQuery={searchQuery} />
          )}

          {activeTab === 'transfers' && (
            <OperationsView type="transfer" searchQuery={searchQuery} />
          )}

          {activeTab === 'adjustments' && (
            <OperationsView type="adjustment" searchQuery={searchQuery} />
          )}

          {activeTab === 'history' && (
            <MoveHistoryView searchQuery={searchQuery} />
          )}

          {activeTab === 'warehouses' && (
            <WarehouseSettingsView />
          )}

          {activeTab === 'profile' && (
            <ProfileView onOpenAuth={() => setIsAuthOpen(true)} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {createOpType && (
        <OperationFormModal
          isOpen={!!createOpType}
          onClose={() => setCreateOpType(null)}
          defaultType={createOpType}
        />
      )}

      {validateOp && (
        <ValidateOperationModal
          operation={validateOp}
          onClose={() => setValidateOp(null)}
        />
      )}
    </div>
  );
}

export default App;
