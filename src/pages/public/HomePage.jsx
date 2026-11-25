/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Designed & built by Krish & Ihsan. All Rights Reserved.
 *
 * Public Landing Page (Step S-C):
 * 1. HERO: Silk WebGL (burgundy) + Noise + SplitText H1 + GradientText + ShinyText CTA + Next Event countdown chip
 * 2. LIVE STATS: 4 Counters (events hosted, students engaged, certificates issued, guest speakers) from public_stats()
 * 3. UPCOMING EVENTS: Up to 3 AppSpotlightCards from public_upcoming_events(3)
 * 4. MOMENTS: DOM-based Carousel of admin-approved photos/posters from public_past_events()
 * 5. INDUSTRY VOICES: LogoLoop of speaker company chips from public_speaker_companies()
 * 6. FEATURES: MagicBento 6 tiles (QR attendance, Reward points, Certificates, Passport, Waitlist, Role security)
 * 7. HOW IT WORKS: 4 numbered steps with AnimatedContent reveal + BlurText heading
 * 8. VERIFY: Code Slots input for certificate ID with Verify button
 * 9. CLOSING CTA + single global footer (rendered by RootLayout)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';

// App UI Components
import AppButton from '../../components/app/AppButton';
import AppSpotlightCard from '../../components/app/AppSpotlightCard';
import AppCodeInput from '../../components/app/AppCodeInput';
import Badge from '../../components/common/Badge';
import MomentsSection from '../../components/sections/MomentsSection';
import { PageEnter, ScrollVelocity, ScrollReveal } from '../../components/motion';

// React Bits UI Components
import Silk from '../../components/ui/Silk/Silk';
import Noise from '../../components/ui/Noise/Noise';
import SplitText from '../../components/ui/SplitText/SplitText';
import GradientText from '../../components/ui/GradientText/GradientText';
import ShinyText from '../../components/ui/ShinyText/ShinyText';
import Counter from '../../components/ui/Counter/Counter';
import LogoLoop from '../../components/ui/LogoLoop/LogoLoop';
import MagicBento from '../../components/MagicBento/MagicBento';
import AnimatedContent from '../../components/ui/AnimatedContent/AnimatedContent';
import BlurText from '../../components/ui/BlurText/BlurText';

// Icons
import {
  GraduationCap,
  Calendar,
  MapPin,
  Users,
  Award,
  FileCheck2,
  Sparkles,
  QrCode,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  ExternalLink,
} from 'lucide-react';

