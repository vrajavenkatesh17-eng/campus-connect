/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Phase 6B: Feedback Ratings Visual (Average + 1-5 Star Breakdown)
 */

import React, { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';

export default function FeedbackRatingsVisual({ data = {} }) {
  const average = Number(data?.average) || 0;
  const total = Number(data?.total) || 0;
  
  // Guard against missing or partial distribution
  const distribution = useMemo(() => {
    const raw = Array.isArray(data?.distribution) ? data.distribution : [];
    // Ensure all 5 stars are present, descending 5 -> 1
    return [5, 4, 3, 2, 1].map(star => {
      const match = raw.find(d => Number(d.star) === star);
      return {
        star,
        count: match ? Number(match.count) || 0 : 0
      };
    });
  }, [data?.distribution]);

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="magic-bento__figure flex items-baseline justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xl font-bold text-ink tracking-tight">
            {total > 0 ? average.toFixed(1) : '0.0'}
          </span>
          <HugeiconsIcon icon={StarIcon} size={16} className="text-amber-500 fill-amber-500" strokeWidth={1.5} />
          <span className="text-xs text-muted">/ 5.0</span>
        </div>
        <span className="magic-bento__figure-note text-xs font-medium text-muted">
          {total} {total === 1 ? 'Response' : 'Responses'}
        </span>
      </div>

      <div className="space-y-1.5 flex-1 flex flex-col justify-center py-1">
        {distribution.map(item => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.star} className="flex items-center gap-2 text-xs">
              <span className="w-4 font-semibold text-muted text-right text-xs">
                {item.star}★
              </span>
              <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-6 text-xs text-muted text-right tabular-nums">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
