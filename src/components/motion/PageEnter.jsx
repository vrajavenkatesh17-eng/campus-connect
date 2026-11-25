import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './motion.css';

/**
 * PageEnter: Wraps every routed page with a 250ms fade + 8px rise.
 * Skipped when switching in-page tabs (keyed by route pathname, not tab).
 */
export default function PageEnter({ children, className = '' }) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      data-motion="page-enter"
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
