/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppSlideConfirm: Design System Slide-to-Confirm Wrapper
 * Wraps React Bits SlideCommit for deliberate actions with haptic-like visual release.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SlideCommit from '../ui/SlideCommit/SlideCommit';

export default function AppSlideConfirm({
  label = 'Slide to confirm',
  doneLabel = 'Confirmed',
  errorLabel = 'Action failed',
  onConfirm,
  onDone,
  onError,
  width = 280,
  height = 50,
  radius = 25,
  disabled = false,
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <SlideCommit
        label={label}
        doneLabel={doneLabel}
        errorLabel={errorLabel}
        onConfirm={onConfirm}
        onDone={onDone}
        onError={onError}
        trackColor={isDark ? '#1F1719' : '#F5EFEA'}     // surface-2
        handleColor={isDark ? '#C95D78' : '#7A1230'}    // primary
        successColor={isDark ? '#4CC38A' : '#1F8A5B'}   // success
        dangerColor={isDark ? '#F0776A' : '#C0392B'}    // danger
        width={width}
        height={height}
        radius={radius}
        disabled={disabled}
        {...props}
      />
    </div>
  );
}
