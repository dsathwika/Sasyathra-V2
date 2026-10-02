// ============================================================================
// SASYATHRA HIGH-FIDELITY LOCAL DATABASE ENGINE & STORE
// ============================================================================
// Provides full persistence, atomic transaction simulation, capacity validation,
// multi-farmer batch management, audit event streaming, and ledger settlement.
// This allows the full workflow to run out of the box or as a fallback when
// remote Supabase credentials are not yet configured.
// ============================================================================

const STORAGE_KEY = 'sasyathra_db_v1';

// Initial realistic seed data as specified in Sections 63, 64
const INITIAL_DATA = {
  profiles: [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      role: 'buyer',
      name: 'Hyderabad Supermarket (Ameerpet)',
      email: 'procurement@hydsupermarket.com',
      phone: '+91 98490 11223',
      village: 'Ameerpet Central',
      district: 'Hyderabad'
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      role: 'buyer',
      name: 'Secunderabad Grand Hotel',
      email: 'chef@secunderabadgrand.com',
      phone: '+91 98490 22334',
      village: 'Secunderabad Station Rd',
      district: 'Hyderabad'
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      role: 'buyer',
      name: 'Warangal University Hostel',
      email: 'hostel@warangaluniv.ac.in',
      phone: '+91 98490 33445',
      village: 'Subedari',
      district: 'Warangal'
    },
    {
      id: 'b1111111-1111-1111-1111-111111111111',
      role: 'farmer',
      name: 'Ramesh Goud',
      email: 'ramesh.farmer@sasyathra.org',
      phone: '+91 94401 55667',
      village: 'Dharmasagar',
      district: 'Warangal',
      farm_size_acres: 4.5,
      preferred_varieties: ['Sona Masuri', 'BPT 5204']
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      role: 'farmer',
      name: 'Lakshmi Bai',
      email: 'lakshmi.farmer@sasyathra.org',
      phone: '+91 94401 66778',
      village: 'Huzurabad',
      district: 'Karimnagar',
      farm_size_acres: 3.0,
      preferred_varieties: ['Sona Masuri', 'Basmati']
    },
    {
      id: 'b3333333-3333-3333-3333-333333333333',
      role: 'farmer',
      name: 'Venkataiah Kurva',
      email: 'venkat.farmer@sasyathra.org',
      phone: '+91 94401 77889',
      village: 'Ghanpur',
      district: 'Jangaon',
      farm_size_acres: 6.0,
      preferred_varieties: ['Standard Paddy', 'Telangana Sona']
    },
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      role: 'cooperative',
      name: 'Kondapur FPO Mill Team',
      email: 'kondapur.fpo@sasyathra.org',
      phone: '+91 98490 88990',
      village: 'Kondapur',
      district: 'Medak'
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      role: 'cooperative',
      name: 'Warangal Cooperative Processing Unit',
      email: 'warangal.coop@sasyathra.org',
      phone: '+91 98490 99001',
      village: 'Warangal Cluster',
      district: 'Warangal'
    }
  ],
  processing_units: [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      name: 'Kondapur FPO Mill (CHC-registered)',
      village: 'Kondapur',
      district: 'Medak',
      daily_capacity_kg: 1500,
      processing_type: 'Modern Paddy De-husking & Grading',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      name: 'Warangal Cooperative Processing Unit',
      village: 'Warangal Cluster',
      district: 'Warangal',
      daily_capacity_kg: 1000,
      processing_type: 'Single-pass Parboiling & Precision Milling',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    }
  ],
  demands: [
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      buyer_id: 'a1111111-1111-1111-1111-111111111111',
      buyer_name: 'Hyderabad Supermarket',
      product: 'Sona Masuri',
      qty_kg: 2000,
      matched_kg: 1350,
      location: 'Hyderabad',
      district: 'Hyderabad',
      required_date: '2026-10-20',
      price_per_kg: 45.0,
      price_min: 42.0,
      price_max: 48.0,
      quality_requirements: 'Standard Grade, moisture <= 14%, clean whole grain',
      notes: 'Direct delivery to central warehouse in Ameerpet.',
      advance_percent: 70,
      status: 'OPEN',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    },
    {
      id: 'd2222222-2222-2222-2222-222222222222',
      buyer_id: 'a2222222-2222-2222-2222-222222222222',
      buyer_name: 'Secunderabad Hotel',
      product: 'Basmati',
      qty_kg: 500,
      matched_kg: 0,
      location: 'Secunderabad',
      district: 'Hyderabad',
      required_date: '2026-10-25',
      price_per_kg: 70.0,
      price_min: 65.0,
      price_max: 75.0,
      quality_requirements: 'Aromatic long grain, polished, moisture <= 12%',
      notes: 'Weekly fresh restaurant supply requirement.',
      advance_percent: 70,
      status: 'OPEN',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'd3333333-3333-3333-3333-333333333333',
      buyer_id: 'a3333333-3333-3333-3333-333333333333',
      buyer_name: 'Warangal Hostel',
      product: 'Standard Paddy',
      qty_kg: 5000,
      matched_kg: 0,
      location: 'Warangal',
      district: 'Warangal',
      required_date: '2026-11-01',
      price_per_kg: 38.0,
      price_min: 35.0,
      price_max: 40.0,
      quality_requirements: 'Standard bold grain suitable for bulk canteen cooking',
      notes: 'Government certified cooperative milling required.',
      advance_percent: 70,
      status: 'OPEN',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  contributions: [
    {
      id: 'c0000001-0000-0000-0000-000000000001',
      demand_id: 'd1111111-1111-1111-1111-111111111111',
      farmer_id: 'b1111111-1111-1111-1111-111111111111',
      farmer_name: 'Ramesh Goud',
      village: 'Dharmasagar',
      district: 'Warangal',
      qty_kg: 800,
      expected_harvest_date: '2026-10-14',
      moisture_percent: 13.5,
      grade: 'Grade A',
      notes: 'First field harvest plot #4',
      status: 'PLEDGED',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'c0000002-0000-0000-0000-000000000002',
      demand_id: 'd1111111-1111-1111-1111-111111111111',
      farmer_id: 'b2222222-2222-2222-2222-222222222222',
      farmer_name: 'Lakshmi Bai',
      village: 'Huzurabad',
      district: 'Karimnagar',
      qty_kg: 550,
      expected_harvest_date: '2026-10-15',
      moisture_percent: 14.0,
      grade: 'Grade A',
      notes: 'Rainfed second crop',
      status: 'PLEDGED',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  produce_lots: [],
  pickup_requests: [],
  processing_batches: [],
  batch_items: [],
  batch_verifications: [],
  trace_events: [
    {
      id: 'te-1',
      demand_id: 'd1111111-1111-1111-1111-111111111111',
      batch_id: null,
      produce_lot_id: null,
      event_type: 'DEMAND_POSTED',
      actor_role: 'buyer',
      actor_name: 'Hyderabad Supermarket',
      details: { product: 'Sona Masuri', qty_kg: 2000, price_per_kg: 45, location: 'Hyderabad' },
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'te-2',
      demand_id: 'd1111111-1111-1111-1111-111111111111',
      batch_id: null,
      produce_lot_id: null,
      event_type: 'PLEDGE_ADDED',
      actor_role: 'farmer',
      actor_name: 'Ramesh Goud',
      details: { pledged_qty_kg: 800, farmer_village: 'Dharmasagar', new_matched_kg: 800, remaining_kg: 1200 },
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'te-3',
      demand_id: 'd1111111-1111-1111-1111-111111111111',
      batch_id: null,
      produce_lot_id: null,
      event_type: 'PLEDGE_ADDED',
      actor_role: 'farmer',
      actor_name: 'Lakshmi Bai',
      details: { pledged_qty_kg: 550, farmer_village: 'Huzurabad', new_matched_kg: 1350, remaining_kg: 650 },
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  ledger_entries: [
    {
      id: 'led-1',
      farmer_id: 'b1111111-1111-1111-1111-111111111111',
      farmer_name: 'Ramesh Goud',
      demand_id: 'd1111111-1111-1111-1111-111111111111',
      contribution_id: 'c0000001-0000-0000-0000-000000000001',
      gross_amount: 36000.0,
      advance_amount: 25200.0,
      balance_amount: 10800.0,
      advance_status: 'ESTIMATED',
      balance_status: 'PENDING',
      note: 'Amounts are ledger estimates; no payment gateway is connected.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      released_at: null
    },
    {
      id: 'led-2',
      farmer_id: 'b2222222-2222-2222-2222-222222222222',
      farmer_name: 'Lakshmi Bai',
      demand_id: 'd1111111-1111-1111-1111-111111111111',
      contribution_id: 'c0000002-0000-0000-0000-000000000002',
      gross_amount: 24750.0,
      advance_amount: 17325.0,
      balance_amount: 7425.0,
      advance_status: 'ESTIMATED',
      balance_status: 'PENDING',
      note: 'Amounts are ledger estimates; no payment gateway is connected.',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      released_at: null
    }
  ],
  deliveries: []
};

class MockEngine {
  constructor() {
    this.listeners = new Set();
    this.data = this.loadData();
  }

  loadData() {
    if (typeof window === 'undefined') return JSON.parse(JSON.stringify(INITIAL_DATA));
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse local storage Sasyathra data:', e);
    }
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData(fresh);
    return fresh;
  }

  saveData(data) {
    this.data = data;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save Sasyathra local storage data:', e);
      }
    }
    this.notify();
  }

  resetDemoData() {
    const fresh = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData(fresh);
    return fresh;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.data);
      } catch (err) {
        console.error('Listener notification error:', err);
      }
    }
  }

  // --- QUERY METHODS ---
  getProfiles() {
    return this.data.profiles;
  }

  getProcessingUnits() {
    return this.data.processing_units;
  }

  getDemands() {
    return this.data.demands.map(d => {
      const contributions = this.data.contributions.filter(c => c.demand_id === d.id);
      const batches = this.data.processing_batches.filter(b => b.demand_id === d.id);
      return {
        ...d,
        contributions,
        processing_batches: batches
      };
    });
  }

  getContributions(farmerId = null) {
    let list = this.data.contributions;
    if (farmerId) {
      list = list.filter(c => c.farmer_id === farmerId);
    }
    return list.map(c => {
      const demand = this.data.demands.find(d => d.id === c.demand_id);
      const lot = this.data.produce_lots.find(l => l.contribution_id === c.id);
      return {
        ...c,
        demand,
        produce_lot: lot
      };
    });
  }

  getProduceLots(farmerId = null) {
    let list = this.data.produce_lots;
    if (farmerId) {
      list = list.filter(l => l.farmer_id === farmerId);
    }
    return list.map(l => {
      const demand = this.data.demands.find(d => d.id === l.demand_id);
      const pickup = this.data.pickup_requests.find(p => p.produce_lot_id === l.id);
      return {
        ...l,
        demand,
        pickup_request: pickup
      };
    });
  }

  getPickupRequests(unitId = null, farmerId = null) {
    let list = this.data.pickup_requests;
    if (unitId) {
      list = list.filter(p => p.processing_unit_id === unitId || !p.processing_unit_id);
    }
    if (farmerId) {
      list = list.filter(p => p.farmer_id === farmerId);
    }
    return list.map(p => {
      const lot = this.data.produce_lots.find(l => l.id === p.produce_lot_id);
      const demand = this.data.demands.find(d => d.id === p.demand_id);
      const unit = this.data.processing_units.find(u => u.id === p.processing_unit_id);
      return {
        ...p,
        produce_lot: lot,
        demand,
        processing_unit: unit
      };
    });
  }

  getProcessingBatches(unitId = null) {
    let list = this.data.processing_batches;
    if (unitId) {
      list = list.filter(b => b.processing_unit_id === unitId);
    }
    return list.map(b => {
      const demand = this.data.demands.find(d => d.id === b.demand_id);
      const unit = this.data.processing_units.find(u => u.id === b.processing_unit_id);
      const items = this.data.batch_items.filter(bi => bi.batch_id === b.id);
      const verifications = this.data.batch_verifications.filter(v => v.batch_id === b.id);
      return {
        ...b,
        demand,
        processing_unit: unit,
        items,
        verifications
      };
    });
  }

  getLedgerEntries(farmerId = null) {
    let list = this.data.ledger_entries;
    if (farmerId) {
      list = list.filter(l => l.farmer_id === farmerId);
    }
    return list.map(l => {
      const demand = this.data.demands.find(d => d.id === l.demand_id);
      return {
        ...l,
        demand
      };
    });
  }

  getTraceEvents(demandId = null, batchId = null) {
    let list = this.data.trace_events;
    if (demandId) {
      list = list.filter(t => t.demand_id === demandId);
    }
    if (batchId) {
      list = list.filter(t => t.batch_id === batchId);
    }
    return [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  // --- BUSINESS OPERATIONS / RPCs ---

  // 1. Post Demand (Section 8)
  postDemand({
    buyer_id,
    buyer_name,
    product,
    qty_kg,
    location,
    district,
    required_date,
    price_per_kg,
    price_min = 0,
    price_max = 0,
    quality_requirements = '',
    notes = ''
  }) {
    const qty = Number(qty_kg);
    const price = Number(price_per_kg);
    if (!qty || qty <= 0) throw new Error('Quantity must be greater than zero');
    if (price === undefined || price < 0) throw new Error('Price must be non-negative');
    if (!product || !location || !required_date) throw new Error('Paddy variety, location, and required date are required');

    const newDemand = {
      id: 'd-' + Math.random().toString(36).substring(2, 9) + Date.now(),
      buyer_id: buyer_id || 'a1111111-1111-1111-1111-111111111111',
      buyer_name: buyer_name || 'Verified Buyer',
      product: product.trim(),
      qty_kg: qty,
      matched_kg: 0,
      location: location.trim(),
      district: district || location.trim(),
      required_date,
      price_per_kg: price,
      price_min: Number(price_min) || price,
      price_max: Number(price_max) || price,
      quality_requirements,
      notes,
      advance_percent: 70,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newTrace = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: newDemand.id,
      batch_id: null,
      produce_lot_id: null,
      event_type: 'DEMAND_POSTED',
      actor_role: 'buyer',
      actor_name: newDemand.buyer_name,
      details: {
        product: newDemand.product,
        qty_kg: qty,
        price_per_kg: price,
        location: newDemand.location,
        required_date
      },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      demands: [newDemand, ...this.data.demands],
      trace_events: [...this.data.trace_events, newTrace]
    };
    this.saveData(updated);
    return newDemand;
  }

  // 2. Atomic Pledge Produce (Section 13, 14, 15)
  pledgeProduce({
    demand_id,
    farmer_id,
    farmer_name,
    village,
    district,
    qty_kg,
    expected_harvest_date = null,
    moisture_percent = null,
    grade = 'Standard Grade',
    notes = ''
  }) {
    const qty = Number(qty_kg);
    if (!qty || qty <= 0) throw new Error('Pledge quantity must be greater than zero');

    // 1. Row Lock & Validate Demand
    const demand = this.data.demands.find(d => d.id === demand_id);
    if (!demand) throw new Error('Demand not found');
    if (demand.status !== 'OPEN') {
      throw new Error(`This demand is not open for pledging (status: ${demand.status})`);
    }

    const remaining = demand.qty_kg - demand.matched_kg;

    // 2. Reject Over-Pledging strictly
    if (qty > remaining) {
      throw new Error(`Only ${remaining} kg is remaining for this demand.`);
    }

    const contributionId = 'c-' + Math.random().toString(36).substring(2, 9) + Date.now();
    const newContrib = {
      id: contributionId,
      demand_id,
      farmer_id: farmer_id || 'b1111111-1111-1111-1111-111111111111',
      farmer_name: farmer_name || 'Farmer',
      village: village || 'Local Village',
      district: district || 'Local District',
      qty_kg: qty,
      expected_harvest_date,
      moisture_percent: moisture_percent ? Number(moisture_percent) : 13.5,
      grade: grade || 'Grade A',
      notes,
      status: 'PLEDGED',
      created_at: new Date().toISOString()
    };

    const newMatched = demand.matched_kg + qty;
    const isFullyMatched = newMatched >= demand.qty_kg;

    // Ledger Calculation (70% advance, 30% balance)
    const gross = qty * demand.price_per_kg;
    const advance = Math.round(gross * 0.70 * 100) / 100;
    const balance = Math.round((gross - advance) * 100) / 100;

    const newLedger = {
      id: 'led-' + Math.random().toString(36).substring(2, 9),
      farmer_id: newContrib.farmer_id,
      farmer_name: newContrib.farmer_name,
      demand_id,
      contribution_id: contributionId,
      gross_amount: gross,
      advance_amount: advance,
      balance_amount: balance,
      advance_status: 'ESTIMATED',
      balance_status: 'PENDING',
      note: isFullyMatched
        ? 'Demand fully matched. Advance estimated in ledger.'
        : 'Pledge recorded. Awaiting full demand confirmation.',
      created_at: new Date().toISOString(),
      released_at: null
    };

    const newTracePledge = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id,
      batch_id: null,
      produce_lot_id: null,
      event_type: 'PLEDGE_ADDED',
      actor_role: 'farmer',
      actor_name: newContrib.farmer_name,
      details: {
        pledged_qty_kg: qty,
        farmer_village: newContrib.village,
        new_matched_kg: newMatched,
        remaining_kg: demand.qty_kg - newMatched
      },
      created_at: new Date().toISOString()
    };

    const updatedDemands = this.data.demands.map(d => {
      if (d.id === demand_id) {
        return {
          ...d,
          matched_kg: newMatched,
          status: isFullyMatched ? 'CONFIRMED' : 'OPEN',
          updated_at: new Date().toISOString()
        };
      }
      return d;
    });

    const traces = [...this.data.trace_events, newTracePledge];
    if (isFullyMatched) {
      traces.push({
        id: 'te-' + Math.random().toString(36).substring(2, 9),
        demand_id,
        batch_id: null,
        produce_lot_id: null,
        event_type: 'DEMAND_CONFIRMED',
        actor_role: 'system',
        actor_name: 'Sasyathra Engine',
        details: { total_qty_kg: demand.qty_kg, matched_kg: newMatched },
        created_at: new Date().toISOString()
      });
    }

    const updated = {
      ...this.data,
      demands: updatedDemands,
      contributions: [...this.data.contributions, newContrib],
      ledger_entries: [...this.data.ledger_entries, newLedger],
      trace_events: traces
    };

    this.saveData(updated);
    return {
      success: true,
      contribution: newContrib,
      is_confirmed: isFullyMatched,
      remaining_kg: demand.qty_kg - newMatched
    };
  }

  // 3. Report Harvest & Create Produce Lot (Section 18, 19, 20)
  reportHarvest({
    contribution_id,
    harvest_date,
    qty_kg,
    moisture_percent,
    grade,
    notes = ''
  }) {
    const contrib = this.data.contributions.find(c => c.id === contribution_id);
    if (!contrib) throw new Error('Pledge contribution not found');
    const demand = this.data.demands.find(d => d.id === contrib.demand_id);

    const qty = Number(qty_kg);
    if (!qty || qty <= 0) throw new Error('Harvested quantity must be greater than zero');

    const lotCount = this.data.produce_lots.length + 1;
    const year = new Date().getFullYear();
    const lotCode = `LOT-${year}-${String(lotCount).padStart(5, '0')}`;

    const newLot = {
      id: 'lot-' + Math.random().toString(36).substring(2, 9) + Date.now(),
      lot_code: lotCode,
      contribution_id,
      demand_id: contrib.demand_id,
      farmer_id: contrib.farmer_id,
      farmer_name: contrib.farmer_name,
      variety: demand ? demand.product : 'Paddy Grain',
      qty_kg: qty,
      harvest_date: harvest_date || new Date().toISOString().split('T')[0],
      village: contrib.village,
      district: contrib.district,
      moisture_percent: moisture_percent ? Number(moisture_percent) : 13.5,
      grade: grade || 'Grade A',
      verification_status: 'SELF_DECLARED',
      verification_tier: 'SELF_DECLARED',
      status: 'HARVESTED',
      notes,
      created_at: new Date().toISOString()
    };

    const updatedContribs = this.data.contributions.map(c => {
      if (c.id === contribution_id) {
        return { ...c, status: 'HARVESTED' };
      }
      return c;
    });

    const newTrace1 = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: contrib.demand_id,
      batch_id: null,
      produce_lot_id: newLot.id,
      event_type: 'HARVEST_REPORTED',
      actor_role: 'farmer',
      actor_name: contrib.farmer_name,
      details: { lot_code: lotCode, qty_kg: qty, grade, moisture: moisture_percent },
      created_at: new Date().toISOString()
    };

    const newTrace2 = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: contrib.demand_id,
      batch_id: null,
      produce_lot_id: newLot.id,
      event_type: 'LOT_CREATED',
      actor_role: 'farmer',
      actor_name: contrib.farmer_name,
      details: { lot_code: lotCode, qty_kg: qty },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      produce_lots: [...this.data.produce_lots, newLot],
      contributions: updatedContribs,
      trace_events: [...this.data.trace_events, newTrace1, newTrace2]
    };

    this.saveData(updated);
    return newLot;
  }

  // 4. Request Pickup (Section 21)
  requestPickup({
    produce_lot_id,
    pickup_location,
    preferred_date,
    notes = ''
  }) {
    const lot = this.data.produce_lots.find(l => l.id === produce_lot_id);
    if (!lot) throw new Error('Produce lot not found');

    const newPickup = {
      id: 'pk-' + Math.random().toString(36).substring(2, 9) + Date.now(),
      produce_lot_id,
      demand_id: lot.demand_id,
      farmer_id: lot.farmer_id,
      farmer_name: lot.farmer_name,
      processing_unit_id: null,
      pickup_location: pickup_location.trim(),
      requested_date: preferred_date,
      scheduled_date: null,
      vehicle_number: null,
      driver_name: null,
      driver_phone: null,
      status: 'REQUESTED',
      picked_up_at: null,
      received_at: null,
      notes,
      created_at: new Date().toISOString()
    };

    const updatedLots = this.data.produce_lots.map(l => {
      if (l.id === produce_lot_id) {
        return { ...l, status: 'PICKUP_REQUESTED' };
      }
      return l;
    });

    const newTrace = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: lot.demand_id,
      batch_id: null,
      produce_lot_id,
      event_type: 'PICKUP_REQUESTED',
      actor_role: 'farmer',
      actor_name: lot.farmer_name,
      details: { lot_code: lot.lot_code, location: pickup_location, date: preferred_date },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      pickup_requests: [...this.data.pickup_requests, newPickup],
      produce_lots: updatedLots,
      trace_events: [...this.data.trace_events, newTrace]
    };

    this.saveData(updated);
    return newPickup;
  }

  // 5. Assign Pickup (Section 22)
  assignPickup({
    pickup_request_id,
    unit_id,
    scheduled_date,
    vehicle_number,
    driver_name,
    driver_phone
  }) {
    const req = this.data.pickup_requests.find(p => p.id === pickup_request_id);
    if (!req) throw new Error('Pickup request not found');
    const lot = this.data.produce_lots.find(l => l.id === req.produce_lot_id);

    const updatedPickups = this.data.pickup_requests.map(p => {
      if (p.id === pickup_request_id) {
        return {
          ...p,
          processing_unit_id: unit_id,
          scheduled_date,
          vehicle_number,
          driver_name,
          driver_phone,
          status: 'SCHEDULED'
        };
      }
      return p;
    });

    const newTrace = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: req.demand_id,
      batch_id: null,
      produce_lot_id: req.produce_lot_id,
      event_type: 'PICKUP_ASSIGNED',
      actor_role: 'cooperative',
      actor_name: 'Logistics Desk',
      details: {
        lot_code: lot ? lot.lot_code : '',
        vehicle_number,
        driver_name,
        scheduled_date
      },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      pickup_requests: updatedPickups,
      trace_events: [...this.data.trace_events, newTrace]
    };

    this.saveData(updated);
  }

  // 6. Mark Picked Up
  markPickedUp({ pickup_request_id }) {
    const req = this.data.pickup_requests.find(p => p.id === pickup_request_id);
    if (!req) throw new Error('Pickup request not found');
    const lot = this.data.produce_lots.find(l => l.id === req.produce_lot_id);

    const updatedPickups = this.data.pickup_requests.map(p => {
      if (p.id === pickup_request_id) {
        return { ...p, status: 'PICKED_UP', picked_up_at: new Date().toISOString() };
      }
      return p;
    });

    const updatedLots = this.data.produce_lots.map(l => {
      if (l.id === req.produce_lot_id) {
        return { ...l, status: 'PICKED_UP' };
      }
      return l;
    });

    const newTrace = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: req.demand_id,
      batch_id: null,
      produce_lot_id: req.produce_lot_id,
      event_type: 'PICKED_UP',
      actor_role: 'cooperative',
      actor_name: req.driver_name || 'Logistics Driver',
      details: { lot_code: lot ? lot.lot_code : '', vehicle_number: req.vehicle_number },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      pickup_requests: updatedPickups,
      produce_lots: updatedLots,
      trace_events: [...this.data.trace_events, newTrace]
    };

    this.saveData(updated);
  }

  // 7. Confirm Receipt at Cooperative (Section 24)
  confirmReceived({
    pickup_request_id,
    received_qty_kg,
    received_date,
    condition_note = ''
  }) {
    const req = this.data.pickup_requests.find(p => p.id === pickup_request_id);
    if (!req) throw new Error('Pickup request not found');
    const lot = this.data.produce_lots.find(l => l.id === req.produce_lot_id);

    const receivedQty = received_qty_kg ? Number(received_qty_kg) : (lot ? lot.qty_kg : 0);

    const updatedPickups = this.data.pickup_requests.map(p => {
      if (p.id === pickup_request_id) {
        return {
          ...p,
          status: 'RECEIVED',
          received_at: new Date().toISOString(),
          notes: p.notes ? `${p.notes} | ${condition_note}` : condition_note
        };
      }
      return p;
    });

    const updatedLots = this.data.produce_lots.map(l => {
      if (l.id === req.produce_lot_id) {
        return {
          ...l,
          status: 'RECEIVED',
          qty_kg: receivedQty,
          verification_status: 'COOPERATIVE_VERIFIED',
          verification_tier: 'COOPERATIVE_VERIFIED'
        };
      }
      return l;
    });

    const newTrace = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: req.demand_id,
      batch_id: null,
      produce_lot_id: req.produce_lot_id,
      event_type: 'RECEIVED',
      actor_role: 'cooperative',
      actor_name: 'Cooperative Receiving Supervisor',
      details: {
        lot_code: lot ? lot.lot_code : '',
        received_qty_kg: receivedQty,
        condition_note,
        received_date: received_date || new Date().toISOString().split('T')[0]
      },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      pickup_requests: updatedPickups,
      produce_lots: updatedLots,
      trace_events: [...this.data.trace_events, newTrace]
    };

    this.saveData(updated);
  }

  // 8. Processing Capacity Check (Section 26)
  checkCapacity(unit_id, date) {
    const unit = this.data.processing_units.find(u => u.id === unit_id);
    if (!unit) throw new Error('Processing unit not found');

    const scheduledToday = this.data.processing_batches
      .filter(b => b.processing_unit_id === unit_id && b.processing_date === date && b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + (Number(b.input_qty_kg) || 0), 0);

    const available = unit.daily_capacity_kg - scheduledToday;
    return {
      daily_capacity_kg: unit.daily_capacity_kg,
      scheduled_kg: scheduledToday,
      available_kg: Math.max(0, available)
    };
  }

  // 9. Schedule Processing Batch (Section 25, 26, 27, 28)
  scheduleProcessingBatch({
    demand_id,
    unit_id,
    processing_date,
    lot_ids,
    operator_name = 'Milling Supervisor',
    notes = ''
  }) {
    const unit = this.data.processing_units.find(u => u.id === unit_id);
    if (!unit) throw new Error('Processing unit not found');

    if (!lot_ids || lot_ids.length === 0) {
      throw new Error('Please select at least one produce lot for this processing batch');
    }

    const selectedLots = this.data.produce_lots.filter(l => lot_ids.includes(l.id));
    const totalInputKg = selectedLots.reduce((sum, l) => sum + Number(l.qty_kg), 0);

    // Capacity check
    const capacityInfo = this.checkCapacity(unit_id, processing_date);
    if (totalInputKg > capacityInfo.available_kg) {
      throw new Error(
        `Capacity exceeded for ${processing_date}: Unit has ${capacityInfo.daily_capacity_kg} kg daily capacity, ` +
        `${capacityInfo.scheduled_kg} kg already scheduled, ${capacityInfo.available_kg} kg available. ` +
        `Attempted to schedule ${totalInputKg} kg.`
      );
    }

    const batchCount = this.data.processing_batches.length + 1;
    const year = new Date().getFullYear();
    const batchCode = `BATCH-${year}-${String(batchCount).padStart(5, '0')}`;

    const batchId = 'bt-' + Math.random().toString(36).substring(2, 9) + Date.now();
    const newBatch = {
      id: batchId,
      batch_code: batchCode,
      demand_id,
      processing_unit_id: unit_id,
      processing_date,
      input_qty_kg: totalInputKg,
      output_qty_kg: null,
      operator_name,
      notes,
      status: 'SCHEDULED',
      created_at: new Date().toISOString(),
      completed_at: null
    };

    // Multi-farmer batch junction items
    const newBatchItems = selectedLots.map(l => ({
      id: 'bi-' + Math.random().toString(36).substring(2, 9),
      batch_id: batchId,
      produce_lot_id: l.id,
      farmer_id: l.farmer_id,
      farmer_name: l.farmer_name,
      qty_kg: l.qty_kg,
      created_at: new Date().toISOString()
    }));

    const updatedLots = this.data.produce_lots.map(l => {
      if (lot_ids.includes(l.id)) {
        return { ...l, status: 'BATCHED' };
      }
      return l;
    });

    const updatedDemands = this.data.demands.map(d => {
      if (d.id === demand_id) {
        return { ...d, status: 'PROCESSING', updated_at: new Date().toISOString() };
      }
      return d;
    });

    const trace1 = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id,
      batch_id: batchId,
      produce_lot_id: null,
      event_type: 'PROCESSING_SCHEDULED',
      actor_role: 'cooperative',
      actor_name: operator_name,
      details: {
        batch_code: batchCode,
        processing_unit: unit.name,
        processing_date,
        input_qty_kg: totalInputKg,
        lot_count: lot_ids.length
      },
      created_at: new Date().toISOString()
    };

    const trace2 = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id,
      batch_id: batchId,
      produce_lot_id: null,
      event_type: 'BATCH_CREATED',
      actor_role: 'cooperative',
      actor_name: operator_name,
      details: { batch_code: batchCode, total_kg: totalInputKg },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      processing_batches: [...this.data.processing_batches, newBatch],
      batch_items: [...this.data.batch_items, ...newBatchItems],
      produce_lots: updatedLots,
      demands: updatedDemands,
      trace_events: [...this.data.trace_events, trace1, trace2]
    };

    this.saveData(updated);
    return newBatch;
  }

  // 10. Update Processing Batch Status (Section 29, 30)
  updateBatchStatus({
    batch_id,
    new_status,
    output_qty_kg = null,
    operator_name = null,
    notes = ''
  }) {
    const batch = this.data.processing_batches.find(b => b.id === batch_id);
    if (!batch) throw new Error('Processing batch not found');
    const unit = this.data.processing_units.find(u => u.id === batch.processing_unit_id);

    const traces = [...this.data.trace_events];

    const updatedBatches = this.data.processing_batches.map(b => {
      if (b.id === batch_id) {
        const item = { ...b, status: new_status };
        if (operator_name) item.operator_name = operator_name;
        if (notes) item.notes = b.notes ? `${b.notes} | ${notes}` : notes;

        if (new_status === 'PROCESSED') {
          item.output_qty_kg = output_qty_kg ? Number(output_qty_kg) : Math.round(b.input_qty_kg * 0.68);
          item.completed_at = new Date().toISOString();
        }
        return item;
      }
      return b;
    });

    let updatedDemands = this.data.demands;

    if (new_status === 'PROCESSING') {
      traces.push({
        id: 'te-' + Math.random().toString(36).substring(2, 9),
        demand_id: batch.demand_id,
        batch_id,
        produce_lot_id: null,
        event_type: 'PROCESSING_STARTED',
        actor_role: 'cooperative',
        actor_name: operator_name || 'Milling Operator',
        details: { batch_code: batch.batch_code, mill: unit ? unit.name : '' },
        created_at: new Date().toISOString()
      });
    } else if (new_status === 'PROCESSED') {
      const outKg = output_qty_kg ? Number(output_qty_kg) : Math.round(batch.input_qty_kg * 0.68);
      traces.push({
        id: 'te-' + Math.random().toString(36).substring(2, 9),
        demand_id: batch.demand_id,
        batch_id,
        produce_lot_id: null,
        event_type: 'PROCESSING_COMPLETED',
        actor_role: 'cooperative',
        actor_name: operator_name || 'Milling Operator',
        details: {
          batch_code: batch.batch_code,
          input_qty_kg: batch.input_qty_kg,
          output_qty_kg: outKg,
          milling_recovery: `${Math.round((outKg / batch.input_qty_kg) * 100)}%`
        },
        created_at: new Date().toISOString()
      });
    } else if (new_status === 'READY_FOR_DELIVERY') {
      updatedDemands = this.data.demands.map(d => {
        if (d.id === batch.demand_id) {
          return { ...d, status: 'READY', updated_at: new Date().toISOString() };
        }
        return d;
      });

      traces.push({
        id: 'te-' + Math.random().toString(36).substring(2, 9),
        demand_id: batch.demand_id,
        batch_id,
        produce_lot_id: null,
        event_type: 'READY_FOR_DELIVERY',
        actor_role: 'cooperative',
        actor_name: operator_name || 'Fulfillment Desk',
        details: { batch_code: batch.batch_code, output_qty_kg: batch.output_qty_kg || batch.input_qty_kg },
        created_at: new Date().toISOString()
      });
    }

    const updated = {
      ...this.data,
      processing_batches: updatedBatches,
      demands: updatedDemands,
      trace_events: traces
    };

    this.saveData(updated);
  }

  // 11. Add Batch Quality Verification (Section 20, 47)
  addBatchVerification({
    batch_id,
    tier = 'COOPERATIVE_VERIFIED',
    status = 'VERIFIED',
    note = '',
    evidence_url = '',
    verified_by = 'Cooperative Quality Officer'
  }) {
    const batch = this.data.processing_batches.find(b => b.id === batch_id);
    if (!batch) throw new Error('Processing batch not found');

    const newVerif = {
      id: 'bv-' + Math.random().toString(36).substring(2, 9),
      batch_id,
      tier,
      status,
      note,
      evidence_url,
      verified_by,
      verified_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const newTrace = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id: batch.demand_id,
      batch_id,
      produce_lot_id: null,
      event_type: 'VERIFIED',
      actor_role: 'cooperative',
      actor_name: verified_by,
      details: { tier, status, note, evidence_url },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      batch_verifications: [...this.data.batch_verifications, newVerif],
      trace_events: [...this.data.trace_events, newTrace]
    };

    this.saveData(updated);
    return newVerif;
  }

  // 12. Mark Delivered & Release Farmer Balance in Ledger (Section 37, 38)
  markDelivered({
    demand_id,
    batch_id = null,
    delivered_qty = null,
    receiver_name,
    notes = ''
  }) {
    const demand = this.data.demands.find(d => d.id === demand_id);
    if (!demand) throw new Error('Demand not found');

    const batch = batch_id ? this.data.processing_batches.find(b => b.id === batch_id) : null;
    const finalDeliveredQty = delivered_qty
      ? Number(delivered_qty)
      : (batch ? (batch.output_qty_kg || batch.input_qty_kg) : demand.qty_kg);

    const newDelivery = {
      id: 'del-' + Math.random().toString(36).substring(2, 9) + Date.now(),
      demand_id,
      batch_id,
      buyer_id: demand.buyer_id,
      delivered_quantity: finalDeliveredQty,
      receiver_name: receiver_name || 'Buyer Warehouse Receiver',
      delivered_at: new Date().toISOString(),
      notes,
      status: 'DELIVERED',
      created_at: new Date().toISOString()
    };

    // 1. Update Demand & Batch status
    const updatedDemands = this.data.demands.map(d => {
      if (d.id === demand_id) {
        return { ...d, status: 'DELIVERED', updated_at: new Date().toISOString() };
      }
      return d;
    });

    const updatedBatches = this.data.processing_batches.map(b => {
      if (b.demand_id === demand_id) {
        return { ...b, status: 'DELIVERED', completed_at: new Date().toISOString() };
      }
      return b;
    });

    // 2. ATOMIC RELEASE OF FARMER BALANCE in Ledger (Section 38)
    let releasedCount = 0;
    const updatedLedger = this.data.ledger_entries.map(l => {
      if (l.demand_id === demand_id && l.balance_status === 'PENDING') {
        releasedCount++;
        return {
          ...l,
          balance_status: 'RELEASED',
          advance_status: 'AVAILABLE',
          released_at: new Date().toISOString(),
          note: 'Balance released in Sasyathra ledger upon buyer delivery confirmation. Actual payment integration is not connected.'
        };
      }
      return l;
    });

    // 3. Log trace event
    const newTrace = {
      id: 'te-' + Math.random().toString(36).substring(2, 9),
      demand_id,
      batch_id,
      produce_lot_id: null,
      event_type: 'DELIVERED',
      actor_role: 'cooperative',
      actor_name: receiver_name || 'Buyer Receiver',
      details: {
        delivered_quantity: finalDeliveredQty,
        receiver: receiver_name,
        farmers_settled: releasedCount,
        disclaimer: 'Balance released in Sasyathra ledger. Actual payment integration is not connected.'
      },
      created_at: new Date().toISOString()
    };

    const updated = {
      ...this.data,
      demands: updatedDemands,
      processing_batches: updatedBatches,
      deliveries: [...this.data.deliveries, newDelivery],
      ledger_entries: updatedLedger,
      trace_events: [...this.data.trace_events, newTrace]
    };

    this.saveData(updated);
    return {
      success: true,
      delivery: newDelivery,
      settled_farmers_count: releasedCount
    };
  }

  // 13. Public Batch Traceability (Section 34 - No Login Needed, Sanitized)
  getBatchTrace(batchCode) {
    const batch = this.data.processing_batches.find(b => b.batch_code.toUpperCase() === batchCode.toUpperCase().trim());
    if (!batch) return { found: false };

    const demand = this.data.demands.find(d => d.id === batch.demand_id);
    const unit = this.data.processing_units.find(u => u.id === batch.processing_unit_id);
    const batchItems = this.data.batch_items.filter(bi => bi.batch_id === batch.id);

    // Sanitized lots (protects farmer privacy: NO phone, NO email, NO private address)
    const lots = batchItems.map(item => {
      const lot = this.data.produce_lots.find(l => l.id === item.produce_lot_id);
      return {
        lot_code: lot ? lot.lot_code : 'LOT-UNKNOWN',
        farmer_alias: item.farmer_name,
        village: lot ? lot.village : 'Village',
        district: lot ? lot.district : 'District',
        variety: lot ? lot.variety : (demand ? demand.product : 'Paddy'),
        qty_kg: item.qty_kg,
        harvest_date: lot ? lot.harvest_date : null,
        grade: lot ? lot.grade : 'Grade A',
        moisture_percent: lot ? lot.moisture_percent : null,
        verification_status: lot ? lot.verification_status : 'COOPERATIVE_VERIFIED'
      };
    });

    const verifications = this.data.batch_verifications.filter(v => v.batch_id === batch.id);
    const timeline = this.data.trace_events
      .filter(t => t.batch_id === batch.id || t.demand_id === batch.demand_id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return {
      found: true,
      batch: {
        batch_code: batch.batch_code,
        processing_date: batch.processing_date,
        input_qty_kg: batch.input_qty_kg,
        output_qty_kg: batch.output_qty_kg,
        status: batch.status,
        created_at: batch.created_at,
        completed_at: batch.completed_at
      },
      product: demand ? demand.product : 'Paddy Grain',
      buyer_destination: demand ? demand.location : 'Destination Hub',
      processing_unit: unit ? {
        name: unit.name,
        village: unit.village,
        district: unit.district,
        daily_capacity_kg: unit.daily_capacity_kg,
        processing_type: unit.processing_type
      } : null,
      lots,
      verifications,
      timeline
    };
  }
}

export const mockEngine = new MockEngine();
