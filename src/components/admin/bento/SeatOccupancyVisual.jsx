/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Tile 2: Seat Occupancy Visual (Ring / Progress with 1-decimal percentage)
 * Exactly preserves: 2 of 500 shows 0.4%, never rounds to 0%.
 * Percentage shown exactly ONCE inside the ring.
 */

import React from 'react';

export default function SeatOccupancyVisual({ data = {} }) {
  const filled = Number(data?.filled_seats) || 0;
  const total = Number(data?.total_seats) || 0;

  // Percentage formatted to exactly ONE decimal place
  const percentage = total > 0 ? ((filled / total) * 100).toFixed(1) : '0.0';
  const pctNumber = parseFloat(percentage);

  // SVG circular ring geometry
  const radius = 36;
  const stroke = 6.5;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    total > 0
      ? circumference - (Math.min(pctNumber, 100) / 100) * circumference
      : circumference;

  return (
    <div className="w-full h-full flex items-center justify-center gap-4 px-2 overflow-hidden select-none">
      {/* Circular Progress Ring with Percentage Inside (Shown ONCE) */}
      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
        <svg height="80" width="80" className="magic-bento__ring-svg">
          <circle
            className="magic-bento__ring-bg"
            strokeWidth={stroke}
            fill="transparent"
            r={normalizedRadius}
            cx="40"
            cy="40"
          />
          <circle
            className="magic-bento__ring-fill"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            fill="transparent"
            r={normalizedRadius}
            cx="40"
            cy="40"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <span className="text-sm font-extrabold text-ink tabular-nums tracking-tight">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Numerical Details beside the ring */}
      <div className="flex flex-col justify-center space-y-1 min-w-0">
        <div className="text-xs text-muted font-medium leading-tight">
          <strong className="text-ink font-bold text-sm block">
            {filled.toLocaleString()} of {total.toLocaleString()}
          </strong>
          <span>seats occupied</span>
        </div>
        <span className="inline-block text-xs font-bold text-primary uppercase tracking-wider">
          Venue Capacity
        </span>
      </div>
    </div>
  );
}
