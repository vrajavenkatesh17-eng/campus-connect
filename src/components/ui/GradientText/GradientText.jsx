import React from 'react';
import './GradientText.css';

export default function GradientText({
  children,
  className = '',
  colors = ['rgb(var(--primary))', '#E6788F', 'rgb(var(--primary))'],
  animationSpeed = 8,
  showBorder = false,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(', ')})`,
    '--gradient-speed': `${animationSpeed}s`,
  };

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      {showBorder && (
        <span
          className="absolute inset-0 rounded-[12px] p-[1px] pointer-events-none animate-gradient-pan"
          style={gradientStyle}
        >
          <span className="block w-full h-full bg-surface rounded-[11px]" />
        </span>
      )}
      <span
        className="relative z-10 inline-block text-transparent bg-clip-text animate-gradient-pan font-inherit"
        style={gradientStyle}
      >
        {children}
      </span>
    </span>
  );
}
