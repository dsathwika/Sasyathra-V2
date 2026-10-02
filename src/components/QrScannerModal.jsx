import React, { useEffect, useState, useRef } from 'react';
import { QrCode, Camera, X, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QrScannerModal({ isOpen, onClose, onSelectBatch, recentBatches = [] }) {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;
    setCameraError(null);

    // Initialize HTML5 QR Code scanner if element exists
    const timer = setTimeout(() => {
      const element = document.getElementById('qr-reader');
      if (element && !scannerRef.current) {
        try {
          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          html5QrCode
            .start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 220, height: 220 }
              },
              (decodedText) => {
                // If scanned a full URL like https://sasyathra.org/trace/BATCH-2026-00001
                let code = decodedText;
                if (decodedText.includes('/trace/')) {
                  code = decodedText.split('/trace/')[1];
                } else if (decodedText.includes('batch=')) {
                  code = new URL(decodedText).searchParams.get('batch') || decodedText;
                }
                stopScanner();
                onSelectBatch(code);
                onClose();
              },
              () => {
                // scan frame without QR detected (ignore)
              }
            )
            .then(() => {
              if (isMounted) setIsScanning(true);
            })
            .catch((err) => {
              console.warn('Camera start error:', err);
              if (isMounted) {
                setCameraError('Camera access unavailable or permission not granted. Use manual Batch Code entry below.');
                setIsScanning(false);
              }
            });
        } catch (e) {
          console.warn('Scanner init error:', e);
          if (isMounted) setCameraError('Scanner unavailable. Please enter batch ID manually.');
        }
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner cleanup warning:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopScanner();
    onSelectBatch(manualCode.trim());
    onClose();
  };

  const handleSampleClick = (code) => {
    stopScanner();
    onSelectBatch(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-earth-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-paddy-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-harvest-400" />
            <h3 className="font-serif font-bold text-base text-white">Scan Batch Traceability QR</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Camera View Area */}
          <div className="relative bg-earth-100 rounded-xl overflow-hidden border border-earth-300 min-h-[240px] flex items-center justify-center">
            <div id="qr-reader" className="w-full h-full"></div>
            {cameraError && (
              <div className="absolute inset-0 bg-earth-50/95 p-4 flex flex-col items-center justify-center text-center">
                <Camera className="w-8 h-8 text-earth-400 mb-2" />
                <p className="text-xs text-slate-600 font-medium max-w-xs">{cameraError}</p>
              </div>
            )}
          </div>

          {/* Manual Entry Fallback (Section 35) */}
          <form onSubmit={handleManualSubmit} className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Or Enter Batch ID Manually
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g. BATCH-2026-00001"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-earth-300 text-xs font-mono font-semibold uppercase tracking-wider focus:ring-2 focus:ring-paddy-500 focus:border-paddy-500"
              />
              <button
                type="submit"
                className="bg-paddy-700 hover:bg-paddy-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                Track <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Recent / Available Batches for quick testing */}
          {recentBatches.length > 0 && (
            <div className="border-t border-earth-200 pt-3">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-harvest-500" /> Active System Batches:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recentBatches.map((b) => (
                  <button
                    key={b.id || b.batch_code}
                    onClick={() => handleSampleClick(b.batch_code)}
                    className="text-[11px] font-mono font-bold bg-earth-100 hover:bg-paddy-100 text-slate-700 hover:text-paddy-900 border border-earth-300 hover:border-paddy-400 px-2.5 py-1 rounded-lg transition"
                  >
                    {b.batch_code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-earth-50 p-3 border-t border-earth-200 flex justify-between items-center text-[11px] text-slate-500">
          <span>Camera stream decoded in browser</span>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-600 hover:text-slate-900 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
