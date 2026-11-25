import React from 'react';

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) {
  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const variantMap = {
    neutral: 'bg-surface-2 text-ink border border-line',
    primary:
      'bg-primary-soft text-primary dark:text-ink border border-primary/25 font-semibold',
    success:
      'bg-success-soft text-success dark:text-ink border border-success/25 font-semibold',
    warning:
      'bg-warning-soft text-warning dark:text-ink border border-warning/25 font-semibold',
    danger:
      'bg-danger-soft text-danger dark:text-ink border border-danger/25 font-semibold',
    info:
      'bg-info-soft text-info dark:text-ink border border-info/25 font-semibold',
    admin:
      'bg-primary-soft text-primary dark:text-ink border border-primary/35 font-semibold',
    coordinator:
      'bg-info-soft text-info dark:text-ink border border-info/35 font-semibold',
    student:
      'bg-success-soft text-success dark:text-ink border border-success/35 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        sizeMap[size] || sizeMap.md
      } ${variantMap[variant] || variantMap.neutral} ${className}`}
    >
      {children}
    </span>
  );
}