export default function HomePage() {
  const { user, role } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [verifyCode, setVerifyCode] = useState('');
  const heroRef = useRef(null);
  const [isHeroNear, setIsHeroNear] = useState(true);

  // Unmount Silk when hero is > 1 viewport away so at most 2 WebGL canvases exist at once
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        setIsHeroNear(Boolean(entries[0]?.isIntersecting));
      },
      { rootMargin: '100% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 1. Live Stats Query
  const { data: stats } = useQuery({
    queryKey: ['publicStats'],
    queryFn: () => eventService.getPublicStats(),
    staleTime: 5 * 60 * 1000,
  });

  // 2. Next Event Query (Hero countdown chip)
  const { data: nextEvent } = useQuery({
    queryKey: ['publicNextEvent'],
    queryFn: () => eventService.getPublicNextEvent(),
    staleTime: 5 * 60 * 1000,
  });

  // 3. Upcoming Events Query (up to 3)
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['publicUpcomingEvents'],
    queryFn: () => eventService.getPublicUpcomingEvents(3),
    staleTime: 5 * 60 * 1000,
  });

  // 4. Past Events Query for Moments Carousel (up to 12)
  const { data: pastEvents = [] } = useQuery({
    queryKey: ['publicPastEvents'],
    queryFn: () => eventService.getPublicPastEvents(12),
    staleTime: 5 * 60 * 1000,
  });

  // 5. Industry Voices Query (Speaker Companies)
  const { data: speakerCompanies = [] } = useQuery({
    queryKey: ['publicSpeakerCompanies'],
    queryFn: () => eventService.getPublicSpeakerCompanies(),
    staleTime: 5 * 60 * 1000,
  });

  // Format visible stats (strictly hide any stat that is 0)
  const visibleStats = useMemo(() => {
    if (!stats) return [];
    const list = [
      { id: 'events', label: 'Events Hosted', value: stats.events_hosted, icon: Calendar },
      { id: 'students', label: 'Students Engaged', value: stats.students_engaged, icon: Users },
      { id: 'certs', label: 'Certificates Issued', value: stats.certificates_issued, icon: FileCheck2 },
      { id: 'speakers', label: 'Industry Speakers', value: stats.guest_speakers, icon: Award },
    ];
    return list.filter((s) => Number(s.value) > 0);
  }, [stats]);

  // DOM cards for Moments Carousel (strictly DOM-based, no second WebGL canvas)
  const momentsCarouselCards = useMemo(() => {
    if (!pastEvents || pastEvents.length === 0) return [];
    return pastEvents.map((ev) => {
      const eventDate = ev.start_time
        ? new Date(ev.start_time).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : ev.event_date || 'Concluded';

      const photoUrl =
        Array.isArray(ev.photos) && ev.photos.length > 0
          ? ev.photos[0].storage_path
          : ev.poster_url;

      return (
        <div
          key={ev.id}
          className="w-full h-full flex flex-col justify-between overflow-hidden rounded-[16px] text-ink select-none bg-surface border border-line p-3 shadow-xs"
        >
          <div className="relative w-full h-[150px] bg-surface-2 overflow-hidden rounded-[12px] border border-line/60">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={ev.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-primary-soft text-primary">
                <Building2 className="w-8 h-8 mb-1 opacity-70" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  FXEC Campus Event
                </span>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-xs text-xs font-semibold text-primary px-2.5 py-0.5 rounded-full border border-line shadow-xs">
              Completed
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between pt-3 space-y-1">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted tracking-wide uppercase">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{eventDate}</span>
              </div>
              <h4 className="text-sm font-bold text-ink line-clamp-1 leading-snug mt-1" title={ev.title}>
                {ev.title}
              </h4>
              {ev.public_summary && (
                <p className="text-xs text-muted line-clamp-1 mt-0.5 font-medium">
                  {ev.public_summary}
                </p>
              )}
            </div>

            {(ev.speaker_name || ev.speaker_company) && (
              <div className="text-xs text-muted truncate pt-1.5 border-t border-line/60">
                <span className="font-semibold text-ink">{ev.speaker_name || 'Guest Speaker'}</span>
                {ev.speaker_company && <span> • {ev.speaker_company}</span>}
              </div>
            )}
          </div>
        </div>
      );
    });
  }, [pastEvents]);

  // MagicBento 6 Tiles: icon + title + description only (strictly NO demo visuals or invented numbers)
  const bentoFeatureTiles = useMemo(() => [
    {
      id: 'qr-attendance',
      label: 'Attendance & Verification',
      title: 'Dynamic QR Attendance',
      description: 'Anti-spoofing rotating QR code attendance with automated geofence and device verification.',
      icon: <QrCode className="w-5 h-5 text-primary" />,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'reward-points',
      label: 'Student Engagement',
      title: 'Institutional Reward Points',
      description: 'Automated activity points awarded directly to student transcripts for validated attendance.',
      icon: <Award className="w-5 h-5 text-primary" />,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'certificates',
      label: 'Verified Credentials',
      title: 'Tamper-Proof Certificates',
      description: 'Cryptographically signed digital certificates instantly downloadable and verifiable by third parties.',
      icon: <FileCheck2 className="w-5 h-5 text-primary" />,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'passport',
      label: 'Student Portfolio',
      title: 'Achievement Passport',
      description: 'A unified digital portfolio curating all completed co-curricular milestones for placement drives.',
      icon: <Sparkles className="w-5 h-5 text-primary" />,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'waitlist',
      label: 'Automated Queues',
      title: 'Smart Real-time Waitlist',
      description: 'Automated promotion pipeline that bumps students into confirmed seats when cancellations occur.',
      icon: <Users className="w-5 h-5 text-primary" />,
      colSpan: 1,
      rowSpan: 1,
    },
    {
      id: 'security',
      label: 'Institutional Governance',
      title: 'Role-Based Row Security',
      description: 'Strict PostgreSQL server-side row level security enforcing student, faculty, and admin policies.',
      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
      colSpan: 1,
      rowSpan: 1,
    },
  ], []);

  // Handle Certificate Code Verification redirect
  const handleVerifySubmit = (e) => {
    e?.preventDefault();
    const cleanCode = verifyCode.trim().toUpperCase();
    if (cleanCode) {
      navigate(`/verify/${cleanCode}`);
    } else {
      navigate('/verify');
    }
  };

  const getPortalHome = () => {
    if (role === 'admin') return '/admin';
    if (role === 'coordinator') return '/coordinator';
    return '/student';
  };

  return (
    <PageEnter className="relative w-full overflow-x-hidden transition-colors duration-200">
      {/* 1. HERO SECTION */}
      <section ref={heroRef} className="relative min-h-[82vh] w-full flex items-center justify-center overflow-hidden py-16 lg:py-24">
        {/* Silk Dynamic WebGL Canvas Background (mounted only when hero is within 1 viewport) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {isHeroNear && (
            <Silk
              color={resolvedTheme === 'dark' ? 'rgb(var(--primary))' : 'rgb(var(--primary-soft))'}
              sheenColor={resolvedTheme === 'dark' ? 'rgb(var(--primary-hover))' : 'rgb(var(--surface))'}
              lightMode={resolvedTheme === 'light'}
              speed={1.0}
              scale={1.1}
              noiseIntensity={0.7}
              rotation={0.2}
              sheen={0.35}
              depth={0.4}
              glow={0.2}
              wave={0.7}
              ripple={0.5}
              fade={0.12}
              className="w-full h-full opacity-65 dark:opacity-45"
            />
          )}
          <Noise opacity={0.035} contrast={0.5} colored={false} blendMode="overlay" fixed={true} zIndex={1} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Institution Header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/90 backdrop-blur-md border border-line text-ink text-xs font-semibold tracking-wide uppercase shadow-xs mb-6 select-none">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Francis Xavier Engineering College • Autonomous</span>
          </div>

          {/* H1 Heading with SplitText & GradientText */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink tracking-tight max-w-4xl leading-[1.15] mb-6">
            <SplitText
              text="Connecting Campus, Industry & "
              delay={35}
              className="font-serif inline"
            />
            <GradientText
              animationSpeed={6}
              className="font-serif inline"
            >
              Student Excellence
            </GradientText>
          </h1>

          {/* Static Subtitle */}
          <p className="text-base sm:text-lg text-muted max-w-2xl leading-relaxed mb-8">
            The autonomous guest lecture management and experiential learning platform. Built for
            seamless seat reservations, live rotating QR attendance, earned activity points, and tamper-proof digital credentials.
          </p>

          {/* Next Event Countdown Chip (Strict Rule: Hide if none) */}
          {nextEvent && nextEvent.start_time && (
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface/90 backdrop-blur-md border border-line text-xs font-semibold text-ink shadow-xs mb-8 animate-in fade-in select-none">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="text-muted">Next Session:</span>
              <span className="font-bold text-ink truncate max-w-[220px] sm:max-w-[340px]">{nextEvent.title}</span>
              <span className="text-line">•</span>
              <span className="text-primary font-mono font-bold">
                starts in <Counter targetDate={nextEvent.start_time} />
              </span>
            </div>
          )}

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {user ? (
              <Link to={getPortalHome()} className="w-full sm:w-auto">
                <AppButton variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                  <span>Enter {role ? role.toUpperCase() : 'YOUR'} Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </AppButton>
              </Link>
            ) : (
              <>
                <Link to="/login" className="w-full sm:w-auto">
                  <AppButton variant="primary" size="lg" className="w-full sm:w-auto gap-2 shadow-sm">
                    <ShinyText
                      text="Sign in with College ID"
                      color="rgb(var(--on-primary))"
                      shineColor="rgb(var(--on-primary))"
                      speed={3}
                      className="font-semibold text-sm"
                    />
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </AppButton>
                </Link>
                <Link to="/events" className="w-full sm:w-auto">
                  <AppButton variant="secondary" size="lg" className="w-full sm:w-auto">
                    Explore events
                  </AppButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. LIVE STATS STRIP (Strict Rule: Hide any stat that is 0; hide section if all 0) */}
      {visibleStats.length > 0 && (
        <section className="relative z-10 border-y border-line bg-surface/80 backdrop-blur-md py-8">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {visibleStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.id} className="flex flex-col items-center text-center space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-primary-soft border border-primary/20 flex items-center justify-center text-primary mb-1">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                      <Counter value={stat.value} duration={2} suffix="+" />
                    </div>
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. UPCOMING EVENTS (Strict Rule: Up to 3 AppSpotlightCards; hide section if none) */}
      {upcomingEvents.length > 0 && (
        <section className="py-16 sm:py-20 border-b border-line bg-bg">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="primary" size="sm" className="uppercase tracking-widest font-bold">
                  Upcoming Lectures
                </Badge>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
                  Featured Academic Sessions
                </h2>
                <p className="text-sm text-muted max-w-xl">
                  Reserve your confirmed seat with your verified student profile before capacity is filled.
                </p>
              </div>
              <Link to="/events">
                <AppButton variant="secondary" size="sm" className="gap-2">
                  <span>View All Sessions</span>
                  <ArrowRight className="w-4 h-4" />
                </AppButton>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcomingEvents.map((evt) => {
                const seatsLeft = Math.max(0, evt.seat_capacity - evt.registered_count);
                const startDateStr = new Date(evt.start_time).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const startTimeStr = new Date(evt.start_time).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <AppSpotlightCard
                    key={evt.id}
                    className="flex flex-col justify-between p-5 space-y-5 h-full"
                    spotlightColor="rgba(var(--primary), 0.12)"
                  >
                    <div className="space-y-4">
                      {/* Event Poster or Graphic */}
                      <div className="relative w-full h-44 rounded-[14px] overflow-hidden bg-surface-2 border border-line">
                        {evt.poster_url ? (
                          <img
                            src={evt.poster_url}
                            alt={evt.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-primary-soft text-primary">
                            <Building2 className="w-10 h-10 mb-2 opacity-60" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              FXEC Lecture
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2.5 right-2.5 bg-surface/90 backdrop-blur-xs text-xs font-bold text-ink px-2.5 py-1 rounded-full border border-line shadow-xs">
                          {seatsLeft > 0 ? `${seatsLeft} seats left` : 'Waitlist only'}
                        </div>
                      </div>

                      {/* Meta Information */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{startDateStr} • {startTimeStr}</span>
                        </div>
                        <h3 className="text-base font-bold text-ink line-clamp-2 leading-snug">
                          {evt.title}
                        </h3>
                        {evt.venue && (
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{evt.venue}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA button */}
                    <div className="pt-3 border-t border-line/60">
                      <Link to="/login" className="w-full block">
                        <AppButton variant="primary" size="sm" className="w-full">
                          Sign in to register
                        </AppButton>
                      </Link>
                    </div>
                  </AppSpotlightCard>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. SLOW BRAND BAND (ScrollVelocity) */}
      <ScrollVelocity text="ATTEND · LEARN · EARN · GET RECOGNIZED" />

      {/* 5. STATEMENT PARAGRAPH (ScrollReveal) */}
      <section className="py-12 sm:py-16 bg-surface/40 border-b border-line">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <ScrollReveal>
            <p className="font-serif text-xl sm:text-2xl text-ink leading-relaxed">
              Every workshop, symposium, and guest lecture at Francis Xavier Engineering College is verified from seat reservation to QR attendance and cryptographic credentialing.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. INDUSTRY VOICES (LogoLoop, Strict Rule: hide if none) */}
      {speakerCompanies.length > 0 && (
        <section className="py-10 border-b border-line bg-bg overflow-hidden select-none">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              Distinguished Speakers from Industry Leaders
            </p>
          </div>
          <LogoLoop items={speakerCompanies} speed={36} className="w-full" />
        </section>
      )}

      {/* 6. FEATURES: MagicBento 6 Tiles (Strict Rule: NO demo visuals or fake numbers) */}
      <section id="features" className="py-16 sm:py-24 border-b border-line bg-surface/40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="primary" size="sm" className="uppercase tracking-widest font-bold">
              Core Capabilities
            </Badge>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-ink">
              Architected for Academic Rigor
            </h2>
            <p className="text-sm sm:text-base text-muted">
              Every workflow is engineered around compliance, cryptographic integrity, and institutional accountability.
            </p>
          </div>

          <div className="w-full">
            <MagicBento
              items={bentoFeatureTiles}
              columns={3}
              rowHeight={210}
              gap={16}
              radius={20}
              theme={resolvedTheme || 'light'}
              glowColor="rgb(var(--primary))"
              enableBorderGlow={true}
              enableSpotlight={true}
              spotlightRadius={320}
              clickEffect={true}
              intro={true}
              enableStars={false}
              enableTilt={false}
              enableMagnetism={false}
            />
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS: 4 Numbered Steps with AnimatedContent & BlurText */}
      <section className="py-16 sm:py-24 border-b border-line bg-bg">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="neutral" size="sm" className="uppercase tracking-widest font-bold">
              Workflow
            </Badge>
            <BlurText
              text="How Campus Connect Works"
              delay={40}
              direction="top"
              animateBy="words"
              trigger="view"
              className="font-serif text-3xl sm:text-4xl font-semibold text-ink justify-center text-center"
            />
            <p className="text-sm sm:text-base text-muted">
              From discovering approved sessions to downloading verified certificates in four streamlined steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Register',
                desc: 'Explore upcoming approved guest lectures and reserve a confirmed seat with single-click Google authentication.',
                icon: Calendar,
              },
              {
                step: '02',
                title: 'Attend with QR',
                desc: 'Verify your physical presence at the hall by scanning rotating anti-spoof dynamic venue QR codes.',
                icon: QrCode,
              },
              {
                step: '03',
                title: 'Earn Points',
                desc: 'Automatically accumulate student reward points accredited to your department transcript.',
                icon: Award,
              },
              {
                step: '04',
                title: 'Download Certificate',
                desc: 'Receive digitally signed PDF credentials with tamper-proof validation hashes for career placement.',
                icon: FileCheck2,
              },
            ].map((st, idx) => {
              const Icon = st.icon;
              return (
                <AnimatedContent
                  key={st.step}
                  delay={idx * 0.12}
                  distance={30}
                  className="h-full"
                >
                  <div className="h-full p-6 rounded-[20px] bg-surface border border-line flex flex-col justify-between space-y-4 shadow-xs hover:border-primary/40 transition-colors">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-2xl font-bold text-primary/80">
                          {st.step}
                        </span>
                        <div className="w-10 h-10 rounded-[12px] bg-primary-soft text-primary flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-base font-bold text-ink">{st.title}</h3>
                        <p className="text-xs text-muted leading-relaxed">{st.desc}</p>
                      </div>
                    </div>
                    <div className="w-full pt-3 border-t border-line/60 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Institutional Step</span>
                    </div>
                  </div>
                </AnimatedContent>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. VERIFY: Code Slots input with Verify Button leading to /verify/:code */}
      <section className="py-16 sm:py-20 border-b border-line bg-surface/50">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-2">
            <Badge variant="primary" size="sm" className="uppercase tracking-widest font-bold">
              Public Ledger Verification
            </Badge>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
              Verify Certificate Authenticity
            </h2>
            <p className="text-sm text-muted max-w-lg mx-auto">
              Enter the unique 8-character certificate code to verify cryptographic authenticity directly against the college database.
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <AppCodeInput
                length={8}
                value={verifyCode}
                onChange={(val) => setVerifyCode(val)}
                aria-label="Certificate Verification Code"
                className="justify-center"
              />
              <span className="text-xs text-muted">
                Format: 8-character alphanumeric code printed on the official certificate
              </span>
            </div>

            <div className="flex items-center gap-3">
              <AppButton type="submit" variant="primary" size="md" className="gap-2">
                <Search className="w-4 h-4" />
                <span>Verify Credential</span>
              </AppButton>
              <Link to="/verify">
                <AppButton variant="secondary" size="md">
                  QR Scanner View
                </AppButton>
              </Link>
            </div>
          </form>
        </div>
      </section>

      {/* 8. MOMENTS GALLERY (FlexCarousel / Scroll-Snap fallback) */}
      <MomentsSection className="bg-bg" />

      {/* 9. CLOSING CALL-TO-ACTION */}
      <section className="py-16 sm:py-24 bg-bg">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[24px] bg-primary text-on-primary p-8 sm:p-14 text-center shadow-md">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface border border-line text-xs font-semibold uppercase tracking-wider text-ink select-none shadow-xs">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span>Francis Xavier Engineering College</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-on-primary">
                Empowering Next-Generation Engineers & Industry Collaborations
              </h2>
              <p className="text-sm sm:text-base text-on-primary max-w-xl mx-auto leading-relaxed">
                Connect with world-class industry experts, expand your engineering knowledge, and build an accredited digital portfolio.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/login" className="w-full sm:w-auto">
                  <AppButton
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto bg-surface text-ink hover:bg-surface-2 border-0 shadow-sm"
                  >
                    Sign In with College ID
                  </AppButton>
                </Link>
                <Link to="/events" className="w-full sm:w-auto">
                  <AppButton
                    variant="ghost"
                    size="lg"
                    className="w-full sm:w-auto !text-on-primary hover:bg-on-primary/10 border border-on-primary/30"
                  >
                    Explore Public Calendar
                  </AppButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageEnter>
  );
}
