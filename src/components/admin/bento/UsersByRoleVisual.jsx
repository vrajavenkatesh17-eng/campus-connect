/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Tile 4: Users by Role Visual (Demographics)
 * Segmented bar with counts: Admins (Navy) / Coordinators (Blue) / Students (Emerald).
 * Fits strictly within container height budget without overflowing title.
 */

import React from 'react';

export default function UsersByRoleVisual({ data = {} }) {
  const admins = Number(data?.admins) || 0;
  const coordinators = Number(data?.coordinators) || 0;
  const students = Number(data?.students) || 0;
  const total = Number(data?.total) || (admins + coordinators + students);

  const adminPct = total > 0 ? (admins / total) * 100 : 0;
  const coordPct = total > 0 ? (coordinators / total) * 100 : 0;
  const studentPct = total > 0 ? (students / total) * 100 : 0;

  return (
    <div className="w-full h-full flex flex-col justify-center gap-2.5 px-1 py-1 overflow-hidden select-none">
      {/* Segmented bar */}
      <div className="magic-bento__segment-bar h-2.5 rounded-full overflow-hidden bg-surface-2">
        <div
          className="magic-bento__segment magic-bento__segment--admin"
          style={{ width: `${Math.max(adminPct > 0 ? 4 : 0, adminPct)}%` }}
          title={`Admins: ${admins} (${adminPct.toFixed(1)}%)`}
        />
        <div
          className="magic-bento__segment magic-bento__segment--coord"
          style={{ width: `${Math.max(coordPct > 0 ? 4 : 0, coordPct)}%` }}
          title={`Coordinators: ${coordinators} (${coordPct.toFixed(1)}%)`}
        />
        <div
          className="magic-bento__segment magic-bento__segment--student"
          style={{ width: `${Math.max(studentPct > 0 ? 4 : 0, studentPct)}%` }}
          title={`Students: ${students} (${studentPct.toFixed(1)}%)`}
        />
      </div>

      {/* Role Counts */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-muted text-xs">Admins</span>
          </div>
          <span className="font-bold text-ink tabular-nums text-xs">{admins}</span>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-info shrink-0" />
            <span className="text-muted text-xs">Coordinators</span>
          </div>
          <span className="font-bold text-ink tabular-nums text-xs">{coordinators}</span>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
            <span className="text-muted text-xs">Students</span>
          </div>
          <span className="font-bold text-ink tabular-nums text-xs">{students.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
