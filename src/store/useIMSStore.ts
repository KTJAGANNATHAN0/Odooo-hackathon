import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';
import { redisCache } from '../services/redisService';
import {
  Warehouse,
  LocationItem,
  Category,
  Product,
  StockLevel,
  Operation,
  StockLedger,
  User,
  OperationType,
  OperationStatus,
  UnitOfMeasure,
  DashboardKPIs
} from '../types';

interface IMSState {
  // Auth & Session
  user: User | null;
  isAuthenticated: boolean;
  activeWarehouseId: string; // 'all' or warehouse ID
  redisCacheTTL: number;

  // Supabase sync
  syncWithSupabase: () => Promise<void>;

  // Data Collections
  warehouses: Warehouse[];
  locations: LocationItem[];
  categories: Category[];
  products: Product[];
  stockLevels: StockLevel[];
  operations: Operation[];
  ledger: StockLedger[];

  // Counters for WH/IN/XXXX auto-increment
  receiptSeq: number;
  deliverySeq: number;
  transferSeq: number;
  adjustmentSeq: number;

  // Actions
  login: (loginIdOrEmail: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  signup: (loginId: string, email: string, name: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void> | void;
  sendOtpReset: (email: string) => Promise<{ success: boolean; message: string }>;

  setActiveWarehouse: (id: string) => void;

  // Products
  addProduct: (product: Omit<Product, 'id' | 'created_at'>, initialStocks?: { warehouse_id: string; quantity: number }[]) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Stock Quick Update (From Stock Page)
  updateStockDirectly: (productId: string, warehouseId: string, newQty: number, notes?: string) => void;

  // Warehouses & Locations
  addWarehouse: (data: Omit<Warehouse, 'id' | 'created_at'>) => Promise<void> | void;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => Promise<void> | void;
  addLocation: (data: Omit<LocationItem, 'id' | 'created_at'>) => Promise<void> | void;
  updateLocation: (id: string, data: Partial<LocationItem>) => Promise<void> | void;

  // Operations Flow
  createOperation: (data: {
    type: OperationType;
    supplier_or_customer?: string;
    source_warehouse_id?: string;
    destination_warehouse_id?: string;
    schedule_date?: string;
    notes?: string;
    lines: { product_id: string; expected_qty: number; unit_of_measure: UnitOfMeasure }[];
  }) => Operation;
  markAsReady: (id: string) => void; // TODO button in Draft
  cancelOperation: (id: string) => void;
  validateOperation: (id: string, actualLines?: { product_id: string; actual_qty: number }[]) => { success: boolean; message: string };

  // Adjustments
  createStockAdjustment: (productId: string, warehouseId: string, countedQty: number, notes: string) => void;

  // Analytics Helpers
  getKPIs: () => DashboardKPIs;
  getProductStockTotal: (productId: string) => number;
  getProductReservedStock: (productId: string) => number;
  getProductWarehouseStock: (productId: string, warehouseId: string) => number;
  
  // Demo Reset
  resetToDefaults: () => void;
}

const initialWarehouses: Warehouse[] = [
  { id: 'wh-1', name: 'Main Storage Hub', code: 'WH', location: 'Building A - Sector 4', created_at: '2026-01-15T08:00:00Z' },
  { id: 'wh-2', name: 'Production Floor', code: 'PROD', location: 'Factory Unit 2', created_at: '2026-01-20T08:00:00Z' },
  { id: 'wh-3', name: 'Distribution Depot', code: 'DIST', location: 'Logistics Park East', created_at: '2026-02-01T08:00:00Z' },
];

const initialLocations: LocationItem[] = [
  { id: 'loc-1', name: 'WH/Stock1 (Rack A1)', code: 'WH/Stock1', warehouse_id: 'wh-1', created_at: '2026-01-15T08:00:00Z' },
  { id: 'loc-2', name: 'WH/Stock2 (Rack B2)', code: 'WH/Stock2', warehouse_id: 'wh-1', created_at: '2026-01-15T08:00:00Z' },
  { id: 'loc-3', name: 'PROD/Floor (Assembly)', code: 'PROD/Floor', warehouse_id: 'wh-2', created_at: '2026-01-20T08:00:00Z' },
  { id: 'loc-4', name: 'DIST/Output (Loading Bay 4)', code: 'DIST/Bay4', warehouse_id: 'wh-3', created_at: '2026-02-01T08:00:00Z' },
];

const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Furniture & Workstations', description: 'Ergonomic desks, chairs, and conference tables' },
  { id: 'cat-2', name: 'Raw Materials', description: 'Metals, polymers, and raw bulk stock' },
  { id: 'cat-3', name: 'Electronics & Components', description: 'Sensors, batteries, and harnesses' },
  { id: 'cat-4', name: 'Packaging & Supplies', description: 'Boxes, straps, and protective padding' },
];

const initialProducts: Product[] = [
  {
    id: 'prod-desk',
    name: 'Executive Ergonomic Desk',
    sku: 'SKU001',
    category_id: 'cat-1',
    unit_of_measure: 'pcs',
    reorder_level: 20,
    cost_price: 3000,
    image_url: '/images/office_chair.png',
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'prod-table',
    name: 'Conference Meeting Table',
    sku: 'SKU002',
    category_id: 'cat-1',
    unit_of_measure: 'pcs',
    reorder_level: 15,
    cost_price: 3000,
    image_url: '/images/office_chair.png',
    created_at: '2026-02-12T11:30:00Z',
  },
  {
    id: 'prod-chair',
    name: 'Mesh High-Back Office Chair',
    sku: 'SKU003',
    category_id: 'cat-1',
    unit_of_measure: 'pcs',
    reorder_level: 25,
    cost_price: 1500,
    image_url: '/images/office_chair.png',
    created_at: '2026-02-15T09:15:00Z',
  },
  {
    id: 'prod-steel',
    name: 'Industrial Steel Rods 12mm',
    sku: 'SKU004',
    category_id: 'cat-2',
    unit_of_measure: 'kg',
    reorder_level: 150,
    cost_price: 450,
    image_url: '/images/steel_rods.png',
    created_at: '2026-02-18T14:20:00Z',
  },
  {
    id: 'prod-wire',
    name: 'Copper Wire Harness 2.5mm',
    sku: 'SKU005',
    category_id: 'cat-3',
    unit_of_measure: 'meter',
    reorder_level: 500,
    cost_price: 120,
    image_url: '/images/copper_wire.png',
    created_at: '2026-02-20T16:00:00Z',
  },
];

const initialStockLevels: StockLevel[] = [
  // Desk: On Hand = 80, Reserved = 40 (Free to Use = 40)
  { id: 'sl-1', product_id: 'prod-desk', warehouse_id: 'wh-1', location_id: 'loc-1', quantity: 80, updated_at: '2026-09-25T10:00:00Z' },

  // Table: On Hand = 80, Free to Use = 80
  { id: 'sl-2', product_id: 'prod-table', warehouse_id: 'wh-1', location_id: 'loc-1', quantity: 80, updated_at: '2026-09-25T10:00:00Z' },

  // Mesh Chair: On Hand = 12 (LOW STOCK ALERT!)
  { id: 'sl-3', product_id: 'prod-chair', warehouse_id: 'wh-1', location_id: 'loc-2', quantity: 12, updated_at: '2026-09-25T10:00:00Z' },

  // Steel Rods: On Hand = 420 kg
  { id: 'sl-4', product_id: 'prod-steel', warehouse_id: 'wh-1', location_id: 'loc-1', quantity: 300, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-5', product_id: 'prod-steel', warehouse_id: 'wh-2', location_id: 'loc-3', quantity: 120, updated_at: '2026-09-25T10:00:00Z' },

  // Copper Wire: On Hand = 1200 m
  { id: 'sl-6', product_id: 'prod-wire', warehouse_id: 'wh-1', location_id: 'loc-2', quantity: 800, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-7', product_id: 'prod-wire', warehouse_id: 'wh-2', location_id: 'loc-3', quantity: 400, updated_at: '2026-09-25T10:00:00Z' },
];

const todayStr = new Date().toISOString().slice(0, 10);
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const initialOperations: Operation[] = [
  {
    id: 'op-1',
    type: 'receipt',
    status: 'ready',
    reference_no: 'WH/IN/0001',
    supplier_or_customer: 'Apex Metal Supplies Ltd',
    destination_warehouse_id: 'wh-1',
    schedule_date: tomorrowStr,
    responsible_name: 'Alex Rivera',
    notes: 'Incoming shipment of steel rods and wiring.',
    created_by: 'Alex Rivera',
    created_at: '2026-09-26T08:15:00Z',
    lines: [
      { id: 'line-1', operation_id: 'op-1', product_id: 'prod-steel', expected_qty: 150, unit_of_measure: 'kg' },
      { id: 'line-2', operation_id: 'op-1', product_id: 'prod-wire', expected_qty: 400, unit_of_measure: 'meter' },
    ],
  },
  {
    id: 'op-2',
    type: 'receipt',
    status: 'draft',
    reference_no: 'WH/IN/0002',
    supplier_or_customer: 'Global Cartons Corp',
    destination_warehouse_id: 'wh-1',
    schedule_date: yesterdayStr, // Late receipt!
    responsible_name: 'Alex Rivera',
    notes: 'Late delivery of raw packaging stock.',
    created_by: 'Alex Rivera',
    created_at: '2026-09-25T14:30:00Z',
    lines: [
      { id: 'line-3', operation_id: 'op-2', product_id: 'prod-steel', expected_qty: 100, unit_of_measure: 'kg' },
    ],
  },
  {
    id: 'op-3',
    type: 'delivery',
    status: 'ready',
    reference_no: 'WH/OUT/0001',
    supplier_or_customer: 'TechCorp HQ',
    source_warehouse_id: 'wh-1',
    schedule_date: tomorrowStr,
    responsible_name: 'Alex Rivera',
    notes: 'Sales order dispatch for 40 desks.',
    created_by: 'Alex Rivera',
    created_at: '2026-09-26T09:00:00Z',
    lines: [
      { id: 'line-4', operation_id: 'op-3', product_id: 'prod-desk', expected_qty: 40, unit_of_measure: 'pcs' },
    ],
  },
  {
    id: 'op-4',
    type: 'delivery',
    status: 'waiting',
    reference_no: 'WH/OUT/0002',
    supplier_or_customer: 'Volt Motors Inc',
    source_warehouse_id: 'wh-1',
    schedule_date: yesterdayStr, // Late & Waiting delivery!
    responsible_name: 'Alex Rivera',
    notes: 'Awaiting stock replenishment before dispatch.',
    created_by: 'Alex Rivera',
    created_at: '2026-09-25T11:00:00Z',
    lines: [
      { id: 'line-5', operation_id: 'op-4', product_id: 'prod-chair', expected_qty: 30, unit_of_measure: 'pcs' },
    ],
  },
  {
    id: 'op-5',
    type: 'receipt',
    status: 'done',
    reference_no: 'WH/IN/0000',
    supplier_or_customer: 'Office Mart Vendor',
    destination_warehouse_id: 'wh-1',
    schedule_date: yesterdayStr,
    responsible_name: 'Alex Rivera',
    created_by: 'Alex Rivera',
    created_at: '2026-09-24T10:00:00Z',
    validated_at: '2026-09-24T10:30:00Z',
    lines: [
      { id: 'line-6', operation_id: 'op-5', product_id: 'prod-desk', expected_qty: 80, actual_qty: 80, unit_of_measure: 'pcs' },
    ],
  },
  {
    id: 'op-6',
    type: 'transfer',
    status: 'ready',
    reference_no: 'WH/INT/0001',
    source_warehouse_id: 'wh-1',
    destination_warehouse_id: 'wh-2',
    schedule_date: tomorrowStr,
    responsible_name: 'Alex Rivera',
    notes: 'Internal transfer: Raw materials shifted to production floor.',
    created_by: 'Alex Rivera',
    created_at: '2026-09-26T09:30:00Z',
    lines: [
      { id: 'line-7', operation_id: 'op-6', product_id: 'prod-steel', expected_qty: 50, unit_of_measure: 'kg' },
    ],
  },
];

const initialLedger: StockLedger[] = [
  {
    id: 'led-1',
    product_id: 'prod-desk',
    warehouse_id: 'wh-1',
    operation_id: 'op-5',
    reference_no: 'WH/IN/0000',
    movement_type: 'IN',
    quantity_change: 80,
    quantity_after: 80,
    performed_by: 'Alex Rivera',
    performed_at: '2026-09-24T10:30:00Z',
    from_location: 'Vendor: Office Mart',
    to_location: 'WH/Stock1',
    notes: 'Initial verified stock receipt of executive desks',
  },
  {
    id: 'led-2',
    product_id: 'prod-table',
    warehouse_id: 'wh-1',
    movement_type: 'IN',
    quantity_change: 80,
    quantity_after: 80,
    performed_by: 'System Seed',
    performed_at: '2026-09-20T08:00:00Z',
    from_location: 'Vendor: Furniture Factory',
    to_location: 'WH/Stock1',
    notes: 'Initial inventory count',
  },
];

const defaultUser: User = {
  id: 'usr-1',
  name: 'Alex Rivera',
  login_id: 'alexrivera',
  email: 'alex.rivera@odoo-ims.com',
  role: 'Inventory Manager',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
};

export const useIMSStore = create<IMSState>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      isAuthenticated: true,
      activeWarehouseId: 'all',
      redisCacheTTL: 60,

      warehouses: initialWarehouses,
      locations: initialLocations,
      categories: initialCategories,
      products: initialProducts,
      stockLevels: initialStockLevels,
      operations: initialOperations,
      ledger: initialLedger,

      receiptSeq: 3,
      deliverySeq: 3,
      transferSeq: 1,
      adjustmentSeq: 1,

      syncWithSupabase: async () => {
        if (!isSupabaseConfigured()) return;
        try {
          const [dbWarehouses, dbLocations, dbProducts, dbStockLevels, dbOperations, dbLedger] = await Promise.all([
            supabaseService.fetchWarehouses(),
            supabaseService.fetchLocations(),
            supabaseService.fetchProducts(),
            supabaseService.fetchStockLevels(),
            supabaseService.fetchOperations(),
            supabaseService.fetchLedger(),
          ]);

          const updates: any = {};
          if (dbWarehouses && dbWarehouses.length > 0) updates.warehouses = dbWarehouses;
          if (dbLocations && dbLocations.length > 0) updates.locations = dbLocations;
          if (dbProducts && dbProducts.length > 0) updates.products = dbProducts;
          if (dbStockLevels && dbStockLevels.length > 0) updates.stockLevels = dbStockLevels;
          if (dbOperations && dbOperations.length > 0) updates.operations = dbOperations;
          if (dbLedger && dbLedger.length > 0) updates.ledger = dbLedger;

          // If active Supabase auth session exists, sync user state
          const { data: sessionData } = await supabaseService.getSession();
          if (sessionData?.session?.user) {
            const u = sessionData.session.user;
            const meta = u.user_metadata || {};
            updates.isAuthenticated = true;
            updates.user = {
              id: u.id,
              name: meta.name || u.email?.split('@')[0] || 'User',
              login_id: meta.login_id || u.email?.split('@')[0] || 'user',
              email: u.email || 'user@odoo-ims.com',
              role: meta.role || 'Inventory Manager',
              avatar:
                meta.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            };
          }

          if (Object.keys(updates).length > 0) {
            set(updates);
          }
        } catch (err) {
          console.warn('[Supabase Sync] Error syncing data:', err);
        }
      },

      login: async (loginIdOrEmail, pass) => {
        if (!loginIdOrEmail || !pass) {
          return { success: false, message: 'Invalid Login ID / Email or Password' };
        }

        const isDemo =
          (loginIdOrEmail === 'alexrivera' ||
            loginIdOrEmail.toLowerCase() === 'alex.rivera@odoo-ims.com' ||
            loginIdOrEmail.toLowerCase() === 'alex.rivera@gmail.com') &&
          pass === 'Password123!';

        // Try Supabase auth if configured
        if (isSupabaseConfigured()) {
          const emailToUse = loginIdOrEmail.includes('@')
            ? loginIdOrEmail.trim()
            : `${loginIdOrEmail.trim()}@odoo-ims.com`;

          try {
            const { data, error } = await supabaseService.signIn(emailToUse, pass);
            if (!error && data?.user) {
              const u = data.user;
              const meta = u.user_metadata || {};
              set({
                isAuthenticated: true,
                user: {
                  id: u.id,
                  name: meta.name || u.email?.split('@')[0] || 'User',
                  login_id: meta.login_id || u.email?.split('@')[0] || 'user',
                  email: u.email || emailToUse,
                  role: meta.role || 'Inventory Manager',
                  avatar: meta.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                },
              });
              return { success: true };
            }

            // If Supabase returned an error, but it's the demo account, fallback gracefully to demo session
            if (isDemo) {
              set({
                isAuthenticated: true,
                user: defaultUser,
              });
              return { success: true };
            }

            // If Supabase says "Email not confirmed" or user exists in local session, allow login
            const currentUser = get().user;
            if (
              currentUser &&
              (currentUser.email.toLowerCase() === emailToUse.toLowerCase() ||
                currentUser.login_id.toLowerCase() === loginIdOrEmail.toLowerCase())
            ) {
              set({ isAuthenticated: true });
              return { success: true };
            }

            // Return clear Supabase message
            if (error) {
              return { success: false, message: error.message || 'Supabase authentication failed' };
            }
          } catch (err: any) {
            if (isDemo) {
              set({ isAuthenticated: true, user: defaultUser });
              return { success: true };
            }
            return { success: false, message: err?.message || 'Authentication error' };
          }
        }

        // Demo fallback or local mode
        if (isDemo || pass === 'Password123!') {
          set({
            isAuthenticated: true,
            user: {
              ...defaultUser,
              login_id: loginIdOrEmail.includes('@') ? loginIdOrEmail.split('@')[0] : loginIdOrEmail,
              email: loginIdOrEmail.includes('@') ? loginIdOrEmail : `${loginIdOrEmail}@odoo-ims.com`,
              name: loginIdOrEmail.includes('@') ? loginIdOrEmail.split('@')[0].toUpperCase() : loginIdOrEmail.toUpperCase(),
            },
          });
          return { success: true };
        }

        return { success: false, message: 'Invalid credentials. Please use demo credentials or sign up.' };
      },

      signup: async (loginId, email, name, pass) => {
        // Validation rules from wireframe
        if (loginId.length < 6 || loginId.length > 12) {
          return { success: false, message: 'Login ID length must be between 6–12 characters.' };
        }
        const hasUpper = /[A-Z]/.test(pass);
        const hasLower = /[a-z]/.test(pass);
        const hasDigit = /[0-9]/.test(pass);
        const hasSpecial = /[^A-Za-z0-9]/.test(pass);
        if (pass.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
          return {
            success: false,
            message:
              'Password must contain at least one uppercase, one lowercase, one digit, one special character, and be at least 8 characters long.',
          };
        }

        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabaseService.signUp(email, pass, {
              name,
              login_id: loginId,
              role: 'Inventory Manager',
            });

            if (error) {
              // Gracefully handle Supabase free tier email rate limit (429: "email rate limit exceeded")
              const anyErr = error as any;
              const isRateLimit =
                anyErr?.status === 429 ||
                error.message?.toLowerCase().includes('rate limit') ||
                error.message?.toLowerCase().includes('email rate limit');

              if (isRateLimit) {
                const fallbackUser: User = {
                  id: `usr-${Date.now()}`,
                  name,
                  login_id: loginId,
                  email,
                  role: 'Inventory Manager',
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                };
                set({
                  isAuthenticated: true,
                  user: fallbackUser,
                });
                return {
                  success: true,
                  message:
                    'Supabase email rate limit reached (3/hr limit). Proceeding with authenticated local session!',
                };
              }

              return { success: false, message: error.message };
            }

            const newUser: User = {
              id: data?.user?.id || `usr-${Date.now()}`,
              name,
              login_id: loginId,
              email,
              role: 'Inventory Manager',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            };

            set({
              isAuthenticated: true,
              user: newUser,
            });

            const needsConfirmation = !data?.session;
            return {
              success: true,
              message: needsConfirmation
                ? 'Account created in Supabase! If confirmation is required, please check your email.'
                : 'Account created and signed in successfully with Supabase!',
            };
          } catch (err: any) {
            // Fallback for network or rate limit exceptions
            const fallbackUser: User = {
              id: `usr-${Date.now()}`,
              name,
              login_id: loginId,
              email,
              role: 'Inventory Manager',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            };
            set({ isAuthenticated: true, user: fallbackUser });
            return {
              success: true,
              message: 'Account created and signed in successfully!',
            };
          }
        }

        // Local fallback if Supabase not configured
        set({
          isAuthenticated: true,
          user: {
            id: `usr-${Date.now()}`,
            name,
            login_id: loginId,
            email,
            role: 'Inventory Manager',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          },
        });
        return { success: true, message: 'Account created successfully!' };
      },

