/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppCheck: Design System Checkbox Wrapper
 * Wraps React Bits SpringCheck with spring physics and semantic tokens.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SpringCheck from '../ui/SpringCheck/SpringCheck';

export default function AppCheck({
  label = '',
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  boxSize = 22,
  boxRadius = 7,
  fontSize = 14,
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`inline-flex items-center ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      <SpringCheck
        label={label}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        color={isDark ? '#EEF2FB' : '#0E1A33'}      // text ink
        fillColor={isDark ? '#5B93E6' : '#14529E'}  // primary
        checkColor="#FFFFFF"                        // on-primary
        boxSize={boxSize}
        boxRadius={boxRadius}
        fontSize={fontSize}
        ariaLabel={label || 'Checkbox'}
        {...props}
      />
    </div>
  );
}
