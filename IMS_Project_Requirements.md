# Inventory Management System (IMS) — Project Requirements Document

> **Hackathon Build · 8-Hour Sprint**
> Stack: Next.js 14 (App Router) · Supabase · Redis (Upstash) · Vercel

---

## 1. Project Overview

A centralized, real-time Inventory Management System to replace manual registers, Excel sheets, and scattered tracking. Digitizes all stock-related operations — receipts, deliveries, transfers, and adjustments — under one unified interface.

**Target Users**
- Inventory Managers — manage incoming & outgoing stock
- Warehouse Staff — perform transfers, picking, shelving, and counting

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR, file-based routing, fast dev |
| Auth | Supabase Auth | Built-in OTP, sessions, JWT |
| Database | Supabase (PostgreSQL) | Relational, RLS, real-time subscriptions |
| File Storage | Supabase Storage | Product images |
| Cache / Rate Limiting | Upstash Redis (REST API) | Serverless-friendly, no infra to manage |
| Deployment | Vercel | Zero-config, works with Next.js natively |
| UI Components | shadcn/ui + Tailwind CSS | Ready-made components, fast to build |
| State Management | Zustand | Lightweight, no boilerplate |
| Forms | React Hook Form + Zod | Validation, fast |
| Charts | Recharts | Dashboard KPIs |

---

## 3. Architecture Overview

```
Browser (Next.js App Router)
        │
        ├── /app/dashboard          — Dashboard KPIs
        ├── /app/products           — Product management
        ├── /app/operations/receipts
        ├── /app/operations/deliveries
        ├── /app/operations/transfers
        ├── /app/operations/adjustments
        ├── /app/operations/history
        ├── /app/settings/warehouse
        └── /app/profile
        │
        ▼
  Next.js API Routes (/app/api/*)
        │
        ├── Supabase Client (DB + Auth + Storage)
        └── Upstash Redis (cache + rate limiting)
        │
        ▼
  Supabase (PostgreSQL + Realtime + Auth)
```

**Key Patterns**
- Server Components for data fetching (no client-side loading spinners for initial loads)
- Client Components only where interactivity is needed (forms, filters, modals)
- Supabase Realtime subscriptions for live stock count updates on dashboard
- Redis caches dashboard KPI aggregations (TTL: 60s) — avoids expensive DB counts on every load
- Row-Level Security (RLS) on all Supabase tables — users only see their warehouse's data

---

## 4. Database Schema

### 4.1 Core Tables

```sql
-- Warehouses
warehouses (
  id uuid PK,
  name text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now()
)

-- Product Categories
categories (
  id uuid PK,
  name text NOT NULL,
  description text
)

-- Products
products (
  id uuid PK,
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  category_id uuid FK→categories,
  unit_of_measure text NOT NULL,     -- kg, pcs, litre, etc.
  reorder_level int DEFAULT 0,       -- triggers low-stock alert
  image_url text,
  created_at timestamptz DEFAULT now()
)

-- Stock Levels (per product per warehouse)
stock_levels (
  id uuid PK,
  product_id uuid FK→products,
  warehouse_id uuid FK→warehouses,
  quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, warehouse_id)
)

-- Operations (Receipts / Deliveries / Transfers / Adjustments)
operations (
  id uuid PK,
  type text CHECK (type IN ('receipt','delivery','transfer','adjustment')),
  status text CHECK (status IN ('draft','waiting','ready','done','canceled')) DEFAULT 'draft',
  reference_no text UNIQUE NOT NULL,   -- auto-generated e.g. REC-20260926-001
  supplier_or_customer text,           -- vendor name for receipt, customer for delivery
  source_warehouse_id uuid FK→warehouses,
  destination_warehouse_id uuid FK→warehouses,  -- for transfers
  notes text,
  created_by uuid FK→auth.users,
  created_at timestamptz DEFAULT now(),
  validated_at timestamptz
)

-- Operation Line Items
operation_lines (
  id uuid PK,
  operation_id uuid FK→operations,
  product_id uuid FK→products,
  expected_qty numeric NOT NULL,
  actual_qty numeric,                  -- filled on validation
  unit_of_measure text NOT NULL
)

-- Stock Ledger (immutable audit trail)
stock_ledger (
  id uuid PK,
  product_id uuid FK→products,
  warehouse_id uuid FK→warehouses,
  operation_id uuid FK→operations,
  movement_type text,                  -- IN / OUT / ADJUST / TRANSFER_IN / TRANSFER_OUT
  quantity_change numeric NOT NULL,
  quantity_after numeric NOT NULL,
  performed_by uuid FK→auth.users,
  performed_at timestamptz DEFAULT now(),
  notes text
)
```

