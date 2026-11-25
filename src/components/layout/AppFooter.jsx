import React from 'react';

export default function AppFooter() {
  return (
    <footer className="bg-surface border-t border-line py-6 mt-auto select-none transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink">Francis Xavier Engineering College</span>
          <span>•</span>
          <span>Autonomous Institution | Tirunelveli</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-center sm:text-right">
          <p>© {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
          <span className="hidden sm:inline text-line">•</span>
          <p className="text-xs text-muted">
            Designed & built by <span className="font-semibold text-ink">Krish & Ihsan</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
