/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function EventCalendar({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstDay = new Date(year, month, 1).getDay();
  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Map events to day numbers
  const eventsByDay = {};
  events.forEach((evt) => {
    const d = new Date(evt.start_time);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dayNum = d.getDate();
      if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
      eventsByDay[dayNum].push(evt);
    }
  });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarCells = [];

  // Padding cells for previous month
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const today = new Date();
  const isToday = (d) =>
    today.getDate() === d &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  return (
    <div className="bg-surface border border-line rounded-[20px] shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-ink">
            {monthName} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="p-2 rounded-[10px] border border-line text-muted hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-semibold rounded-[10px] border border-line text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="p-2 rounded-[10px] border border-line text-muted hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-xs font-semibold text-muted py-2.5">
        {weekDays.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-line bg-line/30">
        {calendarCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="bg-surface-2/40 min-h-[90px] sm:min-h-[110px] p-1.5"
              />
            );
          }

          const dayEvents = eventsByDay[dayNum] || [];

          return (
            <div
              key={`day-${dayNum}`}
              className={`bg-surface min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between transition-colors hover:bg-surface-2/50 ${
                isToday(dayNum) ? 'ring-1 ring-inset ring-primary/40 bg-primary-soft/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday(dayNum)
                      ? 'bg-primary text-on-primary font-bold'
                      : 'text-ink'
                  }`}
                >
                  {dayNum}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded-full">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event pills inside day cell */}
              <div className="space-y-1 mt-1.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((evt) => (
                  <Link
                    key={evt.id}
                    to={`/events/${evt.id}`}
                    title={evt.title}
                    className="block text-xs font-medium truncate px-1.5 py-0.5 rounded-[6px] bg-primary-soft hover:bg-primary-soft/80 text-primary border border-primary/20 transition-colors"
                  >
                    {evt.title}
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-xs text-muted font-medium pl-1">
                    +{dayEvents.length - 2} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
