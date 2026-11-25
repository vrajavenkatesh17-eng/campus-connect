/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * PageContainer: Standard page container wrapper ensuring identical margins,
 * responsive horizontal padding, and max-w 1280px across all application pages.
 */

import React from 'react';

export default function PageContainer({
  children,
  className = '',
  maxWidth = 'max-w-[1280px]',
  noPadding = false,
  ...props
}) {
  return (
    <div
      className={`w-full ${maxWidth} mx-auto ${
        noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-8'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
