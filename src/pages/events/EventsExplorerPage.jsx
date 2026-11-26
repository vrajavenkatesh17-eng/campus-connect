/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.1 /events: Public Events Explorer Page
 * - PageHeader with institutional styling
 * - AppSegmented [Upcoming | Past]
 * - Instant search filter with debounce
 * - AppSpotlightCard grid:
 *     - Upcoming: poster, title, date, venue, seats left, speaker chip, CTA: "Sign in to register" (or "View details")
 *     - Past: photo/poster, title, date, speaker, public_summary
 * - Pagination (12 events per page) with offset
 * - Dedicated empty states per tab
 * - Zero UI token violations, fully accessible, 360-1280px responsive
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import PageContainer from '../../components/common/PageContainer';
import PageHeader from '../../components/common/PageHeader';
import AppSegmented from '../../components/app/AppSegmented';
import AppSpotlightCard from '../../components/app/AppSpotlightCard';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { PageEnter } from '../../components/motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Building2,
  BookOpen,
  GraduationCap
} from 'lucide-react';

const PAGE_SIZE = 12;

export default function EventsExplorerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'upcoming' | 'past'
  const initialTab = searchParams.get('tab') === 'past' ? 'past' : 'upcoming';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [events, setEvents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab === 'past') params.set('tab', 'past');
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (currentPage > 1) params.set('page', currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [activeTab, debouncedSearch, currentPage, setSearchParams]);

  // Fetch paginated events from eventService
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await eventService.getPublicPaginatedEvents({
        timing: activeTab,
        search: debouncedSearch,
        page: currentPage,
        pageSize: PAGE_SIZE,
      });
      setEvents(res.events || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load events list:', err);
      setEvents([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, debouncedSearch, currentPage]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Tab switch handler
  const handleTabChange = (val) => {
    setActiveTab(val);
    setCurrentPage(1);
  };

  // Date formatting helpers
  const formatEventDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatEventTime = (startStr, endStr) => {
    if (!startStr) return '';
    const s = new Date(startStr);
    const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    if (!endStr) return s.toLocaleTimeString('en-IN', timeOptions);
    const e = new Date(endStr);
    return `${s.toLocaleTimeString('en-IN', timeOptions)} - ${e.toLocaleTimeString('en-IN', timeOptions)}`;
  };

  return (
    <PageEnter className="py-8 sm:py-12 bg-bg min-h-[calc(100vh-64px)]">
      <PageContainer className="space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-line">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-primary text-xs font-semibold tracking-wider uppercase select-none">
              <Sparkles className="w-3.5 h-3.5" />
              <span>FXEC Autonomous Knowledge Exchange</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight">
              Guest Lectures & Technical Sessions
            </h1>
            <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
              Explore accredited industry sessions, experiential workshops, and technical symposiums delivered by global industry leaders.
            </p>
          </div>

          {/* Segmented Control: Upcoming vs Past */}
          <div className="w-full sm:w-auto shrink-0">
            <AppSegmented
              items={[
                { label: 'Upcoming', value: 'upcoming' },
                { label: 'Past Sessions', value: 'past' },
              ]}
              value={activeTab}
              onChange={handleTabChange}
              size="lg"
              className="w-full sm:w-64"
              aria-label="Filter events by status"
            />
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by lecture title or topic..."
              className="w-full pl-10 pr-10 py-2.5 rounded-[12px] bg-surface border border-line text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              aria-label="Search events"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink rounded-full h-7 w-7 min-w-0"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="text-xs font-semibold text-muted tracking-wider uppercase self-start sm:self-center">
            {isLoading ? (
              <span>Loading sessions...</span>
            ) : (
              <span>
                Showing {events.length} of {totalCount} {activeTab === 'upcoming' ? 'upcoming' : 'past'}{' '}
                {totalCount === 1 ? 'event' : 'events'}
              </span>
            )}
          </div>
        </div>

        {/* Event Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Spinner size="lg" />
            <p className="text-xs font-medium text-muted">Retrieving institutional sessions...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12">
            {activeTab === 'upcoming' ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming events scheduled"
                description={
                  debouncedSearch
                    ? `No upcoming guest lectures matched "${debouncedSearch}". Try a different search term or check past sessions.`
                    : 'All upcoming sessions have concluded or are awaiting coordinator scheduling. Explore past sessions to review presentation summaries.'
                }
                actionLabel={debouncedSearch ? 'Clear Search' : 'View Past Sessions'}
                onAction={() => (debouncedSearch ? setSearchQuery('') : setActiveTab('past'))}
              />
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No past sessions found"
                description={
                  debouncedSearch
                    ? `No archived event records matched "${debouncedSearch}".`
                    : 'No completed session records are currently archived in this directory.'
                }
                actionLabel={debouncedSearch ? 'Clear Search' : undefined}
                onAction={debouncedSearch ? () => setSearchQuery('') : undefined}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {events.map((evt) => {
              const seatsLeft = Math.max(0, evt.seat_capacity - evt.registered_count);
              const isPast = activeTab === 'past';

              return (
                <AppSpotlightCard
                  key={evt.id}
                  className="h-full flex flex-col justify-between overflow-hidden group shadow-xs border border-line"
                >
                  <div className="space-y-4 flex-1 flex flex-col">
                    {/* Event Poster or Accent Banner */}
                    <div className="relative h-48 w-full rounded-[14px] overflow-hidden bg-surface-2 border border-line/50 shrink-0">
                      {evt.poster_url ? (
                        <img
                          src={evt.poster_url}
                          alt={evt.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-primary-soft to-surface-2">
                          <Building2 className="w-10 h-10 text-primary/40 mb-2" />
                          <span className="font-serif font-bold text-xs uppercase tracking-widest text-primary/80">
                            Francis Xavier Engineering College
                          </span>
                        </div>
                      )}

                      {/* Status / Seats Pill Overlay with Scrim */}
                      <div className="absolute top-3 right-3 z-10">
                        {isPast ? (
                          <Badge variant="neutral" size="sm" className="font-semibold shadow-xs">
                            Archived Session
                          </Badge>
                        ) : seatsLeft === 0 ? (
                          <Badge variant="danger" size="sm" className="font-semibold shadow-xs">
                            Seats Filled
                          </Badge>
                        ) : (
                          <Badge variant="primary" size="sm" className="font-semibold shadow-xs">
                            {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Metadata Strip */}
                    <div className="flex items-center gap-3 text-xs text-muted font-medium pt-1">
                      <div className="inline-flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{formatEventDate(evt.start_time || evt.event_date)}</span>
                      </div>
                      <span className="text-line">•</span>
                      <div className="inline-flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>

                    {/* Event Title */}
                    <h3 className="font-serif font-bold text-lg sm:text-xl text-ink leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {evt.title}
                    </h3>

                    {/* Speaker Chip */}
                    {evt.speaker_name && (
                      <div className="p-2.5 rounded-[10px] bg-surface-2/70 border border-line text-xs flex items-center justify-between gap-2">
                        <span className="font-semibold text-ink truncate">
                          {evt.speaker_name}
                        </span>
                        {evt.speaker_company && (
                          <span className="text-muted text-xs truncate max-w-[130px] text-right">
                            {evt.speaker_company}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Past Tab: Show public_summary */}
                    {isPast && evt.public_summary && (
                      <p className="text-xs text-muted leading-relaxed line-clamp-3 pt-1 border-t border-line/60">
                        <span className="font-semibold text-ink">Summary: </span>
                        {evt.public_summary}
                      </p>
                    )}
                  </div>

                  {/* Bottom Action Area */}
                  <div className="pt-5 mt-4 border-t border-line/80 flex items-center justify-between">
                    {isPast ? (
                      <Link
                        to={`/events/${evt.id}`}
                        className="w-full flex items-center justify-between text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                      >
                        <span>Review event archive</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : user ? (
                      <Link to={`/events/${evt.id}`} className="w-full">
                        <Button variant="primary" size="sm" className="w-full justify-between">
                          <span>View Details & Register</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/login?redirect=/events/${evt.id}`} className="w-full">
                        <Button variant="secondary" size="sm" className="w-full justify-between">
                          <span>Sign in to register</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </AppSpotlightCard>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted">
              Page <span className="font-semibold text-ink">{currentPage}</span> of{' '}
              <span className="font-semibold text-ink">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // Only display nearby pages for clean pagination
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={isLoading}
                        className="w-8 h-8 p-0 min-w-0 font-semibold text-xs"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                  if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="px-1 text-xs text-muted">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoading}
                className="gap-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </PageEnter>
  );
}
