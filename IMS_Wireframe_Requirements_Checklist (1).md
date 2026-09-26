# IMS — Wireframe Requirements & Implementation Checklist

> v2.0 — Updated from full master wireframe (StockSense_8_hours.png)
> Changes from v1.0 are marked with `[UPDATED]` or `[NEW]`

---

## 1. Authentication — Login & Sign Up

### Requirements

**Login Page**
- App logo at the top center
- Fields: Login ID, Password
- Buttons: Sign In, Forgot Password link, Sign Up link
- On submit: validate credentials → if valid, redirect to Dashboard
- If credentials don't match → show inline error: `"Invalid Login Id or Password"`
- "Forgot Password" link → redirects to Forgot Password page
- "Sign Up" link → redirects to Sign Up page

**Sign Up Page**
- Fields: Login ID, Email ID, Password
- Validation rules:
  - Login ID must be unique, length between 6–12 characters
  - Email ID must not be a duplicate in the database
  - Password must contain at least one uppercase, one lowercase, one digit, one special character; minimum 8 characters
- On successful signup → redirect to Dashboard

**Forgot Password / OTP Reset**
- User enters registered email → receives OTP
- OTP verification → allow password reset

### Checklist
- [ ] Login page UI (Login ID + Password fields, Sign In button)
- [ ] Sign Up page UI (Login ID + Email + Password fields)
- [ ] Form validation (client-side via Zod)
- [ ] Supabase Auth: email/password signup
- [ ] Supabase Auth: email/password login
- [ ] Error message: "Invalid Login Id or Password"
- [ ] OTP-based password reset flow (Supabase built-in)
- [ ] Redirect to Dashboard on successful login/signup
- [ ] Protected routes middleware (redirect unauthenticated users to /login)

---

## 2. Global Navigation / Layout

### Requirements

**Top Navigation Bar** `[UPDATED]`
- Links: Dashboard · Operations · Products · Stock · Move History · Settings
- `Stock` is a **top-level nav item** (confirmed in master wireframe — `Dashboard Operations Stock Move History Settings`)
- Right side: Avatar/Profile icon (shows logged-in user initial — e.g., `A`)
- Consistent across all pages

**Reference Number Format**
- Auto-incremented, structured as: `<Warehouse>/<Operation>/<ID>`
  - Receipts:   `WH/IN/0001`
  - Deliveries: `WH/OUT/0001`
  - Warehouse = warehouse short code prefix
  - Operation = IN / OUT
  - ID = auto-incremented unique integer, padded to 4 digits

### Checklist
- [ ] Top navbar: Dashboard, Operations, Products, Stock, Move History, Settings `[UPDATED]`
- [ ] Active link highlighting
- [ ] Profile avatar (shows user initial, top-right)
- [ ] Reference number auto-generation utility (`WH/IN/XXXX`, `WH/OUT/XXXX`)
- [ ] Consistent layout wrapper applied to all pages

---

## 3. Dashboard

### Requirements

**KPI Summary Cards**
- **Receipt card**:
  - Label: `X to receive`
  - Sub-info: `X Late · X operations`
- **Delivery card**:
  - Label: `X to Deliver`
  - Sub-info: `X Late · X waiting · X operations`

**Status Definitions (from master wireframe)**
- **Late**: schedule date < today's date
- **Operations**: schedule date > today's date (upcoming)
- **Waiting**: waiting for the stocks (status = 'waiting')

**Navigation from Dashboard** `[UPDATED]`
- Operations submenu: Receipts, Delivery, Adjustment
- `Stock` → top-level nav (lists available stock)
- Move History → history of In/Out stock movements
- Settings → Warehouse, Locations

### Checklist
- [ ] Dashboard page with two KPI cards (Receipt + Delivery)
- [ ] Receipt card: to receive count, late count, operations count
- [ ] Delivery card: to deliver count, late count, waiting count, operations count
- [ ] Late logic: `schedule_date < today`
- [ ] Operations logic: `schedule_date > today`
- [ ] Waiting logic: `status = 'waiting'`
- [ ] Click on card → navigates to filtered operations list
- [ ] Redis cache KPI aggregations (TTL: 60s)

---

## 4. Receipts (Incoming Stock)

### Requirements

