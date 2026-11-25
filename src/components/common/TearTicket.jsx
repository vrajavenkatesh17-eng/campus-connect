import React from 'react';
import { Link } from 'react-router-dom';
import Badge from './Badge';
import Button from './Button';
import { Calendar, Clock, MapPin, User, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';

export default function TearTicket({ registration }) {
  const evt = registration?.event;
  if (!evt) return null;

  const startDate = new Date(evt.start_time);
  const isConfirmed = registration.status === 'registered';

  return (
    <div className="relative flex flex-col md:flex-row bg-surface border border-line rounded-[20px] overflow-hidden shadow-xs hover:border-primary/40 transition-colors">
      {/* Left Main Ticket Body */}
      <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div>
          {/* Top Ticket Header Bar */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-line">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary-soft text-primary">
                <Ticket className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Official Admission Pass
                </p>
                <p className="text-xs text-muted">
                  Francis Xavier Engineering College
                </p>
              </div>
            </div>

            <Badge
              variant={isConfirmed ? 'success' : 'warning'}
              size="sm"
              className="text-xs font-semibold"
            >
              {isConfirmed ? 'Confirmed Seat' : `Waitlist #${registration.queue_position}`}
            </Badge>
          </div>

          {/* Event Title and Details */}
          <div className="pt-3">
            <h3 className="font-bold text-lg text-ink line-clamp-1">
              {evt.title}
            </h3>
            {evt.speakers && (
              <p className="text-xs text-muted mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold text-ink">{evt.speakers.name}</span> • {evt.speakers.designation}, {evt.speakers.company}
              </p>
            )}
          </div>
        </div>

        {/* Schedule & Location */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted pt-2 border-t border-line/60">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-ink">
              {startDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>
              {startDate.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{evt.venues?.name || evt.custom_venue || 'FXEC Campus'}</span>
          </span>
        </div>
      </div>

      {/* Perforation Line & Tear Notches */}
      <div className="relative hidden md:flex flex-col items-center justify-between py-2">
        {/* Top Notch */}
        <div className="w-6 h-6 rounded-full bg-bg border border-line -mt-5 z-10" />
        {/* Dashed Tear Line */}
        <div className="w-px h-full border-r-2 border-dashed border-line my-1" />
        {/* Bottom Notch */}
        <div className="w-6 h-6 rounded-full bg-bg border border-line -mb-5 z-10" />
      </div>

      {/* Right Tear-off Stub */}
      <div className="w-full md:w-56 bg-surface-2 p-5 sm:p-6 flex flex-col justify-between items-center text-center border-t md:border-t-0 md:border-l border-line space-y-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">
            Pass Verification
          </p>
          <div className="p-2 rounded-xl bg-surface border border-line inline-block">
            <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
          </div>
          <p className="text-xs text-muted pt-1">
            {isConfirmed
              ? 'Present at hall entrance'
              : 'Auto-promotes if seats free'}
          </p>
        </div>

        <Link to={`/events/${evt.id}`} className="w-full">
          <Button variant="primary" size="sm" className="w-full text-xs gap-1.5 shadow-xs">
            <span>Event Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
