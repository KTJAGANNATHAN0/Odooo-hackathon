import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Warehouse,
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
  redisCacheTTL: number; // Simulated Redis TTL countdown indicator

  // Data Collections
  warehouses: Warehouse[];
  categories: Category[];
  products: Product[];
  stockLevels: StockLevel[];
  operations: Operation[];
  ledger: StockLedger[];

  // Actions
  login: (email: string, pass: string) => boolean;
  signup: (email: string, name: string, pass: string) => boolean;
  logout: () => void;
  sendOtpReset: (email: string) => { success: boolean; message: string };

  setActiveWarehouse: (id: string) => void;

  // Products
  addProduct: (product: Omit<Product, 'id' | 'created_at'>, initialStocks?: { warehouse_id: string; quantity: number }[]) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Warehouses
  addWarehouse: (data: Omit<Warehouse, 'id' | 'created_at'>) => void;
  updateWarehouse: (id: string, data: Partial<Warehouse>) => void;

  // Operations
  createOperation: (data: {
    type: OperationType;
    supplier_or_customer?: string;
    source_warehouse_id?: string;
    destination_warehouse_id?: string;
    notes?: string;
    lines: { product_id: string; expected_qty: number; unit_of_measure: UnitOfMeasure }[];
  }) => Operation;
  updateOperation: (id: string, data: Partial<Operation>) => void;
  cancelOperation: (id: string) => void;
  validateOperation: (id: string, actualLines?: { product_id: string; actual_qty: number }[]) => { success: boolean; message: string };

  // Adjustments
  createStockAdjustment: (productId: string, warehouseId: string, countedQty: number, notes: string) => void;

  // Analytics Helpers
  getKPIs: () => DashboardKPIs;
  getProductStockTotal: (productId: string) => number;
  getProductWarehouseStock: (productId: string, warehouseId: string) => number;
  
  // Demo Reset
  resetToDefaults: () => void;
}

const initialWarehouses: Warehouse[] = [
  { id: 'wh-1', name: 'Main Storage Hub', code: 'WH-MAIN', location: 'Building A - Sector 4', created_at: '2026-01-15T08:00:00Z' },
  { id: 'wh-2', name: 'Production Floor', code: 'WH-PROD', location: 'Factory Unit 2', created_at: '2026-01-20T08:00:00Z' },
  { id: 'wh-3', name: 'Distribution Depot', code: 'WH-DIST', location: 'Logistics Park East', created_at: '2026-02-01T08:00:00Z' },
];

const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Raw Materials', description: 'Metals, polymers, and raw bulk stock' },
  { id: 'cat-2', name: 'Finished Goods', description: 'Assembly outputs ready for dispatch' },
  { id: 'cat-3', name: 'Electronics & Components', description: 'Sensors, batteries, and harnesses' },
  { id: 'cat-4', name: 'Office & Furniture', description: 'Workspace equipment and ergonomic seats' },
  { id: 'cat-5', name: 'Packaging & Supplies', description: 'Boxes, straps, and protective padding' },
];

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Industrial Steel Rods 12mm',
    sku: 'RAW-STL-001',
    category_id: 'cat-1',
    unit_of_measure: 'kg',
    reorder_level: 150,
    image_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=300&q=80',
    created_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Copper Wire Harness 2.5mm',
    sku: 'ELE-COP-002',
    category_id: 'cat-3',
    unit_of_measure: 'meter',
    reorder_level: 500,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80',
    created_at: '2026-02-12T11:30:00Z',
  },
  {
    id: 'prod-3',
    name: 'Ergonomic Mesh Office Chair',
    sku: 'FUR-CHR-003',
    category_id: 'cat-4',
    unit_of_measure: 'pcs',
    reorder_level: 15,
    image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1205?auto=format&fit=crop&w=300&q=80',
    created_at: '2026-02-15T09:15:00Z',
  },
  {
    id: 'prod-4',
    name: 'Lithium-Ion Battery Pack 100Ah',
    sku: 'ELE-BAT-004',
    category_id: 'cat-3',
    unit_of_measure: 'pcs',
    reorder_level: 25,
    image_url: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=300&q=80',
    created_at: '2026-02-18T14:20:00Z',
  },
  {
    id: 'prod-5',
    name: 'Corrugated Heavy Duty Box XL',
    sku: 'PKG-BOX-005',
    category_id: 'cat-5',
    unit_of_measure: 'box',
    reorder_level: 300,
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80',
    created_at: '2026-02-20T16:00:00Z',
  },
  {
    id: 'prod-6',
    name: 'Hydraulic Oil ISO 46',
    sku: 'RAW-OIL-006',
    category_id: 'cat-1',
    unit_of_measure: 'litre',
    reorder_level: 40,
    image_url: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=300&q=80',
    created_at: '2026-02-22T08:45:00Z',
  },
];

