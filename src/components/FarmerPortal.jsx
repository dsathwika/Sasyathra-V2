import React, { useState } from 'react';
import {
  Sprout,
  Wheat,
  IndianRupee,
  CheckCircle2,
  Clock,
  Truck,
  Factory,
  PackageCheck,
  AlertCircle,
  MapPin,
  Calendar,
  Filter,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
  ExternalLink,
  Info
} from 'lucide-react';
import { sasyathraService } from '../lib/sasyathraService';

export default function FarmerPortal({
  demands = [],
  contributions = [],
  produceLots = [],
  pickupRequests = [],
  ledgerEntries = [],
  activeFarmer,
  onOpenTrace
}) {
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'pledges' | 'lots' | 'pickups' | 'ledger' | 'profile'
  const [filterVariety, setFilterVariety] = useState('ALL');
  const [filterLocation, setFilterLocation] = useState('');

  // Modals
  const [pledgeTargetDemand, setPledgeTargetDemand] = useState(null);
  const [pledgeForm, setPledgeForm] = useState({
    qty_kg: '',
    expected_harvest_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    moisture_percent: 13.5,
    grade: 'Grade A',
    notes: ''
  });

  const [harvestTargetContrib, setHarvestTargetContrib] = useState(null);
  const [harvestForm, setHarvestForm] = useState({
    qty_kg: '',
    harvest_date: new Date().toISOString().split('T')[0],
    moisture_percent: 13.5,
    grade: 'Grade A',
    notes: ''
  });

  const [pickupTargetLot, setPickupTargetLot] = useState(null);
  const [pickupForm, setPickupForm] = useState({
    pickup_location: activeFarmer?.village ? `${activeFarmer.village} Farm Gate` : 'Farm Gate',
    preferred_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    notes: 'Paddy bags kept dry in shaded shed.'
  });

  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // My filtered records
  const myPledges = contributions.filter(
    (c) => !activeFarmer?.id || c.farmer_id === activeFarmer.id || c.farmer_name === activeFarmer?.name
  );
  const myLots = produceLots.filter(
    (l) => !activeFarmer?.id || l.farmer_id === activeFarmer.id || l.farmer_name === activeFarmer?.name
  );
  const myPickups = pickupRequests.filter(
    (p) => !activeFarmer?.id || p.farmer_id === activeFarmer.id || p.farmer_name === activeFarmer?.name
  );
  const myLedger = ledgerEntries.filter(
    (led) => !activeFarmer?.id || led.farmer_id === activeFarmer.id || led.farmer_name === activeFarmer?.name
  );

  // Earnings calculations
  const totalGross = myLedger.reduce((sum, item) => sum + Number(item.gross_amount || 0), 0);
  const totalAdvance = myLedger.reduce((sum, item) => sum + Number(item.advance_amount || 0), 0);
  const totalBalance = myLedger.reduce((sum, item) => sum + Number(item.balance_amount || 0), 0);
  const releasedBalance = myLedger
    .filter((i) => i.balance_status === 'RELEASED')
    .reduce((sum, item) => sum + Number(item.balance_amount || 0), 0);
  const pendingBalance = totalBalance - releasedBalance;

  // Filter available demands
  const openDemands = demands.filter((d) => {
    if (d.status !== 'OPEN') return false;
    if (filterVariety !== 'ALL' && d.product !== filterVariety) return false;
    if (filterLocation && !d.location.toLowerCase().includes(filterLocation.toLowerCase())) return false;
    return true;
  });

  // Handle Pledge Submit
  const handlePledgeSubmit = async (e) => {
    e.preventDefault();
    if (!pledgeTargetDemand) return;
    setLoadingAction(true);
    setActionError(null);

    const qty = Number(pledgeForm.qty_kg);
    const remaining = Number(pledgeTargetDemand.qty_kg) - Number(pledgeTargetDemand.matched_kg || 0);

    // Over-pledge validation (Section 13)
    if (qty > remaining) {
      setActionError(`Only ${remaining} kg is remaining for this demand.`);
      setLoadingAction(false);
      return;
    }

    try {
      const res = await sasyathraService.pledgeProduce({
        demand_id: pledgeTargetDemand.id,
        farmer_id: activeFarmer?.id,
        farmer_name: activeFarmer?.name || 'Ramesh Goud',
        village: activeFarmer?.village || 'Dharmasagar',
        district: activeFarmer?.district || 'Warangal',
        qty_kg: qty,
        expected_harvest_date: pledgeForm.expected_harvest_date,
        moisture_percent: pledgeForm.moisture_percent,
        grade: pledgeForm.grade,
        notes: pledgeForm.notes
      });

      setActionSuccess(
        res?.is_confirmed
          ? '✓ Demand is now 100% matched and CONFIRMED! 70% advance estimated in your ledger.'
          : 'Pledge recorded successfully! You can track aggregation in My Pledges.'
      );
      setPledgeTargetDemand(null);
      setPledgeForm({ ...pledgeForm, qty_kg: '' });
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Harvest Report Submit
  const handleHarvestSubmit = async (e) => {
    e.preventDefault();
    if (!harvestTargetContrib) return;
    setLoadingAction(true);
    setActionError(null);

    try {
      await sasyathraService.reportHarvest({
        contribution_id: harvestTargetContrib.id,
        harvest_date: harvestForm.harvest_date,
        qty_kg: harvestForm.qty_kg || harvestTargetContrib.qty_kg,
        moisture_percent: harvestForm.moisture_percent,
        grade: harvestForm.grade,
        notes: harvestForm.notes
      });

      setActionSuccess('Harvest reported! Produce Lot generated with unique ID. You can now request pickup.');
      setHarvestTargetContrib(null);
      setActiveTab('lots');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle Pickup Request Submit
  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    if (!pickupTargetLot) return;
    setLoadingAction(true);
    setActionError(null);

    try {
      await sasyathraService.requestPickup({
        produce_lot_id: pickupTargetLot.id,
        pickup_location: pickupForm.pickup_location,
        preferred_date: pickupForm.preferred_date,
        notes: pickupForm.notes
      });

      setActionSuccess('Pickup requested! Cooperative logistics coordinator will assign a vehicle.');
      setPickupTargetLot(null);
      setActiveTab('pickups');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Farmer Identity */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-earth-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-paddy-800 bg-paddy-100 border border-paddy-300 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-paddy-700" /> Verified Farmer Portal
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
            {activeFarmer?.name || 'Ramesh Goud'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-earth-500" />
              {activeFarmer?.village || 'Dharmasagar'}, {activeFarmer?.district || 'Warangal'}
            </span>
            <span>•</span>
            <span>Farm Size: {activeFarmer?.farm_size_acres || 4.5} Acres</span>
            <span>•</span>
            <span>Phone: {activeFarmer?.phone || '+91 94401 55667'}</span>
          </p>
        </div>

        <div className="bg-earth-50 border border-earth-200 p-3.5 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-paddy-100 text-paddy-800 flex items-center justify-center font-bold">
            <Wheat className="w-5 h-5 text-paddy-700" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Estimated Ledger Earnings</div>
            <div className="font-serif text-lg font-bold text-paddy-900">₹{totalGross.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Action Notifications */}
      {actionSuccess && (
        <div className="p-4 bg-paddy-50 border border-paddy-300 text-paddy-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-paddy-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Overview Cards (Section 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Open Demands</div>
          <div className="text-xl font-serif font-bold text-paddy-800">{openDemands.length}</div>
          <div className="text-[10px] text-paddy-600 mt-0.5">Ready for pledge</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">My Pledges</div>
          <div className="text-xl font-serif font-bold text-harvest-800">{myPledges.length}</div>
          <div className="text-[10px] text-harvest-700 mt-0.5">Committed lots</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Harvest Lots</div>
          <div className="text-xl font-serif font-bold text-slate-800">{myLots.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Unique LOT IDs</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pickup Pending</div>
          <div className="text-xl font-serif font-bold text-amber-700">
            {myPickups.filter((p) => p.status !== 'RECEIVED').length}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">Logistics active</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Advance Est.</div>
          <div className="text-xl font-serif font-bold text-paddy-700">₹{totalAdvance.toLocaleString()}</div>
          <div className="text-[10px] text-paddy-600 mt-0.5">70% on match</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Balance Est.</div>
          <div className="text-xl font-serif font-bold text-purple-700">₹{totalBalance.toLocaleString()}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">
            {releasedBalance > 0 ? `₹${releasedBalance.toLocaleString()} released` : '30% on delivery'}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Section 11) */}
      <div className="flex border-b border-earth-300 gap-1 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { key: 'discover', label: 'Discover Demands', icon: Wheat, count: openDemands.length },
          { key: 'pledges', label: 'My Pledges', icon: Sprout, count: myPledges.length },
          { key: 'lots', label: 'Produce Lots & Harvest', icon: PackageCheck, count: myLots.length },
          { key: 'pickups', label: 'Pickup Tracking', icon: Truck, count: myPickups.length },
          { key: 'ledger', label: 'Earnings Ledger (70/30)', icon: IndianRupee, count: myLedger.length },
          { key: 'profile', label: 'Farmer Profile', icon: User }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

      {/* TAB 1: DISCOVER DEMANDS (Section 12, 13) */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-earth-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">Filter By Variety:</span>
              <select
                value={filterVariety}
                onChange={(e) => setFilterVariety(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-earth-300 font-medium"
              >
                <option value="ALL">All Paddy Varieties</option>
                <option value="Sona Masuri">Sona Masuri</option>
                <option value="Basmati">Basmati</option>
                <option value="Standard Paddy">Standard Paddy</option>
                <option value="BPT 5204">BPT 5204</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Location:</span>
              <input
                type="text"
                placeholder="Search city/district..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-earth-300"
              />
            </div>
          </div>

          {/* Demands Cards */}
          {openDemands.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-earth-200">
              <Wheat className="w-10 h-10 text-earth-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No open demands matching criteria</p>
              <p className="text-xs text-slate-500 mt-1">Check back soon or adjust your filter filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openDemands.map((demand) => {
                const total = Number(demand.qty_kg);
                const matched = Number(demand.matched_kg || 0);
                const remaining = Math.max(0, total - matched);
                const percent = Math.min(100, Math.round((matched / total) * 100));

                return (
                  <div
                    key={demand.id}
                    className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm flex flex-col justify-between hover:border-paddy-400 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-paddy-800 bg-paddy-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            OPEN FOR PLEDGE
                          </span>
                          <h3 className="font-serif text-xl font-bold text-slate-900 mt-1">
                            {demand.product} Paddy
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Buyer: {demand.buyer_name}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-paddy-900 font-serif">
                            ₹{demand.price_min || demand.price_per_kg} – ₹{demand.price_max || demand.price_per_kg}
                          </span>
                          <span className="block text-[11px] text-slate-400">per kg</span>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4 text-xs">
                        <div className="flex justify-between text-[11px] text-slate-600">
                          <span>Progress: {matched} kg / {total} kg</span>
                          <span className="font-bold text-paddy-800">{percent}%</span>
                        </div>

                        <div className="w-full h-2 bg-earth-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-harvest-500 to-paddy-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                          <div className="p-2 bg-earth-50 rounded-xl border border-earth-200">
                            <span className="text-slate-400 block">Remaining Quota</span>
                            <span className="font-bold text-amber-800 text-sm">{remaining} kg</span>
                          </div>
                          <div className="p-2 bg-earth-50 rounded-xl border border-earth-200">
                            <span className="text-slate-400 block">Required By</span>
                            <span className="font-semibold text-slate-700">{demand.required_date}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 pt-1">
                          <MapPin className="w-3 h-3 inline text-earth-500 mr-1" />
                          Delivery Location: {demand.location}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-earth-200 flex items-center justify-between gap-3">
                      <span className="text-[10px] text-paddy-700 font-semibold">
                        70% Advance ({demand.advance_percent}%) on match
                      </span>
                      <button
                        onClick={() => {
                          setPledgeTargetDemand(demand);
                          setPledgeForm({
                            ...pledgeForm,
                            qty_kg: Math.min(500, remaining)
                          });
                          setActionError(null);
                        }}
                        className="bg-paddy-700 hover:bg-paddy-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
                      >
                        Pledge Produce <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY PLEDGES (Section 13, 15, 18) */}
      {activeTab === 'pledges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-slate-800">My Committed Pledges</h3>
            <span className="text-xs text-slate-500">Produce committed against buyer orders</span>
          </div>

          {myPledges.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-earth-200">
              <Sprout className="w-10 h-10 text-earth-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No pledges placed yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Explore open buyer demands and commit your harvest to secure advance earnings.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="bg-paddy-700 hover:bg-paddy-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Discover Demands
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myPledges.map((contrib) => {
                const demand = contrib.demand;
                const isConfirmed = demand?.status === 'CONFIRMED' || demand?.matched_kg >= demand?.qty_kg;
                const hasLot = Boolean(contrib.produce_lot || contrib.status === 'HARVESTED');

                const gross = Number(contrib.qty_kg) * Number(demand?.price_per_kg || 45);
                const advance = Math.round(gross * 0.70);

                return (
                  <div
                    key={contrib.id}
                    className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isConfirmed
                              ? 'bg-paddy-100 text-paddy-900 border border-paddy-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isConfirmed ? '✓ Demand Fully Matched' : 'Aggregating Supply'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Pledge #{contrib.id.substring(0, 8)}
                        </span>
                      </div>

                      <h4 className="font-serif text-xl font-bold text-slate-900">
                        {contrib.qty_kg} kg • {demand?.product || 'Paddy'}
                      </h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span>Buyer: <strong>{demand?.buyer_name || 'Verified Buyer'}</strong></span>
                        <span>•</span>
                        <span>Offered Rate: ₹{demand?.price_per_kg || 45}/kg</span>
                        <span>•</span>
                        <span>Expected Harvest: {contrib.expected_harvest_date || 'October 2026'}</span>
                      </div>

                      {/* Advance estimation note */}
                      <div className="text-[11px] text-paddy-800 bg-paddy-50 border border-paddy-200 p-2.5 rounded-xl">
                        Gross Est: ₹{gross.toLocaleString()} • <strong>70% Advance Estimate: ₹{advance.toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 self-start md:self-auto">
                      {isConfirmed && !hasLot && (
                        <button
                          onClick={() => {
                            setHarvestTargetContrib(contrib);
                            setHarvestForm({
                              ...harvestForm,
                              qty_kg: contrib.qty_kg
                            });
                            setActionError(null);
                          }}
                          className="bg-harvest-400 hover:bg-harvest-500 text-paddy-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow flex items-center gap-1.5"
                        >
                          <PackageCheck className="w-4 h-4" /> Report Harvest
                        </button>
                      )}

                      {hasLot && (
                        <span className="bg-paddy-100 text-paddy-900 text-xs font-semibold px-3 py-1.5 rounded-xl border border-paddy-300 text-center">
                          Harvest Lot Created
                        </span>
                      )}

                      {!isConfirmed && (
                        <span className="text-[11px] text-slate-400 italic text-center">
                          Awaiting remaining demand match
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

      {/* TAB 3: PRODUCE LOTS (Section 18, 19, 20) */}
      {activeTab === 'lots' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-xl text-slate-800">Harvested Produce Lots</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical lots generated with unique traceability identifiers (LOT-YYYY-XXXXX)
              </p>
            </div>
          </div>

          {myLots.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-earth-200">
              <PackageCheck className="w-10 h-10 text-earth-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No produce lots created yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Once a demand reaches 100% matched, click "Report Harvest" under My Pledges to generate your unique lot.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myLots.map((lot) => {
                const hasPickup = Boolean(lot.pickup_request || lot.status !== 'HARVESTED');
                return (
                  <div
                    key={lot.id}
                    className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-paddy-900 bg-paddy-100 border border-paddy-300 px-2.5 py-1 rounded-lg">
                            {lot.lot_code}
                          </span>
                          <h4 className="font-serif text-lg font-bold text-slate-900 mt-2">
                            {lot.variety} Paddy
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-earth-500" /> {lot.village}, {lot.district}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-serif font-bold text-paddy-900">{lot.qty_kg} kg</span>
                          <span className="block text-[11px] text-slate-400">Total Lot Weight</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-earth-50 p-3 rounded-2xl border border-earth-200 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Harvest Date</span>
                          <span className="font-semibold text-slate-700">{lot.harvest_date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Moisture</span>
                          <span className="font-semibold text-slate-700">{lot.moisture_percent}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Grade</span>
                          <span className="font-semibold text-slate-700">{lot.grade}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Verification Tier:</span>
                        <span className="font-semibold text-paddy-800 bg-paddy-50 border border-paddy-200 px-2.5 py-0.5 rounded-full text-[11px]">
                          {lot.verification_tier || 'SELF_DECLARED'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-earth-200 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Status: <strong className="text-slate-800">{lot.status}</strong>
                      </span>

                      {!hasPickup ? (
                        <button
                          onClick={() => {
                            setPickupTargetLot(lot);
                            setActionError(null);
                          }}
                          className="bg-paddy-700 hover:bg-paddy-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
                        >
                          <Truck className="w-3.5 h-3.5" /> Request Pickup
                        </button>
                      ) : (
                        <span className="bg-earth-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-xl">
                          Pickup Initiated
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

      {/* TAB 4: PICKUP TRACKING (Section 21, 23) */}
      {activeTab === 'pickups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-xl text-slate-800">Farm Gate Pickup Tracking</h3>
            <span className="text-xs text-slate-500">Live logistics checkpoints from farm to mill</span>
          </div>

          {myPickups.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-earth-200">
              <Truck className="w-10 h-10 text-earth-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No active pickup requests</p>
              <p className="text-xs text-slate-500 mt-1">
                Harvest your pledged produce to request coordinated cooperative logistics.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myPickups.map((pk) => {
                const lot = pk.produce_lot;
                const unit = pk.processing_unit;
                const isRequested = Boolean(pk.status);
                const isAssigned = pk.status !== 'REQUESTED' && Boolean(pk.vehicle_number);
                const isScheduled = pk.status === 'SCHEDULED' || pk.status === 'PICKED_UP' || pk.status === 'RECEIVED';
                const isPickedUp = pk.status === 'PICKED_UP' || pk.status === 'RECEIVED';
                const isReceived = pk.status === 'RECEIVED';

                return (
                  <div
                    key={pk.id}
                    className="bg-white rounded-3xl p-6 border border-earth-200 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-earth-200">
                      <div>
                        <span className="font-mono text-xs font-bold text-paddy-900 bg-paddy-100 px-2 py-0.5 rounded">
                          {lot ? lot.lot_code : 'LOT'}
                        </span>
                        <h4 className="font-serif font-bold text-lg text-slate-900 mt-1">
                          Pickup for {lot?.qty_kg || 'Lot'} kg • {lot?.variety || 'Paddy'}
                        </h4>
                        <p className="text-xs text-slate-500">Location: {pk.pickup_location}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400 block">Processing Destination</span>
                        <span className="font-bold text-paddy-900 text-sm">
                          {unit ? unit.name : 'Cooperative Unit Assigning'}
                        </span>
                      </div>
                    </div>

                    {/* Checkpoints from Section 23 */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div
                        className={`p-3 rounded-2xl border ${
                          isRequested ? 'bg-paddy-50 border-paddy-300 text-paddy-900 font-bold' : 'bg-earth-50 text-slate-400'
                        }`}
                      >
                        <span className="block text-base">{isRequested ? '✓' : '○'}</span>
                        <span className="mt-1 block">Pickup Requested</span>
                        <span className="text-[10px] text-slate-500 block font-normal">{pk.requested_date}</span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isAssigned ? 'bg-paddy-50 border-paddy-300 text-paddy-900 font-bold' : 'bg-earth-50 text-slate-400'
                        }`}
                      >
                        <span className="block text-base">{isAssigned ? '✓' : '○'}</span>
                        <span className="mt-1 block">Vehicle Assigned</span>
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {pk.vehicle_number || 'Pending'}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isScheduled ? 'bg-paddy-50 border-paddy-300 text-paddy-900 font-bold' : 'bg-earth-50 text-slate-400'
                        }`}
                      >
                        <span className="block text-base">{isScheduled ? '✓' : '○'}</span>
                        <span className="mt-1 block">Pickup Scheduled</span>
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {pk.scheduled_date || 'Pending'}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isPickedUp ? 'bg-paddy-50 border-paddy-300 text-paddy-900 font-bold' : 'bg-earth-50 text-slate-400'
                        }`}
                      >
                        <span className="block text-base">{isPickedUp ? '✓' : '○'}</span>
                        <span className="mt-1 block">Picked Up</span>
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {isPickedUp ? 'In Transit' : 'Awaiting Driver'}
                        </span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl border ${
                          isReceived ? 'bg-paddy-50 border-paddy-300 text-paddy-900 font-bold' : 'bg-earth-50 text-slate-400'
                        }`}
                      >
                        <span className="block text-base">{isReceived ? '✓' : '○'}</span>
                        <span className="mt-1 block">Received at Mill</span>
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {isReceived ? 'Weighed & Stored' : 'Pending Receipt'}
                        </span>
                      </div>
                    </div>

                    {/* Driver & Truck Details if assigned */}
                    {pk.driver_name && (
                      <div className="bg-earth-50 p-3 rounded-xl border border-earth-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Driver: <strong>{pk.driver_name}</strong> ({pk.driver_phone || 'Contact via FPO'})
                        </span>
                        <span>Vehicle Number: <strong className="font-mono">{pk.vehicle_number}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: EARNINGS LEDGER (Section 16, 17, 38) */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-xl text-slate-800">Farmer Financial Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparent 70% advance estimate upon demand confirmation and 30% balance settlement on buyer delivery.
              </p>
            </div>
          </div>

          {/* Prominent Disclaimer (Section 16, 38) */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Ledger Accounting Notice</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Amounts are ledger estimates; no payment gateway is connected. "Released" status in the Sasyathra ledger indicates fulfillment settlement; actual banking transfers are executed via offline FPO accounts.
              </p>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-earth-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400 block uppercase">Total Gross Value</span>
              <span className="text-3xl font-serif font-bold text-slate-900 mt-1 block">
                ₹{totalGross.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Cumulative pledge valuation</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-earth-200 shadow-sm">
              <span className="text-xs font-semibold text-paddy-700 block uppercase">Estimated Advance (70%)</span>
              <span className="text-3xl font-serif font-bold text-paddy-900 mt-1 block">
                ₹{totalAdvance.toLocaleString()}
              </span>
              <span className="text-[11px] text-paddy-700 mt-1 block">Credited upon 100% demand match</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-earth-200 shadow-sm">
              <span className="text-xs font-semibold text-purple-700 block uppercase">Estimated Balance (30%)</span>
              <span className="text-3xl font-serif font-bold text-purple-900 mt-1 block">
                ₹{totalBalance.toLocaleString()}
              </span>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Released: ₹{releasedBalance.toLocaleString()}</span>
                <span>Pending: ₹{pendingBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          {myLedger.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-earth-200">
              <IndianRupee className="w-10 h-10 text-earth-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No ledger entries recorded</p>
              <p className="text-xs text-slate-500 mt-1">Pledge produce against open buyer demands to populate your ledger.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-earth-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-earth-100 text-slate-700 font-semibold border-b border-earth-200">
                    <tr>
                      <th className="p-4">Demand Order</th>
                      <th className="p-4">Gross Valuation</th>
                      <th className="p-4">70% Advance</th>
                      <th className="p-4">30% Balance</th>
                      <th className="p-4">Balance Status</th>
                      <th className="p-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-200">
                    {myLedger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-earth-50/50">
                        <td className="p-4">
                          <strong className="text-slate-900 font-serif text-sm block">
                            {entry.demand?.product || 'Paddy'}
                          </strong>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Buyer: {entry.demand?.buyer_name || 'Buyer'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          ₹{Number(entry.gross_amount).toLocaleString()}
                        </td>
                        <td className="p-4 text-paddy-800 font-bold">
                          ₹{Number(entry.advance_amount).toLocaleString()}
                          <span className="block text-[10px] text-paddy-600 font-normal">Advance Estimate</span>
                        </td>
                        <td className="p-4 text-purple-900 font-bold">
                          ₹{Number(entry.balance_amount).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              entry.balance_status === 'RELEASED'
                                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          >
                            {entry.balance_status === 'RELEASED' ? 'RELEASED' : 'PENDING'}
                          </span>
                          {entry.released_at && (
                            <span className="block text-[10px] text-slate-400 mt-1">
                              Settled on buyer receipt
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 text-[11px] max-w-xs">
                          {entry.note}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: FARMER PROFILE (Section 10) */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-earth-200 shadow-sm max-w-2xl">
          <h3 className="font-serif font-bold text-xl text-slate-800 mb-4">Farmer Profile & Farm Details</h3>
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
                <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 font-bold text-slate-800">
                  {activeFarmer?.name || 'Ramesh Goud'}
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
                <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 font-bold text-slate-800">
                  {activeFarmer?.phone || '+91 94401 55667'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Village</label>
                <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 font-bold text-slate-800">
                  {activeFarmer?.village || 'Dharmasagar'}
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">District</label>
                <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 font-bold text-slate-800">
                  {activeFarmer?.district || 'Warangal'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Farm Size</label>
                <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 font-bold text-slate-800">
                  {activeFarmer?.farm_size_acres || 4.5} Acres
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Preferred Paddy Varieties</label>
                <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 font-bold text-slate-800">
                  {activeFarmer?.preferred_varieties?.join(', ') || 'Sona Masuri, BPT 5204'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLEDGE MODAL (Section 13, 14) */}
      {pledgeTargetDemand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-paddy-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Pledge Produce</h3>
                <p className="text-xs text-paddy-200">Commit harvest portion to confirmed buyer order</p>
              </div>
              <button
                onClick={() => setPledgeTargetDemand(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePledgeSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="p-3.5 bg-earth-50 rounded-2xl border border-earth-200 space-y-1">
                <div className="font-bold text-slate-800 text-sm">
                  {pledgeTargetDemand.product} Paddy ({pledgeTargetDemand.buyer_name})
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Price Rate: ₹{pledgeTargetDemand.price_per_kg}/kg</span>
                  <span className="font-bold text-amber-800">
                    Remaining: {Number(pledgeTargetDemand.qty_kg) - Number(pledgeTargetDemand.matched_kg || 0)} kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pledge Quantity (kg)
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  value={pledgeForm.qty_kg}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, qty_kg: e.target.value })}
                  placeholder="Enter kg to commit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 text-sm font-bold focus:ring-2 focus:ring-paddy-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    required
                    value={pledgeForm.expected_harvest_date}
                    onChange={(e) => setPledgeForm({ ...pledgeForm, expected_harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Est. Moisture %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="20"
                    required
                    value={pledgeForm.moisture_percent}
                    onChange={(e) => setPledgeForm({ ...pledgeForm, moisture_percent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Grain Grade
                </label>
                <select
                  value={pledgeForm.grade}
                  onChange={(e) => setPledgeForm({ ...pledgeForm, grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 font-medium"
                >
                  <option value="Grade A">Grade A (Uniform long grain, clean)</option>
                  <option value="Standard Grade">Standard Grade</option>
                  <option value="Coarse Bold">Coarse Bold</option>
                </select>
              </div>

              {/* Earnings Math Live Preview (Section 16) */}
              {Number(pledgeForm.qty_kg) > 0 && (
                <div className="p-3 bg-paddy-50 rounded-xl border border-paddy-200 text-paddy-950 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Estimated Gross:</span>
                    <span>₹{(Number(pledgeForm.qty_kg) * Number(pledgeTargetDemand.price_per_kg)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-paddy-800">
                    <span>70% Advance on Match:</span>
                    <strong>
                      ₹{Math.round(Number(pledgeForm.qty_kg) * Number(pledgeTargetDemand.price_per_kg) * 0.70).toLocaleString()}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>30% Balance on Delivery:</span>
                    <span>
                      ₹{Math.round(Number(pledgeForm.qty_kg) * Number(pledgeTargetDemand.price_per_kg) * 0.30).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-paddy-700 hover:bg-paddy-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Submitting Pledge…' : 'Confirm Pledge'}
                </button>
                <button
                  type="button"
                  onClick={() => setPledgeTargetDemand(null)}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT HARVEST MODAL (Section 18, 19) */}
      {harvestTargetContrib && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
            <div className="bg-paddy-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Report Harvest</h3>
                <p className="text-xs text-paddy-200">Convert confirmed pledge into a physical Produce Lot</p>
              </div>
              <button
                onClick={() => setHarvestTargetContrib(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleHarvestSubmit} className="p-6 space-y-4 text-xs">
              {actionError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl font-medium">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Actual Harvested Quantity (kg)
                </label>
                <input
                  type="number"
                  required
                  value={harvestForm.qty_kg}
                  onChange={(e) => setHarvestForm({ ...harvestForm, qty_kg: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Harvest Date
                  </label>
                  <input
                    type="date"
                    required
                    value={harvestForm.harvest_date}
                    onChange={(e) => setHarvestForm({ ...harvestForm, harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Moisture % (Scale Test)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={harvestForm.moisture_percent}
                    onChange={(e) => setHarvestForm({ ...harvestForm, moisture_percent: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Physical Quality Grade
                </label>
                <select
                  value={harvestForm.grade}
                  onChange={(e) => setHarvestForm({ ...harvestForm, grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 font-medium"
                >
                  <option value="Grade A">Grade A (High Density, Low Chaff)</option>
                  <option value="Standard Grade">Standard Grade</option>
                  <option value="Commercial Grade">Commercial Grade</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-harvest-500 hover:bg-harvest-600 text-paddy-950 font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Generating Lot ID…' : 'Generate Produce Lot ID'}
                </button>
                <button
                  type="button"
                  onClick={() => setHarvestTargetContrib(null)}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST PICKUP MODAL (Section 21) */}
      {pickupTargetLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
            <div className="bg-paddy-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Request Field Pickup</h3>
                <p className="text-xs text-paddy-200">
                  Notify cooperative logistics coordinator for Lot {pickupTargetLot.lot_code}
                </p>
              </div>
              <button
                onClick={() => setPickupTargetLot(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePickupSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Farm Pickup Location
                </label>
                <input
                  type="text"
                  required
                  value={pickupForm.pickup_location}
                  onChange={(e) => setPickupForm({ ...pickupForm, pickup_location: e.target.value })}
                  placeholder="e.g. Dharmasagar Farm Gate Plot #4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-earth-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Preferred Pickup Date
                </label>
                <input
                  type="date"
                  required
                  value={pickupForm.preferred_date}
                  onChange={(e) => setPickupForm({ ...pickupForm, preferred_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Loading Instructions / Notes
                </label>
                <textarea
                  rows="2"
                  value={pickupForm.notes}
                  onChange={(e) => setPickupForm({ ...pickupForm, notes: e.target.value })}
                  placeholder="e.g. Tractor accessible road, 40kg gunny bags stacked"
                  className="w-full px-3 py-2 rounded-xl border border-earth-300"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="flex-1 bg-paddy-700 hover:bg-paddy-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  {loadingAction ? 'Sending Request…' : 'Submit Pickup Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setPickupTargetLot(null)}
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
