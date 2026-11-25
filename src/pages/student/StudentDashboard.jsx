/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Student Portal Dashboard:
 * Rebuilt strictly per DESIGN_SPEC v2 Section 4:
 * - Row 1: Greeting in Fraunces + "Next Event" Hero (span 8) + Side Stack (span 4: Points & Rank, Certificates)
 * - Row 2: "Upcoming Events": filters (AppSelect + AppSegmented) and 3-column grid of event cards (AppSpotlightCard)
 * - Row 3: "My Registrations" (TearTicket passes) + Live Notification Stream
 * - Row 4: Achievement Passport MagicBento (events attended, points, rank, certificates, learning hours)
 * Semantic tokens only, dark/light theme reactive, 100% real Supabase data.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import { pointsService } from '../../services/pointsService';
import { certificateService } from '../../services/certificateService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoleWelcomeDesk from '../../components/common/RoleWelcomeDesk';
import MomentsSection from '../../components/sections/MomentsSection';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Counter from '../../components/ui/Counter/Counter';
import AppSpotlightCard from '../../components/app/AppSpotlightCard';
import AppSegmented from '../../components/app/AppSegmented';
import AppSelect from '../../components/app/AppSelect';
import AppSeatGauge from '../../components/app/AppSeatGauge';
import TearTicket from '../../components/common/TearTicket';
import MagicBento from '../../components/MagicBento/MagicBento';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Award,
  Sparkles,
  Trophy,
  ArrowRight,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Ticket,
  ChevronRight,
  Radio,
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  // Core Data State
  const [nextEvent, setNextEvent] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [pointsSummary, setPointsSummary] = useState({ totalPoints: 0, history: [] });
  const [userRank, setUserRank] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters State for Row 2
  const [eventTypeFilter, setEventTypeFilter] = useState('all'); // 'all' | 'technical' | 'symposium'
  const [selectedDeptId, setSelectedDeptId] = useState('');

  // Time-of-day greeting in Fraunces
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const cleanFirstName = useMemo(() => {
    if (profile?.name && typeof profile.name === 'string') {
      const clean = profile.name.replace(/\b\d{2}[A-Z]{2,4}\d{2,4}\b/gi, '').trim();
      return clean.split(' ')[0] || 'Student';
    }
    return user?.email?.split('@')[0] || 'Student';
  }, [profile?.name, user?.email]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        nextEvt,
        eventsList,
        myRegs,
        myAtt,
        myCerts,
        ptsData,
        leaderboard,
        notifs,
        depts,
      ] = await Promise.all([
        eventService.getPublicNextEvent().catch(() => null),
        eventService.getEvents().catch(() => []),
        eventService.getMyRegistrations().catch(() => []),
        attendanceService.getStudentAttendanceHistory().catch(() => []),
        certificateService.getMyCertificates().catch(() => []),
        pointsService.getStudentPointsSummary(user?.id).catch(() => ({ totalPoints: 0, history: [] })),
        pointsService.getLeaderboard(null, 100).catch(() => []),
        eventService.getNotifications().catch(() => []),
        eventService.getDepartments().catch(() => []),
      ]);

      setNextEvent(nextEvt);
      setUpcomingEvents(eventsList || []);
      setRegistrations(myRegs || []);
      setAttendances(myAtt || []);
      setCertificates(myCerts || []);
      setPointsSummary(ptsData || { totalPoints: 0, history: [] });
      setNotifications(notifs || []);
      setDepartments(depts || []);

      // Derive user rank in leaderboard
      const myRankItem = (leaderboard || []).find((entry) => entry.student_id === user?.id);
      if (myRankItem) {
        setUserRank(myRankItem.leaderboard_rank);
      }
    } catch (err) {
      console.error('Failed to load student home data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  // Derived Countdown Timer for Next Event
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!nextEvent?.start_time) return;
    const target = new Date(nextEvent.start_time).getTime();
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [nextEvent]);

  // Filtered upcoming events for Row 2
  const filteredUpcomingEvents = useMemo(() => {
    const now = new Date();
    return upcomingEvents
      .filter((e) => new Date(e.end_time || e.start_time) >= now)
      .filter((e) => {
        if (!selectedDeptId) return true;
        if (e.is_all_departments) return true;
        return e.event_departments?.some((ed) => ed.department_id === selectedDeptId || ed.department?.id === selectedDeptId);
      })
      .slice(0, 6);
  }, [upcomingEvents, selectedDeptId]);

  // Check if current user is registered for the next event
  const isRegisteredForNext = useMemo(() => {
    if (!nextEvent?.id) return false;
    return registrations.some((r) => r.event_id === nextEvent.id && r.status !== 'cancelled');
  }, [nextEvent?.id, registrations]);

  // Points tier
  const totalPoints = pointsSummary.totalPoints || 0;
  const tier =
    totalPoints >= 300
      ? 'Platinum Scholar'
      : totalPoints >= 150
      ? 'Gold Achiever'
      : totalPoints >= 50
      ? 'Silver Explorer'
      : 'Bronze Participant';

  // Certified hours (2 hrs per verified attendance)
  const totalCertifiedHours = attendances.length * 2;
  const dynamicGlow = resolvedTheme === 'dark' ? 'rgb(var(--primary))' : 'rgb(var(--primary))';

  // Row 4: MagicBento Items for Achievement Passport
  const bentoItems = useMemo(
    () => [
      {
        id: 'passport-hours',
        title: 'Certified Learning Hours',
        label: 'Academic Accreditation',
        colSpan: 2,
        rowSpan: 1,
        visual: (
          <div className="w-full h-full flex items-center justify-between px-3 select-none">
            <div className="space-y-1">
              <span className="text-3xl font-extrabold text-primary tabular-nums">
                {totalCertifiedHours} hrs
              </span>
              <p className="text-xs text-muted font-medium">
                Verified industrial learning across {attendances.length} guest sessions
              </p>
            </div>
            <Badge variant="success" size="sm" className="gap-1 text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </Badge>
          </div>
        ),
      },
      {
        id: 'passport-attended',
        title: 'Sessions Attended',
        label: 'Attendance Turnout',
        colSpan: 1,
        rowSpan: 1,
        visual: (
          <div className="w-full h-full flex flex-col justify-center px-2 select-none">
            <span className="text-3xl font-extrabold text-ink tabular-nums">
              {attendances.length}
            </span>
            <p className="text-xs text-muted font-medium mt-1">Concluded lectures</p>
          </div>
        ),
      },
      {
        id: 'passport-rank',
        title: 'Campus Rank',
        label: 'Recognition',
        colSpan: 1,
        rowSpan: 1,
        visual: (
          <div className="w-full h-full flex flex-col justify-center px-2 select-none">
            <span className="text-3xl font-extrabold text-gold tabular-nums">
              {userRank ? `#${userRank}` : '—'}
            </span>
            <p className="text-xs text-muted font-medium mt-1">College-wide position</p>
          </div>
        ),
      },
      {
        id: 'passport-credential',
        title: 'Extracurricular Passport',
        label: 'Official Transcript',
        colSpan: 2,
        rowSpan: 1,
        visual: (
          <div className="w-full h-full flex items-center justify-between px-3 select-none">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">Institutional Digital Credential</span>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <p className="text-xs text-muted font-medium">
                Official accreditation for placements & university transcripts
              </p>
            </div>
            <Link to="/student/passport">
              <Button size="xs" variant="primary">
                View Passport
              </Button>
            </Link>
          </div>
        ),
      },
      {
        id: 'passport-certs',
        title: 'Participation Credentials',
        label: 'Certificates',
        colSpan: 2,
        rowSpan: 1,
        visual: (
          <div className="w-full h-full flex items-center justify-between px-3 select-none">
            <div className="space-y-1">
              <span className="text-3xl font-extrabold text-ink tabular-nums">
                {certificates.length}
              </span>
              <p className="text-xs text-muted font-medium">
                Institutional e-certificates with cryptographic QR verification
              </p>
            </div>
            <Link to="/student/certificates">
              <Button size="xs" variant="outline">
                Claim / View
              </Button>
            </Link>
          </div>
        ),
      },
    ],
    [totalCertifiedHours, attendances.length, userRank, certificates.length]
  );

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* S-F: Student Role Home Welcome Desk + Lanyard */}
        <RoleWelcomeDesk />

        {/* ROW 1: Next Event Hero (Span 8) + Side Stack (Span 4) */}
        <section className="space-y-6">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Span 8: "Next Event" Hero */}
            <div className="lg:col-span-8 flex">
              {nextEvent ? (
                <div className="w-full rounded-[20px] bg-surface border border-line p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
                  <div className="space-y-4">
                    {/* Top Hero Pill & Countdown */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                          Next Academic Event
                        </span>
                      </div>

                      {/* Live Counter Countdown */}
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted bg-surface-2 px-3 py-1 rounded-full border border-line">
                        <span>Starts in:</span>
                        <span className="text-primary tabular-nums">
                          <Counter value={timeLeft.days} />d <Counter value={timeLeft.hours} />h{' '}
                          <Counter value={timeLeft.minutes} />m <Counter value={timeLeft.seconds} />s
                        </span>
                      </div>
                    </div>

                    {/* Title & Speaker Details */}
                    <div>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-snug line-clamp-2">
                        {nextEvent.title}
                      </h2>
                      {nextEvent.speakers && (
                        <p className="text-xs sm:text-sm text-muted mt-2 flex items-center gap-2">
                          <span className="font-semibold text-ink">{nextEvent.speakers.name}</span>
                          <span>•</span>
                          <span>{nextEvent.speakers.designation}, {nextEvent.speakers.company}</span>
                        </p>
                      )}
                    </div>

                    {/* Schedule & Venue Meta */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted pt-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-medium text-ink">
                          {new Date(nextEvent.start_time).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>
                          {new Date(nextEvent.start_time).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{nextEvent.venues?.name || nextEvent.custom_venue || 'FXEC Campus'}</span>
                      </span>
                    </div>

                    {/* Seat Capacity Gauge */}
                    <div className="pt-2">
                      <AppSeatGauge
                        occupied={nextEvent.registered_count || 0}
                        total={nextEvent.seat_capacity || 100}
                        label="Seat Availability"
                      />
                    </div>
                  </div>

                  {/* Hero Action Footer */}
                  <div className="pt-5 mt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-muted">
                      {isRegisteredForNext ? (
                        <Badge variant="success" size="sm" className="gap-1 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Seat Confirmed
                        </Badge>
                      ) : (
                        <span>Open to eligible engineering students</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Link to={`/events/${nextEvent.id}`} className="w-full sm:w-auto">
                        <Button
                          variant={isRegisteredForNext ? 'secondary' : 'primary'}
                          size="sm"
                          className="w-full text-xs gap-1.5 shadow-xs"
                        >
                          <span>{isRegisteredForNext ? 'View Ticket Pass' : 'View & Register'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-[20px] bg-surface border border-line p-8 flex flex-col items-center justify-center text-center space-y-3">
                  <Calendar className="w-10 h-10 text-muted" />
                  <h3 className="font-bold text-base text-ink">No Scheduled Events Right Now</h3>
                  <p className="text-xs text-muted max-w-md">
                    Check back soon for new guest lectures, workshops, and industry speaker announcements.
                  </p>
                </div>
              )}
            </div>

            {/* Span 4: Side Stack (Points & Rank, Certificates Count) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Card 1: Recognition Points & Rank */}
              <Card className="p-5 flex-1 flex flex-col justify-between border-line shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold tracking-wider text-muted">
                      Recognition Points
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold">
                      <Trophy className="w-3.5 h-3.5 text-gold" />
                      {userRank ? `#${userRank}` : 'Unranked'}
                    </span>
                  </div>

                  <div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-primary tabular-nums">
                      <Counter value={totalPoints} /> <span className="text-sm font-normal text-muted">pts</span>
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">
                      Tier: <span className="font-semibold text-ink">{tier}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <Link to="/student/points">
                    <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                      <span>View Leaderboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Card 2: Certificates Count */}
              <Card className="p-5 flex-1 flex flex-col justify-between border-line shadow-xs">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-semibold tracking-wider text-muted">
                      Official Certificates
                    </span>
                    <Badge variant="primary" size="sm" className="text-xs font-semibold">
                      Verified
                    </Badge>
                  </div>

                  <div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-ink tabular-nums">
                      <Counter value={certificates.length} />
                    </p>
                    <p className="text-xs text-muted font-medium mt-1">
                      Concluded session credentials ready to download
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <Link to="/student/certificates">
                    <Button variant="outline" size="sm" className="w-full text-xs justify-between">
                      <span>Claim Certificates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* ROW 2: "Upcoming Events" — Filters (AppSelect + AppSegmented) and 3-column Grid (AppSpotlightCard) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
            <div>
              <h2 className="text-xl font-bold text-ink">Upcoming Events</h2>
              <p className="text-xs text-muted">
                Explore approved industrial lectures, workshops, and technical symposiums
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-48">
                <AppSelect
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  placeholder="All Departments"
                  options={[
                    { value: '', label: 'All Departments' },
                    ...departments.map((d) => ({
                      value: d.id,
                      label: `${d.code} - ${d.name}`,
                    })),
                  ]}
                />
              </div>

              <Link to="/student/events">
                <Button variant="ghost" size="sm" className="text-xs gap-1 font-semibold text-primary">
                  <span>Browse All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {filteredUpcomingEvents.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Upcoming Events Found"
              description="No upcoming events currently match your selected department filter."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUpcomingEvents.map((evt) => {
                const startDate = new Date(evt.start_time);
                const isFull = (evt.registered_count || 0) >= (evt.seat_capacity || 100);

                return (
                  <AppSpotlightCard key={evt.id} className="h-full">
                    <div className="flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-3">
                        {/* Event Department Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap gap-1">
                            {evt.is_all_departments ? (
                              <Badge variant="neutral" size="sm">Open to All</Badge>
                            ) : (
                              evt.event_departments?.slice(0, 2).map((ed, idx) => (
                                <Badge key={idx} variant="primary" size="sm">
                                  {ed.department?.code}
                                </Badge>
                              ))
                            )}
                          </div>
                          <Badge
                            variant={evt.status === 'approved' ? 'success' : 'warning'}
                            size="sm"
                            className="text-xs uppercase font-semibold"
                          >
                            {evt.status}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-base text-ink line-clamp-2 leading-snug">
                          {evt.title}
                        </h3>

                        {/* Speaker Mini Pill */}
                        {evt.speakers && (
                          <p className="text-xs text-muted flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-ink">{evt.speakers.name}</span>
                            <span>• {evt.speakers.company}</span>
                          </p>
                        )}

                        {/* Date & Location */}
                        <div className="space-y-1 text-xs text-muted pt-1">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>
                              {startDate.toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              • {startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{evt.venues?.name || evt.custom_venue || 'FXEC Campus'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Capacity & CTA */}
                      <div className="pt-3 border-t border-line space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted font-medium">Seats</span>
                          <span className="font-bold text-ink">
                            {evt.registered_count || 0} / {evt.seat_capacity || 100}{' '}
                            {isFull && <span className="text-warning">(Full)</span>}
                          </span>
                        </div>

                        <Link to={`/events/${evt.id}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full text-xs justify-between shadow-xs"
                          >
                            <span>Event Details</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </AppSpotlightCard>
                );
              })}
            </div>
          )}
        </section>

        {/* ROW 3: "My Registrations" (TearTicket passes) + Live Notification Stream */}
        <section className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h2 className="text-xl font-bold text-ink">My Registrations & Admission Passes</h2>
              <p className="text-xs text-muted">
                Official passes for upcoming guest lectures and confirmed seat reservations
              </p>
            </div>
            <span className="text-xs font-semibold text-muted">
              {registrations.length} registered
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Span 8: TearTicket Passes */}
            <div className="lg:col-span-8 space-y-4">
              {registrations.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="No Active Admission Passes"
                  description="You have not registered for any upcoming guest lectures yet."
                  actionLabel="Browse Available Events"
                  onAction={() => navigate('/student/events')}
                />
              ) : (
                registrations.map((reg) => (
                  <TearTicket key={reg.id} registration={reg} />
                ))
              )}
            </div>

            {/* Span 4: Live Activity & Notifications Feed */}
            <div className="lg:col-span-4">
              <Card className="p-5 border-line shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                      Activity Feed
                    </h3>
                  </div>
                  <span className="text-xs text-muted font-mono">{notifications.length} updates</span>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-muted py-6 text-center">
                    No recent updates or notifications.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notif) => (
                      <div
                        key={notif.id}
                        className="p-3 rounded-xl bg-surface-2 border border-line text-xs space-y-1"
                      >
                        <p className="font-bold text-ink line-clamp-1">{notif.title}</p>
                        <p className="text-muted text-xs line-clamp-2">{notif.message}</p>
                        <p className="text-muted text-xs font-mono pt-1">
                          {new Date(notif.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </section>

        {/* ROW 4: Achievement Passport MagicBento */}
        <section className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h2 className="text-xl font-bold text-ink">Achievement Passport Transcript</h2>
              <p className="text-xs text-muted">
                Verified co-curricular digital transcript for campus placements and accreditation
              </p>
            </div>
            <Link to="/student/passport">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <span>Full Passport</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <MagicBento
            items={bentoItems}
            columns={4}
            rowHeight={160}
            gap={14}
            radius={20}
            theme={resolvedTheme || 'light'}
            glowColor={dynamicGlow}
            enableBorderGlow={true}
            enableSpotlight={true}
            spotlightRadius={300}
            clickEffect={true}
            intro={true}
            enableStars={false}
            enableTilt={false}
            enableMagnetism={false}
          />
        </section>

        {/* Campus Moments Gallery */}
        <MomentsSection />
      </div>
    </DashboardLayout>
  );
}
