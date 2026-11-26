/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppToast: Design System Swipeable Toast Wrapper
 * Wraps React Bits SwipeToast with semantic tokens and gesture swipe-to-dismiss.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import SwipeToast from '../ui/SwipeToast/SwipeToast';

export default function AppToast({
  title = '',
  description = '',
  icon,
  actionLabel = '',
  onAction,
  open = true,
  onClose,
  duration = 4000,
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <SwipeToast
      title={title}
      description={description}
      icon={icon}
      actionLabel={actionLabel}
      onAction={onAction}
      open={open}
      onClose={onClose}
      background={isDark ? '#0E1730' : '#FFFFFF'} // surface
      color={isDark ? '#EEF2FB' : '#0E1A33'}      // ink
      fuseColor={isDark ? '#5B93E6' : '#14529E'}  // primary
      duration={duration}
      radius={16}
      width={360}
      className={`border border-line shadow-md ${className}`}
      {...props}
    />
  );
}
