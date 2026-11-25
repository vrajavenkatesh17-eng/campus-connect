/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Tile 1: Registrations Trend Visual (colSpan: 2, rowSpan: 2)
 * Smooth cubic bezier curve with hover scrub for 3+ data points;
 * Bar width capped at 44px and centered for < 3 data points;
 * Below 3 data points shows big number + "Not enough data for a trend yet".
 */

import React, { useRef, useState, useEffect, useMemo } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const curve = (values, width, height) => {
  if (!values || values.length < 2) return null;
  const top = 8;
  const bottom = 6;
  const low = Math.min(...values) * 0.7;
  const high = Math.max(...values);
  const diff = high - low === 0 ? 1 : high - low;
  const points = values.map((value, index) => [
    (index / (values.length - 1)) * width,
    top + (1 - (value - low) / diff) * (height - top - bottom)
  ]);
  const count = points.length;
  const slopes = [];
  for (let i = 0; i < count - 1; i++) {
    const dx = points[i + 1][0] - points[i][0];
    slopes.push(dx === 0 ? 0 : (points[i + 1][1] - points[i][1]) / dx);
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0] || 0;
    if (i === count - 1) return slopes[count - 2] || 0;
    return slopes[i - 1] * slopes[i] > 0 ? (slopes[i - 1] + slopes[i]) / 2 : 0;
  });
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const length = a * a + b * b;
    if (length > 9) {
      const scale = 3 / Math.sqrt(length);
      tangents[i] = scale * a * slopes[i];
      tangents[i + 1] = scale * b * slopes[i];
    }
  }
  let line = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  const samples = [];
  for (let i = 0; i < count - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    const c1 = [x0 + third, y0 + tangents[i] * third];
    const c2 = [x1 - third, y1 - tangents[i + 1] * third];
    line += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
    for (let step = 0; step < 12; step++) {
      const t = step / 12;
      const u = 1 - t;
      samples.push([
        u * u * u * x0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * x1,
        u * u * u * y0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * y1
      ]);
    }
  }
  samples.push(points[count - 1]);
  const area = `${line} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;
  return { line, area, samples };
};

const sampleAt = (samples, x) => {
  if (!samples || samples.length === 0) return 0;
  let index = 1;
  while (index < samples.length - 1 && samples[index][0] < x) index++;
  const [x0, y0] = samples[index - 1];
  const [x1, y1] = samples[index];
  const t = x1 === x0 ? 0 : clamp((x - x0) / (x1 - x0), 0, 1);
  return y0 + (y1 - y0) * t;
};

export default function RegistrationsTrendVisual({ monthlyData = [], eventData = [] }) {
  const chartRef = useRef(null);
  const plotRef = useRef(null);
  const scrubRef = useRef(null);
  const dotRef = useRef(null);
  const valueRef = useRef(null);
  const noteRef = useRef(null);
  const [size, setSize] = useState(null);

  const safeMonthly = useMemo(() => {
    if (!Array.isArray(monthlyData)) return [];
    return monthlyData.map((d) => ({
      month: String(d.month || ''),
      count: Number(d.count) || 0
    }));
  }, [monthlyData]);

  const safeEvents = useMemo(() => {
    if (!Array.isArray(eventData)) return [];
    return eventData.map((e) => ({
      title: String(e.title || 'Session'),
      count: Number(e.count) || 0
    }));
  }, [eventData]);

  const hasTrendCurve = safeMonthly.length >= 3;
  const values = useMemo(() => safeMonthly.map((d) => d.count), [safeMonthly]);
  const labels = useMemo(() => safeMonthly.map((d) => d.month), [safeMonthly]);
  const totalRegistrations = useMemo(
    () => (safeMonthly.length > 0 ? values.reduce((sum, v) => sum + v, 0) : safeEvents.reduce((s, e) => s + e.count, 0)),
    [safeMonthly, values, safeEvents]
  );
  const latestCount = values.length > 0 ? values[values.length - 1] : totalRegistrations;
  const latestMonth = labels.length > 0 ? labels[labels.length - 1] : '';

  useEffect(() => {
    if (!hasTrendCurve) return;
    const plot = plotRef.current;
    if (!plot) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width, height });
        }
      }
    });

    observer.observe(plot);
    return () => observer.disconnect();
  }, [hasTrendCurve]);

  const shape = useMemo(() => {
    if (!size || size.width <= 4 || size.height <= 4 || values.length < 3) {
      return null;
    }
    return curve(values, size.width, size.height);
  }, [size, values]);

  const handleScrub = (event) => {
    const plot = plotRef.current;
    const chart = chartRef.current;
    const line = scrubRef.current;
    const dot = dotRef.current;
    const label = valueRef.current;
    const note = noteRef.current;

    if (!shape || !plot || !chart || !line || !dot || !label || !note || values.length < 3) {
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
    label.textContent = `${Math.round(interpolated)} registrations`;
    note.textContent = labels[monthIndex] || '';
  };

  const handleRest = () => {
    if (chartRef.current) delete chartRef.current.dataset.scrub;
    if (valueRef.current) valueRef.current.textContent = `${latestCount} registrations`;
    if (noteRef.current) noteRef.current.textContent = latestMonth ? `Latest: ${latestMonth}` : 'Total turnout';
  };

  // Case 1: Below 3 data points (0, 1, or 2 data points)
  if (!hasTrendCurve) {
    const maxCount = Math.max(...safeEvents.map((e) => e.count), 1);

    return (
      <div className="w-full h-full flex flex-col justify-between overflow-hidden select-none p-1">
        {/* Big Number & Status Note */}
        <div>
          <div className="flex items-baseline justify-between mb-0.5">
            <span className="text-3xl font-extrabold text-ink tracking-tight">
              {totalRegistrations.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-primary">
              Registrations
            </span>
          </div>
          <p className="text-xs text-muted font-medium">
            Not enough data for a trend yet
          </p>
        </div>

        {/* Centered Bars Capped at 44px (Never full-tile block) */}
        <div className="flex-1 flex items-end justify-center gap-4 py-4 min-h-[100px]">
          {safeEvents.length === 0 ? (
            <div className="text-center text-xs text-muted/70 italic py-6">
              Awaiting first event registrations
            </div>
          ) : (
            safeEvents.slice(0, 2).map((evt, idx) => {
              const heightPct = Math.max(20, Math.round((evt.count / maxCount) * 100));
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-end w-[44px] max-w-[44px] h-full"
                  title={`${evt.title}: ${evt.count} registrations`}
                >
                  <span className="text-xs font-bold text-ink mb-1 tabular-nums">
                    {evt.count}
                  </span>
                  <div
                    className="w-full bg-primary rounded-t-[6px] transition-all duration-300"
                    style={{ height: `${heightPct}%`, minHeight: '16px' }}
                  />
                  <span className="text-xs text-muted truncate w-full text-center mt-1 font-medium">
                    {evt.title.slice(0, 7)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Case 2: 3+ Data Points -> Smooth Cubic Bezier Curve with Scrub
  return (
    <div
      ref={chartRef}
      className="magic-bento__chart w-full h-full flex flex-col justify-between overflow-hidden select-none"
      onPointerMove={handleScrub}
      onPointerLeave={handleRest}
    >
      <div className="magic-bento__figure flex items-baseline justify-between mb-1">
        <span
          ref={valueRef}
          className="magic-bento__figure-value text-2xl font-bold text-ink tracking-tight"
        >
          {latestCount} registrations
        </span>
        <span
          ref={noteRef}
          className="magic-bento__figure-note text-xs font-semibold text-primary"
        >
          {latestMonth ? `Latest: ${latestMonth}` : 'Current'}
        </span>
      </div>

      <div ref={plotRef} className="magic-bento__plot flex-1 relative min-h-[110px] mt-2">
        {shape && (
          <svg
            className="magic-bento__chart-svg absolute inset-0 w-full h-full overflow-visible"
            viewBox={`0 0 ${size?.width || 100} ${size?.height || 100}`}
            preserveAspectRatio="none"
          >
            <path className="magic-bento__chart-area" d={shape.area} />
            <path className="magic-bento__chart-line" d={shape.line} />
          </svg>
        )}
        <div ref={scrubRef} className="magic-bento__scrub">
          <div className="magic-bento__scrub-line" />
          <div ref={dotRef} className="magic-bento__scrub-dot" />
        </div>
      </div>
    </div>
  );
}
