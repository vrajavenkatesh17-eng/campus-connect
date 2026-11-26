/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppSeatGauge: Design System Seat Capacity Gauge Wrapper
 * STRICT POLICY: SloshGauge is used for SEAT CAPACITY ONLY.
 * Shows dynamic fluid sloshing corresponding to occupied seats / total capacity percentage.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SloshGauge from '../ui/SloshGauge/SloshGauge';

export default function AppSeatGauge({
  occupied = 0,
  capacity = 100,
  label = 'Seat Capacity',
  width = 80,
  height = 140,
  radius = 16,
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const validCapacity = Math.max(1, capacity);
  const percentage = Math.min(100, Math.max(0, Math.round((occupied / validCapacity) * 100)));

  return (
    <div className={`flex flex-col items-center gap-2 select-none ${className}`}>
      <SloshGauge
        value={percentage}
        width={width}
        height={height}
        radius={radius}
        glassColor={isDark ? '#0E1730' : '#EEF2FB'}     // surface-2
        liquidColor={isDark ? '#5B93E6' : '#14529E'}    // primary navy
        unit="%"
        ariaLabel={label}
        {...props}
      />
      <div className="text-center space-y-0.5">
        <p className="text-xs font-semibold text-ink">
          {occupied} <span className="text-muted font-normal">of {capacity} seats</span>
        </p>
        <p className="text-xs font-mono text-muted uppercase tracking-wider">
          {percentage}% Occupied
        </p>
      </div>
    </div>
  );
}
