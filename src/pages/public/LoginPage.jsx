/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Pre-Login Screen (Step A):
 * Implemented using React Bits:
 * 1. Silk dynamic WebGL background (brand blue in dark mode, pale primary-soft tint in light mode, paused when tab hidden)
 * 2. Noise film grain overlay at 0.035 opacity
 * 3. Lanyard 3D physics badge on desktop (>=768px) with dynamic canvas texture (no fake names, "Welcome back, <name>" if returning)
 * 4. Sign-in panel with BlurText header, RotatingText tagline, RubberSegment portal selector, and ShinyText Google CTA
 * 5. Past Events DOM-based Carousel showing completed events from Supabase (hidden if 0 events, strictly no mock data)
 *
 * Compliance: DESIGN_SPEC v2 (Navy & Gold, Fraunces serif, Inter UI, gold hairlines, max 2 WebGL canvases)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authService } from '../../services/authService';
import { eventService } from '../../services/eventService';
import {
  extractOAuthErrorFromUrl,
  mapOAuthErrorToFriendlyMessage,
  cleanOAuthErrorFromUrl,
  isInAppBrowser,
} from '../../utils/oauthError';
import Spinner from '../../components/common/Spinner';
import AppButton from '../../components/app/AppButton';
import AppSegmented from '../../components/app/AppSegmented';
import { PageEnter } from '../../components/motion';

// React Bits UI Components
import Silk from '../../components/ui/Silk/Silk';
import Noise from '../../components/ui/Noise/Noise';
import LanyardBadge from '../../components/ui/Lanyard/LanyardBadge';
import BlurText from '../../components/ui/BlurText/BlurText';
import RotatingText from '../../components/ui/RotatingText/RotatingText';
import ShinyText from '../../components/ui/ShinyText/ShinyText';
import Carousel from '../../components/ui/Carousel/Carousel';

// Icons
import { GraduationCap, ShieldCheck, AlertCircle, Calendar, Sparkles, Building2 } from 'lucide-react';

