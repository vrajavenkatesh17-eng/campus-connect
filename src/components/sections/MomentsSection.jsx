import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Images } from 'lucide-react';
import { usePublicGallery } from '../../hooks/usePublicGallery';
import BlurText from '../ui/BlurText/BlurText';
import AppButton from '../app/AppButton';
import { Reveal } from '../motion/Reveal';

const FlexCarousel = React.lazy(() => import('../ui/FlexCarousel/FlexCarousel'));

function supportsWebGL2AndMotion() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

function ScrollSnapFallback({ items }) {
  return (
    <div
      className="w-full h-full flex items-center gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-6 pb-4"
      role="region"
      aria-label="Event moments gallery"
    >
      {items.map((item, idx) => (
        <article
          key={item.id || `${item.src}-${idx}`}
          className="snap-center shrink-0 w-[280px] sm:w-[340px] flex flex-col rounded-[14px] border border-line bg-surface overflow-hidden shadow-xs"
        >
          <div className="w-full aspect-[4/3] bg-surface-2 overflow-hidden">
            <img
              src={item.src}
              alt={item.alt || item.title || 'Campus event moment'}
              width={400}
              height={300}
              loading="lazy"
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3.5 text-ink">
            <h3 className="text-sm font-semibold line-clamp-1">{item.title}</h3>
            {item.subtitle && (
              <p className="text-xs text-muted mt-0.5 line-clamp-1">{item.subtitle}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function MomentsSection({ className = '' }) {
  const { data: items = [], isLoading } = usePublicGallery();
  const containerRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [canUseWebGL2, setCanUseWebGL2] = useState(false);

  useEffect(() => {
    setCanUseWebGL2(supportsWebGL2AndMotion());
  }, []);

  // Mount WebGL2 FlexCarousel only when within 600px of viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const memoizedItems = useMemo(() => items, [items]);

  return (
    <section
      ref={containerRef}
      data-motion="moments-section"
      className={`py-12 sm:py-16 border-t border-line ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Images className="w-3.5 h-3.5" />
                <span>Campus Moments</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
                <BlurText
                  text="Moments from our events"
                  delay={45}
                  animateBy="words"
                  direction="top"
                />
              </h2>
              <p className="text-sm text-muted max-w-xl">
                Candid highlights from symposiums, technical workshops, and student celebrations at FXEC.
              </p>
            </div>

            <Link to="/gallery" className="shrink-0">
              <AppButton variant="secondary" size="sm" iconRight={ArrowRight}>
                View full gallery
              </AppButton>
            </Link>
          </div>
        </Reveal>

        {/* Reserved height wrapper prevents layout shift */}
        <div
          className="relative w-full text-ink rounded-[20px] border border-line bg-surface-2/40 overflow-hidden"
          style={{ height: 'clamp(380px, 52vw, 600px)' }}
        >
          {isLoading || memoizedItems.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center p-6">
              <div className="w-full max-w-md h-48 rounded-[16px] bg-surface-2 animate-pulse border border-line" />
            </div>
          ) : !isNearViewport ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted">
              Loading campus moments...
            </div>
          ) : canUseWebGL2 ? (
            <Suspense fallback={<ScrollSnapFallback items={memoizedItems} />}>
              <FlexCarousel
                items={memoizedItems}
                preset="liquid"
                intro="rise"
                fit="natural"
                cardHeight={0.52}
                gap={16}
                radius={12}
                bend={0.3}
                dispersion={0.3}
                squeeze={0.15}
                focusOnClick
                captions
                autoplay
                interval={4.5}
                captureWheel={false}
              />
            </Suspense>
          ) : (
            <ScrollSnapFallback items={memoizedItems} />
          )}
        </div>
      </div>
    </section>
  );
}
