import React from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent } from '../common/Card';
import Badge from '../common/Badge';
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
    <Card hover className="flex flex-col h-full border-neutral-200 overflow-hidden group">
      {/* Event Poster or Gradient Header */}
      {event.poster_url ? (
        <div className="h-44 w-full overflow-hidden bg-neutral-100 relative">
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
              className="uppercase tracking-wider shadow-sm"
            >
              {event.status}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="h-28 w-full bg-gradient-to-r from-burgundy-900 to-burgundy p-4 flex items-start justify-between text-white relative">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20">
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
            className="uppercase tracking-wider shadow-sm"
          >
            {event.status}
          </Badge>
        </div>
      )}

      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
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

          <h3 className="font-bold text-lg text-neutral-900 leading-snug group-hover:text-burgundy transition-colors line-clamp-2">
            {event.title}
          </h3>

          {/* Speaker mini badge */}
          {event.speakers && (
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {event.speakers.name[0]}
              </div>
              <p className="text-xs text-neutral-600 truncate">
                <span className="font-semibold text-neutral-800">{event.speakers.name}</span> •{' '}
                {event.speakers.company}
              </p>
            </div>
          )}

          {/* Time & Venue */}
          <div className="space-y-1.5 pt-2 text-xs text-neutral-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">
                {event.venues?.name || event.custom_venue || 'Venue TBA'}
              </span>
            </div>
          </div>
        </div>

        {/* Seat Availability Bar */}
        <div className="pt-3 border-t border-neutral-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500 flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5 text-neutral-400" />
              Seats:
            </span>
            <span className="font-bold text-neutral-800">
              {event.registered_count} / {event.seat_capacity}{' '}
              {isFull && <span className="text-amber-600 font-semibold">(Full)</span>}
            </span>
          </div>

          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFull ? 'bg-amber-500' : 'bg-burgundy'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>

          {event.waiting_count > 0 && (
            <p className="text-[11px] text-amber-700 font-medium text-right">
              {event.waiting_count} on waiting list
            </p>
          )}

          <div className="pt-2">
            <Link to={`/events/${event.id}`}>
              <button
                type="button"
                className="w-full py-2 px-3 bg-neutral-50 hover:bg-burgundy hover:text-white border border-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Event Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
