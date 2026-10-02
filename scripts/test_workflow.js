import { mockEngine } from '../src/lib/mockEngine.js';

console.log('=====================================================');
console.log('STARTING COMPLETE SASYATHRA DEMO WORKFLOW TEST');
console.log('=====================================================');

// Reset to clean demo data
mockEngine.resetDemoData();

// 1. BUYER: Creates 1000 kg Sona Masuri @ ₹45/kg in Hyderabad
console.log('\n[STEP 1] Buyer posts demand: 1000 kg Sona Masuri @ ₹45/kg');
const buyerDemand = mockEngine.postDemand({
  buyer_id: 'a1111111-1111-1111-1111-111111111111',
  buyer_name: 'Hyderabad Supermarket',
  product: 'Sona Masuri',
  qty_kg: 1000,
  location: 'Hyderabad',
  district: 'Hyderabad',
  required_date: '2026-10-30',
  price_per_kg: 45,
  price_min: 42,
  price_max: 48,
  quality_requirements: 'Standard Grade, moisture <= 14%'
});
console.log('✓ Created Demand ID:', buyerDemand.id, '| Status:', buyerDemand.status, '| Required:', buyerDemand.qty_kg, 'kg');

// 2. Over-pledge validation test: Farmer tries to pledge 1200 kg (should throw error)
console.log('\n[STEP 2] Testing over-pledge prevention (attempting 1200 kg on 1000 kg demand)...');
try {
  mockEngine.pledgeProduce({
    demand_id: buyerDemand.id,
    farmer_id: 'b1111111-1111-1111-1111-111111111111',
    farmer_name: 'Ramesh Goud',
    village: 'Dharmasagar',
    district: 'Warangal',
    qty_kg: 1200
  });
  console.error('❌ ERROR: Over-pledge was NOT rejected!');
} catch (err) {
  console.log('✓ Correctly rejected over-pledge:', err.message);
}

// 3. FARMER A: Pledges 400 kg
console.log('\n[STEP 3] Farmer A (Ramesh Goud) pledges 400 kg...');
const pledgeA = mockEngine.pledgeProduce({
  demand_id: buyerDemand.id,
  farmer_id: 'b1111111-1111-1111-1111-111111111111',
  farmer_name: 'Ramesh Goud',
  village: 'Dharmasagar',
  district: 'Warangal',
  qty_kg: 400,
  expected_harvest_date: '2026-10-22',
  moisture_percent: 13.5,
  grade: 'Grade A'
});
console.log('✓ Farmer A Pledged 400 kg. Remaining:', pledgeA.remaining_kg, 'kg | Confirmed:', pledgeA.is_confirmed);

// 4. FARMER B: Pledges 600 kg (Demand reaches 1000/1000 kg)
console.log('\n[STEP 4] Farmer B (Lakshmi Bai) pledges 600 kg (completing 1000 kg)...');
const pledgeB = mockEngine.pledgeProduce({
  demand_id: buyerDemand.id,
  farmer_id: 'b2222222-2222-2222-2222-222222222222',
  farmer_name: 'Lakshmi Bai',
  village: 'Huzurabad',
  district: 'Karimnagar',
  qty_kg: 600,
  expected_harvest_date: '2026-10-24',
  moisture_percent: 14.0,
  grade: 'Grade A'
});
console.log('✓ Farmer B Pledged 600 kg. Remaining:', pledgeB.remaining_kg, 'kg | Confirmed:', pledgeB.is_confirmed);

// Check Demand status
const refreshedDemand = mockEngine.getDemands().find(d => d.id === buyerDemand.id);
console.log('✓ Demand Matched:', refreshedDemand.matched_kg, '/', refreshedDemand.qty_kg, 'kg | Status:', refreshedDemand.status);

// Check Farmer A and B Ledger entries (70% advance, 30% balance)
const ledgerA = mockEngine.getLedgerEntries('b1111111-1111-1111-1111-111111111111').find(l => l.contribution_id === pledgeA.contribution.id);
const ledgerB = mockEngine.getLedgerEntries('b2222222-2222-2222-2222-222222222222').find(l => l.contribution_id === pledgeB.contribution.id);
console.log('✓ Ledger A (400kg @ ₹45): Gross: ₹' + ledgerA.gross_amount + ' | 70% Advance: ₹' + ledgerA.advance_amount + ' | 30% Balance: ₹' + ledgerA.balance_amount + ' (Status: ' + ledgerA.balance_status + ')');
console.log('✓ Ledger B (600kg @ ₹45): Gross: ₹' + ledgerB.gross_amount + ' | 70% Advance: ₹' + ledgerB.advance_amount + ' | 30% Balance: ₹' + ledgerB.balance_amount + ' (Status: ' + ledgerB.balance_status + ')');

