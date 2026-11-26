/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.4 Offline Banner
 * Automatically surfaces when navigator is offline and hides when restored.
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] w-full bg-warning-soft border-b border-warning/30 px-4 py-2.5 text-center text-xs font-semibold text-warning-foreground transition-all duration-300 animate-in slide-in-from-top flex items-center justify-center gap-2 select-none shadow-xs"
    >
      <WifiOff className="w-4 h-4 text-warning shrink-0" />
      <span>
        You are currently offline. Live updates and real-time registrations are paused until connection is restored.
      </span>
    </div>
  );
}
