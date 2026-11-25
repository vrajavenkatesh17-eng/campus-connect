import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './motion.css';

export function useFontsReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (active) setReady(true);
      });
    } else {
      setReady(true);
    }
    return () => {
      active = false;
    };
  }, []);

  return ready;
}

/**
 * ScrollReveal: Statement paragraph reveal (transform + opacity, once only).
 */
export function ScrollReveal({ children, className = '' }) {
  const prefersReduced = useReducedMotion();
  const fontsReady = useFontsReady();

  return (
    <motion.div
      data-motion="scroll-reveal"
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      whileInView={fontsReady ? (prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }) : undefined}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScrollVelocity: Slow horizontal brand marquee band.
 */
export function ScrollVelocity({
  text = 'ATTEND · LEARN · EARN · GET RECOGNIZED',
  className = '',
}) {
  const items = Array.from({ length: 8 }, (_, idx) => idx);

  return (
    <div
      data-motion="scroll-velocity"
      className={`w-full overflow-hidden border-y border-line bg-surface-2/60 py-3.5 select-none ${className}`}
      aria-label={text}
    >
      <div className="cc-scroll-velocity-track">
        {items.map((idx) => (
          <span
            key={idx}
            className="mx-6 text-xs sm:text-sm font-mono font-semibold uppercase tracking-[0.22em] text-muted whitespace-nowrap"
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
