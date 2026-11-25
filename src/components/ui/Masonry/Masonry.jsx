import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import './Masonry.css';

export default function Masonry({ items = [], className = '' }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((prev) => (prev + 1) % items.length);
      if (e.key === 'ArrowLeft') setLightboxIdx((prev) => (prev - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIdx, items.length]);

  const activeItem = lightboxIdx !== null ? items[lightboxIdx] : null;

  return (
    <>
      <div className={`rb-masonry ${className}`}>
        {items.map((item, idx) => (
          <figure
            key={item.id || `${item.src}-${idx}`}
            className="rb-masonry__item group rounded-[16px] overflow-hidden border border-line bg-surface shadow-xs hover:border-primary/40 transition-colors"
          >
            <button
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="relative block w-full overflow-hidden bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={`Open photo: ${item.title || item.alt || 'Event moment'}`}
            >
              <img
                src={item.src}
                alt={item.alt || item.title || 'Campus event moment'}
                loading="lazy"
                crossOrigin="anonymous"
                className="w-full h-auto block object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span className="absolute top-3 right-3 p-1.5 rounded-full bg-surface/85 text-ink opacity-0 group-hover:opacity-100 transition-opacity shadow-xs">
                <Maximize2 className="w-4 h-4" />
              </span>
            </button>
            <figcaption className="p-3.5 space-y-1">
              <p className="text-sm font-semibold text-ink line-clamp-1">
                {item.title || 'Event Highlight'}
              </p>
              {item.caption && (
                <p className="text-xs text-ink/85 line-clamp-2">{item.caption}</p>
              )}
              {item.subtitle && (
                <p className="text-xs text-muted line-clamp-1">{item.subtitle}</p>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title || 'Gallery photo preview'}
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90dvh] flex flex-col bg-surface rounded-[20px] border border-line overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface">
              <div className="min-w-0 pr-4">
                <h3 className="text-sm font-bold text-ink truncate">{activeItem.title}</h3>
                {activeItem.subtitle && (
                  <p className="text-xs text-muted truncate">{activeItem.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setLightboxIdx(null)}
                className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface-2 transition-colors"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 min-h-0 bg-black/95 flex items-center justify-center p-2 sm:p-4">
              <img
                src={activeItem.src}
                alt={activeItem.alt || activeItem.title || 'Gallery image'}
                crossOrigin="anonymous"
                className="max-h-[68dvh] max-w-full object-contain rounded-lg"
              />
              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setLightboxIdx((prev) => (prev - 1 + items.length) % items.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-surface/90 text-ink border border-line hover:bg-surface shadow-md"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLightboxIdx((prev) => (prev + 1) % items.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-surface/90 text-ink border border-line hover:bg-surface shadow-md"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {activeItem.caption && (
              <div className="px-4 py-3 border-t border-line bg-surface text-xs text-ink">
                {activeItem.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
