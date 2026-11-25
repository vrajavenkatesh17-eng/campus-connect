/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppSpotlightCard: Interactive Design System Card Wrapper
 * Wraps React Bits SpotlightCard with theme-derived dynamic cursor spotlight.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SpotlightCard from '../ui/SpotlightCard/SpotlightCard';

export default function AppSpotlightCard({
  children,
  className = '',
  spotlightSize = 260,
  onClick,
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Spotlight color derived from active theme primary token
  const dynamicSpotlight = isDark ? 'rgba(201, 93, 120, 0.22)' : 'rgba(122, 18, 48, 0.12)';

  return (
    <div
      onClick={onClick}
      className={`rounded-[20px] transition-all ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <SpotlightCard
        spotlightColor={dynamicSpotlight}
        spotlightSize={spotlightSize}
        theme={isDark ? 'dark' : 'light'}
        className="w-full h-full rounded-[20px] border border-line bg-surface text-ink p-6 shadow-xs"
        {...props}
      >
        {children}
      </SpotlightCard>
    </div>
  );
}
