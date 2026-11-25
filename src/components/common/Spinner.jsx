import React from 'react';

export default function Spinner({ size = 'md', color = 'burgundy', className = '' }) {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorMap = {
    burgundy: 'border-primary border-t-transparent',
    white: 'border-white border-t-transparent',
    neutral: 'border-muted border-t-transparent',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full ${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.burgundy} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