const initialStockLevels: StockLevel[] = [
  // prod-1: total 420 kg
  { id: 'sl-1', product_id: 'prod-1', warehouse_id: 'wh-1', quantity: 300, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-2', product_id: 'prod-1', warehouse_id: 'wh-2', quantity: 120, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-3', product_id: 'prod-1', warehouse_id: 'wh-3', quantity: 0, updated_at: '2026-09-25T10:00:00Z' },

  // prod-2: total 1200 m
  { id: 'sl-4', product_id: 'prod-2', warehouse_id: 'wh-1', quantity: 800, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-5', product_id: 'prod-2', warehouse_id: 'wh-2', quantity: 400, updated_at: '2026-09-25T10:00:00Z' },

  // prod-3: total 8 pcs (LOW STOCK ALERT! reorder level = 15)
  { id: 'sl-6', product_id: 'prod-3', warehouse_id: 'wh-1', quantity: 5, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-7', product_id: 'prod-3', warehouse_id: 'wh-2', quantity: 3, updated_at: '2026-09-25T10:00:00Z' },

  // prod-4: total 0 pcs (OUT OF STOCK ALERT! reorder level = 25)
  { id: 'sl-8', product_id: 'prod-4', warehouse_id: 'wh-1', quantity: 0, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-9', product_id: 'prod-4', warehouse_id: 'wh-2', quantity: 0, updated_at: '2026-09-25T10:00:00Z' },

  // prod-5: total 850 boxes
  { id: 'sl-10', product_id: 'prod-5', warehouse_id: 'wh-1', quantity: 500, updated_at: '2026-09-25T10:00:00Z' },
  { id: 'sl-11', product_id: 'prod-5', warehouse_id: 'wh-3', quantity: 350, updated_at: '2026-09-25T10:00:00Z' },

  // prod-6: total 15 litres (LOW STOCK ALERT! reorder level = 40)
  { id: 'sl-12', product_id: 'prod-6', warehouse_id: 'wh-1', quantity: 15, updated_at: '2026-09-25T10:00:00Z' },
];

const initialOperations: Operation[] = [
  {
    id: 'op-1',
    type: 'receipt',
    status: 'ready',
    reference_no: 'REC-20260926-001',
    supplier_or_customer: 'Apex Metal & Wire Supplies Ltd',
    destination_warehouse_id: 'wh-1',
    notes: 'Urgent incoming batch of raw steel and copper wire.',
    created_by: 'Alex Rivera (Inventory Manager)',
    created_at: '2026-09-26T08:15:00Z',
    lines: [
      { id: 'line-1', operation_id: 'op-1', product_id: 'prod-1', expected_qty: 250, unit_of_measure: 'kg' },
      { id: 'line-2', operation_id: 'op-1', product_id: 'prod-2', expected_qty: 600, unit_of_measure: 'meter' },
    ],
  },
  {
    id: 'op-2',
    type: 'delivery',
    status: 'waiting',
    reference_no: 'DEL-20260926-001',
    supplier_or_customer: 'Volt Motors Tech Inc',
    source_warehouse_id: 'wh-1',
    notes: 'Awaiting stock replenishment of battery packs before packing.',
    created_by: 'Sarah Connor (Warehouse Specialist)',
    created_at: '2026-09-26T09:00:00Z',
    lines: [
      { id: 'line-3', operation_id: 'op-2', product_id: 'prod-4', expected_qty: 10, unit_of_measure: 'pcs' },
    ],
  },
  {
    id: 'op-3',
    type: 'transfer',
    status: 'ready',
    reference_no: 'TRF-20260926-001',
    source_warehouse_id: 'wh-1',
    destination_warehouse_id: 'wh-2',
    notes: 'Transfer raw materials to factory floor for shift B production.',
    created_by: 'Alex Rivera (Inventory Manager)',
    created_at: '2026-09-26T09:45:00Z',
    lines: [
      { id: 'line-4', operation_id: 'op-3', product_id: 'prod-1', expected_qty: 100, unit_of_measure: 'kg' },
    ],
  },
  {
    id: 'op-4',
    type: 'receipt',
    status: 'done',
    reference_no: 'REC-20260925-002',
    supplier_or_customer: 'Global Cartons Corp',
    destination_warehouse_id: 'wh-3',
    notes: 'Bulk box shipment verified and checked into stock.',
    created_by: 'Sarah Connor (Warehouse Specialist)',
    created_at: '2026-09-25T14:30:00Z',
    validated_at: '2026-09-25T15:10:00Z',
    lines: [
      { id: 'line-5', operation_id: 'op-4', product_id: 'prod-5', expected_qty: 500, actual_qty: 500, unit_of_measure: 'box' },
    ],
  },
  {
    id: 'op-5',
    type: 'adjustment',
    status: 'done',
    reference_no: 'ADJ-20260924-001',
    source_warehouse_id: 'wh-1',
    notes: 'Physical audit correction: 2 office chairs damaged during warehouse re-arrangement.',
    created_by: 'Alex Rivera (Inventory Manager)',
    created_at: '2026-09-24T11:00:00Z',
    validated_at: '2026-09-24T11:05:00Z',
    lines: [
      { id: 'line-6', operation_id: 'op-5', product_id: 'prod-3', expected_qty: 5, actual_qty: 5, unit_of_measure: 'pcs' },
    ],
  },
];

const initialLedger: StockLedger[] = [
  {
    id: 'led-1',
    product_id: 'prod-5',
    warehouse_id: 'wh-3',
    operation_id: 'op-4',
    reference_no: 'REC-20260925-002',
    movement_type: 'IN',
    quantity_change: 500,
    quantity_after: 500,
    performed_by: 'Sarah Connor',
    performed_at: '2026-09-25T15:10:00Z',
    notes: 'Receipt validation from Global Cartons Corp',
  },
  {
    id: 'led-2',
    product_id: 'prod-3',
    warehouse_id: 'wh-1',
    operation_id: 'op-5',
    reference_no: 'ADJ-20260924-001',
    movement_type: 'ADJUST',
    quantity_change: -2,
    quantity_after: 5,
    performed_by: 'Alex Rivera',
    performed_at: '2026-09-24T11:05:00Z',
    notes: 'Physical count adjustment (-2 damaged units)',
  },
  {
    id: 'led-3',
    product_id: 'prod-1',
    warehouse_id: 'wh-1',
    movement_type: 'IN',
    quantity_change: 300,
    quantity_after: 300,
    performed_by: 'System Seed',
    performed_at: '2026-09-20T08:00:00Z',
    notes: 'Initial inventory setup count',
  },
  {
    id: 'led-4',
    product_id: 'prod-2',
    warehouse_id: 'wh-1',
    movement_type: 'IN',
    quantity_change: 800,
    quantity_after: 800,
    performed_by: 'System Seed',
    performed_at: '2026-09-20T08:05:00Z',
    notes: 'Initial inventory setup count',
  },
  {
    id: 'led-5',
    product_id: 'prod-6',
    warehouse_id: 'wh-1',
    movement_type: 'IN',
    quantity_change: 15,
    quantity_after: 15,
    performed_by: 'System Seed',
    performed_at: '2026-09-22T09:00:00Z',
    notes: 'Initial inventory setup count',
  },
];

const defaultUser: User = {
  id: 'usr-1',
  name: 'Alex Rivera',
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
      categories: initialCategories,
      products: initialProducts,
      stockLevels: initialStockLevels,
      operations: initialOperations,
      ledger: initialLedger,

      login: (email, pass) => {
        if (email && pass) {
          set({
            isAuthenticated: true,
            user: {
              id: 'usr-1',
              name: email.split('@')[0].replace('.', ' ').toUpperCase(),
              email,
              role: 'Inventory Manager',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            },
          });
          return true;
        }
        return false;
      },

      signup: (email, name, pass) => {
        if (email && name && pass) {
          set({
            isAuthenticated: true,
            user: {
              id: `usr-${Date.now()}`,
              name,
              email,
              role: 'Inventory Manager',
            },
          });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false, user: null }),

      sendOtpReset: (email) => {
        return { success: true, message: `Password reset OTP has been sent to ${email}` };
      },

      setActiveWarehouse: (id) => set({ activeWarehouseId: id, redisCacheTTL: 60 }),

      // Products
      addProduct: (productData, initialStocks = []) => {
        const id = `prod-${Date.now()}`;
        const newProduct: Product = {
          ...productData,
          id,
          created_at: new Date().toISOString(),
        };

        const newStockLevels: StockLevel[] = [...get().stockLevels];
        const newLedger: StockLedger[] = [...get().ledger];

        initialStocks.forEach((st) => {
          newStockLevels.push({
            id: `sl-${Date.now()}-${Math.random()}`,
            product_id: id,
            warehouse_id: st.warehouse_id,
            quantity: st.quantity,
            updated_at: new Date().toISOString(),
          });

          if (st.quantity > 0) {
            newLedger.unshift({
              id: `led-${Date.now()}-${Math.random()}`,
              product_id: id,
              warehouse_id: st.warehouse_id,
              movement_type: 'IN',
              quantity_change: st.quantity,
              quantity_after: st.quantity,
              performed_by: get().user?.name || 'Manager',
              performed_at: new Date().toISOString(),
              notes: 'Initial product stock creation',
            });
          }
        });

        set({
          products: [newProduct, ...get().products],
          stockLevels: newStockLevels,
          ledger: newLedger,
          redisCacheTTL: 60,
        });
      },

      updateProduct: (id, data) => {
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, ...data } : p)),
          redisCacheTTL: 60,
        });
      },

      deleteProduct: (id) => {
        set({
          products: get().products.filter((p) => p.id !== id),
          stockLevels: get().stockLevels.filter((s) => s.product_id !== id),
          redisCacheTTL: 60,
        });
      },

      // Warehouses
      addWarehouse: (data) => {
        const id = `wh-${Date.now()}`;
        const newWh: Warehouse = {
          ...data,
          id,
          created_at: new Date().toISOString(),
        };
        set({ warehouses: [...get().warehouses, newWh], redisCacheTTL: 60 });
      },

      updateWarehouse: (id, data) => {
        set({
          warehouses: get().warehouses.map((w) => (w.id === id ? { ...w, ...data } : w)),
          redisCacheTTL: 60,
        });
      },

      // Operations
      createOperation: (data) => {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(100 + Math.random() * 900);
        const prefixMap: Record<OperationType, string> = {
          receipt: 'REC',
          delivery: 'DEL',
          transfer: 'TRF',
          adjustment: 'ADJ',
        };
        const refNo = `${prefixMap[data.type]}-${dateStr}-${randomNum}`;
        const opId = `op-${Date.now()}`;

        const newOp: Operation = {
          id: opId,
          type: data.type,
          status: 'ready',
          reference_no: refNo,
          supplier_or_customer: data.supplier_or_customer,
          source_warehouse_id: data.source_warehouse_id,
          destination_warehouse_id: data.destination_warehouse_id,
          notes: data.notes,
          created_by: get().user?.name || 'Inventory Specialist',
          created_at: new Date().toISOString(),
          lines: data.lines.map((l, idx) => ({
            id: `line-${opId}-${idx}`,
            operation_id: opId,
            product_id: l.product_id,
            expected_qty: Number(l.expected_qty),
            unit_of_measure: l.unit_of_measure,
          })),
        };

        set({ operations: [newOp, ...get().operations], redisCacheTTL: 60 });
        return newOp;
      },

      updateOperation: (id, data) => {
        set({
          operations: get().operations.map((op) => (op.id === id ? { ...op, ...data } : op)),
          redisCacheTTL: 60,
        });
      },

      cancelOperation: (id) => {
        set({
          operations: get().operations.map((op) => (op.id === id ? { ...op, status: 'canceled' } : op)),
          redisCacheTTL: 60,
        });
      },

      validateOperation: (id, actualLines) => {
        const state = get();
        const op = state.operations.find((o) => o.id === id);

        if (!op) return { success: false, message: 'Operation not found' };
        if (op.status === 'done') return { success: false, message: 'Operation is already validated and done' };
        if (op.status === 'canceled') return { success: false, message: 'Cannot validate a canceled operation' };

        const updatedStockLevels = [...state.stockLevels];
        const newLedgerEntries: StockLedger[] = [...state.ledger];
        const performedBy = state.user?.name || 'Warehouse Specialist';
        const now = new Date().toISOString();

        const updatedLines = op.lines.map((line) => {
          const override = actualLines?.find((a) => a.product_id === line.product_id);
          const finalQty = override ? override.actual_qty : (line.actual_qty ?? line.expected_qty);
          return { ...line, actual_qty: finalQty };
        });

        // Business logic based on type
        for (const line of updatedLines) {
          const qty = line.actual_qty ?? line.expected_qty;

          if (op.type === 'receipt') {
            // Receipt: stock increases in destination warehouse
            const destWh = op.destination_warehouse_id;
            if (!destWh) continue;

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
              notes: `Receipt from ${op.supplier_or_customer || 'Supplier'}`,
            });
          } else if (op.type === 'delivery') {
            // Delivery: stock decreases in source warehouse
            const srcWh = op.source_warehouse_id;
            if (!srcWh) continue;

            let stockIndex = updatedStockLevels.findIndex(
              (s) => s.product_id === line.product_id && s.warehouse_id === srcWh
            );

            let currentQty = 0;
            if (stockIndex >= 0) {
              currentQty = Number(updatedStockLevels[stockIndex].quantity);
              updatedStockLevels[stockIndex].quantity = Math.max(0, currentQty - qty);
              updatedStockLevels[stockIndex].updated_at = now;
            } else {
              updatedStockLevels.push({
                id: `sl-${Date.now()}-${Math.random()}`,
                product_id: line.product_id,
                warehouse_id: srcWh,
                quantity: 0,
                updated_at: now,
              });
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
              notes: `Delivery order for ${op.supplier_or_customer || 'Customer'}`,
            });
          } else if (op.type === 'transfer') {
            // Transfer: source warehouse decrease (-qty), destination warehouse increase (+qty)
            const srcWh = op.source_warehouse_id;
            const destWh = op.destination_warehouse_id;
            if (!srcWh || !destWh) continue;

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
              id: `led-${Date.now()}-src-${Math.random()}`,
              product_id: line.product_id,
              warehouse_id: srcWh,
              operation_id: op.id,
              reference_no: op.reference_no,
              movement_type: 'TRANSFER_OUT',
              quantity_change: -qty,
              quantity_after: srcAfter,
              performed_by: performedBy,
              performed_at: now,
              notes: `Internal Transfer OUT to warehouse ${destWh}`,
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
              id: `led-${Date.now()}-dest-${Math.random()}`,
              product_id: line.product_id,
              warehouse_id: destWh,
              operation_id: op.id,
              reference_no: op.reference_no,
              movement_type: 'TRANSFER_IN',
              quantity_change: qty,
              quantity_after: destAfter,
              performed_by: performedBy,
              performed_at: now,
              notes: `Internal Transfer IN from warehouse ${srcWh}`,
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

        return { success: true, message: `Operation ${op.reference_no} validated and stock levels updated!` };
      },

      createStockAdjustment: (productId, warehouseId, countedQty, notes) => {
        const state = get();
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(100 + Math.random() * 900);
        const refNo = `ADJ-${dateStr}-${randomNum}`;
        const now = new Date().toISOString();
        const performedBy = state.user?.name || 'Inventory Specialist';

        const product = state.products.find((p) => p.id === productId);
        const uom = product ? product.unit_of_measure : 'pcs';

        // Current recorded qty
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
          notes: `Stock adjustment count: recorded ${recordedQty}, counted ${countedQty}. Delta: ${delta >= 0 ? '+' : ''}${delta}. ${notes}`,
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
          notes: notes || `Stock Adjustment (${delta >= 0 ? '+' : ''}${delta} ${uom})`,
        };

        set({
          operations: [newOp, ...state.operations],
          stockLevels: updatedStockLevels,
          ledger: [newLedger, ...state.ledger],
          redisCacheTTL: 60,
        });
      },

      // Analytics Helpers
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

      getProductWarehouseStock: (productId, warehouseId) => {
        const { stockLevels } = get();
        const found = stockLevels.find(
          (sl) => sl.product_id === productId && sl.warehouse_id === warehouseId
        );
        return found ? Number(found.quantity) : 0;
      },

      getKPIs: () => {
        const { products, stockLevels, operations, activeWarehouseId } = get();

        // Calculate total products in stock (qty > 0)
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

          if (totalQty > 0) {
            totalProductsInStock += 1;
          }
          if (totalQty === 0) {
            outOfStockItemsCount += 1;
          } else if (totalQty <= p.reorder_level) {
            lowStockItemsCount += 1;
          }
        });

        const activeOps = operations.filter((op) => {
          if (activeWarehouseId === 'all') return true;
          return op.source_warehouse_id === activeWarehouseId || op.destination_warehouse_id === activeWarehouseId;
        });

        const pendingReceiptsCount = activeOps.filter(
          (op) => op.type === 'receipt' && (op.status === 'ready' || op.status === 'waiting' || op.status === 'draft')
        ).length;

        const pendingDeliveriesCount = activeOps.filter(
          (op) => op.type === 'delivery' && (op.status === 'ready' || op.status === 'waiting' || op.status === 'draft')
        ).length;

        const internalTransfersCount = activeOps.filter(
          (op) => op.type === 'transfer' && op.status !== 'done' && op.status !== 'canceled'
        ).length;

        return {
          totalProductsInStock,
          lowStockItemsCount,
          outOfStockItemsCount,
          pendingReceiptsCount,
          pendingDeliveriesCount,
          internalTransfersCount,
        };
      },

      resetToDefaults: () => {
        set({
          warehouses: initialWarehouses,
          categories: initialCategories,
          products: initialProducts,
          stockLevels: initialStockLevels,
          operations: initialOperations,
          ledger: initialLedger,
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
