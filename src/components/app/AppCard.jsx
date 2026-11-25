/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * AppCard: Static Design System Surface Card
 * Enforces DESIGN_SPEC v2 tokens:
 * - radius 20, border line, bg-surface, text-ink, soft shadow in light mode, line + inset in dark mode
 */

import React from 'react';

export default function AppCard({
  children,
  className = '',
  onClick,
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      onClick={onClick}
      className={`rounded-[20px] bg-surface border border-line text-ink transition-colors shadow-xs ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pb-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component className={`text-lg font-bold text-ink leading-tight tracking-tight ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-muted mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-6 pt-0 flex items-center justify-between border-t border-line/60 mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