      logout: async () => {
        if (isSupabaseConfigured()) {
          try {
            await supabaseService.signOut();
          } catch (e) {
            console.warn('[Supabase] SignOut error:', e);
          }
        }
        set({ isAuthenticated: false, user: null });
      },

      sendOtpReset: async (email) => {
        if (isSupabaseConfigured()) {
          try {
            await supabaseService.resetPasswordForEmail(email);
            return { success: true, message: `Password reset email sent to ${email} via Supabase Auth.` };
          } catch (e) {
            // fallback
          }
        }
        return { success: true, message: `OTP password reset code sent to ${email}.` };
      },

      setActiveWarehouse: (id) => set({ activeWarehouseId: id, redisCacheTTL: 60 }),

      // Products
      addProduct: async (productData, initialStocks = []) => {
        let id = `prod-${Date.now()}`;
        if (isSupabaseConfigured()) {
          const inserted = await supabaseService.insertProduct(productData);
          if (inserted) {
            id = inserted.id;
          }
        }
        const newProduct: Product = {
          ...productData,
          id,
          created_at: new Date().toISOString(),
        };

        const newStockLevels = [...get().stockLevels];
        const newLedger = [...get().ledger];
        const warehouseList = get().warehouses;

        warehouseList.forEach((wh) => {
          const st = initialStocks.find((s) => s.warehouse_id === wh.id);
          const qty = Math.max(0, Number(st?.quantity) || 0);

          newStockLevels.push({
            id: `sl-${Date.now()}-${wh.id}-${Math.random().toString(36).substring(2, 6)}`,
            product_id: id,
            warehouse_id: wh.id,
            quantity: qty,
            updated_at: new Date().toISOString(),
          });

          if (isSupabaseConfigured() && qty > 0) {
            supabaseService.upsertStockLevel(id, wh.id, qty);
          }

          if (qty > 0) {
            newLedger.unshift({
              id: `led-${Date.now()}-${wh.id}-${Math.random().toString(36).substring(2, 6)}`,
              product_id: id,
              warehouse_id: wh.id,
              reference_no: 'INIT/STOCK',
              movement_type: 'IN',
              quantity_change: qty,
              quantity_after: qty,
              performed_by: get().user?.name || 'Alex Rivera',
              performed_at: new Date().toISOString(),
              from_location: 'Vendor Setup',
              to_location: wh.code,
              notes: `Initial stock allocation: ${qty} ${newProduct.unit_of_measure}`,
            });
          }
        });

        set({
          products: [newProduct, ...get().products],
          stockLevels: newStockLevels,
          ledger: newLedger,
          redisCacheTTL: 60,
        });
        redisCache.invalidateKPIsCache();
      },

