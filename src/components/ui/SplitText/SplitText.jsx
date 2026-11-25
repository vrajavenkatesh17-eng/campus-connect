import React from 'react';
import { motion } from 'motion/react';

export default function SplitText({
  text = '',
  className = '',
  delay = 50,
  animationFrom = { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
  animationTo = { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  easing = [0.22, 1, 0.36, 1],
  threshold = 0.1,
  rootMargin = '-50px',
  textAlign = 'left',
  onLetterAnimationComplete,
}) {
  const words = text.split(' ').map(word => word.split(''));

  return (
    <span
      className={`inline-block ${className}`}
      style={{ textAlign, wordWrap: 'break-word' }}
    >
      {words.map((word, wordIndex) => (
        <span
          key={`word-${wordIndex}`}
          style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
        >
          {word.map((char, charIndex) => {
            const index = words
              .slice(0, wordIndex)
              .reduce((acc, w) => acc + w.length, 0) + charIndex;

            return (
              <motion.span
                key={`char-${charIndex}`}
                initial={animationFrom}
                whileInView={animationTo}
                viewport={{ once: true, amount: threshold, margin: rootMargin }}
                transition={{
                  duration: 0.5,
                  delay: (index * delay) / 1000,
                  ease: easing,
                }}
                onAnimationComplete={
                  wordIndex === words.length - 1 && charIndex === word.length - 1
                    ? onLetterAnimationComplete
                    : undefined
                }
                style={{ display: 'inline-block', willChange: 'transform, opacity' }}
              >
                {char}
              </motion.span>
            );
          })}
          <span style={{ display: 'inline-block', width: '0.28em' }}>&nbsp;</span>
        </span>
      ))}
    </span>
  );
}
