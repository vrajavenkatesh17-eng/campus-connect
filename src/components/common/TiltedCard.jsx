/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * TiltedCard: 3D interactive perspective poster card
 * Smooth spring-like cursor tilt with specular wine highlight.
 */

import React, { useRef, useState, useCallback } from 'react';

export default function TiltedCard({
  children,
  className = '',
  maxTilt = 12,
  perspective = 1000,
  scale = 1.02,
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handlePointerMove = useCallback(
    (e) => {
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPct = x / rect.width;
      const yPct = y / rect.height;

      const tiltX = (0.5 - yPct) * maxTilt * 2;
      const tiltY = (xPct - 0.5) * maxTilt * 2;

      setTransform(
        `perspective(${perspective}px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(
          2
        )}deg) scale3d(${scale}, ${scale}, ${scale})`
      );
      setGlare({ x: xPct * 100, y: yPct * 100, opacity: 0.15 });
    },
    [maxTilt, perspective, scale]
  );

  const handlePointerLeave = useCallback(() => {
    setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`);
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, [perspective]);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform,
        transition: 'transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
      }}
      className={`relative rounded-[20px] overflow-hidden border border-line shadow-xs group ${className}`}
    >
      {children}
      {/* Subtle specular reflection overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgb(var(--surface) / 0.25) 0%, transparent 65%)`,
          opacity: glare.opacity,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