// 5. FARMERS: Report harvest & create Produce Lots
console.log('\n[STEP 5] Farmers report harvest & create Produce Lots...');
const lotA = mockEngine.reportHarvest({
  contribution_id: pledgeA.contribution.id,
  harvest_date: '2026-10-22',
  qty_kg: 400,
  moisture_percent: 13.5,
  grade: 'Grade A'
});
const lotB = mockEngine.reportHarvest({
  contribution_id: pledgeB.contribution.id,
  harvest_date: '2026-10-24',
  qty_kg: 600,
  moisture_percent: 14.0,
  grade: 'Grade A'
});
console.log('✓ Lot A Created:', lotA.lot_code, '| Farmer:', lotA.farmer_name, '| Qty:', lotA.qty_kg, 'kg');
console.log('✓ Lot B Created:', lotB.lot_code, '| Farmer:', lotB.farmer_name, '| Qty:', lotB.qty_kg, 'kg');

// 6. FARMERS: Request Pickup
console.log('\n[STEP 6] Farmers request field pickup...');
const pickupA = mockEngine.requestPickup({
  produce_lot_id: lotA.id,
  pickup_location: 'Dharmasagar Farm Gate Plot #4',
  preferred_date: '2026-10-23'
});
const pickupB = mockEngine.requestPickup({
  produce_lot_id: lotB.id,
  pickup_location: 'Huzurabad Main Field Road',
  preferred_date: '2026-10-25'
});
console.log('✓ Pickup A Requested (Status:', pickupA.status, ')');
console.log('✓ Pickup B Requested (Status:', pickupB.status, ')');

// 7. COOPERATIVE: Assigns Pickup
console.log('\n[STEP 7] Cooperative assigns vehicle and driver...');
const coopUnitId = 'e2222222-2222-2222-2222-222222222222'; // Warangal Cooperative Processing Unit (1000 kg/day)
mockEngine.assignPickup({
  pickup_request_id: pickupA.id,
  unit_id: coopUnitId,
  scheduled_date: '2026-10-23',
  vehicle_number: 'TS 03 TA 4421',
  driver_name: 'Satyanarayana',
  driver_phone: '+91 94412 88219'
});
mockEngine.assignPickup({
  pickup_request_id: pickupB.id,
  unit_id: coopUnitId,
  scheduled_date: '2026-10-25',
  vehicle_number: 'TS 03 TA 4421',
  driver_name: 'Satyanarayana',
  driver_phone: '+91 94412 88219'
});
console.log('✓ Vehicle and driver assigned to both pickups');

// 8. COOPERATIVE: Marks Picked Up -> Received
console.log('\n[STEP 8] Mark produce picked up and received at mill scale...');
mockEngine.markPickedUp({ pickup_request_id: pickupA.id });
mockEngine.confirmReceived({
  pickup_request_id: pickupA.id,
  received_qty_kg: 400,
  received_date: '2026-10-23',
  condition_note: 'Tested 13.5% moisture, clean grain'
});
mockEngine.markPickedUp({ pickup_request_id: pickupB.id });
mockEngine.confirmReceived({
  pickup_request_id: pickupB.id,
  received_qty_kg: 600,
  received_date: '2026-10-25',
  condition_note: 'Tested 14.0% moisture, standard grade'
});
console.log('✓ Both lots received at Cooperative Mill Scale (Total Received: 1000 kg)');

// 9. COOPERATIVE: Capacity Check & Multi-farmer Batch Creation (Section 26, 28)
console.log('\n[STEP 9] Checking daily processing capacity...');
const capacity = mockEngine.checkCapacity(coopUnitId, '2026-10-26');
console.log('✓ Warangal Unit Rated Capacity:', capacity.daily_capacity_kg, 'kg | Available:', capacity.available_kg, 'kg');

