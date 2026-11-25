import React from 'react';
import './LogoLoop.css';

export default function LogoLoop({
  items = [],
  speed = 35,
  className = '',
}) {
  if (!items || items.length === 0) return null;

  // Duplicate items array to form seamless continuous loop
  const loopList = [...items, ...items, ...items];

  return (
    <div
      className={`logo-loop-container relative overflow-hidden w-full select-none ${className}`}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div
        className="animate-logo-loop py-3 flex items-center gap-4 sm:gap-6"
        style={{ '--logo-speed': `${speed}s` }}
      >
        {loopList.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-line text-sm font-semibold text-muted hover:text-ink hover:border-primary/40 hover:bg-surface-2 transition-all shadow-xs cursor-default shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            <span className="whitespace-nowrap">{typeof item === 'string' ? item : item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
