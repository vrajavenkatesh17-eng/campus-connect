/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Tile 6: Department Participation Visual (colSpan: 2, rowSpan: 1)
 * Dynamic bars for top departments. Capped bar height so it fits within container budget.
 */

import React, { useMemo } from 'react';

export default function DepartmentParticipationBentoVisual({ data = [] }) {
  const safeData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((d) => ({
      code: String(d.code || 'DEPT'),
      name: String(d.name || d.code || 'Department'),
      count: Number(d.count) || 0
    }));
  }, [data]);

  const totalAttendees = useMemo(() => {
    return safeData.reduce((acc, curr) => acc + curr.count, 0);
  }, [safeData]);

  const maxVal = useMemo(() => {
    if (safeData.length === 0) return 0;
    return Math.max(...safeData.map((d) => d.count), 0);
  }, [safeData]);

  // Show top 7 departments to ensure perfect horizontal spacing
  const displayedDepts = useMemo(() => safeData.slice(0, 7), [safeData]);
  const overflowCount = safeData.length > 7 ? safeData.length - 7 : 0;

  if (safeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 select-none">
        <p className="text-sm font-semibold text-muted">No Department Data</p>
        <span className="text-xs text-muted/70 mt-0.5">
          Registrations will populate department participation
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden select-none px-1">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-lg font-bold text-ink tracking-tight">
          {totalAttendees.toLocaleString()} Registrations
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted">
            {safeData.length} Depts
          </span>
          {overflowCount > 0 && (
            <span className="text-xs font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded-full">
              +{overflowCount} more
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 flex-1 min-h-[65px] max-h-[85px] pt-1 pb-1">
        {displayedDepts.map((dept) => {
          const ratio = maxVal > 0 ? dept.count / maxVal : 0;
          const isPeak = maxVal > 0 && dept.count === maxVal;
          const barHeightPx = Math.max(6, Math.round(ratio * 58));

          return (
            <div
              key={dept.code}
              className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
              title={`${dept.name}: ${dept.count} registrations`}
            >
              <div
                className={`w-full max-w-[36px] rounded-t-[4px] transition-all duration-300 ${
                  isPeak ? 'bg-primary' : 'bg-line hover:bg-muted'
                }`}
                style={{ height: `${barHeightPx}px` }}
              />
              <span className="text-xs font-semibold text-muted group-hover:text-primary transition-colors truncate max-w-full">
                {dept.code}
              </span>

              {/* Hover tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                <div className="bg-ink text-surface text-xs px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                  {dept.name}: <strong>{dept.count}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
