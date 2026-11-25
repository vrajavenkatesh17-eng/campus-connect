/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Loading Skeleton matching MagicBento 7-tile layout
 */

import React from 'react';

export default function BentoSkeleton() {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Top Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div className="space-y-1.5">
          <div className="h-6 w-64 bg-line rounded" />
          <div className="h-4 w-96 bg-surface-2 rounded" />
        </div>
        <div className="h-8 w-36 bg-line rounded-lg" />
      </div>

      {/* Grid skeleton (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Tile 1: Registrations Trend (colSpan 2, rowSpan 2) */}
        <div className="sm:col-span-2 sm:row-span-2 min-h-[420px] bg-surface-2 border border-line rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-5 w-36 bg-line rounded" />
            <div className="h-4 w-16 bg-line rounded" />
          </div>
          <div className="h-52 bg-line/60 rounded-xl w-full" />
          <div className="h-4 w-48 bg-line rounded" />
        </div>

        {/* Tile 2: Seat Occupancy */}
        <div className="h-52 bg-surface-2 border border-line rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-28 bg-line rounded" />
            <div className="h-4 w-12 bg-line rounded" />
          </div>
          <div className="flex items-center gap-4 py-2">
            <div className="w-20 h-20 rounded-full bg-line shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-16 bg-line rounded" />
              <div className="h-3 w-20 bg-line rounded" />
            </div>
          </div>
          <div className="h-3 w-24 bg-line rounded" />
        </div>

        {/* Tile 3: Sessions by Status */}
        <div className="h-52 bg-surface-2 border border-line rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-28 bg-line rounded" />
            <div className="h-4 w-12 bg-line rounded" />
          </div>
          <div className="space-y-2 py-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-20 bg-line rounded" />
                <div className="h-3 w-6 bg-line rounded" />
              </div>
            ))}
          </div>
          <div className="h-3 w-24 bg-line rounded" />
        </div>

        {/* Tile 5: Users by Role */}
        <div className="h-52 bg-surface-2 border border-line rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-28 bg-line rounded" />
            <div className="h-4 w-12 bg-line rounded" />
          </div>
          <div className="space-y-3 py-2">
            <div className="h-2.5 w-full bg-line rounded-full" />
            <div className="space-y-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between">
                  <div className="h-3 w-16 bg-line rounded" />
                  <div className="h-3 w-8 bg-line rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="h-3 w-24 bg-line rounded" />
        </div>

        {/* Tile 6: Active Coordinators */}
        <div className="h-52 bg-surface-2 border border-line rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-line rounded" />
            <div className="h-4 w-12 bg-line rounded" />
          </div>
          <div className="h-16 bg-line/80 rounded-xl w-full my-auto" />
          <div className="h-3 w-24 bg-line rounded" />
        </div>

        {/* Tile 4: Department Participation (colSpan 2) */}
        <div className="sm:col-span-2 h-52 bg-surface-2 border border-line rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-40 bg-line rounded" />
            <div className="h-4 w-16 bg-line rounded" />
          </div>
          <div className="flex items-end justify-between gap-3 h-24 px-2">
            {[35, 70, 50, 90, 65, 45, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-line rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="h-3 w-32 bg-line rounded" />
        </div>

        {/* Tile 7: Feedback Rating (colSpan 2) */}
        <div className="sm:col-span-2 h-52 bg-surface-2 border border-line rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-4 w-32 bg-line rounded" />
            <div className="h-4 w-16 bg-line rounded" />
          </div>
          <div className="space-y-1.5 py-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-2 w-4 bg-line rounded" />
                <div className="flex-1 h-1.5 bg-line rounded-full" />
                <div className="h-2 w-4 bg-line rounded" />
              </div>
            ))}
          </div>
          <div className="h-3 w-32 bg-line rounded" />
        </div>
      </div>
    </div>
  );
}
