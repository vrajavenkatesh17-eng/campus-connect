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
      trackColor={isDark ? '#1F1719' : '#F5EFEA'} // surface-2
      thumbColor={isDark ? '#C95D78' : '#7A1230'} // primary
      textColor={isDark ? '#B3A5AA' : '#6B5E63'}  // muted
      activeTextColor={isDark ? '#1A0A0F' : '#FFFFFF'} // on-primary
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
