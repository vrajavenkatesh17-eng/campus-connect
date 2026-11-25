/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React from 'react';
import { Link } from 'react-router-dom';
import AppSpotlightCard from '../app/AppSpotlightCard';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Calendar, Clock, MapPin, User, Users, ArrowRight } from 'lucide-react';

export default function EventCard({ event }) {
  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);

  const formattedDate = startDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = `${startDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  const isFull = event.registered_count >= event.seat_capacity;
  const capacityPct = Math.min(
    100,
    Math.round((event.registered_count / event.seat_capacity) * 100)
  );

  return (
    <AppSpotlightCard className="h-full flex flex-col justify-between overflow-hidden group shadow-xs">
      {/* Event Poster or Header Accent */}
      {event.poster_url ? (
        <div className="h-44 w-full overflow-hidden bg-surface-2 relative rounded-t-[18px]">
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3">
            <Badge
              variant={
                event.status === 'approved'
                  ? 'success'
                  : event.status === 'pending'
                  ? 'warning'
                  : 'neutral'
              }
              size="sm"
              className="uppercase tracking-wider shadow-sm font-semibold"
            >
              {event.status}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="h-28 w-full bg-primary p-4 flex items-start justify-between text-on-primary relative rounded-t-[18px]">
          <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface/20">
            Guest Lecture
          </span>
          <Badge
            variant={
              event.status === 'approved'
                ? 'success'
                : event.status === 'pending'
                ? 'warning'
                : 'neutral'
            }
            size="sm"
            className="uppercase tracking-wider shadow-sm font-semibold"
          >
            {event.status}
          </Badge>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Department Tag */}
          <div className="flex flex-wrap gap-1.5">
            {event.is_all_departments ? (
              <Badge variant="neutral" size="sm">All Departments</Badge>
            ) : (
              event.event_departments?.map((ed, idx) => (
                <Badge key={idx} variant="primary" size="sm">
                  {ed.department?.code}
                </Badge>
              ))
            )}
          </div>

          <h3 className="font-bold text-lg text-ink leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Speaker mini badge */}
          {event.speakers && (
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-surface-2 text-ink flex items-center justify-center text-xs font-bold shrink-0 border border-line">
                {event.speakers.name[0]}
              </div>
              <p className="text-xs text-muted truncate">
                <span className="font-semibold text-ink">{event.speakers.name}</span> •{' '}
                {event.speakers.company}
              </p>
            </div>
          )}

          {/* Time & Venue */}
          <div className="space-y-1.5 pt-2 text-xs text-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
              <span className="truncate">
                {event.venues?.name || event.custom_venue || 'Venue TBA'}
              </span>
            </div>
          </div>
        </div>

        {/* Seat Availability Bar */}
        <div className="pt-3 border-t border-line space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-muted" />
              Seats:
            </span>
            <span className="font-bold text-ink">
              {event.registered_count} / {event.seat_capacity}{' '}
              {isFull && <span className="text-warning font-semibold">(Full)</span>}
            </span>
          </div>

          <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFull ? 'bg-warning' : 'bg-primary'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>

          {event.waiting_count > 0 && (
            <p className="text-xs text-warning font-medium text-right">
              {event.waiting_count} on waiting list
            </p>
          )}

          <div className="pt-2">
            <Link to={`/events/${event.id}`}>
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs justify-between shadow-xs"
              >
                <span>View Event Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppSpotlightCard>
  );
}
