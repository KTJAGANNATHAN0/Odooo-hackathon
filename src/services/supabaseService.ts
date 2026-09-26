import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Warehouse, Category, StockLevel, Operation, StockLedger, User } from '../types';

/**
 * Service providing database operations against Supabase
 * matching the schema in IMS_Project_Requirements.md
 */
export const supabaseService = {
  /**
   * Check connection health with Supabase
   */
  async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return { connected: false, message: 'Supabase credentials not configured' };
    }
    try {
      const { error } = await supabase.from('warehouses').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        return { connected: false, message: error.message };
      }
      return { connected: true, message: 'Connected to Supabase PostgreSQL' };
    } catch (err: any) {
      return { connected: false, message: err?.message || 'Connection failed' };
    }
  },

  // -------------------------------------------------------------
  // Warehouses
  // -------------------------------------------------------------
  async fetchWarehouses(): Promise<Warehouse[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase.from('warehouses').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data as Warehouse[];
    } catch (err) {
      console.warn('[Supabase] fetchWarehouses failed:', err);
      return null;
    }
  },

  async insertWarehouse(warehouse: Omit<Warehouse, 'id' | 'created_at'>): Promise<Warehouse | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .insert([{ name: warehouse.name, code: warehouse.code, location: warehouse.location }])
        .select()
        .single();
      if (error) throw error;
      return data as Warehouse;
    } catch (err) {
      console.warn('[Supabase] insertWarehouse failed:', err);
      return null;
    }
  },

  // -------------------------------------------------------------
  // Products
  // -------------------------------------------------------------
  async fetchProducts(): Promise<Product[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    } catch (err) {
      console.warn('[Supabase] fetchProducts failed:', err);
      return null;
    }
  },

  async insertProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          sku: product.sku,
          category_id: product.category_id,
          unit_of_measure: product.unit_of_measure,
          reorder_level: product.reorder_level,
          cost_price: product.cost_price,
          image_url: product.image_url,
        }])
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    } catch (err) {
      console.warn('[Supabase] insertProduct failed:', err);
      return null;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase.from('products').update(updates).eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase] updateProduct failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // Stock Levels
  // -------------------------------------------------------------
  async fetchStockLevels(): Promise<StockLevel[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase.from('stock_levels').select('*');
      if (error) throw error;
      return data as StockLevel[];
    } catch (err) {
      console.warn('[Supabase] fetchStockLevels failed:', err);
      return null;
    }
  },

  async upsertStockLevel(productId: string, warehouseId: string, quantity: number): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase.from('stock_levels').upsert(
        {
          product_id: productId,
          warehouse_id: warehouseId,
          quantity: quantity,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'product_id,warehouse_id' }
      );
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase] upsertStockLevel failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // Operations & Lines
  // -------------------------------------------------------------
  async fetchOperations(): Promise<Operation[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('operations')
        .select('*, lines:operation_lines(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Operation[];
    } catch (err) {
      console.warn('[Supabase] fetchOperations failed:', err);
      return null;
    }
  },

  async insertOperation(op: Operation): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      // Insert operation parent
      const { error: opError } = await supabase.from('operations').insert([{
        id: op.id,
        type: op.type,
        status: op.status,
        reference_no: op.reference_no,
        supplier_or_customer: op.supplier_or_customer,
        source_warehouse_id: op.source_warehouse_id,
        destination_warehouse_id: op.destination_warehouse_id,
        schedule_date: op.schedule_date,
        responsible_name: op.responsible_name,
        notes: op.notes,
        created_by: op.created_by,
        created_at: op.created_at,
        validated_at: op.validated_at,
      }]);
      if (opError) throw opError;

      // Insert line items
      if (op.lines && op.lines.length > 0) {
        const linesToInsert = op.lines.map((l) => ({
          id: l.id,
          operation_id: op.id,
          product_id: l.product_id,
          expected_qty: l.expected_qty,
          actual_qty: l.actual_qty,
          unit_of_measure: l.unit_of_measure,
        }));
        const { error: linesError } = await supabase.from('operation_lines').insert(linesToInsert);
        if (linesError) throw linesError;
      }

      return true;
    } catch (err) {
      console.warn('[Supabase] insertOperation failed:', err);
      return false;
    }
  },

  async updateOperationStatus(id: string, status: string, validatedAt?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const updates: any = { status };
      if (validatedAt) updates.validated_at = validatedAt;
      const { error } = await supabase.from('operations').update(updates).eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase] updateOperationStatus failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // Stock Ledger
  // -------------------------------------------------------------
  async fetchLedger(): Promise<StockLedger[] | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase.from('stock_ledger').select('*').order('performed_at', { ascending: false });
      if (error) throw error;
      return data as StockLedger[];
    } catch (err) {
      console.warn('[Supabase] fetchLedger failed:', err);
      return null;
    }
  },

  async insertLedgerEntry(entry: StockLedger): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase.from('stock_ledger').insert([{
        id: entry.id,
        product_id: entry.product_id,
        warehouse_id: entry.warehouse_id,
        operation_id: entry.operation_id,
        reference_no: entry.reference_no,
        movement_type: entry.movement_type,
        quantity_change: entry.quantity_change,
        quantity_after: entry.quantity_after,
        performed_by: entry.performed_by,
        performed_at: entry.performed_at,
        from_location: entry.from_location,
        to_location: entry.to_location,
        notes: entry.notes,
      }]);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('[Supabase] insertLedgerEntry failed:', err);
      return false;
    }
  },

  // -------------------------------------------------------------
  // Realtime Subscriptions (from master wireframe checklist)
  // -------------------------------------------------------------
  subscribeToStockChanges(onStockChange: (payload: any) => void) {
    if (!isSupabaseConfigured()) return () => {};

    const channel = supabase
      .channel('realtime_stock_levels')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stock_levels' },
        (payload) => {
          onStockChange(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