### 4.2 Indexes (Performance)
```sql
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_warehouse ON stock_levels(warehouse_id);
CREATE INDEX idx_operations_status ON operations(status);
CREATE INDEX idx_operations_type ON operations(type);
CREATE INDEX idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX idx_ledger_performed_at ON stock_ledger(performed_at DESC);
```

---

## 5. Feature Specifications

### 5.1 Authentication
- Email/Password signup & login via Supabase Auth
- OTP-based password reset (Supabase handles email delivery)
- Protected routes via Next.js middleware — redirect unauthenticated users to `/login`
- Session stored in cookies (Supabase SSR helpers)

### 5.2 Dashboard
**KPI Cards (top row)**
- Total Products in Stock (distinct products with qty > 0)
- Low Stock Items (qty ≤ reorder_level, qty > 0)
- Out of Stock Items (qty = 0)
- Pending Receipts (status = 'ready' OR 'waiting', type = 'receipt')
- Pending Deliveries (status = 'ready' OR 'waiting', type = 'delivery')
- Internal Transfers Scheduled (status ≠ 'done' OR 'canceled', type = 'transfer')

**Filters (dynamic)**
- Document type: Receipts / Delivery / Internal / Adjustments
- Status: Draft, Waiting, Ready, Done, Canceled
- Warehouse
- Category

**Charts**
- Stock movement trend (last 7 days) — line chart from ledger
- Top 5 low-stock items — horizontal bar chart

> Redis caches KPI aggregations with 60s TTL. Invalidated on any stock mutation.

### 5.3 Products Module
- List view with search (by name/SKU) and category filter
- Create / Edit product form: Name, SKU, Category, Unit of Measure, Reorder Level, Image (optional)
- Stock availability card per warehouse (pulled from stock_levels)
- Reordering rules: set min quantity threshold → auto-flags on dashboard

### 5.4 Receipts (Incoming Stock)
**Flow:** Draft → Waiting → Ready → Done

1. Create receipt: add supplier name, select warehouse, add products + expected quantities
2. Validate: enter actual quantities received → stock_levels updated (+qty), ledger entry written
3. Status auto-advances to `done` on validation
4. Reference number auto-generated: `REC-YYYYMMDD-NNN`

### 5.5 Delivery Orders (Outgoing Stock)
**Flow:** Draft → Waiting → Ready → Done

1. Create delivery: add customer name, select source warehouse, add products + quantities
2. Availability check: warn if stock < requested qty
3. Validate: stock_levels decremented (–qty), ledger entry written
4. Reference number: `DEL-YYYYMMDD-NNN`

### 5.6 Internal Transfers
1. Select source warehouse and destination warehouse
2. Add products + quantities
3. Validate: source stock –qty, destination stock +qty, two ledger entries written
4. Reference number: `TRF-YYYYMMDD-NNN`

### 5.7 Stock Adjustments
1. Select product + warehouse
2. Enter physically counted quantity
3. System calculates delta (counted – recorded)
4. Confirm: stock_levels updated to counted qty, ledger entry written with reason
5. Reference number: `ADJ-YYYYMMDD-NNN`

### 5.8 Move History (Stock Ledger)
- Full ledger view with filters: product, warehouse, date range, movement type
- Sortable by date (default: newest first)
- Export to CSV (client-side, from fetched data)

### 5.9 Settings → Warehouse
- Create / edit warehouses (name, location)
- View stock summary per warehouse

### 5.10 Profile Menu
- View profile (name, email)
- Logout

---

## 6. Low Stock Alerts
- Any product where `stock_levels.quantity ≤ products.reorder_level` is flagged
- Dashboard shows count + list
- Alert banner shown on product detail page
- (Optional stretch): Supabase Edge Function → send email notification via Resend

---

## 7. Redis Usage (Upstash)

| Use Case | Key Pattern | TTL |
|---|---|---|
| Dashboard KPI cache | `dashboard:kpis:{warehouse_id}` | 60s |
| Product list cache | `products:list:{warehouse_id}` | 30s |
| Low stock list | `alerts:lowstock:{warehouse_id}` | 60s |
| API rate limiting | `ratelimit:{user_id}:{route}` | 60s window |

