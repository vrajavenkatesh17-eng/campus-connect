import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import RotatingQRModal from '../../components/attendance/RotatingQRModal';
import { Calendar, Users, PlusCircle, Clock, MapPin, Eye, Edit, QrCode } from 'lucide-react';

export default function CoordinatorDashboard() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQrEvent, setActiveQrEvent] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await eventService.getCoordinatorEvents();
      setSessions(data || []);
    } catch (err) {
      console.error('Error loading coordinator events:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute real counts from database
  const totalSessions = sessions.length;
  const approvedSessions = sessions.filter((s) => s.status === 'approved').length;
  const totalAttendees = sessions.reduce((acc, s) => acc + (s.registered_count || 0), 0);

  return (
    <DashboardLayout
      title={`Coordinator Hub • ${profile?.name || 'Faculty'}`}
      subtitle={`Department: ${profile?.departments?.name || 'Assigned Department'} • Francis Xavier Engineering College`}
      actions={
        <div className="flex items-center gap-2">
          <Link to="/coordinator/events/new">
            <Button variant="primary" size="sm" icon={PlusCircle}>
              Propose New Event
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Metric Cards - Real counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-burgundy-50 text-burgundy flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total Proposals
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  {totalSessions}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Approved Sessions
                </p>
                <p className="text-2xl font-bold text-emerald-900 mt-0.5">
                  {approvedSessions}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total Confirmed Attendees
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  {totalAttendees}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Managed Sessions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Your Event Proposals</h2>
            <span className="text-xs text-neutral-500">Live approval status and attendance metrics</span>
          </div>

          {isLoading ? (
            <div className="p-12 bg-white border border-neutral-200 rounded-xl flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span className="text-xs text-neutral-500">Loading your sessions from database...</span>
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Sessions Proposed Yet"
              description="You have not created any guest lecture proposals yet. Click below to propose a session."
              actionLabel="Create Event Proposal"
              onAction={() => window.location.href = '/coordinator/events/new'}
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((evt) => (
                <Card key={evt.id} className="p-5 border-neutral-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-neutral-900">{evt.title}</h3>
                        <Badge
                          variant={
                            evt.status === 'approved'
                              ? 'success'
                              : evt.status === 'pending'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                          className="uppercase"
                        >
                          {evt.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          {new Date(evt.start_time).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          {evt.venues?.name || evt.custom_venue || 'TBA'}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-neutral-800">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          {evt.registered_count} / {evt.seat_capacity} filled
                          {evt.waiting_count > 0 && ` (${evt.waiting_count} waitlisted)`}
                        </span>
                      </div>

                      {evt.rejection_reason && (
                        <p className="text-xs text-red-600 font-medium pt-1">
                          Rejection Reason: {evt.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {evt.status === 'approved' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={QrCode}
                            className="text-xs shadow-xs"
                            onClick={() => setActiveQrEvent(evt)}
                          >
                            Live QR
                          </Button>
                          <Link to={`/events/${evt.id}/attendance`}>
                            <Button variant="outline" size="sm" icon={Users} className="text-xs">
                              Roster & Stats
                            </Button>
                          </Link>
                        </>
                      )}
                      <Link to={`/coordinator/events/${evt.id}/attendees`}>
                        <Button variant="outline" size="sm">
                          Attendees ({evt.registered_count})
                        </Button>
                      </Link>
                      <Link to={`/coordinator/events/${evt.id}/edit`}>
                        <Button variant="secondary" size="sm" icon={Edit}>
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Live Rotating QR Code Modal */}
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
