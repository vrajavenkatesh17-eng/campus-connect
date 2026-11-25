import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Images, Calendar, Filter, RefreshCw } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import seedGallery from '../../assets/seed-gallery/seed.json';
import Masonry from '../../components/ui/Masonry/Masonry';
import AppSelect from '../../components/app/AppSelect';
import AppButton from '../../components/app/AppButton';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { PageEnter, PageTitle } from '../../components/motion';

function formatEventDate(dateStr, venue) {
  let formatted = '';
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      formatted = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  return formatted ? `${formatted} - ${venue || 'FXEC Campus'}` : venue || 'FXEC Campus';
}

export default function GalleryPage() {
  const [selectedEventId, setSelectedEventId] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [pageSize, setPageSize] = useState(24);

  const { data: rawItems = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['public-gallery-full', selectedEventId, selectedYear, pageSize],
    queryFn: async () => {
      const collected = [];
      const seen = new Set();

      const pushUnique = (item) => {
        if (!item?.src || seen.has(item.src)) return;
        seen.add(item.src);
        collected.push(item);
      };

      if (isSupabaseConfigured) {
        const eventParam = selectedEventId !== 'all' ? selectedEventId : null;
        const yearParam = selectedYear !== 'all' ? parseInt(selectedYear, 10) : null;

        try {
          const { data, error } = await supabase.rpc('public_gallery', {
            limit_count: pageSize,
            offset_count: 0,
            filter_event_id: eventParam,
            filter_year: yearParam,
          });

          if (!error && Array.isArray(data)) {
            data.forEach((row) => {
              pushUnique({
                id: row.id,
                src: row.src,
                alt: row.caption || row.event_title || 'Campus event photo',
                title: row.event_title || 'Campus Event',
                subtitle: formatEventDate(row.event_date, row.venue),
                caption: row.caption || '',
                eventId: row.event_id,
                year: row.event_date ? String(new Date(row.event_date).getFullYear()) : '',
              });
            });
          } else {
            let query = supabase
              .from('event_photos')
              .select('id, storage_path, caption, event_id, created_at, events(id, title, start_time, event_date, custom_venue, venues(name))')
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(pageSize);

            if (eventParam) {
              query = query.eq('event_id', eventParam);
            }

            const { data: directData } = await query;
            (directData || []).forEach((row) => {
              const dt = row.events?.event_date || row.events?.start_time;
              const yr = dt ? String(new Date(dt).getFullYear()) : '';
              if (yearParam && yr !== String(yearParam)) return;
              pushUnique({
                id: row.id,
                src: row.storage_path,
                alt: row.caption || row.events?.title || 'Campus event photo',
                title: row.events?.title || 'Campus Event',
                subtitle: formatEventDate(dt, row.events?.venues?.name || row.events?.custom_venue),
                caption: row.caption || '',
                eventId: row.event_id,
                year: yr,
              });
            });
          }
        } catch (err) {
          console.warn('GalleryPage fetch error:', err);
        }

        // Supplement with completed event posters if no approved gallery photos yet and no filters active
        if (collected.length === 0 && selectedEventId === 'all' && selectedYear === 'all') {
          try {
            const { data: pastEvents } = await supabase.rpc('public_past_events', { limit_count: 24 });
            (pastEvents || []).forEach((evt) => {
              if (evt.poster_url) {
                const dt = evt.event_date || evt.start_time;
                pushUnique({
                  id: `poster-${evt.id}`,
                  src: evt.poster_url,
                  alt: `${evt.title} poster`,
                  title: evt.title,
                  subtitle: formatEventDate(dt, 'FXEC Campus'),
                  caption: evt.public_summary || '',
                  eventId: evt.id,
                  year: dt ? String(new Date(dt).getFullYear()) : '',
                });
              }
            });
          } catch {
            // ignore
          }
        }
      }

      // If still empty and unfiltered, show seed gallery
      if (collected.length === 0 && selectedEventId === 'all' && selectedYear === 'all' && Array.isArray(seedGallery)) {
        seedGallery.forEach((seed) => {
          pushUnique({
            id: seed.id,
            src: seed.src,
            alt: seed.alt || seed.title,
            title: seed.title,
            subtitle: seed.subtitle,
            caption: seed.alt || '',
            year: '2026',
          });
        });
      }

      return collected;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch filterable events list
  const { data: eventOptions = [] } = useQuery({
    queryKey: ['public-gallery-events-filter'],
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data } = await supabase
        .from('events')
        .select('id, title, start_time')
        .in('status', ['approved', 'completed'])
        .order('start_time', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const eventSelectOptions = useMemo(() => {
    const base = [{ value: 'all', label: 'All Events' }];
    eventOptions.forEach((e) => {
      base.push({ value: e.id, label: e.title });
    });
    return base;
  }, [eventOptions]);

  const yearSelectOptions = useMemo(() => {
    const years = new Set(['2026', '2025', '2024']);
    eventOptions.forEach((e) => {
      if (e.start_time) years.add(String(new Date(e.start_time).getFullYear()));
    });
    return [
      { value: 'all', label: 'All Years' },
      ...Array.from(years)
        .sort((a, b) => Number(b) - Number(a))
        .map((y) => ({ value: y, label: y })),
    ];
  }, [eventOptions]);

  const hasMore = rawItems.length >= pageSize;

  return (
    <PageEnter className="min-h-dvh bg-bg py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-line">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Images className="w-3.5 h-3.5" />
              <span>FXEC Institutional Archive</span>
            </div>
            <PageTitle
              title="Campus Moments Gallery"
              subtitle="Verified event photography and highlights approved across Francis Xavier Engineering College."
              className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight"
              subtitleClassName="text-sm text-muted max-w-2xl mt-1.5"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="w-52">
              <AppSelect
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setPageSize(24);
                }}
                options={eventSelectOptions}
                aria-label="Filter by event"
              />
            </div>
            <div className="w-36">
              <AppSelect
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPageSize(24);
                }}
                options={yearSelectOptions}
                aria-label="Filter by year"
              />
            </div>
            <AppButton
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetch()}
              aria-label="Refresh gallery"
            >
              Refresh
            </AppButton>
          </div>
        </div>

        {/* Masonry Grid */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs text-muted">Loading verified campus moments...</p>
          </div>
        ) : rawItems.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No Moments Match Filters"
            description="No approved photos matched your selected event or year filter."
            action={
              (selectedEventId !== 'all' || selectedYear !== 'all') && (
                <AppButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedEventId('all');
                    setSelectedYear('all');
                  }}
                >
                  Reset Filters
                </AppButton>
              )
            }
          />
        ) : (
          <Masonry items={rawItems} />
        )}

        {/* Load 24 at a time */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <AppButton
              variant="secondary"
              size="md"
              icon={Calendar}
              onClick={() => setPageSize((prev) => prev + 24)}
              isLoading={isFetching}
            >
              Load 24 more moments
            </AppButton>
          </div>
        )}
      </div>
    </PageEnter>
  );
}
