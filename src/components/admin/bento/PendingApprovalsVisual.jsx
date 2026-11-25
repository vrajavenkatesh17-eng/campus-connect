/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B: Pending Approvals Visual with Safe Relative Navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { UserCheck01Icon, Calendar03Icon, ArrowRight01Icon, AlertCircleIcon } from '@hugeicons/core-free-icons';
import Button from '../../common/Button';

// Validates strictly same-site relative path to prevent open redirect vulnerabilities
function isValidRelativePath(path) {
  if (typeof path !== 'string') return false;
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('://') && !path.includes('\\');
}

export default function PendingApprovalsVisual({ data = {} }) {
  const navigate = useNavigate();

  const eventsCount = Number(data?.events) || 0;
  const coordinatorsCount = Number(data?.coordinators) || 0;
  const total = Number(data?.total) || eventsCount + coordinatorsCount;

  const handleSafeNavigate = (targetPath) => {
    if (isValidRelativePath(targetPath)) {
      navigate(targetPath);
    } else {
      console.warn('Blocked navigation to non-relative path:', targetPath);
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="magic-bento__figure flex items-baseline justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-ink tracking-tight">
            {total}
          </span>
          <span className="text-xs text-muted">Pending Actions</span>
        </div>
        {total > 0 ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
            Action Required
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            All Clear
          </span>
        )}
      </div>

      <div className="space-y-2 flex-1 flex flex-col justify-center">
        {/* Event Approvals Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSafeNavigate('/admin/events')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-2 hover:bg-surface-2 border border-line/80 transition-all group text-left"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors truncate">
                Event Proposals
              </p>
              <p className="text-xs text-muted">
                {eventsCount} awaiting review
              </p>
            </div>
          </div>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={14}
            className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </Button>

        {/* Coordinator Requests Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleSafeNavigate('/admin/requests')}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-surface-2 hover:bg-surface-2 border border-line/80 transition-all group text-left"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserCheck01Icon} size={13} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink group-hover:text-blue-700 transition-colors truncate">
                Faculty Roles
              </p>
              <p className="text-xs text-muted">
                {coordinatorsCount} requests
              </p>
            </div>
          </div>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={14}
            className="text-muted group-hover:text-blue-700 group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </Button>
      </div>
    </div>
  );
}
