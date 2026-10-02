import React from 'react';
import {
  Wheat,
  Building2,
  Sprout,
  Factory,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Truck,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export default function LandingPage({ onSelectRole, onOpenTrace, onOpenScanner }) {
  return (
    <div className="space-y-16 py-6 animate-fade-in">
      {/* Hero Section (Section 55) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-paddy-900 via-paddy-950 to-earth-900 text-white p-8 md:p-16 shadow-2xl border border-paddy-800">
        <div className="absolute inset-0 bg-[radial-gradient(#4a8f4a_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-harvest-400/20 text-harvest-300 border border-harvest-400/30 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase">
            <Wheat className="w-4 h-4 text-harvest-400" />
            Demand-First Paddy Supply Chain Platform
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
            Sasyathra
          </h1>

          <p className="font-serif italic text-xl md:text-2xl text-harvest-200">
            Where Every Harvest Finds a Home
          </p>

          <p className="text-sm md:text-base text-paddy-200 leading-relaxed max-w-2xl mx-auto font-normal">
            Instead of farmers producing speculatively and searching for buyers, Sasyathra aggregates institutional demand first, secures farmer pledges, coordinates cooperative milling, and guarantees end-to-end QR traceability.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={() => onSelectRole('buyer')}
              className="bg-harvest-400 hover:bg-harvest-500 text-paddy-950 font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" /> Buyer Portal
            </button>

            <button
              onClick={() => onSelectRole('farmer')}
              className="bg-paddy-600 hover:bg-paddy-500 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Sprout className="w-4 h-4" /> Farmer Portal
            </button>

            <button
              onClick={() => onSelectRole('coop')}
              className="bg-earth-800 hover:bg-earth-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition shadow-lg hover:shadow-xl flex items-center gap-2 border border-earth-600"
            >
              <Factory className="w-4 h-4" /> Cooperative Unit
            </button>

            <button
              onClick={onOpenScanner}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3.5 rounded-2xl text-sm transition border border-white/20 flex items-center gap-2"
            >
              <QrCode className="w-4 h-4 text-harvest-300" /> Scan Batch QR
            </button>
          </div>
        </div>
      </section>

      {/* The Central Idea Flow (Section 1, 5) */}
      <section className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-earth-200">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="text-xs font-bold text-paddy-700 uppercase tracking-wider">The Demand-First Revolution</span>
          <h2 className="font-serif text-3xl font-bold text-slate-900 mt-1">
            Demand First ➔ Zero Distress Selling
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Traditional farming forces speculative cultivation. Sasyathra reverses the pipeline to bring predictability and dignity to rice farmers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-paddy-100 text-paddy-700 flex items-center justify-center font-bold text-sm mb-3">
                1
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">Buyer Aggregation</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Supermarkets, hotels, and canteens post exact paddy variety, quantity (kg), and guaranteed fair price brackets.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-earth-200 text-[11px] font-semibold text-paddy-800">
              Guaranteed Purchase Order
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-harvest-100 text-harvest-800 flex items-center justify-center font-bold text-sm mb-3">
                2
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">Farmer Pledging</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Farmers commit portions of their crop with moisture and grade specifications. Atomic locking prevents over-pledging.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-earth-200 text-[11px] font-semibold text-harvest-800">
              70% Advance Ledger Estimate
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-paddy-100 text-paddy-700 flex items-center justify-center font-bold text-sm mb-3">
                3
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">Cooperative Milling</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Local FPOs coordinate farmer field pickup, verify capacity limits, batch mill lots, and conduct quality checks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-earth-200 text-[11px] font-semibold text-paddy-800">
              Verified Capacity & Quality
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-earth-50 border border-earth-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm mb-3">
                4
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900">QR Traceability</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Every milling batch is encoded with a public QR. Upon buyer delivery confirmation, final balance is settled in the ledger.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-earth-200 text-[11px] font-semibold text-purple-800">
              30% Balance Released
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (Section 56 - 7 Steps) */}
      <section className="bg-earth-100 rounded-3xl p-8 md:p-12 border border-earth-200">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-paddy-800 uppercase tracking-wider">Sequential Workflow</span>
          <h2 className="font-serif text-3xl font-bold text-slate-900 mt-1">7 Steps from Demand to Settlement</h2>
          <p className="text-xs text-slate-500 mt-1">Every transition generates verifiable database trace events.</p>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {[
            { step: '1', title: 'Buyer Posts Demand', desc: 'Buyer sets variety, delivery date, target price range, and quantity (e.g. 2,000 kg Sona Masuri).' },
            { step: '2', title: 'Farmers Pledge Produce', desc: 'Smallholder farmers view open demands in their district and commit available harvest lots.' },
            { step: '3', title: 'Demand Gets Confirmed', desc: 'Once pledged quantity reaches 100%, the order auto-confirms and the 70% advance ledger entry is recorded.' },
            { step: '4', title: 'Harvest & Field Pickup', desc: 'Farmers report harvest to generate LOT codes. Cooperative assigns pickup vehicle and receives paddy at mill.' },
            { step: '5', title: 'Cooperative Milling', desc: 'Cooperative checks daily capacity, groups farmer lots into a processing batch, and mills the paddy.' },
            { step: '6', title: 'QR Traceability Generated', desc: 'A public traceability record is created showing farmer origins, milling facility, and verified quality tiers.' },
            { step: '7', title: 'Delivery & Balance Released', desc: 'Cooperative delivers to buyer warehouse. Buyer confirmation triggers 30% farmer ledger balance release.' },
          ].map((item) => (
            <div key={item.step} className="bg-white p-4 rounded-2xl border border-earth-200 flex items-center gap-4 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-paddy-800 text-harvest-300 font-bold flex items-center justify-center shrink-0 text-sm">
                {item.step}
              </div>
              <div className="flex-1">
                <h4 className="font-serif font-bold text-slate-900 text-sm">{item.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      </section>

      {/* Know where your rice came from (Section 57) */}
      <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-earth-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-harvest-700 bg-harvest-100 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Public Verifiable Origin
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 leading-snug">
              Know exactly where your rice came from.
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              Scan any batch QR on the bag to see the transparent harvest timeline: which villages grew the paddy, which cooperative milled it, the moisture readings, and the delivery trail.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="bg-earth-100 text-slate-700 px-3 py-1.5 rounded-lg border border-earth-300">
                Farmer Privacy Protected
              </span>
              <span className="bg-earth-100 text-slate-700 px-3 py-1.5 rounded-lg border border-earth-300">
                Multi-Farmer Lot Aggregation
              </span>
              <span className="bg-earth-100 text-slate-700 px-3 py-1.5 rounded-lg border border-earth-300">
                Zero Login Needed
              </span>
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={() => onOpenTrace('BATCH-2026-00001')}
                className="bg-paddy-800 hover:bg-paddy-900 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              >
                Inspect Sample Batch <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onOpenScanner}
                className="bg-earth-100 hover:bg-earth-200 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs border border-earth-300 transition"
              >
                Launch QR Camera
              </button>
            </div>
          </div>

          <div className="bg-earth-50 border border-earth-300 rounded-3xl p-6 text-center shadow-inner space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-md inline-block">
              <QrCode className="w-32 h-32 text-paddy-900 mx-auto" />
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-paddy-900">BATCH-2026-00001</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Sona Masuri • Warangal Cooperative Processing Unit</p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Positioning (Section 16, 69) */}
      <section className="bg-earth-200/60 rounded-2xl p-6 border border-earth-300 text-xs text-slate-600">
        <h4 className="font-serif font-bold text-slate-800 text-sm mb-1">Transparent Agricultural Ledger</h4>
        <p>
          Sasyathra computes financial advances (70%) and final balances (30%) strictly within an estimated platform ledger. No payment gateway or bank transfer is falsely simulated. All supply chain records and capacity constraints are validated in PostgreSQL.
        </p>
      </section>
    </div>
  );
}