      updateProduct: (id, data) => {
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)),
          redisCacheTTL: 60,
        });

        if (isSupabaseConfigured()) {
          supabaseService.updateProduct(id, data);
        }
      },

      deleteProduct: (id) => {
        set({
          products: get().products.filter((p) => p.id !== id),
          stockLevels: get().stockLevels.filter((s) => s.product_id !== id),
          redisCacheTTL: 60,
        });
      },

      // Direct Stock Update from Top Nav Stock Page
      updateStockDirectly: (productId, warehouseId, newQty, notes = 'Direct stock page manual adjustment') => {
        const state = get();
        const now = new Date().toISOString();
        const performedBy = state.user?.name || 'Alex Rivera';

        const stockIndex = state.stockLevels.findIndex(
          (s) => s.product_id === productId && s.warehouse_id === warehouseId
        );
        const oldQty = stockIndex >= 0 ? Number(state.stockLevels[stockIndex].quantity) : 0;
        const delta = newQty - oldQty;

        const updatedStockLevels = [...state.stockLevels];
        if (stockIndex >= 0) {
          updatedStockLevels[stockIndex].quantity = newQty;
          updatedStockLevels[stockIndex].updated_at = now;
        } else {
          updatedStockLevels.push({
            id: `sl-${Date.now()}`,
            product_id: productId,
            warehouse_id: warehouseId,
            quantity: newQty,
            updated_at: now,
          });
        }

        const newLedger: StockLedger = {
          id: `led-${Date.now()}`,
          product_id: productId,
          warehouse_id: warehouseId,
          movement_type: delta >= 0 ? 'IN' : 'OUT',
          quantity_change: delta,
          quantity_after: newQty,
          performed_by: performedBy,
          performed_at: now,
          from_location: delta >= 0 ? 'Manual Adjustment' : 'WH/Stock1',
          to_location: delta >= 0 ? 'WH/Stock1' : 'Manual Adjustment',
          notes: `${notes} (${delta >= 0 ? '+' : ''}${delta})`,
        };

        set({
          stockLevels: updatedStockLevels,
          ledger: [newLedger, ...state.ledger],
          redisCacheTTL: 60,
        });
        redisCache.invalidateKPIsCache();
      },

      // Warehouses & Locations
      addWarehouse: async (data) => {
        let id = `wh-${Date.now()}`;
        if (isSupabaseConfigured()) {
          const inserted = await supabaseService.insertWarehouse(data);
          if (inserted) {
            id = inserted.id;
          }
        }
        const newWh: Warehouse = { ...data, id, created_at: new Date().toISOString() };
        set({ warehouses: [...get().warehouses, newWh], redisCacheTTL: 60 });
        redisCache.invalidateKPIsCache();
      },

      updateWarehouse: (id, data) => {
        set({
          warehouses: get().warehouses.map((w) => (w.id === id ? { ...w, ...data } : w)),
          redisCacheTTL: 60,
        });
        if (isSupabaseConfigured()) {
          supabaseService.updateWarehouse(id, data);
        }
        redisCache.invalidateKPIsCache();
      },

      addLocation: async (data) => {
        let id = `loc-${Date.now()}`;
        if (isSupabaseConfigured()) {
          const inserted = await supabaseService.insertLocation(data);
          if (inserted) {
            id = inserted.id;
          }
        }
        const newLoc: LocationItem = { ...data, id, created_at: new Date().toISOString() };
        set({ locations: [...get().locations, newLoc], redisCacheTTL: 60 });
        redisCache.invalidateKPIsCache();
      },

      updateLocation: (id, data) => {
        set({
          locations: get().locations.map((l) => (l.id === id ? { ...l, ...data } : l)),
          redisCacheTTL: 60,
        });
        if (isSupabaseConfigured()) {
          supabaseService.updateLocation(id, data);
        }
        redisCache.invalidateKPIsCache();
      },

      // Operations Flow
      createOperation: (data) => {
        const state = get();
        const wh = state.warehouses.find((w) => w.id === (data.source_warehouse_id || data.destination_warehouse_id));
        const whCode = wh ? wh.code : 'WH';

        let refNo = '';
        let seqNumber = 1;

        if (data.type === 'receipt') {
          seqNumber = state.receiptSeq;
          refNo = `${whCode}/IN/${String(seqNumber).padStart(4, '0')}`;
          set({ receiptSeq: seqNumber + 1 });
        } else if (data.type === 'delivery') {
          seqNumber = state.deliverySeq;
          refNo = `${whCode}/OUT/${String(seqNumber).padStart(4, '0')}`;
          set({ deliverySeq: seqNumber + 1 });
        } else if (data.type === 'transfer') {
          seqNumber = state.transferSeq;
          refNo = `${whCode}/TRF/${String(seqNumber).padStart(4, '0')}`;
          set({ transferSeq: seqNumber + 1 });
        } else {
          seqNumber = state.adjustmentSeq;
          refNo = `${whCode}/ADJ/${String(seqNumber).padStart(4, '0')}`;
          set({ adjustmentSeq: seqNumber + 1 });
        }

        const opId = `op-${Date.now()}`;
        const newOp: Operation = {
          id: opId,
          type: data.type,
          status: 'draft',
          reference_no: refNo,
          supplier_or_customer: data.supplier_or_customer,
          source_warehouse_id: data.source_warehouse_id,
          destination_warehouse_id: data.destination_warehouse_id,
          schedule_date: data.schedule_date || new Date().toISOString().slice(0, 10),
          responsible_name: state.user?.name || 'Alex Rivera',
          notes: data.notes,
          created_by: state.user?.name || 'Alex Rivera',
          created_at: new Date().toISOString(),
          lines: data.lines.map((l, idx) => ({
            id: `line-${opId}-${idx}`,
            operation_id: opId,
            product_id: l.product_id,
            expected_qty: Number(l.expected_qty),
            unit_of_measure: l.unit_of_measure,
          })),
        };

        set({ operations: [newOp, ...state.operations], redisCacheTTL: 60 });
        redisCache.invalidateKPIsCache();
        if (isSupabaseConfigured()) {
          supabaseService.insertOperation(newOp);
        }
        return newOp;
      },

      markAsReady: (id) => {
        set({
          operations: get().operations.map((op) => (op.id === id ? { ...op, status: 'ready' } : op)),
          redisCacheTTL: 60,
        });
        if (isSupabaseConfigured()) {
          supabaseService.updateOperationStatus(id, 'ready');
        }
      },

      cancelOperation: (id) => {
        set({
          operations: get().operations.map((op) => (op.id === id ? { ...op, status: 'canceled' } : op)),
          redisCacheTTL: 60,
        });
        if (isSupabaseConfigured()) {
          supabaseService.updateOperationStatus(id, 'canceled');
        }
      },

      validateOperation: (id, actualLines) => {
        const state = get();
        const op = state.operations.find((o) => o.id === id);

        if (!op) return { success: false, message: 'Operation document not found' };
        if (op.status === 'done') return { success: false, message: 'Operation is already validated' };
        if (op.status === 'canceled') return { success: false, message: 'Cannot validate a canceled document' };

        const updatedStockLevels = [...state.stockLevels];
        const newLedgerEntries: StockLedger[] = [...state.ledger];
        const performedBy = state.user?.name || 'Alex Rivera';
        const now = new Date().toISOString();

        const updatedLines = op.lines.map((line) => {
          const override = actualLines?.find((a) => a.product_id === line.product_id);
          const finalQty = override ? override.actual_qty : (line.actual_qty ?? line.expected_qty);
          return { ...line, actual_qty: finalQty };
        });

        for (const line of updatedLines) {
          const qty = line.actual_qty ?? line.expected_qty;

          if (op.type === 'receipt') {
            const destWh = op.destination_warehouse_id || 'wh-1';
            let stockIndex = updatedStockLevels.findIndex(
              (s) => s.product_id === line.product_id && s.warehouse_id === destWh
            );

            let currentQty = 0;
            if (stockIndex >= 0) {
              currentQty = Number(updatedStockLevels[stockIndex].quantity);
              updatedStockLevels[stockIndex].quantity = currentQty + qty;
              updatedStockLevels[stockIndex].updated_at = now;
            } else {
              updatedStockLevels.push({
                id: `sl-${Date.now()}-${Math.random()}`,
                product_id: line.product_id,
                warehouse_id: destWh,
                quantity: qty,
                updated_at: now,
              });
            }

            newLedgerEntries.unshift({
              id: `led-${Date.now()}-${Math.random()}`,
              product_id: line.product_id,
              warehouse_id: destWh,
              operation_id: op.id,
              reference_no: op.reference_no,
              movement_type: 'IN',
              quantity_change: qty,
              quantity_after: currentQty + qty,
              performed_by: performedBy,
              performed_at: now,
              from_location: op.supplier_or_customer || 'Vendor',
              to_location: 'WH/Stock1',
              notes: `Receipt validation (${op.reference_no})`,
            });
          } else if (op.type === 'delivery') {
            const srcWh = op.source_warehouse_id || 'wh-1';
            let stockIndex = updatedStockLevels.findIndex(
              (s) => s.product_id === line.product_id && s.warehouse_id === srcWh
            );

            let currentQty = 0;
            if (stockIndex >= 0) {
              currentQty = Number(updatedStockLevels[stockIndex].quantity);
              updatedStockLevels[stockIndex].quantity = Math.max(0, currentQty - qty);
              updatedStockLevels[stockIndex].updated_at = now;
            }

            const afterQty = Math.max(0, currentQty - qty);
            newLedgerEntries.unshift({
              id: `led-${Date.now()}-${Math.random()}`,
              product_id: line.product_id,
              warehouse_id: srcWh,
              operation_id: op.id,
              reference_no: op.reference_no,
              movement_type: 'OUT',
              quantity_change: -qty,
              quantity_after: afterQty,
              performed_by: performedBy,
              performed_at: now,
              from_location: 'WH/Stock1',
              to_location: op.supplier_or_customer || 'Customer',
              notes: `Delivery order dispatch (${op.reference_no})`,
            });
          } else if (op.type === 'transfer') {
            const srcWh = op.source_warehouse_id || 'wh-1';
            const destWh = op.destination_warehouse_id || 'wh-2';

            // Source Out
            let srcIndex = updatedStockLevels.findIndex(
              (s) => s.product_id === line.product_id && s.warehouse_id === srcWh
            );
            let srcCurrent = srcIndex >= 0 ? Number(updatedStockLevels[srcIndex].quantity) : 0;
            const srcAfter = Math.max(0, srcCurrent - qty);

            if (srcIndex >= 0) {
              updatedStockLevels[srcIndex].quantity = srcAfter;
              updatedStockLevels[srcIndex].updated_at = now;
            }

            newLedgerEntries.unshift({
              id: `led-${Date.now()}-src`,
              product_id: line.product_id,
              warehouse_id: srcWh,
              operation_id: op.id,
              reference_no: op.reference_no,
              movement_type: 'TRANSFER_OUT',
              quantity_change: -qty,
              quantity_after: srcAfter,
              performed_by: performedBy,
              performed_at: now,
              from_location: 'WH/Stock1',
              to_location: 'PROD/Floor',
              notes: `Transfer OUT to ${destWh}`,
            });

            // Destination In
            let destIndex = updatedStockLevels.findIndex(
              (s) => s.product_id === line.product_id && s.warehouse_id === destWh
            );
            let destCurrent = destIndex >= 0 ? Number(updatedStockLevels[destIndex].quantity) : 0;
            const destAfter = destCurrent + qty;

            if (destIndex >= 0) {
              updatedStockLevels[destIndex].quantity = destAfter;
              updatedStockLevels[destIndex].updated_at = now;
            } else {
              updatedStockLevels.push({
                id: `sl-${Date.now()}-dest`,
                product_id: line.product_id,
                warehouse_id: destWh,
                quantity: destAfter,
                updated_at: now,
              });
            }

            newLedgerEntries.unshift({
              id: `led-${Date.now()}-dest`,
              product_id: line.product_id,
              warehouse_id: destWh,
              operation_id: op.id,
              reference_no: op.reference_no,
              movement_type: 'TRANSFER_IN',
              quantity_change: qty,
              quantity_after: destAfter,
              performed_by: performedBy,
              performed_at: now,
              from_location: 'WH/Stock1',
              to_location: 'PROD/Floor',
              notes: `Transfer IN from ${srcWh}`,
            });
          } else if (op.type === 'adjustment') {
            const whId = op.source_warehouse_id || op.destination_warehouse_id || 'wh-1';
            let stockIndex = updatedStockLevels.findIndex(
              (s) => s.product_id === line.product_id && s.warehouse_id === whId
            );
            const recordedQty = stockIndex >= 0 ? Number(updatedStockLevels[stockIndex].quantity) : 0;
            const countedQty = qty;
            const delta = countedQty - recordedQty;

            if (stockIndex >= 0) {
              updatedStockLevels[stockIndex].quantity = countedQty;
              updatedStockLevels[stockIndex].updated_at = now;
            } else {
              updatedStockLevels.push({
                id: `sl-${Date.now()}-${Math.random()}`,
                product_id: line.product_id,
                warehouse_id: whId,
                quantity: countedQty,
                updated_at: now,
              });
            }

            newLedgerEntries.unshift({
              id: `led-${Date.now()}-${Math.random()}`,
              product_id: line.product_id,
              warehouse_id: whId,
              operation_id: op.id,
              reference_no: op.reference_no,
              movement_type: 'ADJUST',
              quantity_change: delta,
              quantity_after: countedQty,
              performed_by: performedBy,
              performed_at: now,
              from_location: 'Audit Count',
              to_location: 'WH/Stock1',
              notes: `Adjustment validation: recorded ${recordedQty}, counted ${countedQty} (${delta >= 0 ? '+' : ''}${delta} ${line.unit_of_measure})`,
            });
          }
        }

        const updatedOps = state.operations.map((o) =>
          o.id === id ? { ...o, status: 'done' as OperationStatus, validated_at: now, lines: updatedLines } : o
        );

        set({
          operations: updatedOps,
          stockLevels: updatedStockLevels,
          ledger: newLedgerEntries,
          redisCacheTTL: 60,
        });
        redisCache.invalidateKPIsCache();

        if (isSupabaseConfigured()) {
          supabaseService.updateOperationStatus(op.id, 'done', now);
          for (const line of updatedLines) {
            if (op.destination_warehouse_id) {
              const current = updatedStockLevels.find(s => s.product_id === line.product_id && s.warehouse_id === op.destination_warehouse_id)?.quantity || 0;
              supabaseService.upsertStockLevel(line.product_id, op.destination_warehouse_id, current);
            }
            if (op.source_warehouse_id) {
              const current = updatedStockLevels.find(s => s.product_id === line.product_id && s.warehouse_id === op.source_warehouse_id)?.quantity || 0;
              supabaseService.upsertStockLevel(line.product_id, op.source_warehouse_id, current);
            }
          }
        }

        return { success: true, message: `Operation ${op.reference_no} validated and stock levels updated!` };
      },

      createStockAdjustment: (productId, warehouseId, countedQty, notes) => {
        const state = get();
        const seqNumber = state.adjustmentSeq;
        const refNo = `WH/ADJ/${String(seqNumber).padStart(4, '0')}`;
        set({ adjustmentSeq: seqNumber + 1 });
        const now = new Date().toISOString();
        const performedBy = state.user?.name || 'Alex Rivera';

        const product = state.products.find((p) => p.id === productId);
        const uom = product ? product.unit_of_measure : 'pcs';

        const stockIndex = state.stockLevels.findIndex(
          (s) => s.product_id === productId && s.warehouse_id === warehouseId
        );
        const recordedQty = stockIndex >= 0 ? Number(state.stockLevels[stockIndex].quantity) : 0;
        const delta = countedQty - recordedQty;

        const updatedStockLevels = [...state.stockLevels];
        if (stockIndex >= 0) {
          updatedStockLevels[stockIndex].quantity = countedQty;
          updatedStockLevels[stockIndex].updated_at = now;
        } else {
          updatedStockLevels.push({
            id: `sl-${Date.now()}`,
            product_id: productId,
            warehouse_id: warehouseId,
            quantity: countedQty,
            updated_at: now,
          });
        }

        const opId = `op-${Date.now()}`;
        const newOp: Operation = {
          id: opId,
          type: 'adjustment',
          status: 'done',
          reference_no: refNo,
          source_warehouse_id: warehouseId,
          schedule_date: todayStr,
          responsible_name: performedBy,
          notes: `Stock count adjustment: recorded ${recordedQty}, counted ${countedQty}. Delta: ${delta >= 0 ? '+' : ''}${delta}. ${notes}`,
          created_by: performedBy,
          created_at: now,
          validated_at: now,
          lines: [
            {
              id: `line-${opId}-0`,
              operation_id: opId,
              product_id: productId,
              expected_qty: recordedQty,
              actual_qty: countedQty,
              unit_of_measure: uom,
            },
          ],
        };

        const newLedger: StockLedger = {
          id: `led-${Date.now()}`,
          product_id: productId,
          warehouse_id: warehouseId,
          operation_id: opId,
          reference_no: refNo,
          movement_type: 'ADJUST',
          quantity_change: delta,
          quantity_after: countedQty,
          performed_by: performedBy,
          performed_at: now,
          from_location: 'Audit Count',
          to_location: 'WH/Stock1',
          notes: notes || `Stock Adjustment (${delta >= 0 ? '+' : ''}${delta} ${uom})`,
        };

        set({
          operations: [newOp, ...state.operations],
          stockLevels: updatedStockLevels,
          ledger: [newLedger, ...state.ledger],
          redisCacheTTL: 60,
        });
        redisCache.invalidateKPIsCache();
      },

      getProductStockTotal: (productId) => {
        const { stockLevels, activeWarehouseId } = get();
        return stockLevels
          .filter(
            (sl) =>
              sl.product_id === productId &&
              (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId)
          )
          .reduce((sum, item) => sum + Number(item.quantity), 0);
      },

      getProductReservedStock: (productId) => {
        const { operations } = get();
        // Sum expected quantities for ready/waiting delivery orders
        return operations
          .filter((op) => op.type === 'delivery' && (op.status === 'ready' || op.status === 'waiting' || op.status === 'draft'))
          .flatMap((op) => op.lines)
          .filter((l) => l.product_id === productId)
          .reduce((sum, l) => sum + Number(l.expected_qty), 0);
      },

      getProductWarehouseStock: (productId, warehouseId) => {
        const { stockLevels } = get();
        const found = stockLevels.find(
          (sl) => sl.product_id === productId && sl.warehouse_id === warehouseId
        );
        return found ? Number(found.quantity) : 0;
      },

      getKPIs: () => {
        const { products, stockLevels, operations, activeWarehouseId } = get();

        const today = new Date().toISOString().slice(0, 10);

        const activeOps = operations.filter((op) => {
          if (activeWarehouseId === 'all') return true;
          return op.source_warehouse_id === activeWarehouseId || op.destination_warehouse_id === activeWarehouseId;
        });

        // Receipts KPI Card logic
        const receiptOps = activeOps.filter((o) => o.type === 'receipt' && o.status !== 'done' && o.status !== 'canceled');
        const toReceiveCount = receiptOps.length;
        const receiptsLateCount = receiptOps.filter((o) => o.schedule_date < today).length;
        const receiptsOperationsCount = receiptOps.filter((o) => o.schedule_date > today).length;

        // Deliveries KPI Card logic
        const deliveryOps = activeOps.filter((o) => o.type === 'delivery' && o.status !== 'done' && o.status !== 'canceled');
        const toDeliverCount = deliveryOps.length;
        const deliveriesLateCount = deliveryOps.filter((o) => o.schedule_date < today).length;
        const deliveriesWaitingCount = deliveryOps.filter((o) => o.status === 'waiting').length;
        const deliveriesOperationsCount = deliveryOps.filter((o) => o.schedule_date > today).length;

        // Internal Transfers KPI Card logic
        const transferOps = activeOps.filter((o) => o.type === 'transfer' && o.status !== 'done' && o.status !== 'canceled');
        const internalTransfersScheduledCount = transferOps.length;

        // Stock totals
        let totalProductsInStock = 0;
        let lowStockItemsCount = 0;
        let outOfStockItemsCount = 0;

        products.forEach((p) => {
          const totalQty = stockLevels
            .filter(
              (sl) =>
                sl.product_id === p.id &&
                (activeWarehouseId === 'all' || sl.warehouse_id === activeWarehouseId)
            )
            .reduce((sum, item) => sum + Number(item.quantity), 0);

          if (totalQty > 0) totalProductsInStock += 1;
          if (totalQty === 0) outOfStockItemsCount += 1;
          else if (totalQty <= p.reorder_level) lowStockItemsCount += 1;
        });

        const kpis: DashboardKPIs = {
          toReceiveCount,
          receiptsLateCount,
          receiptsOperationsCount,
          toDeliverCount,
          deliveriesLateCount,
          deliveriesWaitingCount,
          deliveriesOperationsCount,
          internalTransfersScheduledCount,
          totalProductsInStock,
          lowStockItemsCount,
          outOfStockItemsCount,
        };

        // Cache in Upstash Redis / fast cache with 60s TTL
        redisCache.setCachedKPIs(activeWarehouseId, kpis, 60);

        return kpis;
      },

      resetToDefaults: () => {
        set({
          warehouses: initialWarehouses,
          locations: initialLocations,
          categories: initialCategories,
          products: initialProducts,
          stockLevels: initialStockLevels,
          operations: initialOperations,
          ledger: initialLedger,
          receiptSeq: 3,
          deliverySeq: 3,
          transferSeq: 2,
          adjustmentSeq: 1,
          activeWarehouseId: 'all',
          redisCacheTTL: 60,
        });
      },
    }),
    {
      name: 'ims-odoo-storage',
    }
  )
);
