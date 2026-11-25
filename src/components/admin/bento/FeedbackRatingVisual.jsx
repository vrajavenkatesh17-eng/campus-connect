/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Tile 7: Feedback Rating Visual (Quality Score)
 * Average rating plus 5-star distribution.
 * Fits within container budget without overflowing.
 */

import React, { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';

export default function FeedbackRatingVisual({ data = {} }) {
  const hasFeedback = Boolean(data?.has_feedback && data?.total > 0);
  const total = Number(data?.total) || 0;
  const average = Number(data?.average) || 0;

  const distribution = useMemo(() => {
    const raw = Array.isArray(data?.distribution) ? data.distribution : [];
    return [5, 4, 3, 2, 1].map((star) => {
      const match = raw.find((d) => Number(d.star) === star);
      return {
        star,
        count: match ? Number(match.count) || 0 : 0
      };
    });
  }, [data?.distribution]);

  if (!hasFeedback) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 select-none">
        <HugeiconsIcon icon={StarIcon} size={24} className="text-muted/40 mb-1" />
        <p className="text-sm font-semibold text-muted">No feedback yet</p>
        <span className="text-xs text-muted/70 mt-0.5">
          Student reviews will calculate here
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden select-none px-1">
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-2xl font-bold text-ink tracking-tight">
            {average.toFixed(1)}
          </span>
          <HugeiconsIcon icon={StarIcon} size={16} className="text-amber-500 fill-amber-500" strokeWidth={1.5} />
          <span className="text-xs text-muted">/ 5.0</span>
        </div>
        <span className="text-xs font-semibold text-primary">
          {total} {total === 1 ? 'Response' : 'Responses'}
        </span>
      </div>

      <div className="space-y-1 flex-1 flex flex-col justify-center py-0.5">
        {distribution.map((item) => {
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
              <span className="w-5 text-xs text-muted text-right tabular-nums">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
