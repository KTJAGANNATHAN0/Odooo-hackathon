export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER_IN' | 'TRANSFER_OUT';
export type OperationType = 'receipt' | 'delivery' | 'transfer' | 'adjustment';
export type OperationStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';
export type UnitOfMeasure = 'pcs' | 'kg' | 'litre' | 'box' | 'meter' | 'pallet';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  created_at: string;
}

export interface LocationItem {
  id: string;
  name: string;
  code: string;
  warehouse_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  unit_of_measure: UnitOfMeasure;
  reorder_level: number;
  cost_price: number; // Per Unit Cost in Rs / $
  image_url?: string;
  created_at: string;
}

export interface StockLevel {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id?: string;
  quantity: number;
  updated_at: string;
}

export interface OperationLine {
  id: string;
  operation_id: string;
  product_id: string;
  expected_qty: number;
  actual_qty?: number;
  unit_of_measure: UnitOfMeasure;
}

export interface Operation {
  id: string;
  type: OperationType;
  status: OperationStatus;
  reference_no: string; // WH/IN/0001 or WH/OUT/0001
  supplier_or_customer?: string;
  source_warehouse_id?: string;
  destination_warehouse_id?: string;
  schedule_date: string;
  responsible_name: string;
  notes?: string;
  created_by: string;
  created_at: string;
  validated_at?: string;
  lines: OperationLine[];
}

export interface StockLedger {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id?: string;
  operation_id?: string;
  reference_no?: string;
  movement_type: MovementType;
  quantity_change: number;
  quantity_after: number;
  performed_by: string;
  performed_at: string;
  notes?: string;
  from_location?: string;
  to_location?: string;
}

export interface User {
  id: string;
  name: string;
  login_id: string;
  email: string;
  role: 'Inventory Manager' | 'Warehouse Specialist' | 'Admin';
  avatar?: string;
}

export interface DashboardKPIs {
  toReceiveCount: number;
  receiptsLateCount: number;
  receiptsOperationsCount: number;
  toDeliverCount: number;
  deliveriesLateCount: number;
  deliveriesWaitingCount: number;
  deliveriesOperationsCount: number;
  internalTransfersScheduledCount: number;
  totalProductsInStock: number;
  lowStockItemsCount: number;
  outOfStockItemsCount: number;
}
