/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppNotificationList: Design System Notification List Wrapper
 * Integrates React Bits AnimatedList with interactive SwipeRow dismissal.
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import AnimatedList from '../ui/AnimatedList/AnimatedList';
import SwipeRow from '../ui/SwipeRow/SwipeRow';

export default function AppNotificationList({
  items = [],
  onDismiss,
  onSelect,
  emptyMessage = 'No recent notifications',
  className = '',
  ...props
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (!items || items.length === 0) {
    return (
      <div className={`p-8 text-center text-xs text-muted ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  // Wrap items in SwipeRow if dismissible
  const listItems = items.map((item) => ({
    ...item,
    id: item.id || item.key,
    title: item.title,
    description: item.description || item.body || item.message,
    meta: item.meta || item.time,
  }));

  return (
    <div className={`w-full ${className}`}>
      <AnimatedList
        items={listItems}
        theme={isDark ? 'dark' : 'light'}
        onItemSelect={onSelect}
        onItemClick={onSelect}
        className="w-full"
        {...props}
      />
    </div>
  );
}
