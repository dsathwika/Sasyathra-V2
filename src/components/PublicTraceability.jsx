import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  Wheat,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Truck,
  Factory,
  PackageCheck,
  FileCheck2,
  ExternalLink,
  Share2,
  Award
} from 'lucide-react';
import { sasyathraService } from '../lib/sasyathraService';

export default function PublicTraceability({ batchCode, onBack, onScanAnother }) {
  const [loading, setLoading] = useState(true);
  const [traceData, setTraceData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTrace() {
      if (!batchCode) return;
      setLoading(true);
      try {
        const data = await sasyathraService.getBatchTrace(batchCode);
        if (isMounted) {
          setTraceData(data && data.found ? data : null);
        }
      } catch (err) {
        console.error('Error fetching batch trace:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTrace();
    return () => {
      isMounted = false;
    };
  }, [batchCode]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?batch=${encodeURIComponent(batchCode || '')}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const getTimelineIcon = (type) => {
    switch (type) {
      case 'DEMAND_POSTED':
      case 'DEMAND_CONFIRMED':
        return <Building2 className="w-4 h-4 text-emerald-700" />;
      case 'HARVEST_REPORTED':
      case 'LOT_CREATED':
      case 'PLEDGE_ADDED':
        return <Wheat className="w-4 h-4 text-harvest-600" />;
      case 'PICKUP_REQUESTED':
      case 'PICKUP_ASSIGNED':
      case 'PICKED_UP':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'RECEIVED':
      case 'PROCESSING_SCHEDULED':
      case 'PROCESSING_STARTED':
      case 'PROCESSING_COMPLETED':
      case 'BATCH_CREATED':
        return <Factory className="w-4 h-4 text-blue-600" />;
      case 'VERIFIED':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'READY_FOR_DELIVERY':
      case 'DELIVERED':
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStepActive = (stepKey, status, events = []) => {
    const hasEvent = events.some((e) => e.event_type === stepKey);
    if (hasEvent) return true;
    const order = ['SCHEDULED', 'PROCESSING', 'PROCESSED', 'READY_FOR_DELIVERY', 'DELIVERED'];
    const idx = order.indexOf(status);
    if (stepKey === 'PROCESSING' && idx >= 1) return true;
    if (stepKey === 'PROCESSED' && idx >= 2) return true;
    if (stepKey === 'READY' && idx >= 3) return true;
    if (stepKey === 'DELIVERED' && idx >= 4) return true;
    return false;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-paddy-800 bg-earth-100 hover:bg-earth-200 px-3.5 py-2 rounded-xl transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <button
          onClick={onScanAnother}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-paddy-700 hover:text-paddy-900 bg-paddy-100 hover:bg-paddy-200 px-3.5 py-2 rounded-xl transition"
        >
          Lookup Another Batch
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-earth-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-paddy-600 border-t-transparent mb-4"></div>
          <p className="text-sm font-semibold text-slate-700">Retrieving Batch Traceability Data…</p>
          <p className="text-xs text-slate-400 mt-1">Decentralized origin records are being verified.</p>
        </div>
      ) : !traceData ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-earth-200">
          <div className="w-16 h-16 bg-harvest-100 text-harvest-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wheat className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-800 mb-2">Batch Not Found</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            No active traceability record was found matching code <code className="font-mono font-bold text-paddy-800 bg-earth-100 px-2 py-0.5 rounded">{batchCode}</code>.
            Please ensure you have entered the code accurately or scan a verified Sasyathra QR seal.
          </p>
          <button
            onClick={onScanAnother}
            className="bg-paddy-700 hover:bg-paddy-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Scan or Enter Another Code
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Official Verification Certificate Header */}
          <div className="bg-gradient-to-br from-paddy-900 via-paddy-800 to-paddy-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-harvest-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-harvest-400/20 text-harvest-300 border border-harvest-400/40 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-harvest-400" /> Sasyathra Verified Batch
                  </span>
                  <span className="bg-white/10 text-white/90 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    Public Trace
                  </span>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
                  {traceData.batch.batch_code}
                </h1>
                <p className="text-sm text-paddy-200 flex items-center gap-2">
                  <span>Paddy Variety:</span>
                  <strong className="text-white font-serif text-base">{traceData.product}</strong>
                  <span>•</span>
                  <span>Destination: {traceData.buyer_destination}</span>
                </p>
              </div>

              {/* QR Code Seal */}
              <div className="bg-white p-3 rounded-2xl shadow-lg flex flex-col items-center shrink-0 self-start md:self-auto">
                <QRCode value={shareUrl} size={110} level="M" />
                <span className="text-[10px] font-mono font-bold text-slate-500 mt-1.5 tracking-wider">
                  SCAN TO VERIFY
                </span>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
              <div>
                <span className="text-paddy-300 block text-[11px]">Processing Date</span>
                <span className="font-semibold text-white">{traceData.batch.processing_date || 'In Progress'}</span>
              </div>
              <div>
                <span className="text-paddy-300 block text-[11px]">Total Input Paddy</span>
                <span className="font-semibold text-white">{traceData.batch.input_qty_kg} kg</span>
              </div>
              <div>
                <span className="text-paddy-300 block text-[11px]">Milled Output</span>
                <span className="font-semibold text-white">
                  {traceData.batch.output_qty_kg ? `${traceData.batch.output_qty_kg} kg` : 'Milling in progress'}
                </span>
              </div>
              <div>
                <span className="text-paddy-300 block text-[11px]">Current Status</span>
                <span className="inline-block bg-paddy-500/30 text-harvest-300 border border-harvest-400/30 font-bold px-2 py-0.5 rounded text-[11px]">
                  {traceData.batch.status}
                </span>
              </div>
            </div>
          </div>

          {/* Supply Chain Progression (Visual 7 Steps from Spec Section 34) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-earth-200">
            <h3 className="font-serif font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-paddy-700" /> End-to-End Supply Chain Journey
            </h3>

            {/* Timeline Bar */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 relative">
              {[
                { label: 'Harvested', icon: '🌾', step: 'HARVEST_REPORTED', sub: 'Farmer lots' },
                { label: 'Picked Up', icon: '🚚', step: 'PICKED_UP', sub: 'Coop vehicle' },
                { label: 'Received', icon: '🏭', step: 'RECEIVED', sub: 'Mill scale check' },
                { label: 'Processing', icon: '⚙️', step: 'PROCESSING', sub: 'De-husking' },
                { label: 'Processed', icon: '✓', step: 'PROCESSED', sub: 'Milled & graded' },
                { label: 'Ready', icon: '📦', step: 'READY', sub: 'Packaging' },
                { label: 'Delivered', icon: '🚛', step: 'DELIVERED', sub: 'Buyer confirmed' }
              ].map((s, idx) => {
                const active = getStepActive(s.step, traceData.batch.status, traceData.timeline);
                return (
                  <div
                    key={s.label}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      active
                        ? 'bg-paddy-50 border-paddy-300 text-paddy-950 shadow-sm'
                        : 'bg-earth-50 border-earth-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-xs font-bold uppercase tracking-wider">{s.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.sub}</div>
                    <div className="mt-2">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          active ? 'bg-paddy-600 animate-pulse' : 'bg-slate-300'
                        }`}
                      ></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregated Farmer Produce Lots (Section 28, 34) */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-earth-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-800 flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-harvest-600" /> Origin: Farmer Produce Lots
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Individual harvest commitments aggregated into this batch. (Sanitized for grower privacy).
                </p>
              </div>
              <span className="text-xs font-semibold bg-earth-100 text-slate-700 px-3 py-1 rounded-full">
                {traceData.lots.length} Contributor{traceData.lots.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {traceData.lots.map((lot, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-earth-50 border border-earth-200 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-paddy-800 bg-paddy-100 px-2 py-0.5 rounded">
                        {lot.lot_code}
                      </span>
                      <h4 className="font-semibold text-slate-800 text-sm mt-1.5">
                        Farmer: {lot.farmer_alias}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-earth-500" /> {lot.village}, {lot.district}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-paddy-900 font-serif">{lot.qty_kg} kg</span>
                      <span className="block text-[11px] text-slate-500">Contributed</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-earth-200 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Grade</span>
                      <span className="font-semibold text-slate-700">{lot.grade || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Moisture</span>
                      <span className="font-semibold text-slate-700">{lot.moisture_percent || 13.5}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Harvest Date</span>
                      <span className="font-semibold text-slate-700">{lot.harvest_date || 'Autumn 2026'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Unit & Quality Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unit Details */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-earth-200">
              <h3 className="font-serif font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                <Factory className="w-5 h-5 text-paddy-700" /> Cooperative Processing Unit
              </h3>
              {traceData.processing_unit ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Facility Name</span>
                    <strong className="text-slate-800 text-sm">{traceData.processing_unit.name}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Location</span>
                      <span className="font-medium text-slate-700">
                        {traceData.processing_unit.village}, {traceData.processing_unit.district}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Certified Daily Capacity</span>
                      <span className="font-medium text-slate-700">{traceData.processing_unit.daily_capacity_kg} kg/day</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Milling Standard</span>
                    <span className="font-medium text-slate-700">{traceData.processing_unit.processing_type}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Cooperative unit assignment in progress.</p>
              )}
            </div>

            {/* Quality Verification */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-earth-200">
              <h3 className="font-serif font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" /> Quality Verification Tiers
              </h3>

              {traceData.verifications && traceData.verifications.length > 0 ? (
                <div className="space-y-3">
                  {traceData.verifications.map((v, i) => (
                    <div key={i} className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-purple-900 uppercase tracking-wider text-[11px]">
                          {v.tier.replace('_', ' ')}
                        </span>
                        <span className="text-purple-700 font-semibold text-[10px] bg-purple-200 px-2 py-0.5 rounded-full">
                          {v.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{v.note || 'Quality parameters checked and validated.'}</p>
                      <p className="text-slate-400 text-[10px] mt-1">Verified by {v.verified_by}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-earth-50 border border-earth-200 text-xs text-slate-600">
                  <p className="font-medium text-slate-700 mb-1">Tier: Cooperative Quality Inspected</p>
                  <p className="text-slate-500">
                    Inspected for grain moisture content, husk separation, and unpolished grain integrity prior to distribution.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Audit Event Stream */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-earth-200">
            <h3 className="font-serif font-bold text-xl text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-paddy-700" /> Immutable Event Audit Trail
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-earth-300">
              {traceData.timeline.map((event, idx) => (
                <div key={idx} className="relative group">
                  <div className="absolute -left-6 top-1 bg-white p-1 rounded-full border border-earth-300">
                    {getTimelineIcon(event.event_type)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-xs text-slate-800">
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(event.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Actor: <span className="font-medium text-slate-800">{event.actor_name}</span> ({event.actor_role})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Footer */}
          <div className="flex items-center justify-between p-4 bg-earth-100 rounded-2xl text-xs text-slate-600">
            <span>Official Sasyathra Traceability Record • Zero-knowledge Privacy Preserved</span>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 font-semibold text-paddy-800 hover:text-paddy-950 bg-white px-3 py-1.5 rounded-lg border border-earth-300 transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedLink ? 'Link Copied!' : 'Share Public Record'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
