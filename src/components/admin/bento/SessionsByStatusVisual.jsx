/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Tile 3: Sessions by Status Visual
 * Compact list with colored dots. Strict vocabulary: pending, approved, completed, rejected, cancelled.
 * Never shows duplicate titles and fits strictly within the container height budget.
 */

import React from 'react';

export default function SessionsByStatusVisual({ data = {} }) {
  const pending = Number(data?.pending) || 0;
  const approved = Number(data?.approved) || 0;
  const completed = Number(data?.completed) || 0;
  const rejected = Number(data?.rejected) || 0;
  const cancelled = Number(data?.cancelled) || 0;

  const statuses = [
    { key: 'approved', label: 'Approved', count: approved, dotClass: 'magic-bento__status-dot--approved' },
    { key: 'completed', label: 'Completed', count: completed, dotClass: 'magic-bento__status-dot--completed' },
    { key: 'pending', label: 'Pending', count: pending, dotClass: 'magic-bento__status-dot--pending' },
    { key: 'rejected', label: 'Rejected', count: rejected, dotClass: 'magic-bento__status-dot--rejected' },
    { key: 'cancelled', label: 'Cancelled', count: cancelled, dotClass: 'magic-bento__status-dot--cancelled' }
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center gap-1.5 px-1 py-1 overflow-hidden select-none">
      {statuses.map((s) => (
        <div
          key={s.key}
          className="flex items-center justify-between text-xs py-1 px-2 rounded-[8px] hover:bg-surface-2/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`magic-bento__status-dot ${s.dotClass}`} />
            <span className="text-muted font-medium text-xs">
              {s.label}
            </span>
          </div>
          <span className="font-bold text-ink tabular-nums text-xs">
            {s.count}
          </span>
        </div>
      ))}
    </div>
  );
}
