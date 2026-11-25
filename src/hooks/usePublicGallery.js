import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import seedGallery from '../assets/seed-gallery/seed.json';

function formatEventSubtitle(dateStr, venue) {
  let formattedDate = '';
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  const cleanVenue = venue || 'FXEC Campus';
  return formattedDate ? `${formattedDate} - ${cleanVenue}` : cleanVenue;
}

async function fetchPublicGalleryItems() {
  const collected = [];
  const seenUrls = new Set();

  const pushUnique = (item) => {
    if (!item?.src || seenUrls.has(item.src)) return;
    seenUrls.add(item.src);
    collected.push(item);
  };

  if (isSupabaseConfigured) {
    // 1. Approved gallery photos via public_gallery RPC
    try {
      const { data: galleryRows, error } = await supabase.rpc('public_gallery', {
        limit_count: 24,
        offset_count: 0,
      });

      if (!error && Array.isArray(galleryRows)) {
        galleryRows.forEach((row) => {
          pushUnique({
            id: row.id,
            src: row.src,
            alt: row.caption || row.event_title || 'Campus event moment',
            title: row.event_title || 'Campus Event',
            subtitle: formatEventSubtitle(row.event_date, row.venue),
            caption: row.caption || '',
            eventId: row.event_id,
            eventDate: row.event_date,
          });
        });
      } else {
        // Fallback if RPC 010 is not yet applied
        const { data: directPhotos } = await supabase
          .from('event_photos')
          .select('id, storage_path, caption, event_id, created_at, events(id, title, start_time, event_date, custom_venue, venues(name))')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(24);

        (directPhotos || []).forEach((row) => {
          pushUnique({
            id: row.id,
            src: row.storage_path,
            alt: row.caption || row.events?.title || 'Campus event moment',
            title: row.events?.title || 'Campus Event',
            subtitle: formatEventSubtitle(
              row.events?.event_date || row.events?.start_time,
              row.events?.venues?.name || row.events?.custom_venue
            ),
            caption: row.caption || '',
            eventId: row.event_id,
            eventDate: row.events?.event_date || row.events?.start_time,
          });
        });
      }
    } catch (err) {
      console.warn('usePublicGallery: failed to fetch public_gallery:', err);
    }

    // 2. If fewer than 5 real items: supplement with completed event posters
    if (collected.length < 5) {
      try {
        const { data: pastEvents, error: pastErr } = await supabase.rpc('public_past_events', {
          limit_count: 24,
        });

        if (!pastErr && Array.isArray(pastEvents)) {
          pastEvents.forEach((evt) => {
            if (evt.poster_url) {
              pushUnique({
                id: `poster-${evt.id}`,
                src: evt.poster_url,
                alt: `${evt.title} event poster`,
                title: evt.title,
                subtitle: formatEventSubtitle(evt.event_date || evt.start_time, 'FXEC Campus'),
                caption: evt.public_summary || '',
                eventId: evt.id,
                eventDate: evt.event_date || evt.start_time,
              });
            }
          });
        }
      } catch (err) {
        console.warn('usePublicGallery: failed to fetch public_past_events:', err);
      }
    }
  }

  // 3. If still fewer than 5 (and never when 8+ real items exist): append seed images
  if (collected.length < 5 && Array.isArray(seedGallery)) {
    seedGallery.forEach((seed) => {
      pushUnique({
        id: seed.id,
        src: seed.src,
        alt: seed.alt || seed.title,
        title: seed.title,
        subtitle: seed.subtitle,
        caption: seed.alt || '',
        isSeed: true,
      });
    });
  }

  return collected.slice(0, 24);
}

export function usePublicGallery() {
  return useQuery({
    queryKey: ['public-gallery'],
    queryFn: fetchPublicGalleryItems,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
