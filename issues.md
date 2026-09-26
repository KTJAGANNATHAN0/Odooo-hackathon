# Project Issues & Resolution Log

### 1. Make sure the receipt format is good and is printable
- **Status**: [RESOLVED]
- **Solution**: Created `PrintOperationModal.tsx` which renders a dedicated, official printable voucher (Goods Receipt Slip, Delivery Dispatch Note, Transfer Note, Adjustment Slip) with reference numbers, schedule date, vendor/customer location details, itemized table, and staff signature blocks. Added `@media print` CSS so clicking "Print Document" outputs a clean black-and-white official slip hiding dashboard UI elements.

### 2. Who will use? Is it like a service where others will do or is it for a specific company?
- **Status**: [ANSWERED]
- **Target Persona & Context**: 
  - This system is designed for **one specific enterprise/business** (internal ERP inventory) managing multiple internal facilities (Main Storage Hub, Production Floor, Distribution Depot), rather than a multi-tenant public SaaS for random third parties.
  - The two primary user roles within the company are:
    1. **Inventory Managers**: Monitor high-level KPI dashboards, manage products, reorder thresholds, approve vendor receipts, customer dispatches, and warehouse topologies.
    2. **Warehouse Staff / Specialists**: Perform floor-level physical operations—picking, packing, internal transfers between racks/locations, counting, and entering physical audit count adjustments.

### 3. Initial Stock Allocation per Warehouse in add products needs to be fixed
- **Status**: [RESOLVED]
- **Solution**: 
  - Decoupled `useEffect` in `ProductFormModal.tsx` from volatile dependencies so typed stock values aren't reset.
  - Dynamically iterate over all warehouses with clean number inputs (showing placeholder `0`).
  - Updated `addProduct` in `useIMSStore.ts` to guarantee a `StockLevel` record is created for all warehouses, and automatically generates initial stock inflow records in the `StockLedger` for any non-zero initial quantities.

### 4. Date for the move history needs to be fixed if i download it in csv
- **Status**: [RESOLVED]
- **Solution**: 
  - Updated `exportToCSV` in `MoveHistoryView.tsx` with a safe date formatter producing human-readable full timestamps (`YYYY-MM-DD HH:mm:ss`).
  - Added the UTF-8 BOM (`\uFEFF`) to prevent Excel/CSV viewers from corrupting timestamps or character sets.

### 5. Requirements Compliance Scan & Dynamic Operations
- **Status**: [RESOLVED]
- **Issues Identified & Fixed**:
  - **Internal Transfers Scheduled KPI**: Added `internalTransfersScheduledCount` to `DashboardKPIs`, calculated it in `useIMSStore.ts`, and added the KPI card to `KPICards.tsx`.
  - **Operations View Filter**: Fixed `OperationsView.tsx` which was rendering `RecentOperationsTable` without `filterType={type}`, causing all operation types to appear in single-type views.
  - **Dynamic Filters**: Added document type filter (`Receipts`, `Delivery Orders`, `Internal Transfers`, `Adjustments`), status filter (`Draft`, `Waiting`, `Ready`, `Done`, `Canceled`), product category filter, and location filter to `RecentOperationsTable.tsx`.
  - **Operation Form Modals**: Added proper warehouse selectors (Destination warehouse for Receipts, Source warehouse for Deliveries, Source & Destination for Internal Transfers, Warehouse for Adjustments) to `OperationFormModal.tsx`. Removed unnecessary customer address requirement on transfers.
  - **Adjustment Validation**: Handled `op.type === 'adjustment'` in `validateOperation` to properly update physical counted stock levels and log delta adjustments to `StockLedger`.
  - **Left Sidebar & Profile Menu**: Integrated `Sidebar.tsx` with Profile Menu (`My Profile`, `Logout`) and connected it to `App.tsx` layout alongside the top header.

### 6. Upstash Redis Caching for Dashboard KPIs
- **Status**: [RESOLVED]
- **Solution**:
  - Installed `@upstash/redis` client.
  - Implemented dual-mode Redis client in `src/lib/redis.ts` supporting live Upstash REST API or high-speed local cache fallback.
  - Created `RedisCacheService` in `src/services/redisService.ts` caching Dashboard KPI aggregations with a 60-second TTL.
  - Integrated automatic cache invalidation in `useIMSStore.ts` on inventory operations, adjustments, products, and direct stock mutations.
  - Created interactive `RedisConfigModal.tsx` displaying live cache hits/misses, active keys, TTL countdown, ping latency diagnostic test, cache flush button, and credentials configuration.
  - Made the Redis indicator pill in `TopNavHeader.tsx` clickable to toggle the Redis configuration and cache telemetry modal.


