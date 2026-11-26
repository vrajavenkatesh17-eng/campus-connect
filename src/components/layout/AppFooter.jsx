import React from 'react';
import { Link } from 'react-router-dom';

export default function AppFooter() {
  return (
    <footer className="bg-surface border-t border-line py-8 mt-auto select-none transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted">
          {/* Institutional Brand */}
          <div className="flex items-center gap-2.5">
            <img
              src="/fxec-logo.png"
              alt="FXEC"
              className="w-6 h-6 rounded-full object-contain shrink-0"
              width="24"
              height="24"
            />
            <span className="font-semibold text-ink">Francis Xavier Engineering College</span>
            <span>•</span>
            <span>Autonomous Institution | Tirunelveli</span>
          </div>

          {/* S-L.6 Required Links: Privacy, Terms, Contact, Verify */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium" aria-label="Footer Navigation">
            <Link to="/events" className="hover:text-primary transition-colors">
              Events
            </Link>
            <Link to="/verify" className="hover:text-primary transition-colors">
              Verify
            </Link>
            <Link to="/gallery" className="hover:text-primary transition-colors">
              Moments
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-4 border-t border-line/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <p>© {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
          <p className="text-xs text-muted">
            Designed & built by <span className="font-semibold text-ink">Krish & Ihsan</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
