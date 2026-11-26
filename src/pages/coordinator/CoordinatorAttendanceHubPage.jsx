import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import RotatingQRModal from '../../components/attendance/RotatingQRModal';
import AppSegmented from '../../components/app/AppSegmented';
import AppSeatGauge from '../../components/app/AppSeatGauge';
import {
  QrCode,
  Users,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Radio,
} from 'lucide-react';

export default function CoordinatorAttendanceHubPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQrEvent, setActiveQrEvent] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'live' | 'upcoming'

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getCoordinatorEvents();
      // Only approved events have active QR attendance
      const approved = (data || []).filter((s) => s.status === 'approved');
      setEvents(approved);
    } catch (err) {
      console.error('Error loading approved events:', err);
      showToast(err.message || 'Failed to load events for attendance.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((evt) => {
      const start = new Date(evt.start_time);
      const end = new Date(evt.end_time);

      if (filterMode === 'live') {
        // Today or currently running
        const isToday = start.toDateString() === now.toDateString();
        const isRunning = now >= start && now <= end;
        return isToday || isRunning;
      }
      if (filterMode === 'upcoming') {
        return start > now;
      }
      return true;
    });
  }, [events, filterMode]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-muted">Loading approved events for live attendance...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Live QR Attendance Center"
      subtitle="Launch 30-second rotating QR codes and monitor live turnout in real time"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-ink">Active Approved Events</h2>
            <p className="text-xs text-muted">Select any approved event to start presenting its live dynamic QR code</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <AppSegmented
              options={[
                { value: 'all', label: `All (${events.length})` },
                { value: 'live', label: 'Live / Today' },
                { value: 'upcoming', label: 'Upcoming' },
              ]}
              value={filterMode}
              onChange={setFilterMode}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={loadEvents}
              className="gap-1.5 text-xs self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <EmptyState
            title="No Events Found in This View"
            description={
              events.length === 0
                ? "You do not have any approved events currently. Attendance can only be launched for approved events."
                : "No approved events match the selected filter."
            }
            action={
              events.length === 0 ? (
                <Link to="/coordinator/events/new">
                  <Button variant="primary" size="sm">
                    Propose New Event
                  </Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map((evt) => {
              const start = new Date(evt.start_time);
              const end = new Date(evt.end_time);
              const now = new Date();
              const isLiveNow = now >= start && now <= end;

              return (
                <Card key={evt.id} className="p-5 flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="sm" className="gap-1 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approved
                        </Badge>
                        {isLiveNow && (
                          <Badge variant="danger" size="sm" className="gap-1 animate-pulse text-xs">
                            <Radio className="w-3 h-3 text-red-500 animate-spin" />
                            Live Now
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-muted">
                        {evt.registered_count || 0} / {evt.seat_capacity || 0} seats
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-ink line-clamp-1">
                        {evt.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted" />
                          {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-muted" />
                          {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted" />
                          {evt.venues?.name || evt.custom_venue || 'FXEC Campus'}
                        </span>
                      </div>
                    </div>

                    {/* Seat Gauge Visual */}
                    <div className="pt-2">
                      <AppSeatGauge
                        occupied={evt.registered_count || 0}
                        total={evt.seat_capacity || 100}
                        label="Seat Allocation"
                      />
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-line flex flex-col sm:flex-row items-center gap-2">
                    <Link to={`/coordinator/events/${evt.id}/live`} className="w-full sm:flex-1">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs gap-1.5 shadow-xs"
                      >
                        <QrCode className="w-4 h-4" />
                        Projector Screen (/live)
                      </Button>
                    </Link>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveQrEvent(evt)}
                      className="w-full sm:w-auto text-xs gap-1.5"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      Quick Modal
                    </Button>

                    <Link to={`/coordinator/events/${evt.id}/attendees`} className="w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs gap-1"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Roster & Stats
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Live Rotating QR Modal */}
        {activeQrEvent && (
          <RotatingQRModal
            isOpen={!!activeQrEvent}
            onClose={() => {
              setActiveQrEvent(null);
              loadEvents();
            }}
            event={activeQrEvent}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
