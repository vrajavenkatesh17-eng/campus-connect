/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Events Explorer:
 * Grid and Calendar view of guest lectures and technical symposiums.
 * Semantic tokens only, real Supabase data, responsive 360-1280px.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { profileService } from '../../services/profileService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EventCard from '../../components/events/EventCard';
import EventCalendar from '../../components/events/EventCalendar';
import Input from '../../components/common/Input';
import AppSelect from '../../components/app/AppSelect';
import AppSegmented from '../../components/app/AppSegmented';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { Search, Filter, Calendar as CalendarIcon, LayoutGrid, RefreshCw } from 'lucide-react';

export default function EventsExplorerPage() {
  const { user, profile } = useAuth();

  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'calendar'
  const [timingFilter, setTimingFilter] = useState('upcoming'); // 'upcoming' | 'all'

  // Filters
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [date, setDate] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [eventsData, deptsData] = await Promise.all([
        eventService.getEvents({ search, departmentId, date }),
        profileService.getDepartments(),
      ]);
      setEvents(eventsData || []);
      setDepartments(deptsData || []);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, departmentId, date]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setDate('');
    setTimingFilter('upcoming');
  };

  const displayedEvents = React.useMemo(() => {
    if (timingFilter === 'all') return events;
    const now = new Date();
    return events.filter((e) => new Date(e.end_time || e.start_time) >= now);
  }, [events, timingFilter]);

  return (
    <DashboardLayout
      title="Guest Lectures & Technical Sessions"
      subtitle="Explore approved industry lectures, workshops, and college-wide symposiums"
      actions={
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-surface-2 p-1 rounded-[12px] flex items-center border border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-surface text-primary shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <AppSegmented
            options={[
              { value: 'upcoming', label: 'Upcoming Events' },
              { value: 'all', label: `All Events (${events.length})` },
            ]}
            value={timingFilter}
            onChange={setTimingFilter}
          />
        </div>

        <div className="bg-surface p-4 rounded-[20px] border border-line shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input
            label="Search Events"
            placeholder="Search by topic or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />

          <AppSelect
            label="Target Department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            placeholder="All Departments"
            options={departments.map((d) => ({
              value: d.id,
              label: `${d.code} - ${d.name}`,
            }))}
          />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                label="Filter by Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            {(search || departmentId || date) && (
              <Button
                variant="secondary"
                size="md"
                onClick={handleResetFilters}
                className="mt-6 shrink-0"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Content View */}
        {isLoading ? (
          <div className="p-16 bg-surface border border-line rounded-[20px] flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-muted">
              Loading events matching your department criteria...
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          <EventCalendar events={displayedEvents} />
        ) : displayedEvents.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="No Events Found"
            description={
              search || departmentId || date
                ? 'No approved events matched your search filters. Try clearing or expanding your filter.'
                : 'There are currently no upcoming approved guest lectures targeted at your department.'
            }
            actionLabel={search || departmentId || date ? 'Clear Filters' : undefined}
            onAction={search || departmentId || date ? handleResetFilters : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
