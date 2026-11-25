/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B: Attendance Trend Visual with MagicBento Bezier Curve & Real-Time Scrub
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { curve, sampleAt, clamp } from '../../MagicBento/MagicBento';

export default function AttendanceTrendVisual({ data = [] }) {
  const chartRef = useRef(null);
  const plotRef = useRef(null);
  const scrubRef = useRef(null);
  const dotRef = useRef(null);
  const valueRef = useRef(null);
  const noteRef = useRef(null);
  const [size, setSize] = useState(null);

  // Guard against non-array or empty data
  const safeData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map(item => ({
      month: String(item.month || ''),
      count: Number(item.count) || 0
    }));
  }, [data]);

  const values = useMemo(() => safeData.map(d => d.count), [safeData]);
  const labels = useMemo(() => safeData.map(d => d.month), [safeData]);
  const totalAttendance = useMemo(() => values.reduce((sum, v) => sum + v, 0), [values]);
  const latestCount = values.length > 0 ? values[values.length - 1] : 0;
  const latestMonth = labels.length > 0 ? labels[labels.length - 1] : '';

  // Measure plot container reactively
  useEffect(() => {
    const plot = plotRef.current;
    if (!plot) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width, height });
        }
      }
    });

    observer.observe(plot);
    return () => observer.disconnect();
  }, []);

  // Compute smooth curve with NaN guards
  const shape = useMemo(() => {
    if (!size || size.width <= 4 || size.height <= 4 || values.length < 2) {
      return null;
    }
    return curve(values, size.width, size.height);
  }, [size, values]);

  const handleScrub = event => {
    const plot = plotRef.current;
    const chart = chartRef.current;
    const line = scrubRef.current;
    const dot = dotRef.current;
    const label = valueRef.current;
    const note = noteRef.current;

    if (!shape || !plot || !chart || !line || !dot || !label || !note || values.length < 2) {
      return;
    }

    const rect = plot.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = sampleAt(shape.samples, x);
    const position = (x / Math.max(1, rect.width)) * (values.length - 1);
    const index = Math.min(values.length - 1, Math.floor(position));
    const next = Math.min(values.length - 1, index + 1);
    const fraction = position - index;
    const interpolated = values[index] + (values[next] - values[index]) * fraction;
    const monthIndex = Math.min(labels.length - 1, Math.round(position));

    chart.dataset.scrub = '';
    line.style.transform = `translateX(${x.toFixed(1)}px)`;
    dot.style.transform = `translateY(${y.toFixed(1)}px)`;
    label.textContent = `${Math.round(interpolated)} students`;
    note.textContent = labels[monthIndex] || '';
  };

  const handleRest = () => {
    if (chartRef.current) delete chartRef.current.dataset.scrub;
    if (valueRef.current) valueRef.current.textContent = `${latestCount} students`;
    if (noteRef.current) noteRef.current.textContent = latestMonth ? `Latest: ${latestMonth}` : 'Current';
  };

  // Empty state guard
  if (safeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-sm font-medium text-muted">No attendance data in range</p>
        <span className="text-xs text-muted mt-1">Verified scans will appear here</span>
      </div>
    );
  }

  // Single data point guard
  if (safeData.length === 1) {
    return (
      <div className="flex flex-col justify-between h-full p-2">
        <div className="magic-bento__figure">
          <span className="magic-bento__figure-value">{safeData[0].count} students</span>
          <span className="magic-bento__figure-note">{safeData[0].month}</span>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-semibold">
            Single month recording ({safeData[0].month})
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="magic-bento__chart w-full h-full flex flex-col justify-between select-none"
      onPointerMove={handleScrub}
      onPointerDown={handleScrub}
      onPointerLeave={handleRest}
    >
      <div className="magic-bento__figure flex items-baseline justify-between mb-2">
        <span ref={valueRef} className="magic-bento__figure-value text-xl font-bold text-ink tracking-tight">
          {latestCount} students
        </span>
        <span ref={noteRef} className="magic-bento__figure-note text-xs font-medium text-primary">
          Latest: {latestMonth}
        </span>
      </div>

      <div ref={plotRef} className="magic-bento__plot relative w-full flex-1 min-h-[90px] overflow-hidden">
        {shape && size && (
          <svg viewBox={`0 0 ${size.width} ${size.height}`} className="w-full h-full" aria-hidden="true">
            <path className="magic-bento__chart-area" d={shape.area} />
            <path className="magic-bento__chart-line" d={shape.line} pathLength="1" />
          </svg>
        )}
        <span ref={scrubRef} className="magic-bento__scrub">
          <span ref={dotRef} className="magic-bento__scrub-dot" />
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted mt-1 border-t border-line pt-1">
        <span>{labels[0]}</span>
        <span className="font-semibold text-muted">Total: {totalAttendance}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}
