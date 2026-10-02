import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Clock,
  CheckCircle2,
  Truck,
  Factory,
  PackageCheck,
  AlertCircle,
  MapPin,
  Calendar,
  Wheat,
  IndianRupee,
  Layers,
  QrCode,
  ArrowRight,
  Filter
} from 'lucide-react';
import { sasyathraService } from '../lib/sasyathraService';

export default function BuyerPortal({ demands = [], activeBuyer, onOpenTrace }) {
  const [showPostModal, setShowPostModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form state (Section 8)
  const [form, setForm] = useState({
    product: 'Sona Masuri',
    qty_kg: 1000,
    location: activeBuyer?.village || 'Hyderabad Central',
    district: activeBuyer?.district || 'Hyderabad',
    required_date: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    price_per_kg: 45,
    price_min: 42,
    price_max: 48,
    quality_requirements: 'Standard Grade, moisture <= 14%, uniform whole grain',
    notes: 'Direct delivery to central receiving dock.'
  });

  // Filter demands for this buyer or all if general
  const myDemands = demands.filter(
    (d) => !activeBuyer?.id || d.buyer_id === activeBuyer.id || d.buyer_name?.includes('Hyderabad')
  );

  // Overview Metrics (Section 7)
  const activeCount = myDemands.filter((d) => d.status === 'OPEN').length;
  const confirmedCount = myDemands.filter((d) => d.status === 'CONFIRMED').length;
  const processingCount = myDemands.filter((d) => d.status === 'PROCESSING').length;
  const readyCount = myDemands.filter((d) => d.status === 'READY').length;
  const deliveredCount = myDemands.filter((d) => d.status === 'DELIVERED').length;

  const handlePostDemand = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await sasyathraService.postDemand({
        buyer_id: activeBuyer?.id,
        buyer_name: activeBuyer?.name || 'Hyderabad Supermarket',
        ...form
      });
      setSuccessMsg('Demand successfully posted to the network. Farmers can now pledge supply.');
      setShowPostModal(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to post demand.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOrderStatusIndex = (status) => {
    switch (status) {
      case 'OPEN':
        return 0; // Aggregating
      case 'CONFIRMED':
        return 1; // Order Confirmed
      case 'PROCESSING':
        return 4; // Cooperative Processing
      case 'READY':
        return 5; // Ready for Delivery
      case 'DELIVERED':
        return 7; // Delivered
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner / Persona Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-earth-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-paddy-700 bg-paddy-50 border border-paddy-200 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Buyer Procurement Portal
            </span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900">
            {activeBuyer?.name || 'Hyderabad Supermarket'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-earth-500" />
            <span>{activeBuyer?.village || 'Ameerpet Central'}, {activeBuyer?.district || 'Hyderabad'}</span>
            <span>•</span>
            <span>Procurement Office: {activeBuyer?.phone || '+91 98490 11223'}</span>
          </p>
        </div>

        <button
          onClick={() => setShowPostModal(true)}
          className="bg-paddy-700 hover:bg-paddy-800 text-white font-bold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 transition shadow-sm hover:shadow self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" /> Post New Paddy Demand
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-paddy-50 border border-paddy-300 text-paddy-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-paddy-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Overview Metric Cards (Section 7) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Active Demands</div>
          <div className="text-2xl font-serif font-bold text-paddy-900">{activeCount}</div>
          <div className="text-[10px] text-paddy-600 mt-0.5">Aggregating pledges</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirmed Orders</div>
          <div className="text-2xl font-serif font-bold text-harvest-700">{confirmedCount}</div>
          <div className="text-[10px] text-harvest-700 mt-0.5">100% matched</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">In Processing</div>
          <div className="text-2xl font-serif font-bold text-blue-700">{processingCount}</div>
          <div className="text-[10px] text-blue-600 mt-0.5">At cooperative mill</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Ready for Delivery</div>
          <div className="text-2xl font-serif font-bold text-purple-700">{readyCount}</div>
          <div className="text-[10px] text-purple-600 mt-0.5">Milled & bagged</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-earth-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Delivered Orders</div>
          <div className="text-2xl font-serif font-bold text-emerald-700">{deliveredCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Settled & finalized</div>
        </div>
      </div>

      {/* Demand Tracking List (Section 9 & 36) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-xl text-slate-800">Demand Orders & Live Fulfillment</h3>
          <span className="text-xs text-slate-500 font-medium">Real-time supply chain aggregation</span>
        </div>

        {myDemands.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-earth-200">
            <Wheat className="w-10 h-10 text-earth-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No demands posted yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
              Post your paddy procurement requirements so local farmers and cooperatives can pledge their harvest.
            </p>
            <button
              onClick={() => setShowPostModal(true)}
              className="bg-paddy-700 hover:bg-paddy-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              Post First Demand
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {myDemands.map((demand) => {
              const matched = Number(demand.matched_kg) || 0;
              const total = Number(demand.qty_kg);
              const remaining = Math.max(0, total - matched);
              const percent = Math.min(100, Math.round((matched / total) * 100));
              const isConfirmed = matched >= total;
              const batches = demand.processing_batches || [];

              return (
                <div
                  key={demand.id}
                  className="bg-white rounded-3xl p-6 md:p-8 border border-earth-200 shadow-sm space-y-6 hover:border-paddy-300 transition"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-earth-200">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            demand.status === 'OPEN'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : demand.status === 'CONFIRMED'
                              ? 'bg-paddy-100 text-paddy-900 border border-paddy-300'
                              : demand.status === 'PROCESSING'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : demand.status === 'READY'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {demand.status === 'CONFIRMED' ? '✓ Demand Fully Matched' : demand.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {demand.id.substring(0, 8)}…
                        </span>
                      </div>
                      <h4 className="font-serif text-2xl font-bold text-slate-900">{demand.product} Paddy</h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-earth-500" /> {demand.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-earth-500" /> Delivery Target: {demand.required_date}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">Offered Price Range</div>
                      <div className="text-xl font-bold text-paddy-900 font-serif">
                        ₹{demand.price_min || demand.price_per_kg} – ₹{demand.price_max || demand.price_per_kg} / kg
                      </div>
                      <div className="text-[11px] text-slate-400">Advance Commitment: 70%</div>
                    </div>
                  </div>

                  {/* Live Demand Tracking (Section 9) */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-slate-700">
                        Supply Aggregation Progress:{' '}
                        <strong className="text-paddy-900">{matched} kg</strong> of {total} kg pledged
                      </span>
                      <span className="font-bold text-paddy-800 text-sm font-mono">{percent}%</span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-3.5 bg-earth-100 rounded-full overflow-hidden p-0.5 border border-earth-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percent >= 100
                            ? 'bg-gradient-to-r from-paddy-600 to-emerald-600'
                            : 'bg-gradient-to-r from-harvest-500 to-paddy-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-center">
                      <div className="p-2 rounded-xl bg-earth-50 border border-earth-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Required</span>
                        <span className="font-bold text-slate-800">{total} kg</span>
                      </div>
                      <div className="p-2 rounded-xl bg-earth-50 border border-earth-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Pledged</span>
                        <span className="font-bold text-paddy-800">{matched} kg</span>
                      </div>
                      <div className="p-2 rounded-xl bg-earth-50 border border-earth-200">
                        <span className="text-[10px] text-slate-400 block uppercase">Remaining</span>
                        <span className={`font-bold ${remaining > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          {remaining} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Order Progress Tracker (Section 36) */}
                  <div className="pt-2">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Fulfillment Pipeline
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 text-center text-[10px] font-medium">
                      {[
                        { label: 'Confirmed', step: 1 },
                        { label: 'Harvesting', step: 2 },
                        { label: 'Pickup', step: 3 },
                        { label: 'Received', step: 4 },
                        { label: 'Processing', step: 5 },
                        { label: 'Ready', step: 6 },
                        { label: 'Delivered', step: 7 }
                      ].map((st) => {
                        const activeIdx = getOrderStatusIndex(demand.status);
                        const isDone = activeIdx >= st.step;
                        const isCurrent = activeIdx === st.step;
                        return (
                          <div
                            key={st.label}
                            className={`p-2 rounded-xl border ${
                              isCurrent
                                ? 'bg-paddy-100 border-paddy-400 text-paddy-900 font-bold'
                                : isDone
                                ? 'bg-paddy-50 border-paddy-200 text-paddy-800'
                                : 'bg-earth-50 border-earth-200 text-slate-400'
                            }`}
                          >
                            <span className="block text-xs">{isDone ? '✓' : '○'}</span>
                            <span className="mt-0.5 block">{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quality & Batch Traceability Link */}
                  <div className="pt-3 border-t border-earth-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      <span className="font-semibold text-slate-700">Quality Spec:</span> {demand.quality_requirements || 'Standard Grade'}
                    </div>

                    {batches.length > 0 ? (
                      <div className="flex items-center gap-2">
                        {batches.map((b) => (
                          <button
                            key={b.id || b.batch_code}
                            onClick={() => onOpenTrace(b.batch_code)}
                            className="bg-harvest-400 hover:bg-harvest-500 text-paddy-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" /> View Traceability ({b.batch_code})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        QR Batch traceability will activate upon cooperative milling.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Demand Modal (Section 8) */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-earth-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-paddy-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Post Paddy Demand</h3>
                <p className="text-xs text-paddy-200">Broadcast your institutional procurement requirement to farmers</p>
              </div>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePostDemand} className="p-6 overflow-y-auto space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Paddy Variety
                  </label>
                  <select
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500 font-medium"
                  >
                    <option value="Sona Masuri">Sona Masuri</option>
                    <option value="Basmati">Basmati (Aromatic Long Grain)</option>
                    <option value="BPT 5204">BPT 5204 (Samba Mahsuri)</option>
                    <option value="Telangana Sona">Telangana Sona (RNR 15048)</option>
                    <option value="Standard Paddy">Standard Grade Coarse Paddy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity Required (kg)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={form.qty_kg}
                    onChange={(e) => setForm({ ...form, qty_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Delivery Location
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Hyderabad Central"
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Required Delivery Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.required_date}
                    onChange={(e) => setForm({ ...form, required_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500 font-medium"
                  />
                </div>
              </div>

              {/* Price Range */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={form.price_per_kg}
                    onChange={(e) => setForm({ ...form, price_per_kg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Min Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={form.price_min}
                    onChange={(e) => setForm({ ...form, price_min: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Max Price (₹/kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={form.price_max}
                    onChange={(e) => setForm({ ...form, price_max: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Quality Requirements
                </label>
                <input
                  type="text"
                  value={form.quality_requirements}
                  onChange={(e) => setForm({ ...form, quality_requirements: e.target.value })}
                  placeholder="e.g. Standard Grade, moisture <= 14%, clean whole grain"
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Procurement Notes
                </label>
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional logistics or packaging instructions"
                  className="w-full px-3 py-2 rounded-xl border border-earth-300 focus:ring-2 focus:ring-paddy-500"
                ></textarea>
              </div>

              {/* Financial Commitment Preview */}
              <div className="p-3 bg-earth-50 rounded-xl border border-earth-200 text-slate-700">
                <div className="flex justify-between font-semibold">
                  <span>Total Order Budget:</span>
                  <span className="font-serif text-sm font-bold text-paddy-900">
                    ₹{(Number(form.qty_kg || 0) * Number(form.price_per_kg || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>Farmer Advance Pool (70%):</span>
                  <span>₹{Math.round(Number(form.qty_kg || 0) * Number(form.price_per_kg || 0) * 0.70).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-paddy-700 hover:bg-paddy-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  {submitting ? 'Posting Demand…' : 'Submit & Open for Farmer Pledging'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
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
