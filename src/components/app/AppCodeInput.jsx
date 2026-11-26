/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppCodeInput: Design System Verification Code Wrapper
 * Wraps React Bits CodeSlots with slot machine digit animations and auto-focus.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import CodeSlots from '../ui/CodeSlots/CodeSlots';

export default function AppCodeInput({
  length = 6,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  status = 'idle', // 'idle' | 'success' | 'error'
  disabled = false,
  autoFocus = false,
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <CodeSlots
        length={length}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onComplete={onComplete}
        status={status}
        disabled={disabled}
        autoFocus={autoFocus}
        slotColor={isDark ? '#0E1730' : '#EEF2FB'}   // surface-2
        accentColor={isDark ? '#5B93E6' : '#14529E'} // primary
        inkColor={isDark ? '#EEF2FB' : '#0E1A33'}    // ink
        digitColor={isDark ? '#EEF2FB' : '#0E1A33'}  // ink
        dangerColor={isDark ? '#F0776A' : '#C0392B'} // danger
        slotSize={48}
        gap={10}
        radius={12}
        ariaLabel="Verification code input"
        {...props}
      />
    </div>
  );
}
