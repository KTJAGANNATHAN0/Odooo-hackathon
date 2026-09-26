# Odoo Inventory Management System (IMS) — Hackathon Build

A centralized, real-time Inventory Management System (IMS) designed to digitize and streamline stock-related operations — incoming receipts, delivery dispatches, internal transfers, and physical audit adjustments.

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

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Vanilla CSS variables, Glassmorphism design system
- **State Management**: Zustand (with local persistence)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Canvas Confetti, Framer Motion

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
