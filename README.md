# Sasyathra — Where Every Harvest Finds a Home

> **Demand-driven farmer-to-consumer paddy supply-chain platform connecting Buyers, Farmers, and Cooperative Processing Units from demand aggregation to verifiable QR delivery and settlement.**

---

## 🌾 Concept & Core Workflow

Sasyathra reverses traditional speculative farming:

```
BUYER POSTS DEMAND
        ↓
FARMERS DISCOVER & PLEDGE PRODUCE
        ↓
DEMAND REACHES 100% (CONFIRMED)
        ↓
70% ADVANCE ESTIMATED IN FARMER LEDGER
        ↓
FARMERS REPORT HARVEST (PRODUCE LOT CREATED)
        ↓
PICKUP REQUESTED & SCHEDULED (FPO VEHICLE)
        ↓
PRODUCE RECEIVED AT COOPERATIVE MILL
        ↓
DAILY CAPACITY VERIFICATION CHECK
        ↓
PROCESSING BATCH CREATED (MULTI-FARMER AGGREGATION)
        ↓
MILLING & RECOVERY RECORDED (PROCESSED)
        ↓
QUALITY CERTIFICATE VERIFIED (4 TIERS)
        ↓
PUBLIC QR CODE GENERATED
        ↓
DELIVERY DISPATCHED TO BUYER
        ↓
BUYER RECEIPT CONFIRMED
        ↓
30% BALANCE RELEASED IN FARMER LEDGER
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
```

---

## 🗄️ Supabase PostgreSQL Setup

1. Open your Supabase project dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor** -> **New Query**.
3. Copy and run the entire script in:
   ```
   supabase/clean_rebuild.sql
   ```
   This will cleanly recreate all tables, constraints, RPC stored procedures, row-level security (RLS) policies, and seed demonstration data.
4. Copy your project credentials:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Place them in `.env` or input them directly via the in-app **Database Settings** modal!

---

## 🧑‍🌾 Three Primary Portals

1. **Buyer Portal**:
   - Post Paddy Demand (variety, quantity, delivery date, target price, quality specs).
   - Live demand aggregation tracking (Required vs Pledged vs Remaining).
   - Sequential order fulfillment tracking.
   - Quick access to batch QR traceability seals.

2. **Farmer Portal**:
   - Discover open demands with variety and location filters.
   - Atomic produce pledging with server-side over-pledge prevention.
   - Report harvest to generate unique `LOT-YYYY-XXXXX` codes.
   - Request farm-gate pickup and monitor 5-stage logistics checkpoints.
   - Transparent financial ledger: 70% advance estimate upon match, 30% balance release upon buyer delivery.

3. **Cooperative Milling Portal**:
   - Pickup management: assign driver, truck number, and pickup date.
   - Mill scale receiving and condition weighment.
   - Daily capacity monitor (`Daily Capacity - Already Scheduled = Available Capacity`).
   - Multi-farmer batch milling (`BATCH-YYYY-XXXXX`).
   - 4-Tier quality verification (Self-declared, Cooperative-inspected, Document-verified, Lab-certified).
   - Delivery dispatch and automatic farmer balance release trigger.

---

## 🔍 Public QR Traceability

- Public page (`/trace/:batchCode` or `?batch=...`) accessible without login.
- Zero-knowledge farmer privacy: shows grower alias and village; strictly protects phone numbers, emails, and financial data.
- Full 7-stage visual timeline with timestamps and auditable event records.
- Built-in camera QR scanner and manual batch code lookup.

---

## ⚖️ Financial Ledger Disclaimer

> **Amounts are ledger estimates; no payment gateway is connected.**
> Sasyathra coordinates the transparent accounting and verification of advances and balances; actual banking payouts are disbursed through designated FPO accounts.
