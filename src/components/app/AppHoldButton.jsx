/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppHoldButton: Design System Hold-to-Confirm Button Wrapper
 * Wraps React Bits HoldButton for destructive or high-impact confirmations (e.g. registration cancel).
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import HoldButton from '../ui/HoldButton/HoldButton';

export default function AppHoldButton({
  children = 'Hold to confirm',
  doneLabel = 'Confirmed',
  icon = null,
  doneIcon = null,
  onHold,
  onTap,
  holdTime = 1800,
  variant = 'danger', // 'danger' | 'primary'
  disabled = false,
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const fillColor =
    variant === 'danger'
      ? isDark
        ? '#F0776A'
        : '#C0392B'
      : isDark
      ? '#C95D78'
      : '#7A1230';

  return (
    <HoldButton
      doneLabel={doneLabel}
      icon={icon}
      doneIcon={doneIcon}
      onHold={onHold}
      onTap={onTap}
      holdTime={holdTime}
      backgroundColor={isDark ? '#1F1719' : '#F5EFEA'} // surface-2
      fillColor={fillColor}
      textColor={isDark ? '#F6EFEA' : '#1C1417'}       // ink
      fillTextColor="#FFFFFF"                          // on-primary
      size="md"
      radius={12}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </HoldButton>
  );
}
