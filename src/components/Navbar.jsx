import React, { useState } from 'react';
import {
  Wheat,
  Building2,
  Sprout,
  Factory,
  QrCode,
  Database,
  ShieldCheck,
  AlertCircle,
  Menu,
  X,
  ChevronDown,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function Navbar({
  currentView,
  onNavigate,
  activeRole,
  onSwitchRole,
  activeUser,
  onOpenSupabaseModal,
  onOpenScanner
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const personas = [
    {
      role: 'buyer',
      id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Hyderabad Supermarket',
      title: 'Institutional Buyer (Hyderabad)',
      icon: Building2
    },
    {
      role: 'buyer',
      id: 'a2222222-2222-2222-2222-222222222222',
      name: 'Secunderabad Grand Hotel',
      title: 'Hospitality Buyer (Secunderabad)',
      icon: Building2
    },
    {
      role: 'farmer',
      id: 'b1111111-1111-1111-1111-111111111111',
      name: 'Ramesh Goud',
      title: 'Farmer A (Dharmasagar, Warangal - 4.5 Ac)',
      icon: Sprout
    },
    {
      role: 'farmer',
      id: 'b2222222-2222-2222-2222-222222222222',
      name: 'Lakshmi Bai',
      title: 'Farmer B (Huzurabad, Karimnagar - 3.0 Ac)',
      icon: Sprout
    },
    {
      role: 'cooperative',
      id: 'c2222222-2222-2222-2222-222222222222',
      name: 'Warangal Cooperative Processing Unit',
      title: 'Cooperative Mill (1,000 kg/day)',
      icon: Factory
    },
    {
      role: 'cooperative',
      id: 'c1111111-1111-1111-1111-111111111111',
      name: 'Kondapur FPO Mill',
      title: 'FPO Mill (1,500 kg/day)',
      icon: Factory
    }
  ];

  const handleSelectPersona = (p) => {
    onSwitchRole(p.role, p);
    setPersonaDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-earth-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline (Section 1) */}
          <div
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-paddy-700 to-paddy-900 text-harvest-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Wheat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-paddy-950">
                  Sasyathra
                </span>
                <span className="text-[10px] bg-harvest-100 text-harvest-900 font-bold px-2 py-0.5 rounded-full border border-harvest-300 uppercase tracking-widest hidden sm:inline-block">
                  v1.0 Rebuild
                </span>
              </div>
              <p className="text-[11px] font-serif italic text-earth-600 -mt-0.5">
                Where Every Harvest Finds a Home
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-earth-100/70 p-1.5 rounded-2xl border border-earth-200/80">
            <button
              onClick={() => onNavigate('landing')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                currentView === 'landing'
                  ? 'bg-white text-paddy-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => {
                onSwitchRole('buyer');
                onNavigate('portal');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                currentView === 'portal' && activeRole === 'buyer'
                  ? 'bg-paddy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Buyer Portal
            </button>

            <button
              onClick={() => {
                onSwitchRole('farmer');
                onNavigate('portal');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                currentView === 'portal' && activeRole === 'farmer'
                  ? 'bg-paddy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" /> Farmer Portal
            </button>

            <button
              onClick={() => {
                onSwitchRole('coop');
                onNavigate('portal');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                currentView === 'portal' && activeRole === 'coop'
                  ? 'bg-paddy-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Factory className="w-3.5 h-3.5" /> Cooperative Mill
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* QR Scanner Trigger */}
            <button
              onClick={onOpenScanner}
              className="bg-earth-100 hover:bg-earth-200 text-slate-800 p-2.5 rounded-xl border border-earth-300 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Scan or enter Batch QR Code"
            >
              <QrCode className="w-4 h-4 text-paddy-700" />
              <span className="hidden xl:inline">Scan QR</span>
            </button>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="bg-white hover:bg-earth-50 text-slate-800 border border-earth-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="max-w-[140px] truncate">{activeUser?.name || 'Switch Role'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {personaDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-earth-200 py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-earth-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-harvest-500" /> Quick Persona Switcher
                  </div>
                  {personas.map((p) => {
                    const Icon = p.icon;
                    const isSelected = activeUser?.name === p.name;
                    return (
                      <button
                        key={p.name}
                        onClick={() => handleSelectPersona(p)}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-earth-50 flex items-start gap-2.5 transition ${
                          isSelected ? 'bg-paddy-50 font-bold text-paddy-900' : 'text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-paddy-700 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-[10px] text-slate-500">{p.title}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                isSupabaseConfigured
                  ? 'bg-paddy-50 border-paddy-300 text-paddy-900 hover:bg-paddy-100'
                  : 'bg-harvest-50 border-harvest-300 text-harvest-900 hover:bg-harvest-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConfigured ? 'Supabase' : 'Local DB'}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenScanner}
              className="p-2 rounded-xl bg-earth-100 text-slate-800"
            >
              <QrCode className="w-5 h-5 text-paddy-800" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-earth-100 text-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-earth-200 py-4 space-y-3 animate-fade-in text-xs font-semibold">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onSwitchRole('buyer');
                  onNavigate('portal');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-earth-100 text-center flex flex-col items-center gap-1"
              >
                <Building2 className="w-4 h-4 text-paddy-800" />
                <span>Buyer</span>
              </button>
              <button
                onClick={() => {
                  onSwitchRole('farmer');
                  onNavigate('portal');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-earth-100 text-center flex flex-col items-center gap-1"
              >
                <Sprout className="w-4 h-4 text-paddy-800" />
                <span>Farmer</span>
              </button>
              <button
                onClick={() => {
                  onSwitchRole('coop');
                  onNavigate('portal');
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-xl bg-earth-100 text-center flex flex-col items-center gap-1"
              >
                <Factory className="w-4 h-4 text-paddy-800" />
                <span>Cooperative</span>
              </button>
            </div>

            <div className="border-t border-earth-200 pt-3">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-2">Switch Test User:</span>
              <div className="space-y-1">
                {personas.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => handleSelectPersona(p)}
                    className="w-full text-left p-2 rounded-xl bg-white border border-earth-200 flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{p.role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-earth-200 pt-2 flex justify-between">
              <button
                onClick={() => {
                  onOpenSupabaseModal();
                  setMobileMenuOpen(false);
                }}
                className="text-paddy-800 font-bold"
              >
                Database Settings & SQL Schema
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
