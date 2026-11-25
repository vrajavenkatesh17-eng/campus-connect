/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * RoleWelcomeDesk: S-F Role Home Welcome Desk.
 * - Left:
 *   - Greeting in Fraunces ("Good morning/afternoon/evening, <first name>")
 *   - 3 Contextual Actions with real live counts using Counter
 *   - Next-Event card with Counter countdown and state-driven actions
 * - Right:
 *   - Lanyard badge with real authenticated user data (avatar/monogram, Fraunces name, role pill, department, ID line)
 *   - Physics drops in ONCE per login session via sessionStorage flag; afterwards hangs still
 *   - Mobile (<768px), reduced motion or no WebGL: static card fallback, zero physics
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { supabase } from '../../services/supabase';
import Button from './Button';
import Badge from './Badge';
import Card from './Card';
import Counter from '../ui/Counter/Counter';
import SplitText from '../ui/SplitText/SplitText';
import LanyardBadge from '../ui/Lanyard/LanyardBadge';
import RotatingQRModal from '../attendance/RotatingQRModal';
import {
  Calendar,
  Sparkles,
  Ticket,
  PlusCircle,
  QrCode,
  Clock,
  UserCheck,
  BarChart3,
  MapPin,
  ArrowRight,
  Radio,
  Building2,
} from 'lucide-react';