export default function LoginPage() {
  const { user, role, authError, setAuthError } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const signInLockRef = useRef(false);
  const [inAppWebview] = useState(() => isInAppBrowser());

  // Portal intent selection: 'student' | 'coordinator' | 'admin'
  const [portal, setPortal] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Past events data for carousel
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Auto-redirect if already signed in
  useEffect(() => {
    if (user && role) {
      if (role === 'admin') navigate('/admin', { replace: true });
      else if (role === 'coordinator') navigate('/coordinator', { replace: true });
      else navigate('/student', { replace: true });
    }
  }, [user, role, navigate]);

  // Read error, error_code, error_description from BOTH location.search and location.hash,
  // map to friendly message, and clean URL immediately with history.replaceState.
  useEffect(() => {
    const rawErr = extractOAuthErrorFromUrl();
    if (rawErr) {
      setError(mapOAuthErrorToFriendlyMessage(rawErr));
      cleanOAuthErrorFromUrl();
    } else if (authError) {
      setError(authError);
    }
  }, [location.search, location.hash, authError]);

  // Retrieve returning user's first name from localStorage (try/catch wrapped)
  const returningFirstName = useMemo(() => {
    try {
      const direct = localStorage.getItem('fxec_user_first_name') || localStorage.getItem('user_first_name');
      if (direct && typeof direct === 'string') return direct.trim();

      const profileCache = localStorage.getItem('fxec_user_profile') || localStorage.getItem('campus_connect_profile');
      if (profileCache) {
        const parsed = JSON.parse(profileCache);
        const name = parsed?.full_name || parsed?.name;
        if (name && typeof name === 'string') {
          return name.trim().split(' ')[0];
        }
      }
    } catch (e) {
      // Ignore storage access errors
    }
    return '';
  }, []);

  // Fetch real past completed events from database (NO mock data)
  useEffect(() => {
    let isMounted = true;
    eventService
      .getPublicPastEvents(12)
      .then((data) => {
        if (isMounted) {
          setPastEvents(Array.isArray(data) ? data : []);
          setIsLoadingEvents(false);
        }
      })
      .catch((err) => {
        console.warn('Past events query warning:', err);
        if (isMounted) {
          setPastEvents([]);
          setIsLoadingEvents(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Single-shot Google OAuth Sign In (StrictMode & double-click safe)
  const handleGoogleSignIn = async () => {
    if (signInLockRef.current || isLoading) return;
    signInLockRef.current = true;
    setIsLoading(true);
    setError(null);
    if (setAuthError) setAuthError(null);

    try {
      await authService.signInWithGoogle(portal);
    } catch (err) {
      console.error('Google Sign In Error:', err);
      setError(
        err?.message?.includes('not configured')
          ? err.message
          : 'Sign-in could not be started. Please try again.'
      );
      signInLockRef.current = false;
      setIsLoading(false);
    }
  };

  // Build custom DOM cards for past events carousel
  const carouselCards = useMemo(() => {
    if (!pastEvents || pastEvents.length === 0) return [];
    return pastEvents.map((ev) => {
      const eventDate = ev.start_time
        ? new Date(ev.start_time).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Completed';

      return (
        <div
          key={ev.id}
          className="w-full h-full flex flex-col justify-between overflow-hidden rounded-[16px] text-ink select-none"
        >
          {/* Card Media Header */}
          <div className="relative w-full h-[140px] bg-surface-2 overflow-hidden rounded-[12px] border border-line">
            {ev.poster_url || ev.banner_url ? (
              <img
                src={ev.poster_url || ev.banner_url}
                alt={ev.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-primary-soft text-primary">
                <Building2 className="w-6 h-6 mb-1 opacity-70" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {ev.department || 'FXEC Event'}
                </span>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-xs text-xs font-semibold text-primary px-2.5 py-0.5 rounded-full border border-line shadow-xs">
              Completed
            </div>
          </div>

          {/* Card Meta & Title */}
          <div className="flex-1 flex flex-col justify-between pt-3 space-y-1.5">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted tracking-wide uppercase">
                <Calendar className="w-3 h-3 text-primary shrink-0" />
                <span>{eventDate}</span>
                {ev.department && <span>• {ev.department}</span>}
              </div>
              <h4 className="text-sm font-bold text-ink line-clamp-1 leading-snug mt-1" title={ev.title}>
                {ev.title}
              </h4>
            </div>

            {/* Speaker information if recorded */}
            {(ev.speaker_name || ev.speaker_company) && (
              <div className="text-xs text-muted truncate pt-1.5 border-t border-line/60">
                <span className="font-medium text-ink">{ev.speaker_name || 'Guest Speaker'}</span>
                {ev.speaker_company && <span> • {ev.speaker_company}</span>}
              </div>
            )}
          </div>
        </div>
      );
    });
  }, [pastEvents]);

  return (
    <PageEnter className="relative min-h-[calc(100vh-64px)] w-full flex flex-col justify-between overflow-x-hidden">
      {/* 1. BACKGROUND: Silk WebGL Canvas (1st Canvas on Page) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <Silk
          color={resolvedTheme === 'dark' ? 'rgb(var(--primary))' : 'rgb(var(--primary-soft))'}
          sheenColor={resolvedTheme === 'dark' ? 'rgb(var(--primary-hover))' : 'rgb(var(--surface))'}
          lightMode={resolvedTheme === 'light'}
          speed={1.2}
          scale={1.05}
          noiseIntensity={0.8}
          rotation={0.25}
          sheen={0.35}
          depth={0.4}
          glow={0.2}
          wave={0.75}
          ripple={0.6}
          fade={0.12}
          className="w-full h-full opacity-65 dark:opacity-45"
        />
        {/* Subtle Film Grain Overlay */}
        <Noise
          opacity={0.035}
          contrast={0.5}
          colored={false}
          blendMode="overlay"
          fixed={true}
          zIndex={1}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex-1 flex flex-col justify-start">
        {/* Desktop 2-Column Split / Mobile Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto">
          {/* Left Column: Brand & Sign-in Panel (Col 1 to 7 on lg) */}
          <div className="lg:col-span-7 xl:col-span-6 flex flex-col space-y-6">
            {/* Institutional Brand Header with Scrim per S-A2.1 */}
            <div className="relative rounded-[24px] bg-surface/80 dark:bg-surface/85 backdrop-blur-md border border-line/60 p-6 sm:p-7 shadow-xs space-y-4">
              {/* Ambient Scrim Gradient Layer behind Brand Header per S-A2.1 */}
              <div
                className="absolute inset-0 rounded-[24px] pointer-events-none -z-10 scrim-backdrop"
                aria-hidden="true"
              />
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-surface-2 p-1 border border-line shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                  <img
                    src="/brand/fxec-logo.png"
                    alt="Francis Xavier Engineering College Official Seal"
                    className="w-full h-full object-contain"
                    width="56"
                    height="56"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-xl sm:text-2xl text-ink leading-tight">
                    Campus Connect
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    FXEC Autonomous
                  </span>
                </div>
              </div>

              {/* Title with BlurText */}
              <BlurText
                text="Francis Xavier Engineering College"
                delay={30}
                direction="top"
                animateBy="words"
                trigger="load"
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink leading-[1.15]"
              />

              {/* Tagline with RotatingText in Navy */}
              <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg font-medium text-muted">
                <span className="font-serif italic text-ink">Campus Connect —</span>
                <RotatingText
                  texts={['Attend.', 'Learn.', 'Earn certificates.']}
                  mainClassName="text-primary font-semibold tracking-wide"
                  rotationInterval={2600}
                  staggerDuration={0.03}
                  splitBy="characters"
                />
              </div>
            </div>

            {/* Frosted Sign-in Card */}
            <div className="w-full max-w-lg bg-surface/90 dark:bg-surface/85 backdrop-blur-md rounded-[20px] border border-line p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">Institutional Sign In</h2>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Select your institutional role and authenticate with your verified campus Google ID.
                </p>
              </div>

              {/* AppSegmented: 3 Portal Options */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                  Target Portal
                </label>
                <AppSegmented
                  items={[
                    { value: 'student', label: 'Student' },
                    { value: 'coordinator', label: 'Coordinator' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                  value={portal}
                  onChange={(val) => setPortal(val)}
                  size="md"
                  radius={12}
                  inset={3}
                  equalSlots={true}
                  aria-label="Select institutional role portal"
                  className="w-full"
                />
              </div>

              {/* In-App Browser Guard Banner */}
              {inAppWebview && (
                <div
                  role="status"
                  className="p-3.5 rounded-[12px] bg-warning/15 border border-warning/40 text-ink text-xs flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">
                    Open this link in Chrome/Safari to sign in with Google.
                  </p>
                </div>
              )}

              {/* Single Google Sign-in CTA with ShinyText */}
              <div className="space-y-2.5">
                <AppButton
                  variant="secondary"
                  data-testid="google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading || inAppWebview}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-[12px] text-sm font-semibold border-line hover:border-primary/40 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all shadow-xs disabled:opacity-60 cursor-pointer group select-none"
                >
                  {isLoading ? (
                    <Spinner size="sm" className="text-primary" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <ShinyText
                    text={isLoading ? 'Connecting...' : 'Continue with Google'}
                    color="rgb(var(--ink))"
                    shineColor="rgb(var(--primary))"
                    speed={3}
                    shineWidth={35}
                    disabled={isLoading}
                    className="font-semibold text-sm"
                  />
                </AppButton>

                {/* Subtle portal routing hint */}
                <p className="text-xs text-muted text-center">
                  Signing in as <span className="font-semibold text-ink capitalize">{portal}</span> — redirect to{' '}
                  <code className="px-1.5 py-0.5 rounded bg-surface-2 border border-line text-xs font-mono text-primary dark:text-ink font-semibold">
                    /{portal}
                  </code>
                </p>
              </div>

              {/* Inline Error Display (No window alerts) */}
              {error && (
                <div
                  role="alert"
                  className="p-3.5 rounded-[12px] bg-danger/10 border border-danger/30 text-danger text-xs space-y-2 animate-in fade-in duration-200"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold">Authentication Notice</p>
                      <p className="leading-relaxed opacity-90">{error}</p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-end">
                    <AppButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setError(null);
                        handleGoogleSignIn();
                      }}
                      className="text-xs font-bold text-danger underline hover:opacity-80 cursor-pointer"
                    >
                      Try again
                    </AppButton>
                  </div>
                </div>
              )}

              {/* Domain Verification Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-[12px] bg-primary-soft text-ink text-xs leading-relaxed border border-line">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted">
                  Use your <strong className="text-ink">@francisxavier.ac.in</strong> account. Instant automated role
                  routing for enrolled students and department coordinators.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Lanyard Badge hanging from the top (Col 8 to 12 on lg) */}
          <div className="lg:col-span-5 xl:col-span-6 w-full flex items-center justify-center relative">
            <div className="w-full max-w-[420px] lg:max-w-none flex items-center justify-center">
              <LanyardBadge firstName={returningFirstName} />
            </div>
          </div>
        </div>

        {/* 4. PAST EVENTS CAROUSEL (Bottom Section - Desktop Only per S-D)
            Strict Rule: Only rendered on desktop (>=1024px) if real completed events exist; completely hidden if 0 events (no mock data). */}
        {!isLoadingEvents && pastEvents.length > 0 && (
          <section
            aria-label="Past completed events"
            className="hidden lg:block w-full mt-12 pt-8 border-t border-line/60 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Campus Legacy</p>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">Past Completed Events</h3>
              </div>
              <p className="text-xs text-muted">Memorable lectures, symposiums & hackathons hosted at FXEC</p>
            </div>

            <div className="w-full">
              <Carousel
                items={carouselCards}
                baseWidth={320}
                aspectRatio={1.28}
                peek={20}
                gap={16}
                radius={20}
                effect="slide"
                frame={true}
                indicator="dots"
                arrows={true}
                loop={true}
                autoplay={true}
                autoplayDelay={3800}
                pauseOnHover={true}
                theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                className="w-full"
              />
            </div>
          </section>
        )}
      </div>
    </PageEnter>
  );
}
