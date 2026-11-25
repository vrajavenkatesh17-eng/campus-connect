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
      background={isDark ? '#1F1719' : '#FFFFFF'} // surface
      color={isDark ? '#F6EFEA' : '#1C1417'}      // ink
      fuseColor={isDark ? '#C95D78' : '#7A1230'}  // primary
      duration={duration}
      radius={16}
      width={360}
      className={`border border-line shadow-md ${className}`}
      {...props}
    />
  );
}
