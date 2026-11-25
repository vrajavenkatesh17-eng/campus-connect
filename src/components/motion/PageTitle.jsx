import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import BlurText from '../ui/BlurText/BlurText';
import SplitText from '../ui/SplitText/SplitText';

function useFontsReady() {
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
 * PageTitle: BlurText once per route entry (450ms, ends fully sharp),
 * subtitle fades in 120ms later. Public H1 uses SplitText.
 */
export default function PageTitle({
  title,
  subtitle,
  as: Component = 'h1',
  variant = 'app', // 'app' | 'public'
  className = '',
  subtitleClassName = '',
}) {
  const fontsReady = useFontsReady();
  const prefersReduced = useReducedMotion();

  return (
    <div data-motion="page-title" className="min-w-0">
      <Component className={className}>
        {!fontsReady || prefersReduced ? (
          <span>{title}</span>
        ) : variant === 'public' ? (
          <SplitText text={title} delay={24} />
        ) : (
          <BlurText
            text={title}
            delay={45}
            animateBy="words"
            direction="top"
            stepDuration={0.35}
          />
        )}
      </Component>

      {subtitle && (
        <motion.p
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: prefersReduced ? 0 : 0.12 }}
          className={subtitleClassName}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
