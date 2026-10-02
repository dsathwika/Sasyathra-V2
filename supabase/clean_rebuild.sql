-- ============================================================================
-- SASYATHRA: CLEAN DATABASE SCHEMA & STORED PROCEDURES (COMPLETE REBUILD)
-- ============================================================================
-- "Where Every Harvest Finds a Home"
-- Demand-driven farmer-to-consumer paddy supply-chain platform.
--
-- Run this script in your Supabase SQL Editor:
-- Project Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. DROP OBSOLETE OBJECTS (CASCADE CLEANUP)
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS ledger_entries CASCADE;
DROP TABLE IF EXISTS trace_events CASCADE;
DROP TABLE IF EXISTS batch_verifications CASCADE;
DROP TABLE IF EXISTS batch_items CASCADE;
DROP TABLE IF EXISTS processing_batches CASCADE;
DROP TABLE IF EXISTS pickup_requests CASCADE;
DROP TABLE IF EXISTS produce_lots CASCADE;
DROP TABLE IF EXISTS contributions CASCADE;
DROP TABLE IF EXISTS demands CASCADE;
DROP TABLE IF EXISTS processing_units CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop obsolete functions if they exist
DROP FUNCTION IF EXISTS pledge_produce CASCADE;
DROP FUNCTION IF EXISTS report_harvest CASCADE;
DROP FUNCTION IF EXISTS create_produce_lot CASCADE;
DROP FUNCTION IF EXISTS request_pickup CASCADE;
DROP FUNCTION IF EXISTS assign_pickup CASCADE;
DROP FUNCTION IF EXISTS mark_picked_up CASCADE;
DROP FUNCTION IF EXISTS confirm_received CASCADE;
DROP FUNCTION IF EXISTS schedule_processing CASCADE;
DROP FUNCTION IF EXISTS update_batch_status CASCADE;
DROP FUNCTION IF EXISTS mark_ready_for_delivery CASCADE;
DROP FUNCTION IF EXISTS mark_delivered CASCADE;
DROP FUNCTION IF EXISTS get_batch_trace CASCADE;

-- Ensure UUID extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- PROFILES (Users: Buyer, Farmer, Cooperative, Admin)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('buyer', 'farmer', 'cooperative', 'admin')),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  village TEXT,
  district TEXT,
  farm_size_acres NUMERIC,
  preferred_varieties TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROCESSING UNITS (Mills / FPOs / Cooperative Centers)
CREATE TABLE processing_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT NOT NULL,
  daily_capacity_kg NUMERIC NOT NULL DEFAULT 1000 CHECK (daily_capacity_kg > 0),
  processing_type TEXT NOT NULL DEFAULT 'Paddy Milling & Parboiling',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DEMANDS (Buyer Demand Requirements)
CREATE TABLE demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  product TEXT NOT NULL, -- Paddy variety (e.g., Sona Masuri, Basmati, BPT 5204)
  qty_kg NUMERIC NOT NULL CHECK (qty_kg > 0),
  matched_kg NUMERIC NOT NULL DEFAULT 0 CHECK (matched_kg >= 0 AND matched_kg <= qty_kg),
  location TEXT NOT NULL,
  district TEXT,
  required_date DATE NOT NULL,
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg >= 0),
  price_min NUMERIC DEFAULT 0,
  price_max NUMERIC DEFAULT 0,
  quality_requirements TEXT,
  notes TEXT,
  advance_percent NUMERIC NOT NULL DEFAULT 70 CHECK (advance_percent >= 0 AND advance_percent <= 100),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CONFIRMED', 'PROCESSING', 'READY', 'DELIVERED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CONTRIBUTIONS (Farmer Pledges against Demands)
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  village TEXT NOT NULL,
  district TEXT,
  qty_kg NUMERIC NOT NULL CHECK (qty_kg > 0),
  expected_harvest_date DATE,
  moisture_percent NUMERIC,
  grade TEXT DEFAULT 'Standard Grade',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PLEDGED' CHECK (status IN ('PLEDGED', 'HARVESTED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUCE LOTS (Harvested produce lots created by farmers)
