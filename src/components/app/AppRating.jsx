/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppRating: Design System Rating Wrapper
 * Wraps React Bits PeekRating with gold star tokens and tooltip previews.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import PeekRating from '../ui/PeekRating/PeekRating';

export default function AppRating({
  value,
  defaultValue = 0,
  onChange,
  count = 5,
  shape = 'star',
  labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
  readOnly = false,
  disabled = false,
  size = 24,
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`inline-flex items-center ${className}`}>
      <PeekRating
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        count={count}
        shape={shape}
        labels={labels}
        activeColor={isDark ? '#F1B937' : '#F1B937'} // gold token (decoration only)
        idleColor={isDark ? '#25325A' : '#DCE2EE'}   // line
        tipColor={isDark ? '#0E1730' : '#EEF2FB'}    // surface-2
        tipTextColor={isDark ? '#EEF2FB' : '#0E1A33'}// ink
        size={size}
        readOnly={readOnly}
        disabled={disabled}
        ariaLabel="Event rating"
        {...props}
      />
    </div>
  );
}