**Receipts List View** (default landing when clicking Operations → Receipts)
- Page title: `Receipts`
- `NEW` button → opens new receipt form
- Search bar: search by reference number or contact/vendor name
- View toggle: List view ↔ Kanban view (toggle by status)
- Table columns: Reference · From · To · Contact · Schedule Date · Status
  - From = Vendor (source)
  - To = WH/Stock1 (destination warehouse location)
- Status badge colored by state
- **Empty state text**: `"Populate all work orders added to manufacturing order"` `[NEW]`
- **Below table**: shows "Locations of warehouse" section `[NEW]`

**Receipt Detail / Create Form**
- Auto-generated reference: `WH/IN/0001` format
- Fields:
  - **Receive From** (vendor/supplier name — text input)
  - **Schedule Date** (date picker)
  - **Responsible** (auto-filled with currently logged-in user's name)
- Products section:
  - Table columns: Product · Quantity
  - `+ New Product` inline row to add line items
  - Product = searchable dropdown shown as `[SKU001] Product Name`
- Action buttons: `Validate` · `Print` · `Cancel`
- Status flow indicator displayed on form: `Draft > Ready > Done`

**Button Behavior** `[UPDATED]`
- In **Draft** state:
  - `TODO` button visible → on click, moves status to `Ready`
- In **Ready** state:
  - `Validate` button visible → on click, moves status to `Done`, stock increases
- `Print` → available only when status = Done (print the receipt)
- `Cancel` → sets status to Canceled

**Status Definitions**
- **Draft**: initial stage — being created
- **Ready**: ready to receive (after clicking TODO)
- **Done**: received and validated — stock updated

> ⚠️ Receipt does NOT have a "Waiting" state. Flow is strictly: `Draft > Ready > Done`

### Checklist
- [ ] Receipts list page: table with columns (Reference, From, To, Contact, Schedule Date, Status)
- [ ] Empty state text: "Populate all work orders added to manufacturing order" `[NEW]`
- [ ] "Locations of warehouse" section below table `[NEW]`
- [ ] Search by reference and contact name
- [ ] List ↔ Kanban view toggle
- [ ] `NEW` button → blank receipt form
- [ ] Receipt form: Receive From, Schedule Date, Responsible (auto-filled) fields
- [ ] Auto-generate reference number `WH/IN/XXXX`
- [ ] Add product line items (product dropdown + quantity input)
- [ ] Remove product line item
- [ ] `TODO` button shown in Draft state → Draft → Ready transition
- [ ] `Validate` button shown in Ready state → Ready → Done + stock_levels += qty + ledger entry
- [ ] `Cancel` button: sets status to Canceled
- [ ] `Print` button: available only when status = Done
- [ ] Status flow indicator on form: `Draft > Ready > Done`
- [ ] Status badge on list (color-coded)

---

## 5. Delivery Orders (Outgoing Stock)

### Requirements

**Delivery List View** (default landing when clicking Operations → Delivery)
- Page title: `Delivery`
- `NEW` button, search bar (by reference & contact), List ↔ Kanban toggle
- Table columns: Reference · From · To · Contact · Schedule Date · Status
- **Empty state text**: `"Populate all delivery orders"` `[NEW]`

**Delivery Detail / Create Form** `[UPDATED]`
- Auto-generated reference: `WH/OUT/0001` format
- Fields:
  - **Delivery Address** (customer/destination — text input)
  - **Schedule Date** (date picker)
  - **Responsible** (auto-filled with logged-in user)
  - **Operation Type** (dropdown — e.g., Delivery)
- Products section:
  - Table columns: Product · Quantity
  - `+ New Product` inline row to add products
  - `Add New product` link at the bottom of products table `[NEW]`
  - If product is **out of stock**: alert the notification AND mark the line row **red**
- Action buttons: `Validate` · `Print` · `Cancel`
- Status flow: `Draft > Waiting > Ready > Done`

**Status Definitions** `[UPDATED]`
- **Draft**: initial state
- **Waiting**: waiting for out-of-stock product to be in stock
- **Ready**: ready to deliver/receive
- **Done**: received or delivered — stock updated

**On Validate**
- stock_levels for each product in source warehouse decreases by quantity
- Ledger entry written (`movement_type = OUT`)

### Checklist
- [ ] Delivery list page: table with columns (Reference, From, To, Contact, Schedule Date, Status)
- [ ] Empty state text: "Populate all delivery orders" `[NEW]`
- [ ] Search by reference and contact
- [ ] List ↔ Kanban view toggle
- [ ] `NEW` button → blank delivery form
- [ ] Delivery form: Delivery Address, Schedule Date, Responsible (auto-fill), Operation Type fields
- [ ] Auto-generate reference number `WH/OUT/XXXX`
- [ ] Add product line items (product dropdown + quantity)
- [ ] `Add New product` link at bottom of products table `[NEW]`
- [ ] Remove product line item
- [ ] Out-of-stock check: mark row red + show alert notification
- [ ] `Validate` button: Ready → Done + stock_levels -= qty + ledger entry
- [ ] `Cancel` button: sets status to Canceled
- [ ] `Print` button: available when status = Done
- [ ] Status flow indicator on form: `Draft > Waiting > Ready > Done`
- [ ] Status badge (Draft=gray, Waiting=yellow, Ready=blue, Done=green, Canceled=red)

---

## 6. Move History (Stock Ledger)

### Requirements

**Move History List View**
- Page title: `Move History`
- Search by reference and contact
- List ↔ Kanban view toggle
- Table columns: Reference · Date · Contact · From · To · Quantity · Status
  - `From` / `To` = warehouse/location names (e.g., Vendor → WH/Stock1)
- **Empty state / description text**: `"Populate all moves between the From-To location in inventory"` `[NEW]`

**Color Coding**
- **IN moves** (stock received / incoming): row displayed in **green**
- **OUT moves** (stock sent out): row displayed in **red**

**Multi-product display** `[NEW detail]`
- A single reference with multiple products → display as **multiple rows** (one per product line)

### Checklist
- [ ] Move History list page: table (Reference, Date, Contact, From, To, Quantity, Status)
- [ ] Empty state text: "Populate all moves between the From-To location in inventory" `[NEW]`
- [ ] IN move rows displayed in green
- [ ] OUT move rows displayed in red
- [ ] Multi-product references shown as multiple rows
- [ ] Search by reference and contact
- [ ] List ↔ Kanban view toggle
- [ ] Date-sorted (newest first by default)

---

## 7. Stock (Top-level Nav) `[UPDATED]`

### Requirements

**Stock Page** — accessed via top nav `Stock` link (NOT under Settings)
- Page title: `Stock`
- Table columns: Product · Per Unit Cost · On Hand · Free to Use
  - On Hand = total physical quantity in warehouse
  - Free to Use = On Hand minus quantities reserved for pending deliveries
- **User must be able to update the stock directly from this page** (inline edit or quick adjustment)
- Sample data shown in wireframe: Desk (3000 Rs, On Hand: 80, Free to Use: 40), Table (3000 Rs, On Hand: 80, Free to Use: 80)

### Checklist
- [ ] Stock page accessible from top nav (`/stock`) `[UPDATED]`
- [ ] Table: Product, Per Unit Cost, On Hand, Free to Use columns
- [ ] "Free to Use" = On Hand − reserved quantity calculation
- [ ] Inline edit or "Update" button to adjust stock from this page
- [ ] Filter by warehouse

---

## 8. Settings — Warehouse

### Requirements

**Warehouse Form/Page**
- Page header note: `"This page contains the warehouse details & location"`
- Fields:
  - Name (text input)
  - Short Code (text input — used in reference numbers, e.g., `WH`)
  - Address (text area)

### Checklist
- [ ] Warehouse settings page (`/settings/warehouse`)
- [ ] Create warehouse form (Name, Short Code, Address)
- [ ] Edit existing warehouse
- [ ] List all warehouses

---

## 9. Settings — Location

### Requirements

**Location Form**
- Page title: `Location`
- Fields:
  - Name
  - Short Code
  - Warehouse (dropdown — links location to a parent warehouse)
- Purpose note: `"This holds the multiple locations of warehouse, rooms, etc."`

### Checklist
- [ ] Location settings page (`/settings/location`)
- [ ] Create location form (Name, Short Code, Warehouse dropdown)
- [ ] Edit existing location
- [ ] List all locations (grouped by warehouse)

---

## 10. Products Module

### Requirements

**Product List**
- Search by name or SKU
- Filter by category

**Product Form**
- Fields: Name · SKU · Category · Unit of Measure · Reorder Level
- SKU displayed in dropdowns as: `[SKU001] Product Name`

### Checklist
- [ ] Products list page with search and category filter
- [ ] Create product form (Name, SKU, Category, Unit of Measure, Reorder Level)
- [ ] Edit product
- [ ] SKU format `[SKU001] Product Name` in all dropdowns throughout the app
- [ ] Stock availability per warehouse on product detail page
- [ ] Low stock flag when `qty ≤ reorder_level`

---

## 11. Cross-Cutting / Global Requirements

| Requirement | Detail | Source |
|---|---|---|
| Top nav includes `Stock` as own item | `Dashboard · Operations · Products · Stock · Move History · Settings` | Master wireframe |
| Reference auto-increment | `WH/IN/XXXX` for receipts, `WH/OUT/XXXX` for deliveries | All operation screens |
| Responsible field auto-fill | Auto-populates with logged-in user's name | Receipt + Delivery forms |
| List + Kanban toggle | Reusable, on all operation list pages | Receipts, Delivery, Move History |
| Search by reference & contact | Reusable search bar on all operation lists | Receipts, Delivery, Move History |
| Status color badges | Draft=gray, Waiting=yellow, Ready=blue, Done=green, Canceled=red | All tables |
| Out-of-stock row → red + notification | On Delivery form line items | Delivery form |
| IN moves = green rows | In Move History table | Move History |
| OUT moves = red rows | In Move History table | Move History |
| Print button | Receipt + Delivery, only when status = Done | Receipt + Delivery forms |
| Empty state text | Each list page has a descriptive empty state | Receipts, Delivery, Move History |
| `Add New product` link | At bottom of Delivery products table | Delivery form |
| Receipt has NO Waiting state | Flow: Draft → Ready → Done only | Receipt wireframe |
| Delivery has Waiting state | Flow: Draft → Waiting → Ready → Done | Delivery wireframe |

### Global Checklist
- [ ] Top nav updated: Dashboard, Operations, Products, **Stock**, Move History, Settings `[UPDATED]`
- [ ] Reference number generator utility (`WH/IN/XXXX`, `WH/OUT/XXXX`)
- [ ] Responsible field auto-populated from auth session on all forms
- [ ] Reusable List ↔ Kanban view toggle component
- [ ] Reusable search component (by reference + contact)
- [ ] Reusable status badge component (color-coded)
- [ ] Empty state components for all list pages `[NEW]`
- [ ] Print view for Receipt and Delivery (status = Done only)
- [ ] Row color coding in Move History (green = IN, red = OUT)
- [ ] Out-of-stock alert on Delivery form (row turns red)
- [ ] Late / Waiting / Operations logic on Dashboard KPI cards
- [ ] Supabase Realtime subscription on stock_levels for live updates

---

## 12. Master Implementation Checklist (Build Order)

### Phase 1 — Setup (Hour 0:00–1:00)
- [ ] Next.js 14 project init with App Router
- [ ] shadcn/ui + Tailwind CSS setup
- [ ] Supabase project created, env vars configured
- [ ] Upstash Redis account + env vars configured
- [ ] Database schema migrated (all tables + indexes + RLS policies)
- [ ] Seed data: 1 warehouse, 3–5 products, sample operations

### Phase 2 — Auth (Hour 1:00–1:45)
- [ ] Login page (Login ID + Password, Sign In, links)
- [ ] Sign Up page (with validation rules from wireframe)
- [ ] Forgot Password / OTP reset (Supabase built-in)
- [ ] Middleware: protect all non-auth routes → redirect to /login
- [ ] Redirect to Dashboard on success

### Phase 3 — Layout (Hour 1:45–2:30)
- [ ] Top navigation bar: Dashboard, Operations, Products, Stock, Move History, Settings
- [ ] Profile avatar (user initial, top-right)
- [ ] Page wrapper / layout component
- [ ] Reference number generator utility function
- [ ] Reusable: StatusBadge, ListKanbanToggle, SearchBar, EmptyState components

### Phase 4 — Dashboard (Hour 2:30–3:15)
- [ ] Receipt KPI card (to receive, late, operations count)
- [ ] Delivery KPI card (to deliver, late, waiting, operations count)
- [ ] Late / Operations / Waiting query logic
- [ ] Redis caching for KPI aggregations (TTL: 60s)
- [ ] Click card → navigate to filtered operations list

### Phase 5 — Products (Hour 3:15–3:45)
- [ ] Products list page (search + category filter)
- [ ] Create / edit product form
- [ ] Stock per warehouse on product detail
- [ ] Low stock flag (qty ≤ reorder_level)

### Phase 6 — Receipts (Hour 3:45–4:30)
- [ ] Receipts list view (table + empty state + search + view toggle)
- [ ] New Receipt form (Receive From, Schedule Date, Responsible auto-fill)
- [ ] Add / remove product line items (`[SKU] Name` dropdown + qty)
- [ ] `TODO` button (Draft → Ready)
- [ ] `Validate` button (Ready → Done + stock += qty + ledger entry)
- [ ] `Cancel` button
- [ ] `Print` view (Done status only)
- [ ] Status flow indicator: `Draft > Ready > Done`

### Phase 7 — Delivery Orders (Hour 4:30–5:15)
- [ ] Delivery list view (table + empty state + search + view toggle)
- [ ] New Delivery form (Delivery Address, Schedule Date, Responsible, Operation Type)
- [ ] Add / remove product line items + `Add New product` bottom link
- [ ] Out-of-stock check (mark row red + show notification)
- [ ] `Validate` button (→ Done + stock -= qty + ledger entry)
- [ ] `Cancel` + `Print` buttons
- [ ] Status flow indicator: `Draft > Waiting > Ready > Done`

### Phase 8 — Move History (Hour 5:15–5:45)
- [ ] Move History list view (table + empty state + search + view toggle)
- [ ] Green rows for IN moves, red rows for OUT moves
- [ ] Multi-product references shown as multiple rows
- [ ] Date-sorted (newest first)

### Phase 9 — Stock + Settings (Hour 5:45–6:15)
- [ ] Stock page (`/stock`) via top nav: Product, Per Unit Cost, On Hand, Free to Use, editable
- [ ] Warehouse create/edit page (Name, Short Code, Address)
- [ ] Location create/edit page (Name, Short Code, Warehouse dropdown)

### Phase 10 — Polish & Submit (Hour 6:15–8:00)
- [ ] Loading states on all forms and tables
- [ ] Error states (network errors, validation failures)
- [ ] Empty state text on all list pages
- [ ] Status badge colors consistent everywhere
- [ ] Out-of-stock alerts on Delivery working end-to-end
- [ ] Low-stock alerts on Dashboard
- [ ] Print view tested (Receipt + Delivery)
- [ ] Responsive check (desktop-first is fine)
- [ ] App deployed to Vercel
- [ ] Demo video recorded (3–5 min full walkthrough)
- [ ] README with live URL + local setup steps
- [ ] Submission form filled and submitted ✓

---

## 13. Delta: What Changed from v1.0 → v2.0

| # | Change | Impact |
|---|---|---|
| 1 | Top nav now includes `Stock` as a standalone link | Update nav component, add `/stock` route |
| 2 | Receipt status is `Draft > Ready > Done` only (NO Waiting) | Remove Waiting from receipt logic |
| 3 | Delivery status is `Draft > Waiting > Ready > Done` | Keep Waiting only on delivery |
| 4 | Receipts list empty state: "Populate all work orders…" | Add EmptyState component |
| 5 | Receipts list has "Locations of warehouse" section below table | Add location section to receipts list |
| 6 | Delivery form has `Add New product` link at bottom of product table | Extra UI element on delivery form |
| 7 | Delivery list empty state: "Populate all delivery orders" | Add EmptyState component |
| 8 | Move History empty state: "Populate all moves between From-To…" | Add EmptyState component |
| 9 | Dashboard: Operations = `schedule_date > today` (not just non-done) | Fix KPI query logic |
| 10 | Stock page is top-level nav, NOT under Settings | Move route to `/stock` |

---

*Checklist v2.0 · Updated from master wireframe (StockSense_8_hours.png) · 26 Sep 2026*
