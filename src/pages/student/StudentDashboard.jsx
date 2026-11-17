import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { attendanceService } from '../../services/attendanceService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { Calendar, Award, CheckCircle, FileText, Sparkles, ArrowRight, Clock, MapPin } from 'lucide-react';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [attendedSessions, setAttendedSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const [regs, attendances] = await Promise.all([
          eventService.getMyRegistrations(),
          attendanceService.getStudentAttendanceHistory(),
        ]);
        if (isMounted) {
          setRegistrations(regs || []);
          setAttendedSessions(attendances || []);
        }
      } catch (err) {
        console.error('Failed to load student dashboard metrics:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  const confirmedCount = registrations.filter((r) => r.status === 'registered').length;
  const waitlistedCount = registrations.filter((r) => r.status === 'waitlisted').length;
  const attendedCount = attendedSessions.length;

  return (
    <DashboardLayout
      title={`Welcome, ${profile?.name || 'Student'}`}
      subtitle={`Student Portal • ${profile?.departments?.code || 'Department'} • Francis Xavier Engineering College`}
      actions={
        <Link to="/student/events">
          <Button variant="primary" size="sm" icon={Calendar}>
            Explore Events
          </Button>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Metric Cards - Real counts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-burgundy-50 text-burgundy flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Registered Events
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  {confirmedCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Waitlisted Queue
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  {waitlistedCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Link to="/student/attendance">
            <Card className="hover:border-neutral-300 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Sessions Attended
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                    {attendedCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Certificates
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-0.5">
                  0
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registered Events Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">Your Registered Sessions</h2>
            <Link
              to="/student/events"
              className="text-xs font-semibold text-burgundy hover:underline"
            >
              Browse All Events &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="p-10 bg-white border border-neutral-200 rounded-xl flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span className="text-xs text-neutral-500">Checking your registered sessions...</span>
            </div>
          ) : registrations.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Registrations Yet"
              description="You have not registered for any upcoming guest lectures or workshops."
              actionLabel="Explore Available Events"
              onAction={() => window.location.href = '/student/events'}
            />
          ) : (
            <div className="space-y-3">
              {registrations.map((reg) => {
                const evt = reg.event;
                if (!evt) return null;
                const startDate = new Date(evt.start_time);

                return (
                  <Card key={reg.id} className="p-5 border-neutral-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-neutral-900">{evt.title}</h3>
                          <Badge
                            variant={reg.status === 'registered' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {reg.status === 'registered'
                              ? 'Confirmed Seat'
                              : `Waitlist Position #${reg.queue_position}`}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-neutral-400" />
                            {startDate.toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                            {evt.venues?.name || 'Campus Venue'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link to={`/events/${evt.id}`}>
                          <Button variant="outline" size="sm">
                            View Event
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Student Passport Callout */}
        <Card className="bg-gradient-to-r from-neutral-900 to-neutral-800 text-white border-0 shadow-md">
          <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Achievement Passport</span>
              </div>
              <h3 className="text-xl font-bold">Track Your Professional Journey</h3>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Guest lectures you attend are verified by coordinators and added to your official extracurricular transcript.
              </p>
            </div>
            <Link to="/student/events">
              <Button variant="secondary" size="md" icon={ArrowRight}>
                Find Lectures
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
