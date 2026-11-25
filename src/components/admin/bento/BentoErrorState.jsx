/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B: Robust Error State with Retry for Admin Analytics Bento
 */

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AlertCircleIcon } from '@hugeicons/core-free-icons';
import Button from '../../common/Button';

export default function BentoErrorState({ error, onRetry }) {
  const errorMessage = error?.message || 'Unable to load administrative dashboard statistics.';

  return (
    <div className="w-full p-8 rounded-2xl bg-red-50/60 border border-red-200/80 text-center flex flex-col items-center justify-center space-y-4 my-4">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
      </div>

      <div className="max-w-md space-y-1">
        <h3 className="text-base font-bold text-ink">
          Analytics Pipeline Temporarily Unavailable
        </h3>
        <p className="text-xs text-muted">
          {errorMessage}
        </p>
      </div>

      {onRetry && (
        <Button
          variant="primary"
          size="sm"
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          Retry Connection
        </Button>
      )}
    </div>
  );
}
