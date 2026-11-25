/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B: Top Active Students Leaderboard Visual (colSpan 2)
 * Privacy Guarantee: Strictly presents name, department, and points only. Zero emails or private PII.
 */

import React, { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { TrophyIcon, Award01Icon } from '@hugeicons/core-free-icons';

export default function TopStudentsVisual({ data = [] }) {
  const students = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.slice(0, 5).map((s, idx) => ({
      rank: idx + 1,
      name: String(s.name || 'Anonymous Student'),
      department: String(s.department || 'GEN'),
      points: Number(s.points) || 0
    }));
  }, [data]);

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <HugeiconsIcon icon={TrophyIcon} size={28} className="text-neutral-300 mb-2" />
        <p className="text-sm font-medium text-muted">No activity points awarded yet</p>
        <span className="text-xs text-muted mt-1">
          Coordinators awarding engagement points will populate this leaderboard
        </span>
      </div>
    );
  }

  const getRankBadge = rank => {
    if (rank === 1) {
      return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
    }
    if (rank === 2) {
      return 'bg-slate-200 text-slate-800 border-slate-300 font-bold';
    }
    if (rank === 3) {
      return 'bg-amber-50 text-amber-900 border-amber-200 font-bold';
    }
    return 'bg-surface-2 text-muted border-line font-medium';
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="magic-bento__figure flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={TrophyIcon} size={18} className="text-primary" />
          <span className="text-base font-bold text-ink">
            Top Active Students
          </span>
        </div>
        <span className="text-xs font-semibold text-primary">
          Top 5 Leaderboard
        </span>
      </div>

      <div className="space-y-1.5 flex-1 flex flex-col justify-center">
        {students.map(student => (
          <div
            key={student.rank}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-2/70 hover:bg-surface-2/80 transition-colors border border-line"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border shrink-0 ${getRankBadge(
                  student.rank
                )}`}
              >
                {student.rank}
              </span>
              <span className="text-xs font-semibold text-ink truncate">
                {student.name}
              </span>
              <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-line/80 text-ink uppercase shrink-0">
                {student.department}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <HugeiconsIcon icon={Award01Icon} size={12} className="text-primary" />
              <span className="text-xs font-bold text-ink tabular-nums">
                {student.points.toLocaleString()}
              </span>
              <span className="text-xs text-muted">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
