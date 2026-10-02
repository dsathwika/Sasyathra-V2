import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import {
  Factory,
  Truck,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  AlertCircle,
  FileCheck2,
  QrCode,
  ArrowRight,
  ExternalLink,
  Upload,
  UserCheck,
  PackageCheck,
  Scale,
  Award
} from 'lucide-react';
import { sasyathraService } from '../lib/sasyathraService';

export default function CooperativePortal({
  processingUnits = [],
  pickupRequests = [],
  produceLots = [],
  demands = [],
  processingBatches = [],
  onOpenTrace
}) {
  const [selectedUnitId, setSelectedUnitId] = useState(
    processingUnits[0]?.id || 'e2222222-2222-2222-2222-222222222222'
  );
  const [activeDesk, setActiveDesk] = useState('milling'); // 'pickup' | 'receiving' | 'milling' | 'verification' | 'delivery'

  const activeUnit = processingUnits.find((u) => u.id === selectedUnitId) || processingUnits[0];

  // Modals state
  const [assignPickupTarget, setAssignPickupTarget] = useState(null);
  const [assignForm, setAssignForm] = useState({
    scheduled_date: new Date().toISOString().split('T')[0],
    vehicle_number: 'TS 03 TA 4421',
    driver_name: 'Satyanarayana (FPO Logistics)',
    driver_phone: '+91 94412 88219'
  });

  const [receiveTarget, setReceiveTarget] = useState(null);
  const [receiveForm, setReceiveForm] = useState({
    received_qty_kg: '',
    received_date: new Date().toISOString().split('T')[0],
    condition_note: 'Moisture tested 13.8%, good grain color, no insect infestation'
  });

  // Batch Creation Form (Multi-farmer Section 28)
  const [selectedDemandId, setSelectedDemandId] = useState('');
  const [selectedLotIds, setSelectedLotIds] = useState([]);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchOperator, setBatchOperator] = useState('Cooperative Chief Miller');
  const [batchNotes, setBatchNotes] = useState('Parboiled 4-hour cycle, single rubber-roller dehusking');

  // Milling completion form
  const [millCompleteTarget, setMillCompleteTarget] = useState(null);
  const [outputQty, setOutputQty] = useState('');

  // Delivery Modal
  const [deliveryTargetBatch, setDeliveryTargetBatch] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({
    delivered_qty: '',
    receiver_name: 'Buyer Receiving Officer',
    notes: 'Delivered in 25kg branded Sasyathra jute sacks with batch QR seal.'
  });

  // Verification Modal
  const [verifTargetBatch, setVerifTargetBatch] = useState(null);
  const [verifForm, setVerifForm] = useState({
    tier: 'COOPERATIVE_VERIFIED',
    status: 'VERIFIED',
    note: 'Tested for moisture, broken rice ratio < 4%, husk separation complete.',
    evidence_url: 'https://storage.sasyathra.org/certificates/coop-lab-verified-sample.pdf',
    verified_by: 'Warangal FPO Quality Inspector'
  });

  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Available Capacity Calculation (Section 26)
  const capacityInfo = activeUnit
    ? sasyathraService.checkCapacity(activeUnit.id, batchDate)
    : { daily_capacity_kg: 1000, scheduled_kg: 0, available_kg: 1000 };

  // Received lots ready for milling
  const receivedLots = produceLots.filter((l) => l.status === 'RECEIVED');

  // Filter batches for this unit
  const unitBatches = processingBatches.filter(
    (b) => !activeUnit?.id || b.processing_unit_id === activeUnit.id
  );

  // Handlers
  const handleAssignPickup = async (e) => {
    e.preventDefault();
    if (!assignPickupTarget) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await sasyathraService.assignPickup({
        pickup_request_id: assignPickupTarget.id,
        unit_id: activeUnit.id,
        ...assignForm
      });
      setActionSuccess('Pickup scheduled and driver assigned.');
      setAssignPickupTarget(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkPickedUp = async (pickupId) => {
    setLoadingAction(true);
    setActionError(null);
    try {
      await sasyathraService.markPickedUp({ pickup_request_id: pickupId });
      setActionSuccess('Produce marked as Picked Up from farm.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmReceived = async (e) => {
    e.preventDefault();
    if (!receiveTarget) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await sasyathraService.confirmReceived({
        pickup_request_id: receiveTarget.id,
        received_qty_kg: receiveForm.received_qty_kg || receiveTarget.produce_lot?.qty_kg,
        received_date: receiveForm.received_date,
        condition_note: receiveForm.condition_note
      });
      setActionSuccess('Produce receipt confirmed! Produce lot is now available for Batch Milling.');
      setReceiveTarget(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!selectedDemandId) {
      setActionError('Please select a target confirmed demand for this milling batch.');
      return;
    }
    if (selectedLotIds.length === 0) {
      setActionError('Please select at least one received farmer lot to include in this batch.');
      return;
    }

    setLoadingAction(true);
    setActionError(null);

    try {
      const newBatch = await sasyathraService.scheduleProcessing({
        demand_id: selectedDemandId,
        unit_id: activeUnit.id,
        processing_date: batchDate,
        lot_ids: selectedLotIds,
        operator_name: batchOperator,
        notes: batchNotes
      });

      setActionSuccess(`Batch ${newBatch.batch_code} successfully scheduled! Traceability QR generated.`);
      setSelectedLotIds([]);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStartProcessing = async (batchId) => {
    setLoadingAction(true);
    setActionError(null);
    try {
      await sasyathraService.updateBatchStatus({
        batch_id: batchId,
        new_status: 'PROCESSING',
        operator_name: batchOperator
      });
      setActionSuccess('Milling started. Batch status transitioned to PROCESSING.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompleteProcessing = async (e) => {
    e.preventDefault();
    if (!millCompleteTarget) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await sasyathraService.updateBatchStatus({
        batch_id: millCompleteTarget.id,
        new_status: 'PROCESSED',
        output_qty_kg: outputQty || Math.round(millCompleteTarget.input_qty_kg * 0.68),
        operator_name: batchOperator
      });
      setActionSuccess('Processing completed! Actual output quantity recorded.');
      setMillCompleteTarget(null);
      setOutputQty('');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMarkReadyForDelivery = async (batchId) => {
    setLoadingAction(true);
    setActionError(null);
    try {
      await sasyathraService.updateBatchStatus({
        batch_id: batchId,
        new_status: 'READY_FOR_DELIVERY',
        operator_name: batchOperator
      });
      setActionSuccess('Batch packed & marked READY FOR DELIVERY.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddVerification = async (e) => {
    e.preventDefault();
    if (!verifTargetBatch) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await sasyathraService.addBatchVerification({
        batch_id: verifTargetBatch.id,
        tier: verifForm.tier,
        status: verifForm.status,
        note: verifForm.note,
        evidence_url: verifForm.evidence_url,
        verified_by: verifForm.verified_by
      });
      setActionSuccess('Quality verification certificate attached to batch.');
      setVerifTargetBatch(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryTargetBatch) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      const res = await sasyathraService.markDelivered({
        demand_id: deliveryTargetBatch.demand_id,
        batch_id: deliveryTargetBatch.id,
        delivered_qty: deliveryForm.delivered_qty || deliveryTargetBatch.output_qty_kg || deliveryTargetBatch.input_qty_kg,
        receiver_name: deliveryForm.receiver_name,
        notes: deliveryForm.notes
      });

      setActionSuccess(
        `Delivery confirmed! ${res.settled_farmers_count || 'All'} participating farmers' 30% balance RELEASED in ledger.`
      );
      setDeliveryTargetBatch(null);
      setTimeout(() => setActionSuccess(null), 6000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Processing Unit Switcher */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-earth-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-paddy-900 bg-harvest-100 border border-harvest-300 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Factory className="w-3.5 h-3.5 text-paddy-800" /> Cooperative & FPO Milling Unit
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
            {activeUnit?.name || 'Warangal Cooperative Processing Unit'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-earth-500" />
            <span>{activeUnit?.village}, {activeUnit?.district}</span>
            <span>•</span>
            <span>Milling Standard: {activeUnit?.processing_type}</span>
          </p>
        </div>

        {/* Processing Unit Selector */}
        <div className="flex flex-col gap-1 shrink-0">
          <label className="text-[11px] font-semibold text-slate-500 uppercase">Active Milling Center</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-earth-300 bg-earth-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-paddy-500"
          >
            {processingUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.daily_capacity_kg} kg/day)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-paddy-50 border border-paddy-300 text-paddy-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-paddy-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Daily Capacity Widget (Section 25, 26) */}
      <div className="bg-gradient-to-r from-earth-900 to-paddy-950 text-white rounded-3xl p-6 shadow-md border border-earth-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-harvest-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-harvest-400" /> Server-Side Capacity Verification (Section 26)
            </span>
            <h3 className="font-serif text-xl font-bold text-white mt-1">
              Daily Milling Capacity Monitor
            </h3>
            <p className="text-xs text-earth-300 mt-0.5">
              Target Milling Date: <strong>{batchDate}</strong> • Capacity is locked against overscheduling.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
              <span className="text-[10px] text-earth-300 block uppercase">Daily Rated</span>
              <span className="text-lg font-bold font-serif text-white">{capacityInfo.daily_capacity_kg} kg</span>
            </div>
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
              <span className="text-[10px] text-earth-300 block uppercase">Scheduled</span>
              <span className="text-lg font-bold font-serif text-harvest-300">{capacityInfo.scheduled_kg} kg</span>
            </div>
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
              <span className="text-[10px] text-earth-300 block uppercase">Available</span>
              <span className="text-lg font-bold font-serif text-emerald-400">{capacityInfo.available_kg} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desk Navigation Tabs */}
      <div className="flex border-b border-earth-300 gap-1 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { key: 'milling', label: 'Batch Milling Studio', icon: Layers, count: unitBatches.length },
          { key: 'pickup', label: 'Pickup Logistics', icon: Truck, count: pickupRequests.length },
          { key: 'verification', label: 'Quality Verification', icon: ShieldCheck },
          { key: 'delivery', label: 'Delivery & Settlement', icon: PackageCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeDesk === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveDesk(tab.key)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl transition whitespace-nowrap ${
                active
                  ? 'bg-paddy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-earth-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20 text-white' : 'bg-earth-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* DESK 1: BATCH MILLING STUDIO (Section 27, 28, 29, 30) */}
      {activeDesk === 'milling' && (
        <div className="space-y-6">
          {/* Create Batch Card (Multi-farmer aggregation Section 28) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-earth-200 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-bold text-paddy-800 uppercase tracking-wider">Multi-Farmer Aggregation</span>
              <h3 className="font-serif text-2xl font-bold text-slate-900 mt-1">
                Schedule New Processing Batch (BATCH-YYYY-XXXXX)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Group received produce lots from multiple farmers into a single verifiable milling run.
              </p>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmed Buyer Demand Order
                  </label>
                  <select
                    value={selectedDemandId}
                    onChange={(e) => setSelectedDemandId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-medium"
                  >
                    <option value="">Select Demand Order…</option>
                    {demands.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.product} ({d.qty_kg} kg) - {d.buyer_name} [{d.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Scheduled Milling Date
                  </label>
                  <input
                    type="date"
                    required
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Operator / Chief Miller
                  </label>
                  <input
                    type="text"
                    value={batchOperator}
                    onChange={(e) => setBatchOperator(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                  />
                </div>
              </div>

              {/* Multi-Farmer Received Produce Lots Selection (Section 28) */}
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Received Farmer Lots to Batch Mill:
                </label>

                {receivedLots.length === 0 ? (
                  <div className="p-4 bg-earth-50 rounded-2xl border border-earth-200 text-slate-500 text-center">
                    No received produce lots awaiting milling. First confirm receipt under Pickup Logistics desk.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {receivedLots.map((lot) => {
                      const isSelected = selectedLotIds.includes(lot.id);
                      return (
                        <div
                          key={lot.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLotIds(selectedLotIds.filter((id) => id !== lot.id));
                            } else {
                              setSelectedLotIds([...selectedLotIds, lot.id]);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                            isSelected
                              ? 'bg-paddy-50 border-paddy-500 ring-2 ring-paddy-500/20'
                              : 'bg-white border-earth-200 hover:border-earth-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold text-paddy-900 bg-paddy-100 px-2 py-0.5 rounded">
                              {lot.lot_code}
                            </span>
                            <span className="font-bold text-sm text-slate-900 font-serif">{lot.qty_kg} kg</span>
                          </div>
                          <div className="text-slate-800 font-semibold text-xs mt-1.5">{lot.farmer_name}</div>
                          <div className="text-[11px] text-slate-500">
                            {lot.village} • {lot.grade} ({lot.moisture_percent}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total Input Preview & Capacity Check */}
              {selectedLotIds.length > 0 && (
                <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 flex justify-between items-center text-xs">
                  <span>
                    Selected <strong>{selectedLotIds.length}</strong> lots • Input Paddy Total:{' '}
                    <strong className="text-paddy-900 text-sm">
                      {receivedLots
                        .filter((l) => selectedLotIds.includes(l.id))
                        .reduce((sum, l) => sum + Number(l.qty_kg), 0)}{' '}
                      kg
                    </strong>
                  </span>
                  <span className="text-slate-500">
                    Remaining Day Capacity: {capacityInfo.available_kg} kg
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingAction || selectedLotIds.length === 0}
                className="bg-paddy-700 hover:bg-paddy-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl transition shadow flex items-center gap-2"
              >
                <Layers className="w-4 h-4" /> Create & Schedule Milling Batch
              </button>
            </form>
          </div>

          {/* Active Processing Batches List (Section 29, 30, 31) */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-xl text-slate-800">Milling Batches & Processing Pipeline</h3>

            {unitBatches.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-earth-200 text-xs text-slate-500">
                No processing batches created yet for this facility.
              </div>
            ) : (
              <div className="space-y-4">
                {unitBatches.map((batch) => {
                  const isScheduled = batch.status === 'SCHEDULED';
                  const isProcessing = batch.status === 'PROCESSING';
                  const isProcessed = batch.status === 'PROCESSED';
                  const isReady = batch.status === 'READY_FOR_DELIVERY';
                  const isDelivered = batch.status === 'DELIVERED';

                  return (
                    <div
                      key={batch.id}
                      className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-earth-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-paddy-900 bg-paddy-100 px-3 py-1 rounded-xl">
                              {batch.batch_code}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isDelivered
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : isReady
                                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                  : isProcessed
                                  ? 'bg-paddy-100 text-paddy-900 border border-paddy-300'
                                  : isProcessing
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300 animate-pulse'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {batch.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Paddy Variety: <strong>{batch.demand?.product || 'Sona Masuri'}</strong> • Scheduled Date:{' '}
                            {batch.processing_date}
                          </p>
                        </div>

                        {/* QR Code Quick Button (Section 33) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenTrace(batch.batch_code)}
                            className="bg-harvest-400 hover:bg-harvest-500 text-paddy-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" /> View Public QR Trace
                          </button>
                        </div>
                      </div>

                      {/* Weight Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200">
                          <span className="text-[10px] text-slate-400 block uppercase">Input Paddy</span>
                          <span className="font-bold text-slate-800">{batch.input_qty_kg} kg</span>
                        </div>

                        <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200">
                          <span className="text-[10px] text-slate-400 block uppercase">Milled Output</span>
                          <span className="font-bold text-paddy-900">
                            {batch.output_qty_kg ? `${batch.output_qty_kg} kg` : 'Milling in progress'}
                          </span>
                        </div>

                        <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200">
                          <span className="text-[10px] text-slate-400 block uppercase">Recovery Rate</span>
                          <span className="font-bold text-slate-800">
                            {batch.output_qty_kg
                              ? `${Math.round((batch.output_qty_kg / batch.input_qty_kg) * 100)}%`
                              : 'Est. 68%'}
                          </span>
                        </div>

                        <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200">
                          <span className="text-[10px] text-slate-400 block uppercase">Miller / Operator</span>
                          <span className="font-semibold text-slate-700">{batch.operator_name || 'Miller'}</span>
                        </div>
                      </div>

                      {/* Workflow State Transition Controls (Section 29) */}
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-slate-500 text-[11px]">
                          Notes: {batch.notes || 'Standard cooperative milling run'}
                        </div>

                        <div className="flex items-center gap-2">
                          {isScheduled && (
                            <button
                              onClick={() => handleStartProcessing(batch.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-xl transition"
                            >
                              Start Milling (⚙️ PROCESSING)
                            </button>
                          )}

                          {isProcessing && (
                            <button
                              onClick={() => {
                                setMillCompleteTarget(batch);
                                setOutputQty(Math.round(batch.input_qty_kg * 0.68));
                              }}
                              className="bg-paddy-700 hover:bg-paddy-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition"
                            >
                              Complete Milling (✓ PROCESSED)
                            </button>
                          )}

                          {isProcessed && (
                            <button
                              onClick={() => handleMarkReadyForDelivery(batch.id)}
                              className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition"
                            >
                              Mark Ready for Delivery (📦 READY)
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => {
                                setDeliveryTargetBatch(batch);
                                setDeliveryForm({
                                  ...deliveryForm,
                                  delivered_qty: batch.output_qty_kg || batch.input_qty_kg
                                });
                              }}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow"
                            >
                              <PackageCheck className="w-3.5 h-3.5" /> Dispatch & Confirm Delivery
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setVerifTargetBatch(batch);
                            }}
                            className="bg-earth-100 hover:bg-earth-200 text-slate-800 font-semibold px-3 py-1.5 rounded-xl transition border border-earth-300"
                          >
                            + Quality Cert
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESK 2: PICKUP LOGISTICS & RECEIVING (Section 22, 24) */}
      {activeDesk === 'pickup' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-slate-800">Farm Gate Pickups & Receiving</h3>
            <span className="text-xs text-slate-500">Coordinate farm collection and record incoming scale weight</span>
          </div>

          {pickupRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-earth-200 text-xs text-slate-500">
              No pickup requests pending. Farmers will request pickup after harvest.
            </div>
          ) : (
            <div className="space-y-4">
              {pickupRequests.map((pk) => {
                const lot = pk.produce_lot;
                return (
                  <div
                    key={pk.id}
                    className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-paddy-900 bg-paddy-100 px-2 py-0.5 rounded">
                          {lot ? lot.lot_code : 'LOT'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            pk.status === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : pk.status === 'PICKED_UP'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {pk.status}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-lg text-slate-900">
                        {lot?.qty_kg || '—'} kg {lot?.variety || 'Paddy'} • Farmer: {pk.farmer_name}
                      </h4>

                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-earth-500" /> Pickup Location: {pk.pickup_location}
                      </p>

                      {pk.driver_name && (
                        <p className="text-[11px] text-slate-600 bg-earth-50 p-2 rounded-xl border border-earth-200">
                          Assigned: {pk.driver_name} ({pk.driver_phone}) • Vehicle: {pk.vehicle_number} • Date:{' '}
                          {pk.scheduled_date}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 self-start md:self-auto">
                      {pk.status === 'REQUESTED' && (
                        <button
                          onClick={() => {
                            setAssignPickupTarget(pk);
                            setActionError(null);
                          }}
                          className="bg-harvest-400 hover:bg-harvest-500 text-paddy-950 font-bold px-4 py-2 rounded-xl text-xs transition shadow"
                        >
                          Assign Vehicle & Driver
                        </button>
                      )}

                      {pk.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleMarkPickedUp(pk.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                        >
                          Mark Picked Up from Farm
                        </button>
                      )}

                      {pk.status === 'PICKED_UP' && (
                        <button
                          onClick={() => {
                            setReceiveTarget(pk);
                            setReceiveForm({
                              ...receiveForm,
                              received_qty_kg: lot?.qty_kg || ''
                            });
                          }}
                          className="bg-paddy-700 hover:bg-paddy-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                        >
                          Confirm Receipt at Mill Scale
                        </button>
                      )}

                      {pk.status === 'RECEIVED' && (
                        <span className="text-xs font-semibold text-paddy-800 bg-paddy-100 border border-paddy-300 px-3 py-1.5 rounded-xl text-center">
                          Received & Ready to Mill
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DESK 3: QUALITY VERIFICATION (Section 20, 47) */}
      {activeDesk === 'verification' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-earth-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-serif font-bold text-xl text-slate-800">Quality Verification Desk</h3>
            <p className="text-xs text-slate-500 mt-1">
              Verify produce lots and processing batches across 4 tiers: SELF_DECLARED, COOPERATIVE_VERIFIED, DOCUMENT_VERIFIED, and LAB_VERIFIED.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-earth-50 border border-earth-200">
              <span className="font-bold text-slate-800 block text-sm">Tier 1: Self-Declared</span>
              <p className="text-slate-500 text-[11px] mt-1">Farmer farm-gate moisture and physical variety declaration.</p>
            </div>
            <div className="p-4 rounded-2xl bg-paddy-50 border border-paddy-200">
              <span className="font-bold text-paddy-900 block text-sm">Tier 2: Cooperative Verified</span>
              <p className="text-paddy-700 text-[11px] mt-1">Mill scale weighment, moisture probe inspection, and de-husking test.</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="font-bold text-blue-900 block text-sm">Tier 3: Document Verified</span>
              <p className="text-blue-700 text-[11px] mt-1">FPO certification certificate and agricultural receipt documentation.</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <span className="font-bold text-purple-900 block text-sm">Tier 4: Lab Verified</span>
              <p className="text-purple-700 text-[11px] mt-1">Accredited laboratory pesticide and grain quality analysis report.</p>
            </div>
          </div>
        </div>
      )}

      {/* DESK 4: DELIVERY & SETTLEMENT (Section 37, 38) */}
      {activeDesk === 'delivery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-xl text-slate-800">Delivery Dispatch & Balance Settlement</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fulfilling deliveries to buyers automatically triggers the release of the 30% farmer ledger balance.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {unitBatches.filter((b) => b.status === 'READY_FOR_DELIVERY' || b.status === 'DELIVERED').map((batch) => (
              <div
                key={batch.id}
                className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-paddy-900 bg-paddy-100 px-2.5 py-0.5 rounded">
                      {batch.batch_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        batch.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-purple-100 text-purple-900'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-lg text-slate-900 mt-1">
                    {batch.output_qty_kg || batch.input_qty_kg} kg {batch.demand?.product} for {batch.demand?.buyer_name}
                  </h4>
                  <p className="text-xs text-slate-500">Destination: {batch.demand?.location}</p>
                </div>

                <div className="flex items-center gap-3">
                  {batch.status === 'READY_FOR_DELIVERY' ? (
                    <button
                      onClick={() => {
                        setDeliveryTargetBatch(batch);
                        setDeliveryForm({
                          ...deliveryForm,
                          delivered_qty: batch.output_qty_kg || batch.input_qty_kg
                        });
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow flex items-center gap-1.5"
                    >
                      <PackageCheck className="w-4 h-4" /> Confirm Buyer Delivery
                    </button>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-900 font-bold px-4 py-2 rounded-xl text-xs border border-emerald-300">
                      ✓ Delivered & Ledger Balance Released
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSIGN PICKUP MODAL (Section 22) */}
      {assignPickupTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
            <div className="bg-paddy-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Assign Pickup Vehicle</h3>
                <p className="text-xs text-paddy-200">Dispatch logistics truck for Lot {assignPickupTarget.produce_lot?.lot_code}</p>
              </div>
              <button onClick={() => setAssignPickupTarget(null)} className="text-white/80 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignPickup} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Scheduled Pickup Date
                </label>
                <input
                  type="date"
                  required
                  value={assignForm.scheduled_date}
                  onChange={(e) => setAssignForm({ ...assignForm, scheduled_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  required
                  value={assignForm.vehicle_number}
                  onChange={(e) => setAssignForm({ ...assignForm, vehicle_number: e.target.value })}
                  placeholder="e.g. TS 03 TA 4421"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    required
                    value={assignForm.driver_name}
                    onChange={(e) => setAssignForm({ ...assignForm, driver_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Driver Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={assignForm.driver_phone}
                    onChange={(e) => setAssignForm({ ...assignForm, driver_phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-harvest-500 hover:bg-harvest-600 text-paddy-950 font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Assigning…' : 'Confirm Assignment'}
                </button>
                <button
                  type="button"
                  onClick={() => setAssignPickupTarget(null)}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM RECEIPT MODAL (Section 24) */}
      {receiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
            <div className="bg-paddy-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Confirm Mill Scale Receipt</h3>
                <p className="text-xs text-paddy-200">Record weighment for Lot {receiveTarget.produce_lot?.lot_code}</p>
              </div>
              <button onClick={() => setReceiveTarget(null)} className="text-white/80 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReceived} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Received Quantity (kg)
                </label>
                <input
                  type="number"
                  required
                  value={receiveForm.received_qty_kg}
                  onChange={(e) => setReceiveForm({ ...receiveForm, received_qty_kg: e.target.value })}
                  placeholder="Scale weight in kg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Receipt Date
                </label>
                <input
                  type="date"
                  required
                  value={receiveForm.received_date}
                  onChange={(e) => setReceiveForm({ ...receiveForm, received_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Condition / Quality Note
                </label>
                <textarea
                  rows="2"
                  value={receiveForm.condition_note}
                  onChange={(e) => setReceiveForm({ ...receiveForm, condition_note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-paddy-700 hover:bg-paddy-800 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Recording…' : 'Record Received Quantity'}
                </button>
                <button
                  type="button"
                  onClick={() => setReceiveTarget(null)}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MILLING COMPLETE MODAL (Section 30) */}
      {millCompleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
            <div className="bg-paddy-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Record Milled Output</h3>
                <p className="text-xs text-paddy-200">Actual milled output for {millCompleteTarget.batch_code}</p>
              </div>
              <button onClick={() => setMillCompleteTarget(null)} className="text-white/80 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteProcessing} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-earth-50 rounded-xl border border-earth-200">
                <span className="text-slate-500 block">Input Paddy:</span>
                <span className="font-bold text-slate-900 text-sm">{millCompleteTarget.input_qty_kg} kg</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Actual Output Quantity (Milled Rice kg)
                </label>
                <input
                  type="number"
                  required
                  value={outputQty}
                  onChange={(e) => setOutputQty(e.target.value)}
                  placeholder="e.g. 680 kg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-paddy-700 hover:bg-paddy-800 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Completing…' : 'Confirm Processing Completed'}
                </button>
                <button
                  type="button"
                  onClick={() => setMillCompleteTarget(null)}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELIVERY MODAL (Section 37, 38) */}
      {deliveryTargetBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Confirm Buyer Delivery</h3>
                <p className="text-xs text-emerald-200">
                  Completes order and triggers 30% balance release in farmer ledgers
                </p>
              </div>
              <button onClick={() => setDeliveryTargetBatch(null)} className="text-white/80 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Delivered Quantity (kg)
                </label>
                <input
                  type="number"
                  required
                  value={deliveryForm.delivered_qty}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, delivered_qty: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Receiver Name & Designation
                </label>
                <input
                  type="text"
                  required
                  value={deliveryForm.receiver_name}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, receiver_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Delivery Notes
                </label>
                <textarea
                  rows="2"
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                ></textarea>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong className="block mb-0.5">Section 38 Release Notice:</strong>
                Submitting this confirmation will change participating farmers' 30% ledger balance from PENDING to
                RELEASED.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Delivering…' : 'Mark Delivered & Release Balance'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryTargetBatch(null)}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUALITY VERIFICATION MODAL (Section 20, 47) */}
      {verifTargetBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
            <div className="bg-purple-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Add Quality Verification</h3>
                <p className="text-xs text-purple-200">Certify Batch {verifTargetBatch.batch_code}</p>
              </div>
              <button onClick={() => setVerifTargetBatch(null)} className="text-white/80 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVerification} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Verification Tier
                </label>
                <select
                  value={verifForm.tier}
                  onChange={(e) => setVerifForm({ ...verifForm, tier: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-medium"
                >
                  <option value="SELF_DECLARED">Tier 1: Self-Declared Farm Gate</option>
                  <option value="COOPERATIVE_VERIFIED">Tier 2: Cooperative Physical Inspection</option>
                  <option value="DOCUMENT_VERIFIED">Tier 3: Document & FPO Registered</option>
                  <option value="LAB_VERIFIED">Tier 4: Accredited Lab Certified</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Verification Notes / Parameters
                </label>
                <textarea
                  rows="2"
                  value={verifForm.note}
                  onChange={(e) => setVerifForm({ ...verifForm, note: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Evidence Document URL
                </label>
                <input
                  type="text"
                  value={verifForm.evidence_url}
                  onChange={(e) => setVerifForm({ ...verifForm, evidence_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  required
                  value={verifForm.verified_by}
                  onChange={(e) => setVerifForm({ ...verifForm, verified_by: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Verifying…' : 'Attach Verification'}
                </button>
                <button
                  type="button"
                  onClick={() => setVerifTargetBatch(null)}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
