import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import AppButton from '../app/AppButton';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-[20px] bg-surface text-left shadow-xl transition-all w-full sm:my-8 ${maxWidth} border border-line`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-line/60">
            <div>
              {title && (
                <h3 className="text-lg font-semibold leading-6 text-ink">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-muted">{description}</p>
              )}
            </div>
            <AppButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-lg p-1 text-muted hover:text-ink hover:bg-surface-2 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </AppButton>
          </div>

          {/* Content */}
          <div className="px-6 py-5 text-ink">{children}</div>
        </div>
      </div>
    </div>
  );
}
