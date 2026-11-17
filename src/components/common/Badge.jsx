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
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
    primary: 'bg-burgundy-50 text-burgundy-900 border border-burgundy-200 font-medium',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-red-50 text-red-800 border border-red-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    admin: 'bg-purple-50 text-purple-900 border border-purple-200 font-semibold',
    coordinator: 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-medium',
    student: 'bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium',
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
