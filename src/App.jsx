import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import BuyerPortal from './components/BuyerPortal';
import FarmerPortal from './components/FarmerPortal';
import CooperativePortal from './components/CooperativePortal';
import PublicTraceability from './components/PublicTraceability';
import QrScannerModal from './components/QrScannerModal';
import SupabaseSetupModal from './components/SupabaseSetupModal';
import { sasyathraService } from './lib/sasyathraService';
import { Wheat, ShieldCheck, Heart, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'portal' | 'trace'
  const [activeRole, setActiveRole] = useState('buyer'); // 'buyer' | 'farmer' | 'coop'

  // Initial active persona
  const [activeUser, setActiveUser] = useState({
    id: 'a1111111-1111-1111-1111-111111111111',
    role: 'buyer',
    name: 'Hyderabad Supermarket',
    village: 'Ameerpet Central',
    district: 'Hyderabad',
    phone: '+91 98490 11223'
  });

  const [traceBatchCode, setTraceBatchCode] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Core Data State
  const [demands, setDemands] = useState([]);
  const [processingUnits, setProcessingUnits] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [produceLots, setProduceLots] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [processingBatches, setProcessingBatches] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all supply chain data
  const loadAllData = useCallback(async () => {
    try {
      const [d, u, c, pLots, pReqs, b, led] = await Promise.all([
        sasyathraService.getDemands(),
        sasyathraService.getProcessingUnits(),
        sasyathraService.getContributions(),
        sasyathraService.getProduceLots(),
        sasyathraService.getPickupRequests(),
        sasyathraService.getProcessingBatches(),
        sasyathraService.getLedgerEntries()
      ]);

      setDemands(d || []);
      setProcessingUnits(u || []);
      setContributions(c || []);
      setProduceLots(pLots || []);
      setPickupRequests(pReqs || []);
      setProcessingBatches(b || []);
      setLedgerEntries(led || []);
    } catch (err) {
      console.error('Failed to load Sasyathra data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and URL check for batch parameter (Public QR access)
  useEffect(() => {
    loadAllData();

    // Check URL parameters for direct batch QR scanning
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const batchParam = params.get('batch');
      if (batchParam) {
        setTraceBatchCode(batchParam);
        setCurrentView('trace');
      } else if (window.location.pathname.startsWith('/trace/')) {
        const pathCode = window.location.pathname.replace('/trace/', '');
        if (pathCode) {
          setTraceBatchCode(pathCode);
          setCurrentView('trace');
        }
      }
    }

    // Subscribe to realtime updates across actors (Section 53)
    const unsubscribe = sasyathraService.subscribeToChanges(() => {
      loadAllData();
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [loadAllData]);

  // Handle role switching
  const handleSwitchRole = (roleKey, persona = null) => {
    setActiveRole(roleKey);
    setCurrentView('portal');

    if (persona) {
      setActiveUser(persona);
    } else {
      // Default persona for role
      if (roleKey === 'buyer') {
        setActiveUser({
          id: 'a1111111-1111-1111-1111-111111111111',
          role: 'buyer',
          name: 'Hyderabad Supermarket',
          village: 'Ameerpet Central',
          district: 'Hyderabad',
          phone: '+91 98490 11223'
        });
      } else if (roleKey === 'farmer') {
        setActiveUser({
          id: 'b1111111-1111-1111-1111-111111111111',
          role: 'farmer',
          name: 'Ramesh Goud',
          village: 'Dharmasagar',
          district: 'Warangal',
          phone: '+91 94401 55667',
          farm_size_acres: 4.5
        });
      } else if (roleKey === 'coop') {
        setActiveUser({
          id: 'c2222222-2222-2222-2222-222222222222',
          role: 'cooperative',
          name: 'Warangal Cooperative Processing Unit',
          village: 'Warangal Cluster',
          district: 'Warangal',
          phone: '+91 98490 99001'
        });
      }
    }
  };

  // Open batch trace
  const handleOpenTrace = (batchCode) => {
    setTraceBatchCode(batchCode);
    setCurrentView('trace');
  };

  return (
    <div className="min-h-screen bg-earth-50 text-slate-800 flex flex-col font-sans selection:bg-paddy-200 selection:text-paddy-900">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        activeRole={activeRole}
        onSwitchRole={handleSwitchRole}
        activeUser={activeUser}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-10 h-10 border-4 border-paddy-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-700">Connecting to Sasyathra Platform…</p>
            <p className="text-xs text-slate-400">Loading supply chain state and verification ledgers.</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: LANDING PAGE */}
            {currentView === 'landing' && (
              <LandingPage
                onSelectRole={handleSwitchRole}
                onOpenTrace={handleOpenTrace}
                onOpenScanner={() => setIsScannerOpen(true)}
              />
            )}

            {/* VIEW 2: PORTALS */}
            {currentView === 'portal' && (
              <>
                {activeRole === 'buyer' && (
                  <BuyerPortal
                    demands={demands}
                    activeBuyer={activeUser}
                    onOpenTrace={handleOpenTrace}
                  />
                )}

                {activeRole === 'farmer' && (
                  <FarmerPortal
                    demands={demands}
                    contributions={contributions}
                    produceLots={produceLots}
                    pickupRequests={pickupRequests}
                    ledgerEntries={ledgerEntries}
                    activeFarmer={activeUser}
                    onOpenTrace={handleOpenTrace}
                  />
                )}

                {activeRole === 'coop' && (
                  <CooperativePortal
                    processingUnits={processingUnits}
                    pickupRequests={pickupRequests}
                    produceLots={produceLots}
                    demands={demands}
                    processingBatches={processingBatches}
                    onOpenTrace={handleOpenTrace}
                  />
                )}
              </>
            )}

            {/* VIEW 3: PUBLIC TRACEABILITY (NO LOGIN REQUIRED) */}
            {currentView === 'trace' && (
              <PublicTraceability
                batchCode={traceBatchCode || 'BATCH-2026-00001'}
                onBack={() => setCurrentView('portal')}
                onScanAnother={() => setIsScannerOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-earth-100/80 border-t border-earth-200 mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-paddy-700" />
            <span className="font-serif font-bold text-slate-800 text-sm">Sasyathra</span>
            <span>—</span>
            <span className="italic font-serif">Where Every Harvest Finds a Home</span>
          </div>

          <div className="text-center md:text-right space-y-0.5">
            <p className="font-medium text-slate-700">
              Demand-First Farmer-to-Consumer Paddy Supply Chain
            </p>
            <p className="text-[11px] text-slate-400">
              Cooperative Processing • Verifiable QR Traceability • 70/30 Transparent Estimated Ledger
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectBatch={(batchCode) => {
          handleOpenTrace(batchCode);
          setIsScannerOpen(false);
        }}
        recentBatches={processingBatches}
      />

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
}
