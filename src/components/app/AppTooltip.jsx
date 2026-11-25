/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppTooltip: Design System Warm Tooltip Wrapper
 * Wraps React Bits WarmTooltip with smooth micro-interaction physics and semantic tokens.
 */

import React from 'react';
import WarmTooltip from '../ui/WarmTooltip/WarmTooltip';

export default function AppTooltip({
  content = '',
  children,
  side = 'top',
  size = 'md',
  className = '',
  ...props
}) {
  if (!content) return children;

  return (
    <WarmTooltip
      content={content}
      side={side}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </WarmTooltip>
  );
}