CREATE TABLE produce_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_code TEXT NOT NULL UNIQUE, -- e.g. LOT-2026-00021
  contribution_id UUID REFERENCES contributions(id) ON DELETE CASCADE,
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  variety TEXT NOT NULL,
  qty_kg NUMERIC NOT NULL CHECK (qty_kg > 0),
  harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  village TEXT NOT NULL,
  district TEXT,
  moisture_percent NUMERIC,
  grade TEXT DEFAULT 'Grade A',
  verification_status TEXT NOT NULL DEFAULT 'SELF_DECLARED' CHECK (verification_status IN ('SELF_DECLARED', 'COOPERATIVE_VERIFIED', 'DOCUMENT_VERIFIED', 'LAB_VERIFIED')),
  verification_tier TEXT NOT NULL DEFAULT 'SELF_DECLARED',
  status TEXT NOT NULL DEFAULT 'HARVESTED' CHECK (status IN ('HARVESTED', 'PICKUP_REQUESTED', 'PICKED_UP', 'RECEIVED', 'BATCHED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PICKUP REQUESTS (Farmer to Cooperative Logistics)
CREATE TABLE pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produce_lot_id UUID NOT NULL REFERENCES produce_lots(id) ON DELETE CASCADE,
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  processing_unit_id UUID REFERENCES processing_units(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  requested_date DATE NOT NULL,
  scheduled_date DATE,
  vehicle_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'ASSIGNED', 'SCHEDULED', 'PICKED_UP', 'RECEIVED')),
  picked_up_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROCESSING BATCHES (Milling Runs at Cooperative Units)
CREATE TABLE processing_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code TEXT NOT NULL UNIQUE, -- e.g. BATCH-2026-00124
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  processing_unit_id UUID NOT NULL REFERENCES processing_units(id) ON DELETE RESTRICT,
  processing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  input_qty_kg NUMERIC NOT NULL CHECK (input_qty_kg > 0),
  output_qty_kg NUMERIC,
  operator_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'PROCESSING', 'PROCESSED', 'READY_FOR_DELIVERY', 'DELIVERED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- BATCH ITEMS (Junction table linking multiple farmer produce lots into a single batch)
CREATE TABLE batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES processing_batches(id) ON DELETE CASCADE,
  produce_lot_id UUID NOT NULL REFERENCES produce_lots(id) ON DELETE RESTRICT,
  farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  qty_kg NUMERIC NOT NULL CHECK (qty_kg > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- BATCH VERIFICATIONS (Quality & Origin Verification tiers)
CREATE TABLE batch_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES processing_batches(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('SELF_DECLARED', 'COOPERATIVE_VERIFIED', 'DOCUMENT_VERIFIED', 'LAB_VERIFIED')),
  status TEXT NOT NULL DEFAULT 'VERIFIED' CHECK (status IN ('VERIFIED', 'PENDING', 'REJECTED')),
  note TEXT,
  evidence_url TEXT,
  verified_by TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TRACE EVENTS (Auditable lifecycle event stream for full traceability)
CREATE TABLE trace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID REFERENCES demands(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES processing_batches(id) ON DELETE SET NULL,
  produce_lot_id UUID REFERENCES produce_lots(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LEDGER ENTRIES (Farmer earnings tracking with 70% advance & 30% delivery balance)
CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  contribution_id UUID NOT NULL REFERENCES contributions(id) ON DELETE CASCADE,
  gross_amount NUMERIC NOT NULL CHECK (gross_amount >= 0),
  advance_amount NUMERIC NOT NULL CHECK (advance_amount >= 0),
  balance_amount NUMERIC NOT NULL CHECK (balance_amount >= 0),
  advance_status TEXT NOT NULL DEFAULT 'ESTIMATED' CHECK (advance_status IN ('ESTIMATED', 'PENDING', 'AVAILABLE')),
  balance_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (balance_status IN ('PENDING', 'RELEASED')),
  note TEXT DEFAULT 'Amounts are ledger estimates; no payment gateway is connected.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ
);

-- DELIVERIES (Cooperative fulfillment to Buyer)
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demand_id UUID NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES processing_batches(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  delivered_quantity NUMERIC NOT NULL CHECK (delivered_quantity > 0),
  receiver_name TEXT NOT NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'DELIVERED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_demands_status ON demands(status);
CREATE INDEX idx_demands_buyer ON demands(buyer_id);
CREATE INDEX idx_contributions_demand ON contributions(demand_id);
CREATE INDEX idx_contributions_farmer ON contributions(farmer_id);
CREATE INDEX idx_produce_lots_lot_code ON produce_lots(lot_code);
CREATE INDEX idx_produce_lots_demand ON produce_lots(demand_id);
CREATE INDEX idx_processing_batches_code ON processing_batches(batch_code);
CREATE INDEX idx_processing_batches_demand ON processing_batches(demand_id);
CREATE INDEX idx_batch_items_batch ON batch_items(batch_id);
CREATE INDEX idx_trace_events_demand ON trace_events(demand_id);
CREATE INDEX idx_trace_events_batch ON trace_events(batch_id);
CREATE INDEX idx_ledger_entries_farmer ON ledger_entries(farmer_id);
CREATE INDEX idx_ledger_entries_demand ON ledger_entries(demand_id);

-- ============================================================================
-- 4. STORED PROCEDURES / RPCs
-- ============================================================================

-- A. POST DEMAND
CREATE OR REPLACE FUNCTION post_demand(
  p_buyer_id UUID,
  p_buyer_name TEXT,
  p_product TEXT,
  p_qty_kg NUMERIC,
  p_location TEXT,
  p_district TEXT,
  p_required_date DATE,
  p_price_per_kg NUMERIC,
  p_price_min NUMERIC DEFAULT 0,
  p_price_max NUMERIC DEFAULT 0,
  p_quality_requirements TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_demand_id UUID;
BEGIN
  IF p_qty_kg IS NULL OR p_qty_kg <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  IF p_price_per_kg IS NULL OR p_price_per_kg < 0 THEN
    RAISE EXCEPTION 'Price must be non-negative';
  END IF;

  INSERT INTO demands (
    buyer_id, buyer_name, product, qty_kg, matched_kg, location, district,
    required_date, price_per_kg, price_min, price_max, quality_requirements,
    notes, advance_percent, status
  ) VALUES (
    p_buyer_id, p_buyer_name, p_product, p_qty_kg, 0, p_location, p_district,
    p_required_date, p_price_per_kg, p_price_min, p_price_max, p_quality_requirements,
    p_notes, 70, 'OPEN'
  ) RETURNING id INTO v_demand_id;

  INSERT INTO trace_events (demand_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_demand_id,
    'DEMAND_POSTED',
    'buyer',
    p_buyer_name,
    jsonb_build_object(
      'product', p_product,
      'qty_kg', p_qty_kg,
      'price_per_kg', p_price_per_kg,
      'location', p_location,
      'required_date', p_required_date
    )
  );

  RETURN v_demand_id;
END;
$$ LANGUAGE plpgsql;


-- B. ATOMIC PLEDGE WITH FOR UPDATE ROW LOCKING
CREATE OR REPLACE FUNCTION pledge_produce(
  p_demand_id UUID,
  p_farmer_id UUID,
  p_farmer_name TEXT,
  p_village TEXT,
  p_district TEXT,
  p_qty NUMERIC,
  p_harvest_date DATE DEFAULT NULL,
  p_moisture NUMERIC DEFAULT NULL,
  p_grade TEXT DEFAULT 'Standard Grade',
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_demand RECORD;
  v_remaining NUMERIC;
  v_contribution_id UUID;
  v_new_matched NUMERIC;
  v_gross NUMERIC;
  v_advance NUMERIC;
  v_balance NUMERIC;
  v_is_confirmed BOOLEAN := false;
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'Pledge quantity must be greater than zero';
  END IF;

  -- 1. Lock the demand row to prevent race conditions
  SELECT * INTO v_demand FROM demands WHERE id = p_demand_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand not found';
  END IF;

  IF v_demand.status != 'OPEN' THEN
    RAISE EXCEPTION 'This demand is not open for pledging (status: %)', v_demand.status;
  END IF;

  v_remaining := v_demand.qty_kg - v_demand.matched_kg;

  -- 2. Reject over-pledging strictly according to spec
  IF p_qty > v_remaining THEN
    RAISE EXCEPTION 'Only % kg is remaining for this demand.', v_remaining;
  END IF;

  -- 3. Insert Contribution / Pledge
  INSERT INTO contributions (
    demand_id, farmer_id, farmer_name, village, district, qty_kg,
    expected_harvest_date, moisture_percent, grade, notes, status
  ) VALUES (
    p_demand_id, p_farmer_id, p_farmer_name, p_village, p_district, p_qty,
    p_harvest_date, p_moisture, p_grade, p_notes, 'PLEDGED'
  ) RETURNING id INTO v_contribution_id;

  -- 4. Update matched quantity
  v_new_matched := v_demand.matched_kg + p_qty;

  -- 5. Calculate ledger earnings (70% advance, 30% balance)
  v_gross := p_qty * v_demand.price_per_kg;
  v_advance := round(v_gross * 0.70, 2);
  v_balance := round(v_gross - v_advance, 2);

  -- 6. Check if fully matched (100%)
  IF v_new_matched = v_demand.qty_kg THEN
    v_is_confirmed := true;
    UPDATE demands
    SET matched_kg = v_new_matched,
        status = 'CONFIRMED',
        updated_at = now()
    WHERE id = p_demand_id;

    -- Advance ledger entry created upon confirmation
    INSERT INTO ledger_entries (
      farmer_id, farmer_name, demand_id, contribution_id,
      gross_amount, advance_amount, balance_amount,
      advance_status, balance_status, note
    ) VALUES (
      p_farmer_id, p_farmer_name, p_demand_id, v_contribution_id,
      v_gross, v_advance, v_balance,
      'ESTIMATED', 'PENDING',
      'Demand fully matched. Advance estimated in ledger.'
    );

    -- Log confirmation trace event
    INSERT INTO trace_events (demand_id, event_type, actor_role, actor_name, details)
    VALUES (
      p_demand_id,
      'DEMAND_CONFIRMED',
      'system',
      'Sasyathra Engine',
      jsonb_build_object('total_qty_kg', v_demand.qty_kg, 'matched_kg', v_new_matched)
    );
  ELSE
    UPDATE demands
    SET matched_kg = v_new_matched,
        updated_at = now()
    WHERE id = p_demand_id;

    -- Create ledger entry in estimated state
    INSERT INTO ledger_entries (
      farmer_id, farmer_name, demand_id, contribution_id,
      gross_amount, advance_amount, balance_amount,
      advance_status, balance_status, note
    ) VALUES (
      p_farmer_id, p_farmer_name, p_demand_id, v_contribution_id,
      v_gross, v_advance, v_balance,
      'ESTIMATED', 'PENDING',
      'Pledge recorded. Awaiting full demand confirmation.'
    );
  END IF;

  -- 7. Log pledge trace event
  INSERT INTO trace_events (demand_id, event_type, actor_role, actor_name, details)
  VALUES (
    p_demand_id,
    'PLEDGE_ADDED',
    'farmer',
    p_farmer_name,
    jsonb_build_object(
      'pledged_qty_kg', p_qty,
      'farmer_village', p_village,
      'new_matched_kg', v_new_matched,
      'remaining_kg', v_demand.qty_kg - v_new_matched
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'contribution_id', v_contribution_id,
    'pledged_qty', p_qty,
    'new_matched_kg', v_new_matched,
    'remaining_kg', v_demand.qty_kg - v_new_matched,
    'is_confirmed', v_is_confirmed
  );
END;
$$ LANGUAGE plpgsql;


-- C. REPORT HARVEST & CREATE PRODUCE LOT
CREATE OR REPLACE FUNCTION report_harvest(
  p_contribution_id UUID,
  p_harvest_date DATE,
  p_qty_kg NUMERIC,
  p_moisture_percent NUMERIC,
  p_grade TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_contrib RECORD;
  v_demand RECORD;
  v_lot_id UUID;
  v_lot_code TEXT;
  v_seq INT;
BEGIN
  SELECT * INTO v_contrib FROM contributions WHERE id = p_contribution_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pledge contribution not found';
  END IF;

  SELECT * INTO v_demand FROM demands WHERE id = v_contrib.demand_id;

  -- Generate unique LOT-YYYY-XXXXX code
  SELECT count(*) + 1 INTO v_seq FROM produce_lots;
  v_lot_code := 'LOT-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(v_seq::text, 5, '0');

  INSERT INTO produce_lots (
    lot_code, contribution_id, demand_id, farmer_id, farmer_name,
    variety, qty_kg, harvest_date, village, district, moisture_percent,
    grade, verification_status, verification_tier, status
  ) VALUES (
    v_lot_code, p_contribution_id, v_contrib.demand_id, v_contrib.farmer_id, v_contrib.farmer_name,
    v_demand.product, p_qty_kg, p_harvest_date, v_contrib.village, v_contrib.district, p_moisture_percent,
    p_grade, 'SELF_DECLARED', 'SELF_DECLARED', 'HARVESTED'
  ) RETURNING id INTO v_lot_id;

  UPDATE contributions SET status = 'HARVESTED' WHERE id = p_contribution_id;

  INSERT INTO trace_events (demand_id, produce_lot_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_contrib.demand_id,
    v_lot_id,
    'HARVEST_REPORTED',
    'farmer',
    v_contrib.farmer_name,
    jsonb_build_object('lot_code', v_lot_code, 'qty_kg', p_qty_kg, 'moisture', p_moisture_percent, 'grade', p_grade)
  );

  INSERT INTO trace_events (demand_id, produce_lot_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_contrib.demand_id,
    v_lot_id,
    'LOT_CREATED',
    'farmer',
    v_contrib.farmer_name,
    jsonb_build_object('lot_code', v_lot_code, 'qty_kg', p_qty_kg)
  );

  RETURN jsonb_build_object(
    'success', true,
    'produce_lot_id', v_lot_id,
    'lot_code', v_lot_code
  );
END;
$$ LANGUAGE plpgsql;


-- D. REQUEST PICKUP
CREATE OR REPLACE FUNCTION request_pickup(
  p_produce_lot_id UUID,
  p_pickup_location TEXT,
  p_preferred_date DATE,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_lot RECORD;
  v_pickup_id UUID;
BEGIN
  SELECT * INTO v_lot FROM produce_lots WHERE id = p_produce_lot_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produce lot not found';
  END IF;

  INSERT INTO pickup_requests (
    produce_lot_id, demand_id, farmer_id, farmer_name,
    pickup_location, requested_date, status, notes
  ) VALUES (
    p_produce_lot_id, v_lot.demand_id, v_lot.farmer_id, v_lot.farmer_name,
    p_pickup_location, p_preferred_date, 'REQUESTED', p_notes
  ) RETURNING id INTO v_pickup_id;

  UPDATE produce_lots SET status = 'PICKUP_REQUESTED' WHERE id = p_produce_lot_id;

  INSERT INTO trace_events (demand_id, produce_lot_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_lot.demand_id,
    p_produce_lot_id,
    'PICKUP_REQUESTED',
    'farmer',
    v_lot.farmer_name,
    jsonb_build_object('lot_code', v_lot.lot_code, 'pickup_location', p_pickup_location, 'preferred_date', p_preferred_date)
  );

  RETURN v_pickup_id;
END;
$$ LANGUAGE plpgsql;


-- E. ASSIGN PICKUP (COOPERATIVE)
CREATE OR REPLACE FUNCTION assign_pickup(
  p_pickup_request_id UUID,
  p_unit_id UUID,
  p_scheduled_date DATE,
  p_vehicle_number TEXT,
  p_driver_name TEXT,
  p_driver_phone TEXT
) RETURNS VOID AS $$
DECLARE
  v_req RECORD;
  v_lot RECORD;
BEGIN
  SELECT * INTO v_req FROM pickup_requests WHERE id = p_pickup_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pickup request not found';
  END IF;

  SELECT * INTO v_lot FROM produce_lots WHERE id = v_req.produce_lot_id;

  UPDATE pickup_requests
  SET processing_unit_id = p_unit_id,
      scheduled_date = p_scheduled_date,
      vehicle_number = p_vehicle_number,
      driver_name = p_driver_name,
      driver_phone = p_driver_phone,
      status = 'SCHEDULED'
  WHERE id = p_pickup_request_id;

  INSERT INTO trace_events (demand_id, produce_lot_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_req.demand_id,
    v_req.produce_lot_id,
    'PICKUP_ASSIGNED',
    'cooperative',
    'Logistics Coordinator',
    jsonb_build_object(
      'lot_code', v_lot.lot_code,
      'scheduled_date', p_scheduled_date,
      'vehicle_number', p_vehicle_number,
      'driver_name', p_driver_name
    )
  );
END;
$$ LANGUAGE plpgsql;


-- F. MARK PICKED UP
CREATE OR REPLACE FUNCTION mark_picked_up(
  p_pickup_request_id UUID
) RETURNS VOID AS $$
DECLARE
  v_req RECORD;
  v_lot RECORD;
BEGIN
  SELECT * INTO v_req FROM pickup_requests WHERE id = p_pickup_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pickup request not found';
  END IF;

  SELECT * INTO v_lot FROM produce_lots WHERE id = v_req.produce_lot_id;

  UPDATE pickup_requests
  SET status = 'PICKED_UP',
      picked_up_at = now()
  WHERE id = p_pickup_request_id;

  UPDATE produce_lots
  SET status = 'PICKED_UP'
  WHERE id = v_req.produce_lot_id;

  INSERT INTO trace_events (demand_id, produce_lot_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_req.demand_id,
    v_req.produce_lot_id,
    'PICKED_UP',
    'cooperative',
    coalesce(v_req.driver_name, 'Logistics Driver'),
    jsonb_build_object('lot_code', v_lot.lot_code, 'vehicle_number', v_req.vehicle_number)
  );
END;
$$ LANGUAGE plpgsql;


-- G. CONFIRM RECEIVED AT COOPERATIVE
CREATE OR REPLACE FUNCTION confirm_received(
  p_pickup_request_id UUID,
  p_received_qty_kg NUMERIC,
  p_received_date DATE,
  p_condition_note TEXT
) RETURNS VOID AS $$
DECLARE
  v_req RECORD;
  v_lot RECORD;
BEGIN
  SELECT * INTO v_req FROM pickup_requests WHERE id = p_pickup_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pickup request not found';
  END IF;

  SELECT * INTO v_lot FROM produce_lots WHERE id = v_req.produce_lot_id;

  UPDATE pickup_requests
  SET status = 'RECEIVED',
      received_at = now(),
      notes = concat_ws(' | ', notes, p_condition_note)
  WHERE id = p_pickup_request_id;

  UPDATE produce_lots
  SET status = 'RECEIVED',
      qty_kg = coalesce(p_received_qty_kg, qty_kg),
      verification_status = 'COOPERATIVE_VERIFIED',
      verification_tier = 'COOPERATIVE_VERIFIED'
  WHERE id = v_req.produce_lot_id;

  INSERT INTO trace_events (demand_id, produce_lot_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_req.demand_id,
    v_req.produce_lot_id,
    'RECEIVED',
    'cooperative',
    'Cooperative Quality Supervisor',
    jsonb_build_object(
      'lot_code', v_lot.lot_code,
      'received_qty_kg', p_received_qty_kg,
      'condition_note', p_condition_note,
      'received_date', p_received_date
    )
  );
END;
$$ LANGUAGE plpgsql;


-- H. SCHEDULE PROCESSING WITH CAPACITY CHECK
CREATE OR REPLACE FUNCTION schedule_processing(
  p_demand_id UUID,
  p_unit_id UUID,
  p_processing_date DATE,
  p_lot_ids UUID[],
  p_operator_name TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_unit RECORD;
  v_already_scheduled NUMERIC;
  v_total_input_kg NUMERIC := 0;
  v_available_capacity NUMERIC;
  v_batch_id UUID;
  v_batch_code TEXT;
  v_seq INT;
  v_lot_id UUID;
  v_lot RECORD;
BEGIN
  -- 1. Get processing unit
  SELECT * INTO v_unit FROM processing_units WHERE id = p_unit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processing unit not found';
  END IF;

  -- 2. Calculate input qty from lots
  SELECT coalesce(sum(qty_kg), 0) INTO v_total_input_kg
  FROM produce_lots
  WHERE id = ANY(p_lot_ids);

  IF v_total_input_kg <= 0 THEN
    RAISE EXCEPTION 'Selected produce lots have no quantity';
  END IF;

  -- 3. Server-side Capacity Check: Daily Capacity - Already Scheduled = Available Capacity
  SELECT coalesce(sum(input_qty_kg), 0) INTO v_already_scheduled
  FROM processing_batches
  WHERE processing_unit_id = p_unit_id
    AND processing_date = p_processing_date
    AND status != 'CANCELLED';

  v_available_capacity := v_unit.daily_capacity_kg - v_already_scheduled;

  IF v_total_input_kg > v_available_capacity THEN
    RAISE EXCEPTION 'Capacity exceeded for %: Unit has % kg daily capacity, % kg already scheduled, % kg available. Attempted to schedule % kg.',
      p_processing_date, v_unit.daily_capacity_kg, v_already_scheduled, v_available_capacity, v_total_input_kg;
  END IF;

  -- 4. Generate BATCH-YYYY-XXXXX code
  SELECT count(*) + 1 INTO v_seq FROM processing_batches;
  v_batch_code := 'BATCH-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(v_seq::text, 5, '0');

  -- 5. Insert processing batch
  INSERT INTO processing_batches (
    batch_code, demand_id, processing_unit_id, processing_date,
    input_qty_kg, operator_name, notes, status
  ) VALUES (
    v_batch_code, p_demand_id, p_unit_id, p_processing_date,
    v_total_input_kg, p_operator_name, p_notes, 'SCHEDULED'
  ) RETURNING id INTO v_batch_id;

  -- 6. Link multiple farmer produce lots via batch_items
  FOREACH v_lot_id IN ARRAY p_lot_ids LOOP
    SELECT * INTO v_lot FROM produce_lots WHERE id = v_lot_id;
    INSERT INTO batch_items (batch_id, produce_lot_id, farmer_id, farmer_name, qty_kg)
    VALUES (v_batch_id, v_lot_id, v_lot.farmer_id, v_lot.farmer_name, v_lot.qty_kg);

    UPDATE produce_lots SET status = 'BATCHED' WHERE id = v_lot_id;
  END LOOP;

  -- 7. Update demand status
  UPDATE demands SET status = 'PROCESSING', updated_at = now() WHERE id = p_demand_id;

  -- 8. Log trace events
  INSERT INTO trace_events (demand_id, batch_id, event_type, actor_role, actor_name, details)
  VALUES (
    p_demand_id,
    v_batch_id,
    'PROCESSING_SCHEDULED',
    'cooperative',
    p_operator_name,
    jsonb_build_object(
      'batch_code', v_batch_code,
      'processing_unit', v_unit.name,
      'processing_date', p_processing_date,
      'input_qty_kg', v_total_input_kg,
      'lot_count', array_length(p_lot_ids, 1)
    )
  );

  INSERT INTO trace_events (demand_id, batch_id, event_type, actor_role, actor_name, details)
  VALUES (
    p_demand_id,
    v_batch_id,
    'BATCH_CREATED',
    'cooperative',
    p_operator_name,
    jsonb_build_object('batch_code', v_batch_code, 'total_kg', v_total_input_kg)
  );

  RETURN jsonb_build_object(
    'success', true,
    'batch_id', v_batch_id,
    'batch_code', v_batch_code,
    'total_input_kg', v_total_input_kg
  );
END;
$$ LANGUAGE plpgsql;


-- I. UPDATE BATCH STATUS (PROCESSING -> PROCESSED -> READY_FOR_DELIVERY)
CREATE OR REPLACE FUNCTION update_batch_status(
  p_batch_id UUID,
  p_new_status TEXT,
  p_output_qty_kg NUMERIC DEFAULT NULL,
  p_operator_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_batch RECORD;
  v_unit RECORD;
BEGIN
  SELECT * INTO v_batch FROM processing_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processing batch not found';
  END IF;

  SELECT * INTO v_unit FROM processing_units WHERE id = v_batch.processing_unit_id;

  IF p_new_status = 'PROCESSING' THEN
    UPDATE processing_batches
    SET status = 'PROCESSING',
        operator_name = coalesce(p_operator_name, operator_name),
        notes = concat_ws(' | ', notes, p_notes)
    WHERE id = p_batch_id;

    INSERT INTO trace_events (demand_id, batch_id, event_type, actor_role, actor_name, details)
    VALUES (
      v_batch.demand_id,
      p_batch_id,
      'PROCESSING_STARTED',
      'cooperative',
      coalesce(p_operator_name, 'Milling Operator'),
      jsonb_build_object('batch_code', v_batch.batch_code, 'mill', v_unit.name)
    );

  ELSIF p_new_status = 'PROCESSED' THEN
    UPDATE processing_batches
    SET status = 'PROCESSED',
        output_qty_kg = p_output_qty_kg,
        operator_name = coalesce(p_operator_name, operator_name),
        notes = concat_ws(' | ', notes, p_notes),
        completed_at = now()
    WHERE id = p_batch_id;

    INSERT INTO trace_events (demand_id, batch_id, event_type, actor_role, actor_name, details)
    VALUES (
      v_batch.demand_id,
      p_batch_id,
      'PROCESSING_COMPLETED',
      'cooperative',
      coalesce(p_operator_name, 'Milling Operator'),
      jsonb_build_object(
        'batch_code', v_batch.batch_code,
        'input_qty_kg', v_batch.input_qty_kg,
        'output_qty_kg', p_output_qty_kg,
        'milling_recovery_rate', CASE WHEN v_batch.input_qty_kg > 0 THEN round((p_output_qty_kg / v_batch.input_qty_kg) * 100, 1) ELSE 0 END
      )
    );

  ELSIF p_new_status = 'READY_FOR_DELIVERY' THEN
    UPDATE processing_batches SET status = 'READY_FOR_DELIVERY' WHERE id = p_batch_id;
    UPDATE demands SET status = 'READY', updated_at = now() WHERE id = v_batch.demand_id;

    INSERT INTO trace_events (demand_id, batch_id, event_type, actor_role, actor_name, details)
    VALUES (
      v_batch.demand_id,
      p_batch_id,
      'READY_FOR_DELIVERY',
      'cooperative',
      coalesce(p_operator_name, 'Fulfillment Desk'),
      jsonb_build_object('batch_code', v_batch.batch_code, 'ready_units_kg', coalesce(p_output_qty_kg, v_batch.output_qty_kg, v_batch.input_qty_kg))
    );
  END IF;
END;
$$ LANGUAGE plpgsql;


-- J. ADD BATCH VERIFICATION
CREATE OR REPLACE FUNCTION add_batch_verification(
  p_batch_id UUID,
  p_tier TEXT,
  p_status TEXT,
  p_note TEXT,
  p_evidence_url TEXT,
  p_verified_by TEXT
) RETURNS UUID AS $$
DECLARE
  v_batch RECORD;
  v_verif_id UUID;
BEGIN
  SELECT * INTO v_batch FROM processing_batches WHERE id = p_batch_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processing batch not found';
  END IF;

  INSERT INTO batch_verifications (
    batch_id, tier, status, note, evidence_url, verified_by, verified_at
  ) VALUES (
    p_batch_id, p_tier, p_status, p_note, p_evidence_url, p_verified_by, now()
  ) RETURNING id INTO v_verif_id;

  INSERT INTO trace_events (demand_id, batch_id, event_type, actor_role, actor_name, details)
  VALUES (
    v_batch.demand_id,
    p_batch_id,
    'VERIFIED',
    'cooperative',
    p_verified_by,
    jsonb_build_object('tier', p_tier, 'status', p_status, 'note', p_note, 'evidence', p_evidence_url)
  );

  RETURN v_verif_id;
END;
$$ LANGUAGE plpgsql;


-- K. MARK DELIVERED & ATOMICALLY RELEASE FARMER BALANCE IN LEDGER
CREATE OR REPLACE FUNCTION mark_delivered(
  p_demand_id UUID,
  p_batch_id UUID,
  p_delivered_qty NUMERIC,
  p_receiver_name TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_demand RECORD;
  v_delivery_id UUID;
  v_released_count INT := 0;
BEGIN
  SELECT * INTO v_demand FROM demands WHERE id = p_demand_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Demand not found';
  END IF;

  -- 1. Create delivery record
  INSERT INTO deliveries (
    demand_id, batch_id, buyer_id, delivered_quantity, receiver_name, delivered_at, notes, status
  ) VALUES (
    p_demand_id, p_batch_id, v_demand.buyer_id, p_delivered_qty, p_receiver_name, now(), p_notes, 'DELIVERED'
  ) RETURNING id INTO v_delivery_id;

  -- 2. Mark Demand & Batch as DELIVERED
  UPDATE demands SET status = 'DELIVERED', updated_at = now() WHERE id = p_demand_id;

  IF p_batch_id IS NOT NULL THEN
    UPDATE processing_batches SET status = 'DELIVERED', completed_at = now() WHERE id = p_batch_id;
  END IF;

  -- 3. ATOMIC BALANCE RELEASE in Farmer Ledger
  UPDATE ledger_entries
  SET balance_status = 'RELEASED',
      advance_status = 'AVAILABLE',
      released_at = now(),
      note = 'Balance released in Sasyathra ledger upon buyer delivery confirmation. Actual payment integration is not connected.'
  WHERE demand_id = p_demand_id AND balance_status = 'PENDING';

  GET DIAGNOSTICS v_released_count = ROW_COUNT;

  -- 4. Log trace event
  INSERT INTO trace_events (demand_id, batch_id, event_type, actor_role, actor_name, details)
  VALUES (
    p_demand_id,
    p_batch_id,
    'DELIVERED',
    'cooperative',
    p_receiver_name,
    jsonb_build_object(
      'delivered_quantity', p_delivered_qty,
      'receiver', p_receiver_name,
      'farmers_settled', v_released_count,
      'note', 'Buyer delivery received. Ledger balance released.'
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'delivery_id', v_delivery_id,
    'farmers_settled', v_released_count
  );
END;
$$ LANGUAGE plpgsql;


-- L. GET PUBLIC BATCH TRACE (NO LOGIN NEEDED, STRICTLY SANITIZED)
CREATE OR REPLACE FUNCTION get_batch_trace(p_batch_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_batch RECORD;
  v_demand RECORD;
  v_unit RECORD;
  v_lots JSONB;
  v_timeline JSONB;
  v_verifications JSONB;
BEGIN
  -- 1. Batch header
  SELECT * INTO v_batch FROM processing_batches WHERE batch_code = p_batch_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- 2. Demand
  SELECT * INTO v_demand FROM demands WHERE id = v_batch.demand_id;

  -- 3. Unit
  SELECT * INTO v_unit FROM processing_units WHERE id = v_batch.processing_unit_id;

  -- 4. Produce lots (Sanitized: NO phone, NO email, NO private address)
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'lot_code', pl.lot_code,
      'farmer_alias', pl.farmer_name,
      'village', pl.village,
      'district', pl.district,
      'variety', pl.variety,
      'qty_kg', bi.qty_kg,
      'harvest_date', pl.harvest_date,
      'grade', pl.grade,
      'moisture_percent', pl.moisture_percent,
      'verification_status', pl.verification_status
    )
  ), '[]'::jsonb) INTO v_lots
  FROM batch_items bi
  JOIN produce_lots pl ON pl.id = bi.produce_lot_id
  WHERE bi.batch_id = v_batch.id;

  -- 5. Verifications
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'tier', bv.tier,
      'status', bv.status,
      'note', bv.note,
      'evidence_url', bv.evidence_url,
      'verified_by', bv.verified_by,
      'verified_at', bv.verified_at
    ) ORDER BY bv.created_at ASC
  ), '[]'::jsonb) INTO v_verifications
  FROM batch_verifications bv
  WHERE bv.batch_id = v_batch.id;

  -- 6. Timeline events
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'event_type', te.event_type,
      'actor_role', te.actor_role,
      'actor_name', te.actor_name,
      'details', te.details,
      'created_at', te.created_at
    ) ORDER BY te.created_at ASC
  ), '[]'::jsonb) INTO v_timeline
  FROM trace_events te
  WHERE te.batch_id = v_batch.id OR te.demand_id = v_batch.demand_id;

  RETURN jsonb_build_object(
    'found', true,
    'batch', jsonb_build_object(
      'batch_code', v_batch.batch_code,
      'processing_date', v_batch.processing_date,
      'input_qty_kg', v_batch.input_qty_kg,
      'output_qty_kg', v_batch.output_qty_kg,
      'status', v_batch.status,
      'created_at', v_batch.created_at,
      'completed_at', v_batch.completed_at
    ),
    'product', v_demand.product,
    'buyer_destination', v_demand.location,
    'processing_unit', jsonb_build_object(
      'name', v_unit.name,
      'village', v_unit.village,
      'district', v_unit.district,
      'daily_capacity_kg', v_unit.daily_capacity_kg,
      'processing_type', v_unit.processing_type
    ),
    'lots', v_lots,
    'verifications', v_verifications,
    'timeline', v_timeline
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE produce_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Public / Authenticated read policies (allowing frontend client app transparency)
CREATE POLICY "Allow public read processing_units" ON processing_units FOR SELECT USING (true);
CREATE POLICY "Allow public read demands" ON demands FOR SELECT USING (true);
CREATE POLICY "Allow public insert demands" ON demands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update demands" ON demands FOR UPDATE USING (true);

CREATE POLICY "Allow public read contributions" ON contributions FOR SELECT USING (true);
CREATE POLICY "Allow public insert contributions" ON contributions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update contributions" ON contributions FOR UPDATE USING (true);

CREATE POLICY "Allow public read produce_lots" ON produce_lots FOR SELECT USING (true);
CREATE POLICY "Allow public insert produce_lots" ON produce_lots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update produce_lots" ON produce_lots FOR UPDATE USING (true);

CREATE POLICY "Allow public read pickup_requests" ON pickup_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert pickup_requests" ON pickup_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update pickup_requests" ON pickup_requests FOR UPDATE USING (true);

CREATE POLICY "Allow public read processing_batches" ON processing_batches FOR SELECT USING (true);
CREATE POLICY "Allow public insert processing_batches" ON processing_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update processing_batches" ON processing_batches FOR UPDATE USING (true);

CREATE POLICY "Allow public read batch_items" ON batch_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert batch_items" ON batch_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read batch_verifications" ON batch_verifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert batch_verifications" ON batch_verifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read trace_events" ON trace_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert trace_events" ON trace_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read ledger_entries" ON ledger_entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert ledger_entries" ON ledger_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ledger_entries" ON ledger_entries FOR UPDATE USING (true);

CREATE POLICY "Allow public read deliveries" ON deliveries FOR SELECT USING (true);
CREATE POLICY "Allow public insert deliveries" ON deliveries FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON profiles FOR UPDATE USING (true);


-- ============================================================================
-- 6. REALTIME REPLICATION ENABLEMENT
-- ============================================================================
-- Enable supabase realtime on live tables
ALTER PUBLICATION supabase_realtime ADD TABLE demands;
ALTER PUBLICATION supabase_realtime ADD TABLE contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE produce_lots;
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE processing_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE trace_events;
ALTER PUBLICATION supabase_realtime ADD TABLE ledger_entries;


-- ============================================================================
-- 7. REALISTIC SEED DATA (DEMO SCENARIOS FROM SPECIFICATION)
-- ============================================================================

-- A. DEMO PROFILES
INSERT INTO profiles (id, role, name, email, phone, village, district, farm_size_acres, preferred_varieties) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'buyer', 'Hyderabad Supermarket (Ameerpet)', 'procurement@hydsupermarket.com', '+91 98490 11223', 'Ameerpet', 'Hyderabad', NULL, NULL),
  ('a2222222-2222-2222-2222-222222222222', 'buyer', 'Secunderabad Grand Hotel', 'chef@secunderabadgrand.com', '+91 98490 22334', 'Secunderabad', 'Hyderabad', NULL, NULL),
  ('a3333333-3333-3333-3333-333333333333', 'buyer', 'Warangal University Hostel', 'hostel@warangaluniv.ac.in', '+91 98490 33445', 'Subedari', 'Warangal', NULL, NULL),
  ('b1111111-1111-1111-1111-111111111111', 'farmer', 'Ramesh Goud', 'ramesh.farmer@sasyathra.org', '+91 94401 55667', 'Dharmasagar', 'Warangal', 4.5, ARRAY['Sona Masuri', 'BPT 5204']),
  ('b2222222-2222-2222-2222-222222222222', 'farmer', 'Lakshmi Bai', 'lakshmi.farmer@sasyathra.org', '+91 94401 66778', 'Huzurabad', 'Karimnagar', 3.0, ARRAY['Sona Masuri', 'Basmati']),
  ('b3333333-3333-3333-3333-333333333333', 'farmer', 'Venkataiah Kurva', 'venkat.farmer@sasyathra.org', '+91 94401 77889', 'Ghanpur', 'Jangaon', 6.0, ARRAY['Standard Paddy', 'Telangana Sona']),
  ('c1111111-1111-1111-1111-111111111111', 'cooperative', 'Kondapur FPO Mill Team', 'kondapur.fpo@sasyathra.org', '+91 98490 88990', 'Kondapur', 'Medak', NULL, NULL),
  ('c2222222-2222-2222-2222-222222222222', 'cooperative', 'Warangal Cooperative Processing Unit', 'warangal.coop@sasyathra.org', '+91 98490 99001', 'Warangal Cluster', 'Warangal', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- B. PROCESSING UNITS (From spec: Kondapur FPO Mill & Warangal Cooperative Unit)
INSERT INTO processing_units (id, name, village, district, daily_capacity_kg, processing_type) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Kondapur FPO Mill (CHC-registered)', 'Kondapur', 'Medak', 1500, 'Modern Paddy De-husking & Grading'),
  ('e2222222-2222-2222-2222-222222222222', 'Warangal Cooperative Processing Unit', 'Warangal Cluster', 'Warangal', 1000, 'Single-pass Parboiling & Precision Milling')
ON CONFLICT (id) DO NOTHING;

-- C. DEMO DEMANDS (From spec: Hyderabad Supermarket, Secunderabad Hotel, Warangal Hostel)
INSERT INTO demands (
  id, buyer_id, buyer_name, product, qty_kg, matched_kg, location, district,
  required_date, price_per_kg, price_min, price_max, quality_requirements, notes, advance_percent, status, created_at
) VALUES
  (
    'd1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Hyderabad Supermarket',
    'Sona Masuri',
    2000,
    1350,
    'Hyderabad',
    'Hyderabad',
    '2026-10-20',
    45.0,
    42.0,
    48.0,
    'Standard Grade, moisture <= 14%, clean whole grain',
    'Direct delivery to central warehouse in Ameerpet.',
    70,
    'OPEN',
    now() - interval '3 days'
  ),
  (
    'd2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'Secunderabad Hotel',
    'Basmati',
    500,
    0,
    'Secunderabad',
    'Hyderabad',
    '2026-10-25',
    70.0,
    65.0,
    75.0,
    'Aromatic long grain, polished, moisture <= 12%',
    'Weekly fresh restaurant supply requirement.',
    70,
    'OPEN',
    now() - interval '2 days'
  ),
  (
    'd3333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'Warangal Hostel',
    'Standard Paddy',
    5000,
    0,
    'Warangal',
    'Warangal',
    '2026-11-01',
    38.0,
    35.0,
    40.0,
    'Standard bold grain suitable for bulk canteen cooking',
    'Government certified cooperative milling required.',
    70,
    'OPEN',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- D. EXISTING CONTRIBUTIONS / PLEDGES FOR HYDERABAD SUPERMARKET (1350 kg pledged out of 2000 kg)
INSERT INTO contributions (
  id, demand_id, farmer_id, farmer_name, village, district, qty_kg, expected_harvest_date, moisture_percent, grade, notes, status, created_at
) VALUES
  (
    'c0000001-0000-0000-0000-000000000001',
    'd1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'Ramesh Goud',
    'Dharmasagar',
    'Warangal',
    800,
    '2026-10-14',
    13.5,
    'Grade A',
    'First field harvest plot #4',
    'PLEDGED',
    now() - interval '2 days'
  ),
  (
    'c0000002-0000-0000-0000-000000000002',
    'd1111111-1111-1111-1111-111111111111',
    'b2222222-2222-2222-2222-222222222222',
    'Lakshmi Bai',
    'Huzurabad',
    'Karimnagar',
    550,
    '2026-10-15',
    14.0,
    'Grade A',
    'Rainfed second crop',
    'PLEDGED',
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- E. SEED ESTIMATED LEDGER ENTRIES
INSERT INTO ledger_entries (
  farmer_id, farmer_name, demand_id, contribution_id, gross_amount, advance_amount, balance_amount, advance_status, balance_status, note, created_at
) VALUES
  (
    'b1111111-1111-1111-1111-111111111111',
    'Ramesh Goud',
    'd1111111-1111-1111-1111-111111111111',
    'c0000001-0000-0000-0000-000000000001',
    36000.00, -- 800 kg * 45
    25200.00, -- 70%
    10800.00, -- 30%
    'ESTIMATED',
    'PENDING',
    'Amounts are ledger estimates; no payment gateway is connected.',
    now() - interval '2 days'
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    'Lakshmi Bai',
    'd1111111-1111-1111-1111-111111111111',
    'c0000002-0000-0000-0000-000000000002',
    24750.00, -- 550 kg * 45
    17325.00, -- 70%
    7425.00,  -- 30%
    'ESTIMATED',
    'PENDING',
    'Amounts are ledger estimates; no payment gateway is connected.',
    now() - interval '1 day'
  )
ON CONFLICT DO NOTHING;

-- F. SEED INITIAL TRACE EVENTS
INSERT INTO trace_events (demand_id, event_type, actor_role, actor_name, details, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'DEMAND_POSTED', 'buyer', 'Hyderabad Supermarket', '{"product": "Sona Masuri", "qty_kg": 2000, "price_per_kg": 45, "location": "Hyderabad"}'::jsonb, now() - interval '3 days'),
  ('d1111111-1111-1111-1111-111111111111', 'PLEDGE_ADDED', 'farmer', 'Ramesh Goud', '{"pledged_qty_kg": 800, "farmer_village": "Dharmasagar", "new_matched_kg": 800, "remaining_kg": 1200}'::jsonb, now() - interval '2 days'),
  ('d1111111-1111-1111-1111-111111111111', 'PLEDGE_ADDED', 'farmer', 'Lakshmi Bai', '{"pledged_qty_kg": 550, "farmer_village": "Huzurabad", "new_matched_kg": 1350, "remaining_kg": 650}'::jsonb, now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SASYATHRA SCHEMA SCRIPT
-- ============================================================================
