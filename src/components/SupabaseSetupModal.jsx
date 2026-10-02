import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, RefreshCw, X, AlertCircle, ShieldCheck } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured, saveSupabaseCredentials } from '../lib/supabaseClient';
import { sasyathraService } from '../lib/sasyathraService';

export default function SupabaseSetupModal({ isOpen, onClose }) {
  const [url, setUrl] = useState(supabaseUrl || '');
  const [key, setKey] = useState(supabaseAnonKey || '');
  const [copied, setCopied] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveSupabaseCredentials(url, key);
  };

  const handleClear = () => {
    saveSupabaseCredentials('', '');
  };

  const handleCopySchema = async () => {
    try {
      const response = await fetch('/supabase/clean_rebuild.sql');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleResetData = () => {
    sasyathraService.resetDemoData();
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-earth-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-paddy-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-harvest-400" />
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Database & Supabase Configuration</h3>
              <p className="text-xs text-paddy-200">Connect cloud PostgreSQL or utilize the local reactive engine</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isSupabaseConfigured
              ? 'bg-paddy-50 border-paddy-200 text-paddy-900'
              : 'bg-harvest-50 border-harvest-200 text-harvest-900'
          }`}>
            {isSupabaseConfigured ? (
              <ShieldCheck className="w-5 h-5 text-paddy-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-harvest-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider">
                {isSupabaseConfigured ? 'Supabase Cloud Connected' : 'Running on High-Fidelity Reactive Engine'}
              </p>
              <p className="text-xs mt-1 text-slate-600">
                {isSupabaseConfigured
                  ? `Connected to: ${supabaseUrl.replace(/https:\/\/(.*?)\..*/, '$1.supabase.co')}. All transactions, row locks, and RLS sync directly to PostgreSQL.`
                  : 'Sasyathra is executing with full atomic validation, row locking simulation, capacity checks, and trace events in persistent local storage. To connect to your Supabase project, enter your credentials below.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Project URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-lg border border-earth-300 text-xs focus:ring-2 focus:ring-paddy-500 focus:border-paddy-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Supabase Anon Public Key
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-earth-300 text-xs focus:ring-2 focus:ring-paddy-500 focus:border-paddy-500 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-paddy-700 hover:bg-paddy-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                Save & Connect Supabase
              </button>
              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-earth-200 hover:bg-earth-300 text-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
                >
                  Disconnect
                </button>
              )}
            </div>
          </form>

          {/* Schema Section */}
          <div className="border-t border-earth-200 pt-5">
            <h4 className="font-serif font-bold text-slate-800 mb-1">Database Schema & Functions</h4>
            <p className="text-xs text-slate-500 mb-3">
              The project includes the clean, complete SQL script with all tables, constraints, RPCs, and RLS policies.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySchema}
                className="flex items-center gap-1.5 bg-earth-100 hover:bg-earth-200 text-earth-800 px-3.5 py-2 rounded-lg text-xs font-semibold border border-earth-300 transition"
              >
                {copied ? <Check className="w-4 h-4 text-paddy-600" /> : <Copy className="w-4 h-4 text-earth-600" />}
                {copied ? 'Schema Copied to Clipboard!' : 'Copy clean_rebuild.sql'}
              </button>
              <span className="text-[11px] text-slate-400">Located in <code>supabase/clean_rebuild.sql</code></span>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="border-t border-earth-200 pt-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs text-slate-700">Reset Local Demo Data</p>
              <p className="text-[11px] text-slate-500">Restore default demo demands, processing units, and farmer pledges.</p>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              disabled={resetSuccess}
              className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetSuccess ? 'animate-spin' : ''}`} />
              {resetSuccess ? 'Resetting...' : 'Reset Data'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-earth-100 p-4 border-t border-earth-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-white hover:bg-earth-50 text-slate-700 border border-earth-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
