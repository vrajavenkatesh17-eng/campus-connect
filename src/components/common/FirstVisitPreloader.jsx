/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.5 First-Visit Preloader
 * Brand mark fade, max 600ms, skipped on repeat visits (sessionStorage)
 * and when assets are cached. Accessible and GPU-accelerated.
 */

import React, { useState, useEffect } from 'react';

const PRELOADER_STORAGE_KEY = 'cc_preloader_seen';
const MAX_DURATION_MS = 600;

export default function FirstVisitPreloader() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      // Skip if already seen in this session
      if (sessionStorage.getItem(PRELOADER_STORAGE_KEY)) return false;

      // Skip on back-forward cache or reload
      const navEntry = performance.getEntriesByType?.('navigation')?.[0];
      if (navEntry && (navEntry.type === 'back_forward' || navEntry.type === 'reload')) {
        sessionStorage.setItem(PRELOADER_STORAGE_KEY, '1');
        return false;
      }

      return true;
    } catch {
      return false;
    }
  });

  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    // Start fade out at 420ms, unmount at 600ms
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 420);

    const endTimer = setTimeout(() => {
      setIsVisible(false);
      try {
        sessionStorage.setItem(PRELOADER_STORAGE_KEY, '1');
      } catch {}
    }, MAX_DURATION_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] bg-bg flex flex-col items-center justify-center transition-opacity duration-200 pointer-events-none select-none ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-surface p-1.5 border border-line shadow-sm flex items-center justify-center">
          <img
            src="/fxec-logo.png"
            alt="FXEC"
            className="w-full h-full object-contain"
            width="64"
            height="64"
          />
        </div>
        <div className="text-center space-y-1">
          <span className="font-serif font-bold text-xl text-ink tracking-tight block">
            Campus Connect
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary block">
            Francis Xavier Engineering College
          </span>
        </div>
      </div>
    </div>
  );
}
