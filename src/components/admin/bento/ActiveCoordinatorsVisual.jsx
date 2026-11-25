/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Tile 5: Active Coordinators Visual (Faculty)
 * Active count plus top coordinator by hosted event volume.
 * Fits strictly within container height budget without overlapping headers.
 */

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { TrophyIcon } from '@hugeicons/core-free-icons';

export default function ActiveCoordinatorsVisual({ data = {} }) {
  const activeCount = Number(data?.active_coordinators) || 0;
  const totalCoordinators = Number(data?.total_coordinators) || 0;
  const topCoordinator = data?.top_coordinator || null;

  return (
    <div className="w-full h-full flex flex-col justify-center gap-2 px-1 py-1 overflow-hidden select-none">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-extrabold text-sm text-ink tabular-nums">
          {activeCount} Active
        </span>
        <span className="text-xs text-muted">
          of {totalCoordinators} Faculty
        </span>
      </div>

      {topCoordinator && topCoordinator.name ? (
        <div className="p-2.5 rounded-[12px] bg-primary-soft/50 border border-primary/20 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-xs">
            <HugeiconsIcon icon={TrophyIcon} size={14} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-primary uppercase tracking-wider leading-none mb-0.5">
              Top Host
            </p>
            <p className="text-xs font-bold text-ink truncate leading-tight">
              {topCoordinator.name}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {topCoordinator.events_count} {topCoordinator.events_count === 1 ? 'session' : 'sessions'}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-2.5 text-center rounded-[12px] bg-surface-2 border border-line">
          <p className="text-xs font-semibold text-ink">No sessions hosted yet</p>
          <span className="text-xs text-muted block mt-0.5">
            Active session hosts appear here
          </span>
        </div>
      )}
    </div>
  );
}