export default function RoleWelcomeDesk() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();

  // Metrics state
  const [nextEvent, setNextEvent] = useState(null);
  const [liveEvent, setLiveEvent] = useState(null);
  const [pendingEventsCount, setPendingEventsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [myRegistrationsCount, setMyRegistrationsCount] = useState(0);
  const [myPassportCount, setMyPassportCount] = useState(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Time-of-day greeting in Fraunces
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Clean first name extraction
  const cleanFirstName = useMemo(() => {
    if (profile?.name && typeof profile.name === 'string') {
      const clean = profile.name.replace(/\b\d{2}[A-Z]{2,4}\d{2,4}\b/gi, '').trim();
      return clean.split(' ')[0] || 'User';
    }
    return user?.email?.split('@')[0] || 'User';
  }, [profile?.name, user?.email]);

  // Fetch real counts & next event from database
  useEffect(() => {
    let isMounted = true;

    async function loadDeskData() {
      setIsLoading(true);
      try {
        // 1. Fetch next upcoming event
        const nextEvt = await eventService.getPublicNextEvent();
        if (isMounted && nextEvt) {
          setNextEvent(nextEvt);
        }

        // 2. Fetch role-specific live data
        if (role === 'student' && user?.id) {
          const [regsRes, attRes] = await Promise.all([
            supabase
              .from('event_registrations')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('status', 'registered'),
            supabase
              .from('attendance')
              .select('id', { count: 'exact', head: true })
              .eq('student_id', user.id)
              .eq('status', 'present'),
          ]);
          if (isMounted) {
            setMyRegistrationsCount(regsRes.count || 0);
            setMyPassportCount(attRes.count || 0);
          }
        } else if (role === 'coordinator' && user?.id) {
          const [coordEvtsRes, pendingRes] = await Promise.all([
            supabase
              .from('events')
              .select('*')
              .eq('created_by', user.id)
              .order('start_time', { ascending: true }),
            supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .eq('created_by', user.id)
              .eq('status', 'pending'),
          ]);

          if (isMounted) {
            const evts = coordEvtsRes.data || [];
            setPendingEventsCount(pendingRes.count || 0);

            // Check if any event is live now
            const now = new Date();
            const live = evts.find((e) => {
              if (e.status !== 'approved') return false;
              const start = new Date(e.start_time);
              const end = e.end_time ? new Date(e.end_time) : new Date(start.getTime() + 2 * 3600000);
              return now >= start && now <= end;
            });
            if (live) setLiveEvent(live);
          }
        } else if (role === 'admin') {
          const [pendingEvtsRes, pendingReqsRes] = await Promise.all([
            supabase
              .from('events')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending'),
            supabase
              .from('coordinator_requests')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending'),
          ]);

          if (isMounted) {
            setPendingEventsCount(pendingEvtsRes.count || 0);
            setPendingRequestsCount(pendingReqsRes.count || 0);
          }
        }
      } catch (err) {
        console.warn('Welcome desk data load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDeskData();
    return () => {
      isMounted = false;
    };
  }, [user?.id, role]);

  // Countdown timer calculations with server-time offset
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' })
      .then((res) => {
        const dateHeader = res.headers.get('date');
        if (active && dateHeader) {
          const serverTime = new Date(dateHeader).getTime();
          if (!Number.isNaN(serverTime)) {
            setServerOffsetMs(serverTime - Date.now());
          }
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!nextEvent?.start_time) return;

    const target = new Date(nextEvent.start_time).getTime();
    const updateCountdown = () => {
      const nowServer = Date.now() + serverOffsetMs;
      const diff = Math.max(0, target - nowServer);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [nextEvent, serverOffsetMs]);

  return (
    <section className="w-full mb-10 pt-2 pb-6 border-b border-line select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Side: Welcome Desk (Col 1 to 7 on lg) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* Greeting in Fraunces Variable with SplitText */}
          <div className="space-y-1.5">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
              <SplitText text={`${greeting}, ${cleanFirstName}`} delay={24} />
            </h1>
            <p className="text-sm sm:text-base text-muted font-normal">
              {role === 'admin' && 'Francis Xavier Institutional Administration & Governance Portal'}
              {role === 'coordinator' && `${profile?.departments?.name || 'Department Faculty'} • Academic Coordination Hub`}
              {role === 'student' && `${profile?.departments?.name || 'Engineering Student'} • Digital Identity & Event Transcripts`}
            </p>
          </div>

          {/* 3 Contextual Actions per Role strictly per S-F */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {role === 'student' && (
              <>
                <Link to="/events" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Browse</span>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Upcoming Events</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <Link to="/student" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Passes</span>
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">My Registrations</span>
                      <span className="text-base font-bold text-primary tabular-nums">
                        <Counter value={myRegistrationsCount} />
                      </span>
                    </div>
                  </div>
                </Link>

                <Link to="/student/passport" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Transcript</span>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Passport</span>
                      <span className="text-base font-bold text-primary tabular-nums">
                        <Counter value={myPassportCount} />
                      </span>
                    </div>
                  </div>
                </Link>
              </>
            )}

            {role === 'coordinator' && (
              <>
                <Link to="/coordinator/events/new" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Create</span>
                      <PlusCircle className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Propose Event</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <div
                  onClick={() => {
                    if (liveEvent) setIsQrModalOpen(true);
                  }}
                  className={`p-3.5 rounded-[14px] bg-surface border transition-all shadow-xs flex flex-col justify-between h-24 select-none ${
                    liveEvent
                      ? 'border-primary/40 hover:bg-primary-soft/30 cursor-pointer text-primary'
                      : 'border-line opacity-70 cursor-not-allowed text-muted'
                  }`}
                  title={liveEvent ? `Live: ${liveEvent.title}` : 'No event is live right now'}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold tracking-wider">
                      {liveEvent ? 'Event Live' : 'Attendance'}
                    </span>
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink">Launch QR</span>
                    {liveEvent && (
                      <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                    )}
                  </div>
                </div>

                <Link to="/coordinator/sessions" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Review</span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Pending Items</span>
                      <span className="text-base font-bold text-primary tabular-nums">
                        <Counter value={pendingEventsCount} />
                      </span>
                    </div>
                  </div>
                </Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link to="/admin/events" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Proposals</span>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Pending Events</span>
                      <span className="text-base font-bold text-primary tabular-nums">
                        <Counter value={pendingEventsCount} />
                      </span>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/requests" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Faculty</span>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Pending Requests</span>
                      <span className="text-base font-bold text-primary tabular-nums">
                        <Counter value={pendingRequestsCount} />
                      </span>
                    </div>
                  </div>
                </Link>

                <Link to="/admin/analytics" className="w-full">
                  <div className="p-3.5 rounded-[14px] bg-surface border border-line hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-pointer group flex flex-col justify-between h-24">
                    <div className="flex items-center justify-between text-muted group-hover:text-primary">
                      <span className="text-xs uppercase font-semibold tracking-wider">Insights</span>
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">Open Analytics</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Next-Event Card with Counter Countdown */}
          {nextEvent ? (
            <div className="p-5 rounded-[18px] bg-surface border border-line shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Next Academic Event
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted font-mono">
                  <span>In:</span>
                  <span className="tabular-nums font-bold text-ink">
                    <Counter value={timeLeft.days} />d <Counter value={timeLeft.hours} />h{' '}
                    <Counter value={timeLeft.minutes} />m
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-base font-bold text-ink truncate" title={nextEvent.title}>
                    {nextEvent.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {new Date(nextEvent.start_time).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      {nextEvent.venues?.name || 'Campus Venue'}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link to={`/events/${nextEvent.id}`}>
                    <Button variant="primary" size="sm">
                      {role === 'coordinator' ? 'Manage Event' : 'View Details'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[14px] bg-surface-2 border border-line text-xs text-muted flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted shrink-0" />
              <span>No upcoming institutional events scheduled right now. Check back soon.</span>
            </div>
          )}
        </div>

        {/* Right Side: Lanyard Badge with Signed-In User's REAL data (Col 8 to 12 on lg) */}
        <div className="lg:col-span-5 xl:col-span-5 flex items-center justify-center relative">
          <div className="w-full max-w-[380px] lg:max-w-none flex items-center justify-center">
            <LanyardBadge
              user={user}
              profile={profile}
              role={role}
              sessionDropOnly={true}
            />
          </div>
        </div>
      </div>

      {/* Rotating QR Modal for Coordinator Live Launch */}
      {isQrModalOpen && liveEvent && (
        <RotatingQRModal
          event={liveEvent}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
        />
      )}
    </section>
  );
}