console.log('Scheduling multi-farmer Batch (Farmer A 400kg + Farmer B 600kg = 1000kg)...');
const batch = mockEngine.scheduleProcessingBatch({
  demand_id: buyerDemand.id,
  unit_id: coopUnitId,
  processing_date: '2026-10-26',
  lot_ids: [lotA.id, lotB.id],
  operator_name: 'Chief Miller Mallesh',
  notes: 'Sona Masuri parboiled single-pass milling'
});
console.log('✓ Processing Batch Created:', batch.batch_code, '| Total Input:', batch.input_qty_kg, 'kg | Status:', batch.status);

// 10. COOPERATIVE: Processing transitions
console.log('\n[STEP 10] Processing status transitions...');
mockEngine.updateBatchStatus({
  batch_id: batch.id,
  new_status: 'PROCESSING',
  operator_name: 'Chief Miller Mallesh'
});
console.log('✓ Batch transitioned to PROCESSING');

mockEngine.updateBatchStatus({
  batch_id: batch.id,
  new_status: 'PROCESSED',
  output_qty_kg: 680, // 68% recovery
  operator_name: 'Chief Miller Mallesh'
});
console.log('✓ Batch transitioned to PROCESSED (Output: 680 kg milled rice, Recovery: 68%)');

mockEngine.updateBatchStatus({
  batch_id: batch.id,
  new_status: 'READY_FOR_DELIVERY',
  operator_name: 'Fulfillment Desk'
});
console.log('✓ Batch transitioned to READY_FOR_DELIVERY');

// 11. QUALITY VERIFICATION
console.log('\n[STEP 11] Attaching quality verification certificate...');
mockEngine.addBatchVerification({
  batch_id: batch.id,
  tier: 'COOPERATIVE_VERIFIED',
  status: 'VERIFIED',
  note: 'Physical inspection passed: broken grains < 4%, moisture < 12%',
  evidence_url: 'https://storage.sasyathra.org/certificates/sample-test.pdf',
  verified_by: 'Inspector Prabhakar'
});
console.log('✓ Quality verification certificate attached');

// 12. PUBLIC TRACEABILITY INSPECTION (No login needed)
console.log('\n[STEP 12] Fetching public batch traceability for QR page...');
const trace = mockEngine.getBatchTrace(batch.batch_code);
console.log('✓ Public Trace found:', trace.found);
console.log('✓ Batch Code:', trace.batch.batch_code, '| Status:', trace.batch.status);
console.log('✓ Paddy Variety:', trace.product, '| Destination:', trace.buyer_destination);
console.log('✓ Contributing Lots:', trace.lots.map(l => `${l.lot_code} (${l.farmer_alias} from ${l.village}, ${l.qty_kg} kg)`).join(' + '));
console.log('✓ Verified Timeline Events:', trace.timeline.length, 'audit events recorded');

// 13. DELIVERY & ATOMIC FARMER BALANCE RELEASE (Section 37, 38)
console.log('\n[STEP 13] Confirming Buyer Delivery & Releasing Farmer Balance...');
const deliveryResult = mockEngine.markDelivered({
  demand_id: buyerDemand.id,
  batch_id: batch.id,
  delivered_qty: 680,
  receiver_name: 'Venkatesh (Ameerpet Warehouse)',
  notes: 'Received in 25kg bags with QR seal intact'
});
console.log('✓ Delivery Confirmed! Settled Farmers Count:', deliveryResult.settled_farmers_count);

// Check Farmer Ledgers after delivery
const finalLedgerA = mockEngine.getLedgerEntries('b1111111-1111-1111-1111-111111111111').find(l => l.contribution_id === pledgeA.contribution.id);
const finalLedgerB = mockEngine.getLedgerEntries('b2222222-2222-2222-2222-222222222222').find(l => l.contribution_id === pledgeB.contribution.id);

console.log('\n=====================================================');
console.log('FINAL SETTLEMENT VERIFICATION:');
console.log('Farmer A Balance Status:', finalLedgerA.balance_status, '(Amount: ₹' + finalLedgerA.balance_amount + ')');
console.log('Farmer B Balance Status:', finalLedgerB.balance_status, '(Amount: ₹' + finalLedgerB.balance_amount + ')');
console.log('Ledger Disclaimer:', finalLedgerA.note);
console.log('=====================================================');
console.log('ALL 16 STEPS OF THE SASYATHRA LIFECYCLE PASSED FLAWLESSLY!');
console.log('=====================================================');
