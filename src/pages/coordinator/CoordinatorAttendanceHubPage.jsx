import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import RotatingQRModal from '../../components/attendance/RotatingQRModal';
import {
  QrCode,
  Users,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export default function CoordinatorAttendanceHubPage() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQrEvent, setActiveQrEvent] = useState(null);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getCoordinatorEvents();
      // Only approved sessions have active QR attendance
      const approved = (data || []).filter((s) => s.status === 'approved');
      setSessions(approved);
    } catch (err) {
      console.error('Error loading approved sessions:', err);
      showToast(err.message || 'Failed to load sessions for attendance.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-neutral-500">Loading approved sessions for live attendance...</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Active Approved Sessions</h2>
            <p className="text-xs text-neutral-500">Select any approved session to start presenting its live QR code</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            className="gap-1.5 text-xs self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {sessions.length === 0 ? (
          <EmptyState
            title="No Approved Sessions Ready for Attendance"
            description="You do not have any approved events currently. Attendance can only be launched for approved sessions."
            action={
              <Link to="/coordinator/events/new">
                <Button variant="primary" size="sm">
                  Propose New Session
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sessions.map((evt) => (
              <Card key={evt.id} className="p-5 flex flex-col justify-between hover:border-burgundy/40 transition-colors">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="success" size="sm" className="gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Approved
                    </Badge>
                    <span className="text-xs font-semibold text-neutral-600">
                      Capacity: {evt.registered_count}/{evt.seat_capacity} filled
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 line-clamp-1">
                      {evt.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {new Date(evt.start_time).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                        {evt.venues?.name || evt.custom_venue || 'FXEC Campus'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-4 mt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveQrEvent(evt)}
                    className="w-full sm:flex-1 text-xs gap-1.5 shadow-xs"
                  >
                    <QrCode className="w-4 h-4" />
                    Launch Live QR Code
                  </Button>

                  <Link to={`/events/${evt.id}/attendance`} className="w-full sm:w-auto">
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
            ))}
          </div>
        )}

        {/* Live Rotating QR Modal */}
        {activeQrEvent && (
          <RotatingQRModal
            isOpen={!!activeQrEvent}
            onClose={() => setActiveQrEvent(null)}
            event={activeQrEvent}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
