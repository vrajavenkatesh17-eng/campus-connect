import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';
import AppFooter from './AppFooter';
import ScrollToTop from './ScrollToTop';
import ThemeToggle from '../common/ThemeToggle';
import OAuthErrorBanner from '../auth/OAuthErrorBanner';
import OfflineBanner from '../common/OfflineBanner';
import FirstVisitPreloader from '../common/FirstVisitPreloader';
import SeoHead from '../common/SeoHead';
import SmoothScroll from './SmoothScroll';
import { ArrowLeft } from 'lucide-react';

export default function RootLayout({ children }) {
  const location = useLocation();
  const isLoginPage = location.pathname.startsWith('/login');

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-ink transition-colors duration-200">
      <SeoHead />
      <FirstVisitPreloader />
      <SmoothScroll />
      <ScrollToTop />
      <OfflineBanner />

      {/* Header: sticky top-0, z-50 */}
      {isLoginPage ? (
        <header className="sticky top-0 z-50 w-full h-16 bg-surface/90 backdrop-blur-md border-b border-line px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors duration-200">
          <Link to="/" className="flex items-center gap-3 text-ink hover:opacity-85 transition-opacity select-none">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-2 p-0.5 border border-line shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/brand/fxec-logo.png"
                alt="Francis Xavier Engineering College Logo"
                className="w-full h-full object-contain"
                width="40"
                height="40"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg text-ink leading-tight">Campus Connect</span>
              <span className="text-xs text-muted leading-none hidden sm:inline">Francis Xavier Engineering College</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink px-3 py-1.5 rounded-[12px] bg-surface-2 border border-line hover:bg-surface hover:border-line transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-primary" />
              <span>Back to home</span>
            </Link>
          </div>
        </header>
      ) : (
        <Navbar />
      )}

      {/* Main Content: flex-1, scroll-mt-16 to guarantee header never overlaps scrolled titles */}
      <main className="flex-1 flex flex-col scroll-mt-16">
        <OAuthErrorBanner />
        {children}
      </main>

      {/* Single Global Footer */}
      <AppFooter />
    </div>
  );
}
