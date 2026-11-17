/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Ref: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React from 'react';
import Navbar from './Navbar';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <footer className="bg-white border-t border-neutral-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">Francis Xavier Engineering College</span>
            <span>•</span>
            <span>Autonomous Institution | Tirunelveli</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-right">
            <p>© {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
            <span className="hidden sm:inline text-neutral-300">•</span>
            <p className="text-[11px] text-neutral-400">
              Architected & Patented by <span className="font-semibold text-neutral-700">Krish & Ihsan</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
