import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { profileService } from '../../services/profileService';
import DashboardLayout from '../../components/layout/DashboardLayout';
import EventCard from '../../components/events/EventCard';
import EventCalendar from '../../components/events/EventCalendar';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
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
  };

  return (
    <DashboardLayout
      title="Guest Lectures & Technical Sessions"
      subtitle="Explore approved industry lectures, workshops, and college-wide symposiums"
      actions={
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-neutral-100 p-1 rounded-lg flex items-center border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-burgundy shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-burgundy shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Input
            label="Search Events"
            placeholder="Search by topic or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />

          <Select
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
          <div className="p-16 bg-white border border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-sm font-medium text-neutral-500">
              Loading sessions matching your department criteria...
            </p>
          </div>
        ) : viewMode === 'calendar' ? (
          <EventCalendar events={events} />
        ) : events.length === 0 ? (
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
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