**Rate Limiting**: API routes protected with sliding-window rate limiter using Upstash Redis — 30 requests/minute per user per sensitive route (validate operation, create product).

---

## 8. API Routes

All under `/app/api/`:

```
POST   /api/products                  — create product
PUT    /api/products/[id]             — update product
GET    /api/products                  — list products (cached)

POST   /api/operations                — create operation (any type)
PUT    /api/operations/[id]           — update draft
POST   /api/operations/[id]/validate  — validate → triggers stock mutation
DELETE /api/operations/[id]           — cancel (draft only)

GET    /api/dashboard/kpis            — dashboard aggregations (Redis cached)
GET    /api/ledger                    — stock movement history

GET    /api/warehouses                — list warehouses
POST   /api/warehouses                — create warehouse
```

---

## 9. UI/UX Conventions

- Left sidebar navigation (fixed, collapsible on mobile)
- Top bar: search, warehouse selector, profile avatar
- Tables: sortable columns, pagination (25 rows/page), row-click to open detail
- All forms: inline validation via Zod, loading states on submit
- Status badges: color-coded (Draft=gray, Waiting=yellow, Ready=blue, Done=green, Canceled=red)
- All destructive actions: confirmation modal

---

## 10. Folder Structure

```
/app
  /(auth)
    /login
    /signup
    /reset-password
  /(dashboard)
    /dashboard
    /products
      /[id]
    /operations
      /receipts
      /deliveries
      /transfers
      /adjustments
      /history
    /settings
      /warehouse
    /profile
  /api
    /products
    /operations
    /dashboard
    /warehouses
    /ledger
/components
  /ui          — shadcn components
  /layout      — Sidebar, Topbar, PageHeader
  /dashboard   — KPICard, StockChart, AlertBanner
  /products    — ProductTable, ProductForm
  /operations  — OperationTable, OperationForm, LineItemRow
  /shared      — StatusBadge, ConfirmModal, FilterBar
/lib
  /supabase    — client, server, middleware helpers
  /redis       — upstash client, cache helpers, rate limiter
  /validations — Zod schemas
  /utils       — reference-number generator, date helpers
/hooks         — useProducts, useOperations, useStockLevels
/types         — TypeScript interfaces
/store         — Zustand stores (filters, active warehouse)
```

---

## 11. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 12. 8-Hour Build Plan

| Hour | Task |
|---|---|
| 0:00–0:30 | Project setup: Next.js, Supabase project, Upstash Redis, shadcn/ui |
| 0:30–1:00 | DB schema migration in Supabase, seed test data, RLS policies |
| 1:00–1:45 | Auth: login, signup, OTP reset, middleware, protected routes |
| 1:45–2:30 | Layout: sidebar, topbar, routing skeleton |
| 2:30–3:15 | Dashboard: KPI cards + Redis cache + charts |
| 3:15–4:00 | Products module: list, create, edit, stock view |
| 4:00–4:45 | Receipts + Delivery Orders: create flow + validate |
| 4:45–5:15 | Internal Transfers + Adjustments |
| 5:15–5:30 | Move History (ledger view) |
| 5:30–5:45 | Warehouse settings + low-stock alerts |
| 5:45–6:30 | Bug fixes, edge cases, loading/error states |
| 6:30–7:15 | Styling polish, responsive check, final QA |
| 7:15–8:00 | Demo video recording, README, deployment to Vercel, submission |

---

## 13. Scope Cuts for Speed (Hackathon Mode)

These are **deferred** — not in scope for the 8-hour build:

- Email notifications for low stock (Resend integration)
- Multi-user roles with granular permissions
- Barcode scanner integration
- PDF report generation
- Mobile app
- Advanced analytics (beyond dashboard charts)
- Bulk import via CSV

---

## 14. Definition of Done (Submission Checklist)

- [ ] Auth flow works (signup, login, OTP reset)
- [ ] Dashboard shows real KPIs from DB
- [ ] Products can be created, edited, viewed with stock per warehouse
- [ ] Receipt validates → stock increases
- [ ] Delivery validates → stock decreases
- [ ] Transfer validates → source –qty, destination +qty
- [ ] Adjustment validates → stock corrected, ledger entry written
- [ ] Move History shows full ledger
- [ ] Low stock alert shows on dashboard
- [ ] App deployed on Vercel
- [ ] Demo video recorded (screen capture, ~3–5 min walkthrough)
- [ ] README with setup instructions and live link

---

*Document version: 1.0 · Generated for 8-hour hackathon sprint · 26 Sep 2026*
