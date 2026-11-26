/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppSegmented: Design System Segmented Control Wrapper
 * Wraps React Bits RubberSegment with semantic tokens and theme reactivity.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import RubberSegment from '../ui/RubberSegment/RubberSegment';

export default function AppSegmented({
  items = [],
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  radius = 12,
  inset = 3,
  equalSlots = true,
  disabled = false,
  className = '',
  'aria-label': ariaLabel = 'Segmented options',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const resolvedItems = items && items.length > 0 ? items : options;

  return (
    <RubberSegment
      items={resolvedItems}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      trackColor={isDark ? '#0E1730' : '#EEF2FB'} // surface-2
      thumbColor={isDark ? '#5B93E6' : '#14529E'} // primary
      textColor={isDark ? '#9FADCB' : '#5B6781'}  // muted
      activeTextColor={isDark ? '#06122B' : '#FFFFFF'} // on-primary
      size={size}
      radius={radius}
      inset={inset}
      equalSlots={equalSlots}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      {...props}
    />
  );
}
