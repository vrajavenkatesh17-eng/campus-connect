import React, { useEffect, useState, useRef } from 'react';

export default function Counter({
  value,
  from = 0,
  duration = 2,
  prefix = '',
  suffix = '',
  targetDate,
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(from);
  const [countdownStr, setCountdownStr] = useState('');
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  // If targetDate is passed, operate in live countdown mode
  useEffect(() => {
    if (!targetDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = Math.max(0, target - now);

      if (diff <= 0) {
        setCountdownStr('Starting now');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);

      if (days > 0) {
        setCountdownStr(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdownStr(`${hours}h ${minutes}m`);
      } else {
        setCountdownStr(`${minutes}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Viewport observer for numeric count-up
  useEffect(() => {
    if (targetDate) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetDate]);

  // Smooth numeric counter animation
  useEffect(() => {
    if (targetDate || !isInView) return;

    let startTimestamp = null;
    let rafId;
    const targetNum = Number(value) || 0;
    const startNum = Number(from) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startNum + (targetNum - startNum) * easedProgress);

      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetNum);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, from, duration, isInView, targetDate]);

  if (targetDate) {
    return (
      <span className={`tabular-nums font-mono ${className}`}>
        {countdownStr}
      </span>
    );
  }

  return (
    <span ref={containerRef} className={`tabular-nums font-mono ${className}`}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
