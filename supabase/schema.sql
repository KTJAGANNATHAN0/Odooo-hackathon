-- ====================================================================
-- ODOO INVENTORY MANAGEMENT SYSTEM (IMS) — SUPABASE POSTGRESQL SCHEMA
-- Adheres to IMS_Project_Requirements.md & Wireframe Checklist v2.0
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
);

-- 2. Warehouse Internal Locations
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text NOT NULL,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 3. Product Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 4. Products Catalog
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  unit_of_measure text NOT NULL DEFAULT 'pcs',
  reorder_level integer DEFAULT 10,
  cost_price numeric NOT NULL DEFAULT 3000,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 5. Stock Levels (per product per warehouse)
CREATE TABLE IF NOT EXISTS public.stock_levels (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
);

-- 6. Operations (Receipts, Delivery Orders, Internal Transfers, Adjustments)
CREATE TABLE IF NOT EXISTS public.operations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type IN ('receipt', 'delivery', 'transfer', 'adjustment')),
  status text NOT NULL CHECK (status IN ('draft', 'waiting', 'ready', 'done', 'canceled')) DEFAULT 'ready',
  reference_no text UNIQUE NOT NULL,
  supplier_or_customer text,
  source_warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  destination_warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE SET NULL,
  schedule_date date DEFAULT CURRENT_DATE,
  responsible_name text DEFAULT 'Alex Rivera',
  notes text,
  created_by text DEFAULT 'Alex Rivera (Inventory Manager)',
  created_at timestamptz DEFAULT now(),
  validated_at timestamptz
);

-- 7. Operation Line Items
CREATE TABLE IF NOT EXISTS public.operation_lines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_id uuid REFERENCES public.operations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  expected_qty numeric NOT NULL,
  actual_qty numeric,
  unit_of_measure text NOT NULL DEFAULT 'pcs'
);

-- 8. Stock Ledger (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS public.stock_ledger (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE,
  operation_id uuid REFERENCES public.operations(id) ON DELETE SET NULL,
  reference_no text,
  movement_type text NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUST', 'TRANSFER_IN', 'TRANSFER_OUT')),
  quantity_change numeric NOT NULL,
  quantity_after numeric NOT NULL,
  performed_by text NOT NULL DEFAULT 'Alex Rivera',
  performed_at timestamptz DEFAULT now(),
  from_location text,
  to_location text,
  notes text
);

-- ====================================================================
-- PERFORMANCE INDEXES (Conforming to Supabase Postgres Best Practices)
-- ====================================================================
-- Foreign key column indexes to prevent sequential scans during JOINs and CASCADE operations
CREATE INDEX IF NOT EXISTS idx_locations_wh ON public.locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_cat ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_product ON public.stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_warehouse ON public.stock_levels(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_operations_src_wh ON public.operations(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_operations_dest_wh ON public.operations(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_operations_status ON public.operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_type ON public.operations(type);
CREATE INDEX IF NOT EXISTS idx_operations_ref ON public.operations(reference_no);
CREATE INDEX IF NOT EXISTS idx_operation_lines_op ON public.operation_lines(operation_id);
CREATE INDEX IF NOT EXISTS idx_operation_lines_prod ON public.operation_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_product ON public.stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_warehouse ON public.stock_ledger(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_ledger_op ON public.stock_ledger(operation_id);
CREATE INDEX IF NOT EXISTS idx_ledger_performed_at ON public.stock_ledger(performed_at DESC);

-- ====================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for stock_levels and operations tables
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_levels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operations;

-- ====================================================================
-- PERMISSIONS FOR SUPABASE DATA API (Anon & Authenticated Roles)
-- ====================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- Allow public access for hackathon evaluation
-- ====================================================================
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read warehouses" ON public.warehouses FOR SELECT USING (true);
CREATE POLICY "Allow public write warehouses" ON public.warehouses FOR ALL USING (true);

CREATE POLICY "Allow public read locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Allow public write locations" ON public.locations FOR ALL USING (true);

CREATE POLICY "Allow public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public write categories" ON public.categories FOR ALL USING (true);

CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public write products" ON public.products FOR ALL USING (true);

CREATE POLICY "Allow public read stock_levels" ON public.stock_levels FOR SELECT USING (true);
CREATE POLICY "Allow public write stock_levels" ON public.stock_levels FOR ALL USING (true);

CREATE POLICY "Allow public read operations" ON public.operations FOR SELECT USING (true);
CREATE POLICY "Allow public write operations" ON public.operations FOR ALL USING (true);

CREATE POLICY "Allow public read operation_lines" ON public.operation_lines FOR SELECT USING (true);
CREATE POLICY "Allow public write operation_lines" ON public.operation_lines FOR ALL USING (true);

CREATE POLICY "Allow public read stock_ledger" ON public.stock_ledger FOR SELECT USING (true);
CREATE POLICY "Allow public write stock_ledger" ON public.stock_ledger FOR ALL USING (true);

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================
INSERT INTO public.warehouses (id, name, code, location) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Main Storage Hub', 'WH-MAIN', 'Building A - Sector 4'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Production Floor', 'WH-PROD', 'Factory Unit 2'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Distribution Depot', 'WH-DIST', 'Logistics Park East')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, description) VALUES
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Raw Materials', 'Metals, polymers, and raw bulk stock'),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Finished Goods', 'Assembly outputs ready for dispatch'),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Electronics & Components', 'Sensors, batteries, and harnesses'),
  ('c1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Office & Furniture', 'Workspace equipment and ergonomic seats')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, sku, category_id, unit_of_measure, reorder_level, cost_price, image_url) VALUES
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Industrial Steel Rods 12mm', 'RAW-STL-001', 'c1b2c3d4-e5f6-7890-abcd-ef1234567801', 'kg', 150, 2400, '/images/steel_rods.png'),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Copper Wire Harness 2.5mm', 'ELE-COP-002', 'c1b2c3d4-e5f6-7890-abcd-ef1234567803', 'meter', 500, 1800, '/images/copper_wire.png'),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Ergonomic Mesh Office Chair', 'FUR-CHR-003', 'c1b2c3d4-e5f6-7890-abcd-ef1234567804', 'pcs', 15, 6500, '/images/office_chair.png')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stock_levels (product_id, warehouse_id, quantity) VALUES
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 300),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567801', 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 120),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567802', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 800),
  ('b1b2c3d4-e5f6-7890-abcd-ef1234567803', 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 5)
ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity;
