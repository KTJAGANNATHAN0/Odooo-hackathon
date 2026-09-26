import React, { useState } from 'react';
import { TopNavHeader, MainNavTab } from './components/layout/TopNavHeader';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { StockView } from './components/stock/StockView';
import { OperationsView } from './components/operations/OperationsView';
import { MoveHistoryView } from './components/operations/MoveHistoryView';
import { WarehouseSettingsView } from './components/settings/WarehouseSettingsView';
import { LocationSettingsView } from './components/settings/LocationSettingsView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthModal } from './components/auth/AuthModal';
import { OperationFormModal } from './components/operations/OperationFormModal';
import { ValidateOperationModal } from './components/operations/ValidateOperationModal';
import { Operation, OperationType, Product } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [createOpType, setCreateOpType] = useState<OperationType | null>(null);
  const [validateOp, setValidateOp] = useState<Operation | null>(null);

  const handleOpenCreateOp = (type: OperationType) => {
    setCreateOpType(type);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Header with Wireframe Top-Level Navigation */}
      <TopNavHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-150">
        {activeTab === 'dashboard' && (
          <DashboardView
            searchQuery={searchQuery}
            onOpenCreateOp={handleOpenCreateOp}
            onOpenValidate={(op) => setValidateOp(op)}
            onOpenDetail={(op) => setValidateOp(op)}
            onNavigateToTab={(tab) => setActiveTab(tab as MainNavTab)}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView searchQuery={searchQuery} />
        )}

        {/* Top-Level Stock Nav Page */}
        {activeTab === 'stock' && (
          <StockView searchQuery={searchQuery} />
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

        {activeTab === 'settings_warehouse' && (
          <WarehouseSettingsView />
        )}

        {activeTab === 'settings_location' && (
          <LocationSettingsView />
        )}

        {activeTab === 'profile' && (
          <ProfileView onOpenAuth={() => setIsAuthOpen(true)} />
        )}
      </main>

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
