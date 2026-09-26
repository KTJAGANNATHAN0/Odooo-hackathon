# Odoo Inventory Management System (IMS) — Hackathon Build

A centralized, real-time Inventory Management System (IMS) designed to digitize and streamline stock-related operations — incoming receipts, delivery dispatches, internal transfers, and physical audit adjustments.

- **🌐 Live Demo Web App**: [https://ktjagannathan0.github.io/Odooo-hackathon/](https://ktjagannathan0.github.io/Odooo-hackathon/)
- **📦 GitHub Repository**: [https://github.com/KTJAGANNATHAN0/Odooo-hackathon](https://github.com/KTJAGANNATHAN0/Odooo-hackathon)

![IMS Dashboard](https://raw.githubusercontent.com/KTJAGANNATHAN0/Odooo-hackathon/main/public/demo-banner.png)

## 🌟 Features & Highlights

- **Dashboard & Aggregations**:
  - Live KPI cards: Total Products in Stock, Low Stock Items, Out of Stock Items, Pending Receipts, Pending Deliveries, Internal Transfers Scheduled.
  - Interactive Recharts trend area chart (7-day stock inflow/outflow) & low-stock bar chart.
  - Upstash Redis aggregation caching simulation with live 60s TTL countdown.
  - Multi-warehouse selector & low-stock notification alerts.

- **Product Master Catalog**:
  - SKU management, product categories, Unit of Measure (UOM), and customizable reorder thresholds.
  - Grid & List view modes with real-time SKU / Name instant search.
  - Warehouse stock breakdown cards & product movement audit ledger.

- **Stock Operations**:
  - **Goods Receipts (Incoming)**: Vendor receipts flow (Draft → Waiting → Ready → Done). Validating auto-increments warehouse inventory.
  - **Delivery Orders (Outgoing)**: Customer dispatches with stock availability validation. Decrements warehouse inventory.
  - **Internal Transfers**: Relocate stock between warehouses/racks with double-entry ledger logging.
  - **Stock Adjustments**: Fix discrepancies between physical counts and recorded stock with automatic delta calculation.
  - **Validation & Confetti**: Line-by-line actual count validation featuring celebration micro-animations (`canvas-confetti`).

- **Stock Ledger (Move History)**:
  - Immutable audit trail of every stock transaction with timestamps, reference numbers, and performing users.
  - Export full ledger history to CSV.

- **Warehouse Topology Settings**:
  - Create and configure multiple warehouse locations (Main Hub, Production Floor, Distribution Depot).

- **Authentication & Profile**:
  - Sign in, Sign up, and OTP password reset simulation with role badges.

---

- **Backend & Database**:
  - **Supabase (PostgreSQL)**: Relational schema for products, warehouses, stock levels, operations, and immutable stock ledger.
  - **Realtime Subscriptions**: Live postgres change notifications on `stock_levels` table.
  - **Dual Mode Architecture**: Seamless fallback between live Supabase cloud database and offline persistent local storage.
  - **SQL Migration**: Complete setup script included at `supabase/schema.sql` with indexes, RLS policies, and seed data.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Database / Backend**: Supabase (PostgreSQL + Realtime Subscriptions)
- **Styling**: Tailwind CSS v4, Vanilla CSS variables, Glassmorphism design system
- **State Management**: Zustand (with local persistence & Supabase sync)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Canvas Confetti, Framer Motion

---

## 🗄️ Supabase Setup & Configuration

1. Create a free project on [Supabase](https://supabase.com/).
2. Run the SQL script from `supabase/schema.sql` in the **Supabase SQL Editor**.
3. Create a `.env` file from `.env.example`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-api-key
   ```
4. Or simply click the **Supabase: Connect** badge in the app's top bar to test and save credentials directly from the UI!

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone repository
git clone https://github.com/KTJAGANNATHAN0/Odooo-hackathon.git
cd Odooo-hackathon

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

App will be live at `http://localhost:5173/`.

---

## 📜 Submission Details

- **Event**: 8-Hour Hackathon Sprint
- **Project**: Inventory Management System (Odoo IMS)
- **Repository**: [https://github.com/KTJAGANNATHAN0/Odooo-hackathon](https://github.com/KTJAGANNATHAN0/Odooo-hackathon)
