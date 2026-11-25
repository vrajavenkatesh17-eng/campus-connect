/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B: Dynamic Department Participation Bar Visual
 */

import React, { useMemo } from 'react';

export default function DepartmentParticipationVisual({ data = [] }) {
  const safeData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map(d => ({
      code: String(d.code || 'DEPT'),
      name: String(d.name || d.code || 'Department'),
      count: Number(d.count) || 0
    }));
  }, [data]);

  const maxVal = useMemo(() => {
    if (safeData.length === 0) return 0;
    return Math.max(...safeData.map(d => d.count), 0);
  }, [safeData]);

  const totalAttendees = useMemo(() => {
    return safeData.reduce((acc, curr) => acc + curr.count, 0);
  }, [safeData]);

  if (safeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-sm font-medium text-muted">No department data recorded</p>
        <span className="text-xs text-muted mt-1">Student registrations will populate this</span>
      </div>
    );
  }

  return (
    <div className="magic-bento__bars w-full h-full flex flex-col justify-between">
      <div className="magic-bento__figure flex items-baseline justify-between mb-1">
        <span className="magic-bento__figure-value text-xl font-bold text-ink tracking-tight">
          {totalAttendees}
        </span>
        <span className="magic-bento__figure-note text-xs font-medium text-muted">
          Across {safeData.length} Departments
        </span>
      </div>

      <div className="magic-bento__bars-plot flex items-end justify-between gap-1.5 flex-1 min-h-[90px] pt-4 pb-1">
        {safeData.map((dept, index) => {
          const ratio = maxVal > 0 ? dept.count / maxVal : 0;
          const isPeak = maxVal > 0 && dept.count === maxVal;
          return (
            <div
              key={dept.code}
              className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              title={`${dept.name}: ${dept.count} attendees`}
            >
              <div
                className="magic-bento__bar w-full rounded-t-sm transition-all duration-300"
                data-peak={isPeak ? '' : undefined}
                style={{
                  '--h': Math.max(0.04, ratio),
                  '--i': index,
                  height: `${Math.max(4, Math.round(ratio * 80))}px`,
                  backgroundColor: isPeak ? 'rgb(var(--primary))' : undefined
                }}
              />
              <span className="text-xs font-semibold text-muted group-hover:text-primary transition-colors truncate max-w-full">
                {dept.code}
              </span>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                <div className="bg-neutral-900 text-white text-xs px-2 py-0.5 rounded shadow whitespace-nowrap">
                  {dept.count} attended
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
