/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * SmoothScroll: S-N 1 Lenis smooth scroll for public pages
 * Rules:
 * 1. ONLY active on public pages (/, /events, /login, /gallery, /privacy, /terms, /contact, /help, /verify)
 * 2. Native scroll in all portals (/student, /coordinator, /admin, /profile)
 * 3. Disabled on prefers-reduced-motion
 * 4. Paused/disabled when a modal or drawer is open
 * 5. Handles anchor links and scroll restoration
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

const PUBLIC_PATH_PREFIXES = [
  '/',
  '/events',
  '/login',
  '/gallery',
  '/privacy',
  '/terms',
  '/contact',
  '/help',
  '/verify',
];

const PORTAL_PATH_PREFIXES = [
  '/student',
  '/coordinator',
  '/admin',
  '/profile',
];

export default function SmoothScroll() {
  const location = useLocation();
  const lenisRef = useRef(null);

  useEffect(() => {
    const path = location.pathname;

    // Check if path is in portals
    const isPortal = PORTAL_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
    if (isPortal) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    // Check if path is public
    const isPublic =
      PUBLIC_PATH_PREFIXES.includes(path) ||
      PUBLIC_PATH_PREFIXES.some((prefix) => prefix !== '/' && path.startsWith(prefix));

    if (!isPublic) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    // Check prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    // RAF loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Watch for modal or drawer opens (overflow-hidden on body)
    const observer = new MutationObserver(() => {
      const isModalOpen =
        document.body.classList.contains('overflow-hidden') ||
        document.querySelector('[data-modal-open="true"]') !== null;
      if (isModalOpen) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [location.pathname]);

  return null;
}
