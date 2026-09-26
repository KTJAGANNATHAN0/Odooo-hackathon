import React, { useState, useEffect } from 'react';
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
import { Operation, OperationType } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { useIMSStore } from './store/useIMSStore';
import { supabaseService } from './services/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';

export function App() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [createOpType, setCreateOpType] = useState<OperationType | null>(null);
  const [validateOp, setValidateOp] = useState<Operation | null>(null);

  const syncWithSupabase = useIMSStore((s) => s.syncWithSupabase);

  // Initialize Supabase sync and Realtime subscriptions if configured
  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncWithSupabase();
      const unsubscribe = supabaseService.subscribeToStockChanges(() => {
        syncWithSupabase();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [syncWithSupabase]);

  const handleOpenCreateOp = (type: OperationType) => {
    setCreateOpType(type);
  };

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans">
      {/* Top Bar Header with Wireframe Top-Level Navigation */}
      <TopNavHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <div className="flex-1 flex w-full">
        {/* Left Sidebar (Profile Menu, Operations, Navigation) */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-150 overflow-x-hidden">
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
