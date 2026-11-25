import React from 'react';
import { motion } from 'motion/react';

export default function AnimatedContent({
  children,
  distance = 30,
  direction = 'vertical',
  reverse = false,
  delay = 0,
  duration = 0.6,
  threshold = 0.1,
  className = '',
}) {
  const axis = direction === 'vertical' ? 'y' : 'x';
  const offset = reverse ? -distance : distance;

  return (
    <motion.div
      className={className}
      initial={{
        [axis]: offset,
        opacity: 0,
      }}
      whileInView={{
        [axis]: 0,
        opacity: 1,
      }}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
