/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * PageHeader: Consistent standard heading block with title, subtitle, and action buttons.
 */

import React from 'react';
import PageTitle from '../motion/PageTitle';

export default function PageHeader({
  title,
  subtitle,
  actions,
  variant = 'app',
  className = '',
  ...props
}) {
  if (!title && !subtitle && !actions) return null;

  return (
    <div
      className={`mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
      {...props}
    >
      <div className="min-w-0">
        {title ? (
          <PageTitle
            title={title}
            subtitle={subtitle}
            variant={variant}
            className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-ink"
            subtitleClassName="text-sm text-muted mt-1 leading-relaxed"
          />
        ) : (
          subtitle && (
            <p className="text-sm text-muted mt-1 leading-relaxed">{subtitle}</p>
          )
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
