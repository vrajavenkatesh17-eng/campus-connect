/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * LanyardBadge:
 * Lazy-loaded Three.js physics lanyard on desktop (>=768px).
 * Gracefully degrades to static high-resolution canvas badge under 768px or if WebGL is unavailable.
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import {
  generateIdCardTexture,
  generateIdCardBackTexture,
  generateUserCardTexture,
} from '../../../utils/idCardTexture';

const LazyLanyard = React.lazy(() => import('./Lanyard'));

function LanyardSkeleton() {
  return (
    <div
      className="w-full h-full min-h-[460px] flex flex-col items-center justify-center p-6 animate-pulse select-none"
      aria-hidden="true"
    >
      <div className="w-1.5 h-36 bg-primary/20 rounded-full mb-2" />
      <div className="w-[280px] h-[400px] rounded-[20px] bg-surface-2 border border-line flex flex-col justify-between p-6 shadow-xs">
        <div className="h-10 w-full bg-primary/10 rounded-[10px]" />
        <div className="w-20 h-20 rounded-full bg-line mx-auto" />
        <div className="space-y-2">
          <div className="h-6 w-3/4 bg-line rounded mx-auto" />
          <div className="h-4 w-1/2 bg-line rounded mx-auto" />
        </div>
        <div className="h-12 w-full bg-line/60 rounded-[10px]" />
      </div>
    </div>
  );
}

// Error Boundary for WebGL/Physics Failures
class LanyardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('Lanyard 3D physics failed to load, rendering static ID badge:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function LanyardBadge({
  firstName = '',
  user = null,
  profile = null,
  role = 'student',
  sessionDropOnly = false,
  className = '',
}) {
  const { resolvedTheme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [frontTextureUrl, setFrontTextureUrl] = useState('');

  // Check WebGL availability
  useEffect(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  // Monitor viewport width (<768px disables physics for mobile performance)
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // S-F Session physics drop rule: drops with physics ONCE per session, afterwards hangs still
  const [shouldAnimateIntro, setShouldAnimateIntro] = useState(() => {
    if (!sessionDropOnly) return true;
    try {
      return !sessionStorage.getItem('cc_lanyard_intro_done');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (sessionDropOnly && shouldAnimateIntro) {
      try {
        sessionStorage.setItem('cc_lanyard_intro_done', 'true');
      } catch {}
    }
  }, [sessionDropOnly, shouldAnimateIntro]);

  // Generate crisp canvas textures for front (supports real user profile data)
  useEffect(() => {
    let isMounted = true;
    const currentTheme = resolvedTheme || 'light';

    if (user || profile) {
      generateUserCardTexture({
        theme: currentTheme,
        fullName: profile?.name || user?.user_metadata?.full_name || '',
        avatarUrl: profile?.avatar_url || user?.user_metadata?.avatar_url || '',
        role: role || profile?.role || 'student',
        department: profile?.departments?.name || profile?.department || '',
        registerNumber: profile?.register_number || '',
      }).then((url) => {
        if (isMounted) setFrontTextureUrl(url);
      });
    } else {
      const url = generateIdCardTexture({ theme: currentTheme, firstName });
      if (isMounted) setFrontTextureUrl(url);
    }

    return () => {
      isMounted = false;
    };
  }, [user, profile, role, resolvedTheme, firstName]);

  const backTextureUrl = useMemo(() => {
    return generateIdCardBackTexture({ theme: resolvedTheme || 'light' });
  }, [resolvedTheme]);

  // Static Fallback Badge (rendered on mobile, reduced-motion, or WebGL absence)
  const staticBadge = (
    <div className={`flex flex-col items-center justify-center p-4 select-none ${className}`}>
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[1024/1440] rounded-[20px] overflow-hidden border border-line shadow-md group transition-transform duration-300 hover:scale-[1.02]">
        {frontTextureUrl && (
          <img
            src={frontTextureUrl}
            alt="Francis Xavier Engineering College Student ID Pass"
            className="w-full h-full object-contain"
          />
        )}
        <div className="absolute inset-0 ring-1 ring-inset ring-gold/20 pointer-events-none rounded-[20px]" />
      </div>
      <p className="text-xs text-muted text-center mt-3 font-medium">
        Francis Xavier Engineering College • {role ? role.toUpperCase() : 'STUDENT'} ID PASS
      </p>
    </div>
  );

  if (isMobile || prefersReducedMotion || !hasWebGL) {
    return staticBadge;
  }

  return (
    <div className={`w-full h-full min-h-[500px] flex items-center justify-center relative overflow-hidden select-none ${className}`}>
      <LanyardErrorBoundary fallback={staticBadge}>
        <Suspense fallback={<LanyardSkeleton />}>
          <LazyLanyard
            frontImage={frontTextureUrl}
            backImage={backTextureUrl}
            cardColor={resolvedTheme === 'dark' ? '#1F1719' : '#FFFFFF'}
            strapColor={resolvedTheme === 'dark' ? '#C95D78' : '#7A1230'}
            metal={resolvedTheme === 'dark' ? 'gold' : 'gold'}
            size={0.65}
            orientation="portrait"
            finish="glossy"
            cornerRadius={0.2}
            gravity={shouldAnimateIntro ? 0.9 : 0.25}
            damping={0.4}
            elasticity={0.45}
            breeze={shouldAnimateIntro ? 0.3 : 0.1}
            interactive={true}
            intro={shouldAnimateIntro}
            className="w-full h-full min-h-[520px]"
          />
        </Suspense>
      </LanyardErrorBoundary>
    </div>
  );
}
