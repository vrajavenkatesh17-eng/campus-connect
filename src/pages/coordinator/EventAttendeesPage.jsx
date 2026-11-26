import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { Users, Clock, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function EventAttendeesPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState({ registered: [], waitlisted: [] });
  const [activeTab, setActiveTab] = useState('registered'); // 'registered' | 'waitlisted'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [evt, attData] = await Promise.all([
        eventService.getEventById(id),
        eventService.getEventAttendees(id),
      ]);
      setEvent(evt);
      setAttendees(attData);
    } catch (err) {
      console.error('Error loading attendees:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2">
          <Spinner size="lg" />
          <p className="text-sm text-muted font-medium">Loading attendee list from database...</p>
        </div>
      </DashboardLayout>
    );
  }

  const registeredColumns = [
    {
      header: 'Student',
      key: 'student',
      render: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.student?.name}</p>
          <p className="text-xs text-muted">{row.student?.email}</p>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (row) => (
        <span className="text-xs text-ink">
          {row.student?.departments ? `${row.student.departments.code}` : '—'}
        </span>
      ),
    },
    {
      header: 'Register No.',
      key: 'register_number',
      render: (row) => (
        <span className="text-xs font-mono font-semibold text-ink">
          {row.student?.register_number || '—'}
        </span>
      ),
    },
    {
      header: 'Contact',
      key: 'phone',
      render: (row) => (
        <span className="text-xs text-muted">{row.student?.phone || '—'}</span>
      ),
    },
    {
      header: 'Registered At',
      key: 'registered_at',
      render: (row) => (
        <span className="text-xs text-muted">
          {new Date(row.registered_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant="success" size="sm">
          {row.promoted_at ? 'Promoted (Confirmed)' : 'Confirmed'}
        </Badge>
      ),
    },
  ];

  const waitlistedColumns = [
    {
      header: 'Queue #',
      key: 'queue_position',
      render: (row) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">
          #{row.queue_position}
        </span>
      ),
    },
    {
      header: 'Student',
      key: 'student',
      render: (row) => (
        <div>
          <p className="font-semibold text-ink">{row.student?.name}</p>
          <p className="text-xs text-muted">{row.student?.email}</p>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (row) => (
        <span className="text-xs text-ink">
          {row.student?.departments ? `${row.student.departments.code}` : '—'}
        </span>
      ),
    },
    {
      header: 'Register No.',
      key: 'register_number',
      render: (row) => (
        <span className="text-xs font-mono font-semibold text-ink">
          {row.student?.register_number || '—'}
        </span>
      ),
    },
    {
      header: 'Joined Waitlist',
      key: 'registered_at',
      render: (row) => (
        <span className="text-xs text-muted">
          {new Date(row.registered_at).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  const capacityPct = event
    ? Math.min(100, Math.round((event.registered_count / event.seat_capacity) * 100))
    : 0;

  return (
    <DashboardLayout
      title={`Attendees: ${event?.title}`}
      subtitle="Manage confirmed registrations and real-time waiting list queue"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Refresh List
          </Button>
          <Link to={`/events/${id}`}>
            <Button variant="ghost" size="sm" icon={ArrowLeft}>
              Event View
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Capacity Overview Bar */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Seat Capacity Allocation
              </span>
              <p className="text-2xl font-extrabold text-ink">
                {event?.registered_count} / {event?.seat_capacity}{' '}
                <span className="text-sm font-semibold text-muted">seats filled</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  Waiting List
                </span>
                <p className="text-2xl font-extrabold text-amber-700">
                  {event?.waiting_count}{' '}
                  <span className="text-sm font-semibold text-muted">waiting</span>
                </p>
              </div>
            </div>
          </div>

          <div className="w-full bg-surface-2 rounded-full h-2.5 mt-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                event?.registered_count >= event?.seat_capacity ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </Card>

        {/* Tab Selection */}
        <div className="flex border-b border-line gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('registered')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'registered'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmed Attendees ({attendees.registered.length})</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('waitlisted')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'waitlisted'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Waiting List Queue ({attendees.waitlisted.length})</span>
          </Button>
        </div>

        {/* Tables */}
        {activeTab === 'registered' ? (
          <Table
            columns={registeredColumns}
            data={attendees.registered}
            emptyTitle="No confirmed attendees yet"
            emptyDescription="Students who register for this event will be listed here automatically."
          />
        ) : (
          <Table
            columns={waitlistedColumns}
            data={attendees.waitlisted}
            emptyTitle="Waiting list is empty"
            emptyDescription="When event capacity is reached, additional student registrations enter this queue."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
