import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Badge from '../common/Badge';

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
    <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-burgundy" />
          <h2 className="text-lg font-bold text-neutral-900">
            {monthName} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-center text-xs font-semibold text-neutral-600 py-2.5">
        {weekDays.map((wd) => (
          <div key={wd}>{wd}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-neutral-200 bg-neutral-100/50">
        {calendarCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="bg-neutral-50/60 min-h-[90px] sm:min-h-[110px] p-1.5"
              />
            );
          }

          const dayEvents = eventsByDay[dayNum] || [];

          return (
            <div
              key={`day-${dayNum}`}
              className={`bg-white min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between transition-colors hover:bg-neutral-50/50 ${
                isToday(dayNum) ? 'ring-1 ring-inset ring-burgundy/50 bg-burgundy-50/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday(dayNum)
                      ? 'bg-burgundy text-white font-bold'
                      : 'text-neutral-700'
                  }`}
                >
                  {dayNum}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] font-bold text-burgundy bg-burgundy-50 px-1.5 py-0.5 rounded-full">
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
                    className="block text-[11px] font-medium truncate px-1.5 py-0.5 rounded bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-900 border border-burgundy-200 transition-colors"
                  >
                    {evt.title}
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-neutral-400 font-medium pl-1">
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
