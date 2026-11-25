/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * ThemeToggle: Accessible button switching between Light and Dark themes.
 * Uses verified Hugeicons Sun01Icon and Moon02Icon.
 */

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon, Moon02Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '../../context/ThemeContext';
import AppButton from '../app/AppButton';

export default function ThemeToggle({ className = '' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const currentLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <AppButton
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={`p-2 rounded-[12px] text-muted hover:text-primary hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
      aria-label={currentLabel}
      title={currentLabel}
    >
      {isDark ? (
        <HugeiconsIcon icon={Sun01Icon} className="w-5 h-5 text-amber-400" />
      ) : (
        <HugeiconsIcon icon={Moon02Icon} className="w-5 h-5 text-muted hover:text-ink" />
      )}
      <span className="sr-only">{currentLabel}</span>
    </AppButton>
  );
}
