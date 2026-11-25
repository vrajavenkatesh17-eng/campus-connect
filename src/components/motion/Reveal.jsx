import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * Reveal: Section / block entrance when scrolled into view (once only).
 * Uses transform + opacity only; respects prefers-reduced-motion.
 */
export function Reveal({ children, delay = 0, className = '' }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      data-motion="reveal"
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
      whileInView={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: 0.35,
        delay: Math.min(delay, 0.45),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * RevealGroup: Staggers up to 8 children by 60ms each (once only).
 */
export function RevealGroup({ children, className = '', staggerMs = 60, maxAnimated = 8 }) {
  const items = React.Children.toArray(children);

  return (
    <div data-motion="reveal-group" className={className}>
      {items.map((child, idx) => {
        if (idx >= maxAnimated) return child;
        return (
          <Reveal key={child.key || idx} delay={(idx * staggerMs) / 1000}>
            {child}
          </Reveal>
        );
      })}
    </div>
  );
}
