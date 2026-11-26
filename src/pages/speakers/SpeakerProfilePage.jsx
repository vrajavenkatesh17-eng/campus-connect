import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import {
  User,
  Building2,
  Briefcase,
  Linkedin,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function SpeakerProfilePage() {
  const { id } = useParams();
  const [speaker, setSpeaker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSpeaker() {
      setIsLoading(true);
      try {
        const data = await eventService.getSpeakerById(id);
        setSpeaker(data);
      } catch (err) {
        console.error('Failed to load speaker:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSpeaker();
  }, [id]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted font-medium">Loading speaker profile & lecture catalog...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!speaker) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Speaker Not Found"
          description="The keynote speaker requested could not be found."
          action={
            <Link to="/events">
              <Button variant="primary" icon={ArrowLeft}>
                Back to Events
              </Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={speaker.name}
      subtitle="Industry Keynote Speaker • Francis Xavier Engineering College"
      actions={
        <Link to="/events">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            All Events
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl border border-line p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {speaker.photo_url ? (
            <img
              src={speaker.photo_url}
              alt={speaker.name}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-primary/20 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-primary/10 text-primary border-2 border-primary/30 flex items-center justify-center font-bold text-4xl uppercase shrink-0">
              {speaker.name[0]}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Keynote Speaker
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                {speaker.name}
              </h1>
              <p className="text-sm sm:text-base font-semibold text-primary mt-0.5">
                {speaker.designation}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted">
              {speaker.company && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-4 h-4 text-muted" />
                  <span>{speaker.company}</span>
                </div>
              )}
              {speaker.experience && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Briefcase className="w-4 h-4 text-muted" />
                  <span>{speaker.experience} Industry Experience</span>
                </div>
              )}
            </div>

            {speaker.bio && (
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-2xl pt-1">
                {speaker.bio}
              </p>
            )}

            {speaker.linkedin_url && (
              <div className="pt-2">
                <a
                  href={speaker.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-info text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  LinkedIn Profile
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Guest Lectures Conducted */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">
                Lectures & Sessions ({speaker.events?.length || 0})
              </h2>
              <p className="text-xs text-muted">
                Sessions delivered or scheduled at Francis Xavier Engineering College
              </p>
            </div>
          </div>

          {!speaker.events || speaker.events.length === 0 ? (
            <Card className="p-8 text-center text-xs text-muted">
              No registered guest lectures currently listed for this speaker.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {speaker.events.map((ev) => (
                <Card
                  key={ev.id}
                  className="p-5 flex flex-col justify-between hover:border-primary/40 transition-colors bg-white shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={
                          ev.status === 'completed'
                            ? 'neutral'
                            : ev.status === 'approved'
                            ? 'success'
                            : 'warning'
                        }
                        size="sm"
                        className="uppercase text-xs"
                      >
                        {ev.status}
                      </Badge>
                      <span className="text-xs text-muted">
                        Cap: {ev.seat_capacity} seats
                      </span>
                    </div>

                    <h3 className="font-bold text-ink text-sm leading-snug line-clamp-2">
                      {ev.title}
                    </h3>

                    <div className="space-y-1.5 text-xs text-muted pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>
                          {new Date(ev.start_time).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>
                          {new Date(ev.start_time).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(ev.end_time).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {ev.venues?.name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span>{ev.venues.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-line">
                    <Link to={`/events/${ev.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Event Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
