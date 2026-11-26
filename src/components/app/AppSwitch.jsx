/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppSwitch: Design System Toggle Switch Wrapper
 * Wraps React Bits SquishSwitch with semantic tokens and tactile feedback.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SquishSwitch from '../ui/SquishSwitch/SquishSwitch';

export default function AppSwitch({
  checked,
  defaultChecked = false,
  onChange,
  label = '',
  disabled = false,
  width = 56,
  height = 28,
  radius = 14,
  className = '',
  id,
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={`inline-flex items-center gap-3 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      <SquishSwitch
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        label=""
        disabled={disabled}
        trackColor={isDark ? '#25325A' : '#DCE2EE'}  // line
        trackOnColor={isDark ? '#5B93E6' : '#14529E'} // primary
        thumbColor={isDark ? '#EEF2FB' : '#FFFFFF'}   // ink/surface
        thumbOnColor="#FFFFFF"                        // on-primary
        width={width}
        height={height}
        radius={radius}
        ariaLabel={label || 'Toggle switch'}
        id={id}
        {...props}
      />
      {label && (
        <span className="text-sm font-medium text-ink select-none cursor-pointer">
          {label}
        </span>
      )}
    </div>
  );
}
