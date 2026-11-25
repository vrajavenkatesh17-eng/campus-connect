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
        slotColor={isDark ? '#1F1719' : '#F5EFEA'}   // surface-2
        accentColor={isDark ? '#C95D78' : '#7A1230'} // primary
        inkColor={isDark ? '#F6EFEA' : '#1C1417'}    // ink
        digitColor={isDark ? '#F6EFEA' : '#1C1417'}  // ink
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
